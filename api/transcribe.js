// Vercel Serverless API - 音频转录服务
import { PROMPTS, API_ENDPOINTS, API_CONFIG } from '../config/apiConfig.js';

export default async function handler(req, res) {
    // 设置CORS头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // 处理预检请求
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // 只允许POST请求
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { mimeType, data } = req.body;

        // 验证请求数据
        if (!data || !mimeType) {
            return res.status(400).json({ error: '缺少音频数据或MIME类型' });
        }

        // 检查音频大小（Base64解码后的大小）
        const byteLength = Math.floor(data.length * 3 / 4);
        
        if (byteLength > API_CONFIG.MAX_AUDIO_SIZE) {
            return res.status(413).json({ 
                error: `音频文件过大 (${(byteLength / 1024 / 1024).toFixed(2)}MB)，请录制更短的音频` 
            });
        }

        // 检查API密钥
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error('GEMINI_API_KEY 环境变量未设置');
            return res.status(500).json({ error: 'API配置错误，请联系管理员' });
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
            
            // 根据状态码返回不同错误信息
            if (geminiResponse.status === 400) {
                return res.status(400).json({ error: '音频格式不支持或请求格式错误' });
            } else if (geminiResponse.status === 403) {
                return res.status(403).json({ error: 'API密钥无效或配额不足' });
            } else if (geminiResponse.status === 429) {
                return res.status(429).json({ error: '请求过于频繁，请稍后再试' });
            } else {
                return res.status(500).json({ error: 'Gemini API服务暂时不可用' });
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
                // 查找JSON对象
                const jsonMatch = responseText.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    parsedJson = JSON.parse(jsonMatch[0]);
                }
            } catch (parseError) {
                console.error('解析JSON失败:', parseError);
                // 如果JSON解析失败，尝试从文本中提取信息
                parsedJson = {
                    transcript: responseText.trim(),
                    keywords: [],
                    confidence: null
                };
            }
        }

        // 返回结果
        const result = {
            success: true,
            raw: geminiResult,
            text_blob: responseText.trim(),
            parsed_json: parsedJson,
            timestamp: new Date().toISOString(),
            audio_size_mb: (byteLength / 1024 / 1024).toFixed(2)
        };

        return res.status(200).json(result);

    } catch (error) {
        console.error('处理请求失败:', error);
        
        // 根据错误类型返回不同信息
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            return res.status(503).json({ error: '网络连接失败，请检查网络连接' });
        } else if (error.message.includes('timeout')) {
            return res.status(504).json({ error: '请求超时，请稍后重试' });
        } else {
            return res.status(500).json({ 
                error: '服务器内部错误',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
}