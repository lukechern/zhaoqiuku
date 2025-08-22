/*
 * ========================================
 * 🎤 音频处理完整流程 API
 * ========================================
 * 集成音频转录和物品存储业务逻辑
 */

import { PROMPTS, API_ENDPOINTS, API_CONFIG } from '../config/apiConfig.js';
import { handleItemStorage } from './item-storage.js';

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
        console.log('🚀 开始处理音频请求');
        console.log('请求时间:', new Date().toISOString());
        console.log('请求方法:', req.method);
        console.log('请求头:', JSON.stringify(req.headers, null, 2));
        
        // 验证用户认证
        const authHeader = req.headers.authorization;
        console.log('Authorization头:', authHeader ? 'Bearer ' + authHeader.substring(7, 27) + '...' : '未提供');
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.log('❌ 认证失败 - 未提供令牌');
            return res.status(401).json({ error: '未提供认证令牌' });
        }

        const token = authHeader.substring(7);
        let userId;
        
        try {
            // 简化的JWT验证 - 手动解析payload
            const [header, payload, signature] = token.split('.');
            if (!header || !payload || !signature) {
                throw new Error('Invalid token format');
            }
            
            const decodedPayload = JSON.parse(Buffer.from(payload, 'base64').toString());
            userId = decodedPayload.userId || decodedPayload.sub;
            
            if (!userId) {
                throw new Error('No user ID in token');
            }
            
            // 检查token是否过期
            if (decodedPayload.exp && Date.now() >= decodedPayload.exp * 1000) {
                throw new Error('Token expired');
            }
            
            console.log('✅ 用户认证成功');
            console.log('用户ID:', userId);
        } catch (jwtError) {
            console.log('❌ 认证失败 - 令牌无效:', jwtError.message);
            return res.status(401).json({ error: '认证令牌无效' });
        }

        console.log('📦 请求体检查');
        console.log('请求体存在:', !!req.body);
        console.log('请求体类型:', typeof req.body);
        
        const { mimeType, data } = req.body || {};
        
        console.log('mimeType:', mimeType);
        console.log('data存在:', !!data);
        console.log('data长度:', data ? data.length : 0);

        // 验证请求数据
        if (!data || !mimeType) {
            console.log('❌ 请求数据验证失败');
            return res.status(400).json({ error: '缺少音频数据或MIME类型' });
        }

        // 检查音频大小
        const byteLength = Math.floor(data.length * 3 / 4);
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

        // 检查环境变量
        console.log('🔧 环境变量检查');
        console.log('GEMINI_API_KEY存在:', !!process.env.GEMINI_API_KEY);
        console.log('JWT_SECRET存在:', !!process.env.JWT_SECRET);
        
        // 步骤1: 调用音频转录
        console.log('🎤 开始音频转录处理');
        console.log('用户ID:', userId);
        console.log('音频大小:', `${(byteLength / 1024 / 1024).toFixed(2)}MB`);
        console.log('音频格式:', mimeType);
        
        const transcriptionResult = await transcribeAudio(mimeType, data);
        
        if (!transcriptionResult.success) {
            console.error('❌ 音频转录失败:', transcriptionResult.error);
            return res.status(400).json({ 
                error: transcriptionResult.error || '音频转录失败',
                details: process.env.NODE_ENV === 'development' ? transcriptionResult : undefined
            });
        }

        console.log('✅ 音频转录成功');
        console.log('转录文本:', transcriptionResult.text_blob);
        console.log('解析结果:', transcriptionResult.parsed_json);

        // 步骤2: 处理业务逻辑
        console.log('🔄 开始业务逻辑处理');
        const businessResult = await handleItemStorage(
            transcriptionResult.parsed_json, 
            userId, 
            clientIP
        );
        
        console.log('✅ 业务逻辑处理完成');
        console.log('处理结果:', businessResult);

        // 返回完整结果
        const finalResult = {
            success: true,
            transcription: transcriptionResult,
            business: businessResult,
            timestamp: new Date().toISOString()
        };
        
        console.log('🎉 请求处理完成');
        console.log('最终结果:', JSON.stringify(finalResult, null, 2));
        
        return res.status(200).json(finalResult);

    } catch (error) {
        console.error('处理音频请求失败:', error);
        return res.status(500).json({ 
            error: '服务器内部错误',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}

/**
 * 音频转录函数
 */
async function transcribeAudio(mimeType, data) {
    try {
        // 检查API密钥
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error('GEMINI_API_KEY 环境变量未设置');
            return { success: false, error: 'API配置错误，请联系管理员' };
        }

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

        // 调用Gemini API
        const geminiResponse = await fetch(API_ENDPOINTS.GEMINI_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': apiKey
            },
            body: JSON.stringify(requestBody)
        });

        if (!geminiResponse.ok) {
            const errorText = await geminiResponse.text();
            console.error('Gemini API错误:', errorText);
            
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
            console.error('提取响应文本失败:', extractError);
        }

        // 尝试解析JSON响应
        let parsedJson = null;
        if (responseText) {
            console.log('🔍 开始解析AI返回的JSON');
            console.log('原始响应文本:', responseText);
            
            try {
                const jsonMatch = responseText.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    console.log('找到JSON片段:', jsonMatch[0]);
                    parsedJson = JSON.parse(jsonMatch[0]);
                    console.log('✅ JSON解析成功:', parsedJson);
                    
                    // 🔍 详细分析结果
                    console.log('=== AI分析结果详情 ===');
                    console.log('转录文本:', parsedJson.transcript);
                    console.log('动作分类:', parsedJson.action);
                    console.log('物品名称:', parsedJson.object);
                    console.log('存放位置:', parsedJson.location);
                    console.log('置信度:', parsedJson.confidence);
                    console.log('=====================');
                } else {
                    console.log('❌ 未找到有效的JSON格式');
                }
            } catch (parseError) {
                console.error('❌ JSON解析失败:', parseError);
                console.log('使用默认unknown格式');
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
        console.error('音频转录失败:', error);
        
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            return { success: false, error: '网络连接失败，请检查网络连接' };
        } else if (error.message.includes('timeout')) {
            return { success: false, error: '请求超时，请稍后重试' };
        } else {
            return { success: false, error: '转录服务暂时不可用' };
        }
    }
}