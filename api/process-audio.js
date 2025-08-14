/*
 * ========================================
 * 🎤 音频处理完整流程 API
 * ========================================
 * 集成音频转录和物品存储业务逻辑
 */

import { PROMPTS, API_ENDPOINTS, API_CONFIG } from '../config/apiConfig.js';
import { handleItemStorage } from './item-storage.js';
import jwt from 'jsonwebtoken';

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
        // 验证用户认证
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: '未提供认证令牌' });
        }

        const token = authHeader.substring(7);
        let userId;
        
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            userId = decoded.userId;
        } catch (jwtError) {
            return res.status(401).json({ error: '认证令牌无效' });
        }

        const { mimeType, data } = req.body;

        // 验证请求数据
        if (!data || !mimeType) {
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

        // 步骤1: 调用音频转录
        const transcriptionResult = await transcribeAudio(mimeType, data);
        
        if (!transcriptionResult.success) {
            return res.status(500).json(transcriptionResult);
        }

        // 步骤2: 处理业务逻辑
        const businessResult = await handleItemStorage(
            transcriptionResult.parsed_json, 
            userId, 
            clientIP
        );

        // 返回完整结果
        return res.status(200).json({
            success: true,
            transcription: transcriptionResult,
            business: businessResult,
            timestamp: new Date().toISOString()
        });

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
            try {
                const jsonMatch = responseText.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    parsedJson = JSON.parse(jsonMatch[0]);
                }
            } catch (parseError) {
                console.error('解析JSON失败:', parseError);
                parsedJson = {
                    transcript: responseText.trim(),
                    action: "unknown",
                    object: "",
                    location: "",
                    confidence: null
                };
            }
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