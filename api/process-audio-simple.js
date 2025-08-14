/*
 * ========================================
 * 🎤 音频处理简化版 API
 * ========================================
 * 用于调试的简化版本
 */

import { PROMPTS, API_ENDPOINTS, API_CONFIG } from '../config/apiConfig.js';

export default async function handler(req, res) {
    // 设置CORS头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // 处理预检请求
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // 只允许POST请求
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        console.log('🚀 简化版API - 开始处理音频请求');
        console.log('请求时间:', new Date().toISOString());
        console.log('请求方法:', req.method);
        
        // 验证用户认证
        const authHeader = req.headers.authorization;
        console.log('Authorization头存在:', !!authHeader);
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.log('❌ 认证失败 - 未提供令牌');
            return res.status(401).json({ error: '未提供认证令牌' });
        }

        const token = authHeader.substring(7);
        console.log('Token长度:', token.length);
        
        // 简单的token验证 - 只检查格式
        let userId = 'test-user-id';
        try {
            const [header, payload, signature] = token.split('.');
            if (header && payload && signature) {
                const decodedPayload = JSON.parse(Buffer.from(payload, 'base64').toString());
                userId = decodedPayload.userId || decodedPayload.sub || 'decoded-user-id';
                console.log('✅ Token解析成功，用户ID:', userId);
            }
        } catch (tokenError) {
            console.log('⚠️ Token解析失败，使用默认用户ID:', tokenError.message);
        }

        console.log('📦 检查请求体');
        const { mimeType, data } = req.body || {};
        
        if (!data || !mimeType) {
            console.log('❌ 请求数据验证失败');
            return res.status(400).json({ error: '缺少音频数据或MIME类型' });
        }

        console.log('✅ 请求数据验证通过');
        console.log('音频格式:', mimeType);
        console.log('音频数据长度:', data.length);

        // 检查音频大小
        const byteLength = Math.floor(data.length * 3 / 4);
        console.log('音频大小:', `${(byteLength / 1024 / 1024).toFixed(2)}MB`);

        if (byteLength > API_CONFIG.MAX_AUDIO_SIZE) {
            return res.status(413).json({ 
                error: `音频文件过大 (${(byteLength / 1024 / 1024).toFixed(2)}MB)，请录制更短的音频` 
            });
        }

        // 获取客户端IP
        const clientIP = req.headers['x-forwarded-for'] || 
                        req.headers['x-real-ip'] || 
                        req.connection.remoteAddress || 
                        req.socket.remoteAddress ||
                        '127.0.0.1';
        console.log('客户端IP:', clientIP);

        // 调用音频转录
        console.log('🎤 开始调用Gemini API');
        const transcriptionResult = await transcribeAudio(mimeType, data);
        
        if (!transcriptionResult.success) {
            console.log('❌ 转录失败:', transcriptionResult.error);
            return res.status(500).json(transcriptionResult);
        }

        console.log('✅ 转录成功');
        console.log('转录结果:', transcriptionResult.parsed_json);

        // 模拟业务处理结果
        const mockBusinessResult = {
            success: true,
            message: `检测到操作: ${transcriptionResult.parsed_json?.action || 'unknown'}`,
            data: {
                action: transcriptionResult.parsed_json?.action,
                object: transcriptionResult.parsed_json?.object,
                location: transcriptionResult.parsed_json?.location
            }
        };

        console.log('🎉 请求处理完成');

        // 返回完整结果
        return res.status(200).json({
            success: true,
            transcription: transcriptionResult,
            business: mockBusinessResult,
            timestamp: new Date().toISOString(),
            debug: {
                userId: userId,
                clientIP: clientIP,
                audioSize: `${(byteLength / 1024 / 1024).toFixed(2)}MB`
            }
        });

    } catch (error) {
        console.error('❌ 处理音频请求失败:', error);
        console.error('错误堆栈:', error.stack);
        return res.status(500).json({ 
            error: '服务器内部错误',
            details: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
}

/**
 * 音频转录函数
 */
async function transcribeAudio(mimeType, data) {
    try {
        console.log('🔧 检查API配置');
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error('❌ GEMINI_API_KEY 环境变量未设置');
            return { success: false, error: 'API配置错误，请联系管理员' };
        }
        console.log('✅ API Key存在');

        // 构建Gemini API请求
        const requestBody = {
            contents: [
                {
                    parts: [
                        { text: PROMPTS.AUDIO_TRANSCRIPTION },
                        {
                            inlineData: {
                                mimeType: mimeType,
                                data: data
                            }
                        }
                    ]
                }
            ],
            generationConfig: PROMPTS.GENERATION_CONFIG
        };

        console.log('📤 发送请求到Gemini API');
        console.log('API URL:', API_ENDPOINTS.GEMINI_URL);

        // 调用Gemini API
        const geminiResponse = await fetch(API_ENDPOINTS.GEMINI_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': apiKey
            },
            body: JSON.stringify(requestBody)
        });

        console.log('📥 收到Gemini API响应');
        console.log('响应状态:', geminiResponse.status);

        if (!geminiResponse.ok) {
            const errorText = await geminiResponse.text();
            console.error('❌ Gemini API错误:', errorText);
            
            if (geminiResponse.status === 400) {
                return { success: false, error: '音频格式不支持或请求格式错误' };
            } else if (geminiResponse.status === 403) {
                return { success: false, error: 'API密钥无效或配额不足' };
            } else if (geminiResponse.status === 429) {
                return { success: false, error: '请求过于频繁，请稍后再试' };
            } else {
                return { success: false, error: 'Gemini API服务暂时不可用' };
            }
        }

        const geminiResult = await geminiResponse.json();
        console.log('✅ Gemini API响应成功');

        // 提取响应文本
        let responseText = '';
        try {
            if (geminiResult.candidates && geminiResult.candidates.length > 0) {
                const candidate = geminiResult.candidates[0];
                if (candidate.content && candidate.content.parts) {
                    responseText = candidate.content.parts
                        .filter(part => part.text)
                        .map(part => part.text)
                        .join('\n');
                }
            }
        } catch (extractError) {
            console.error('❌ 提取响应文本失败:', extractError);
        }

        console.log('📝 原始响应文本:', responseText);

        // 尝试解析JSON响应
        let parsedJson = null;
        if (responseText) {
            console.log('🔍 开始解析JSON');
            
            try {
                const jsonMatch = responseText.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    console.log('找到JSON片段:', jsonMatch[0]);
                    parsedJson = JSON.parse(jsonMatch[0]);
                    console.log('✅ JSON解析成功:', parsedJson);
                } else {
                    console.log('❌ 未找到有效的JSON格式');
                }
            } catch (parseError) {
                console.error('❌ JSON解析失败:', parseError);
                parsedJson = {
                    transcript: responseText.trim(),
                    action: "unknown",
                    object: "",
                    location: "",
                    confidence: null
                };
            }
        } else {
            console.log('❌ AI返回的响应文本为空');
        }

        return {
            success: true,
            raw: geminiResult,
            text_blob: responseText.trim(),
            parsed_json: parsedJson,
            timestamp: new Date().toISOString()
        };

    } catch (error) {
        console.error('❌ 音频转录失败:', error);
        console.error('错误堆栈:', error.stack);
        
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            return { success: false, error: '网络连接失败，请检查网络连接' };
        } else if (error.message.includes('timeout')) {
            return { success: false, error: '请求超时，请稍后重试' };
        } else {
            return { success: false, error: '转录服务暂时不可用', details: error.message };
        }
    }
}