// API客户端模块
class APIClient {
    constructor() {
        this.baseUrl = '/api';
    }

    // 发送音频到Gemini API
    async transcribeAudio(audioBlob, mimeType) {
        try {
            // 检查音频大小
            const maxSize = 20 * 1024 * 1024; // 20MB
            if (audioBlob.size > maxSize) {
                throw new Error(`音频文件过大 (${(audioBlob.size / 1024 / 1024).toFixed(2)}MB)，请录制更短的音频`);
            }

            // 转换为Base64
            const base64Data = await this.blobToBase64(audioBlob);
            
            // 构建请求数据
            const requestData = {
                mimeType: mimeType,
                data: base64Data
            };

            // 发送请求
            const response = await fetch(`${this.baseUrl}/transcribe`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            return this.processApiResponse(result);

        } catch (error) {
            console.error('API请求失败:', error);
            throw error;
        }
    }

    // 将Blob转换为Base64
    async blobToBase64(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                // 移除data:audio/webm;base64,前缀
                const base64 = reader.result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    // 处理API响应
    processApiResponse(response) {
        try {
            // 如果有解析好的JSON结果，优先使用
            if (response.parsed_json) {
                return {
                    success: true,
                    transcript: response.parsed_json.transcript || '',
                    keywords: response.parsed_json.keywords || [],
                    confidence: response.parsed_json.confidence || null,
                    raw: response.raw,
                    processed: true
                };
            }

            // 尝试从文本中提取JSON
            if (response.text_blob) {
                const jsonMatch = response.text_blob.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    try {
                        const parsed = JSON.parse(jsonMatch[0]);
                        return {
                            success: true,
                            transcript: parsed.transcript || '',
                            keywords: parsed.keywords || [],
                            confidence: parsed.confidence || null,
                            raw: response.raw,
                            processed: true
                        };
                    } catch (e) {
                        // JSON解析失败，返回原始文本
                    }
                }

                // 如果没有找到JSON，返回原始文本
                return {
                    success: true,
                    transcript: response.text_blob,
                    keywords: [],
                    confidence: null,
                    raw: response.raw,
                    processed: false
                };
            }

            // 如果都没有，返回原始响应
            return {
                success: true,
                transcript: '无法解析响应内容',
                keywords: [],
                confidence: null,
                raw: response,
                processed: false
            };

        } catch (error) {
            console.error('处理API响应失败:', error);
            return {
                success: false,
                error: error.message,
                raw: response
            };
        }
    }

    // 格式化结果用于显示
    formatResultForDisplay(result) {
        if (!result.success) {
            return {
                error: result.error || '处理失败',
                raw: result.raw
            };
        }

        const displayResult = {
            transcript: result.transcript,
            keywords: result.keywords,
            processed: result.processed
        };

        if (result.confidence !== null) {
            displayResult.confidence = result.confidence;
        }

        // 添加一些元数据
        displayResult.timestamp = new Date().toISOString();
        displayResult.audio_processed = true;

        return displayResult;
    }

    // 测试API连接
    async testConnection() {
        try {
            const response = await fetch(`${this.baseUrl}/health`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            return response.ok;
        } catch (error) {
            console.error('API连接测试失败:', error);
            return false;
        }
    }

    // 获取支持的音频格式
    getSupportedFormats() {
        return [
            'audio/webm',
            'audio/webm;codecs=opus',
            'audio/mp4',
            'audio/ogg;codecs=opus',
            'audio/wav'
        ];
    }

    // 验证音频格式
    isFormatSupported(mimeType) {
        return this.getSupportedFormats().includes(mimeType);
    }
}