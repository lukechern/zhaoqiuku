// API客户端模块
export class APIClient {
    constructor() {
        this.config = window.apiConfig;
    }

    // 发送音频到Gemini API
    async transcribeAudio(audioBlob, mimeType) {
        try {
            // 检查音频大小
            const maxSize = this.config.getMaxAudioSize();
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

            // 获取认证令牌（使用正确的存储key）
            const token = localStorage.getItem('zhaoqiuku_access_token');
            let useNewApi = !!token; // 如果有token就使用新API，否则使用旧API
            
            console.log('🔍 Token检查:', {
                tokenExists: !!token,
                tokenPreview: token ? token.substring(0, 20) + '...' : 'null',
                willUseNewApi: useNewApi
            });
            
            // 记录请求信息（不包含完整的base64数据，太长了）
            const requestUrl = this.config.getUrlWithTimestamp(
                useNewApi ? this.config.getTranscribeUrl() : this.config.getTranscribeLegacyUrl()
            );
            const requestHeaders = useNewApi ? {
                ...this.config.getDefaultHeaders(),
                'Authorization': `Bearer ${token}`
            } : this.config.getDefaultHeaders();
            
            const requestInfo = {
                url: requestUrl,
                method: 'POST',
                headers: requestHeaders,
                body: {
                    mimeType: mimeType,
                    dataSize: `${(audioBlob.size / 1024).toFixed(2)}KB`,
                    dataPreview: base64Data.substring(0, 100) + '...'
                },
                timestamp: new Date().toISOString()
            };

            console.log('🚀 前端发送音频请求');
            console.log('使用API:', useNewApi ? '新版完整流程API' : '传统转录API');
            console.log('请求URL:', requestUrl);
            console.log('音频大小:', `${(audioBlob.size / 1024).toFixed(2)}KB`);
            console.log('音频格式:', mimeType);
            console.log('认证状态:', useNewApi ? '已认证' : '未认证');

            // 发送请求
            const response = await fetch(requestUrl, {
                method: 'POST',
                headers: requestHeaders,
                body: JSON.stringify(requestData)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                
                // 如果是认证错误且使用的是新API，尝试回退到旧API
                if (response.status === 401 && useNewApi) {
                    console.log('🔄 认证失败，回退到传统API');
                    return this.transcribeAudioLegacy(audioBlob, mimeType);
                }
                
                throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            
            // 记录响应信息
            const responseInfo = {
                status: response.status,
                statusText: response.statusText,
                headers: Object.fromEntries(response.headers.entries()),
                body: result,
                timestamp: new Date().toISOString()
            };

            return this.processApiResponse(result, requestInfo, responseInfo);

        } catch (error) {
            console.error('API请求失败:', error);
            throw error;
        }
    }

    // 使用传统API进行音频转录（无需认证）
    async transcribeAudioLegacy(audioBlob, mimeType) {
        try {
            console.log('🔄 使用传统转录API');
            
            // 检查音频大小
            const maxSize = this.config.getMaxAudioSize();
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

            const requestUrl = this.config.getUrlWithTimestamp(this.config.getTranscribeLegacyUrl());
            const requestHeaders = this.config.getDefaultHeaders();
            
            const requestInfo = {
                url: requestUrl,
                method: 'POST',
                headers: requestHeaders,
                body: {
                    mimeType: mimeType,
                    dataSize: `${(audioBlob.size / 1024).toFixed(2)}KB`,
                    dataPreview: base64Data.substring(0, 100) + '...'
                },
                timestamp: new Date().toISOString()
            };

            console.log('📤 发送传统API请求');

            // 发送请求
            const response = await fetch(requestUrl, {
                method: 'POST',
                headers: requestHeaders,
                body: JSON.stringify(requestData)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            
            // 记录响应信息
            const responseInfo = {
                status: response.status,
                statusText: response.statusText,
                headers: Object.fromEntries(response.headers.entries()),
                body: result,
                timestamp: new Date().toISOString()
            };

            console.log('📥 传统API响应成功');
            return this.processApiResponse(result, requestInfo, responseInfo);

        } catch (error) {
            console.error('传统API请求失败:', error);
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
    processApiResponse(response, requestInfo, responseInfo) {
        try {
            console.log('📥 处理API响应');
            console.log('响应数据:', response);
            
            // 检查是否是新的完整流程API响应
            if (response.transcription && response.business) {
                console.log('✅ 检测到完整流程API响应');
                const transcription = response.transcription;
                const business = response.business;
                
                return {
                    success: true,
                    transcript: transcription.parsed_json?.transcript || transcription.text_blob || '',
                    action: transcription.parsed_json?.action || 'unknown',
                    object: transcription.parsed_json?.object || '',
                    location: transcription.parsed_json?.location || '',
                    confidence: transcription.parsed_json?.confidence || null,
                    business_result: business,
                    raw: response,
                    processed: true,
                    debug: {
                        request: requestInfo,
                        response: responseInfo
                    }
                };
            }
            
            // 如果有解析好的JSON结果，优先使用（旧版API兼容）
            if (response.parsed_json) {
                return {
                    success: true,
                    transcript: response.parsed_json.transcript || '',
                    keywords: response.parsed_json.keywords || [],
                    confidence: response.parsed_json.confidence || null,
                    raw: response.raw,
                    processed: true,
                    debug: {
                        request: requestInfo,
                        response: responseInfo
                    }
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
                            processed: true,
                            debug: {
                                request: requestInfo,
                                response: responseInfo
                            }
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
                    processed: false,
                    debug: {
                        request: requestInfo,
                        response: responseInfo
                    }
                };
            }

            // 如果都没有，返回原始响应
            return {
                success: true,
                transcript: '无法解析响应内容',
                keywords: [],
                confidence: null,
                raw: response,
                processed: false,
                debug: {
                    request: requestInfo,
                    response: responseInfo
                }
            };

        } catch (error) {
            console.error('处理API响应失败:', error);
            return {
                success: false,
                error: error.message,
                raw: response,
                debug: {
                    request: requestInfo,
                    response: responseInfo
                }
            };
        }
    }

    // 格式化结果用于显示
    formatResultForDisplay(result) {
        if (!result.success) {
            return {
                error: result.error || '处理失败',
                raw: result.raw,
                debug: result.debug
            };
        }

        const displayResult = {
            // 主要结果
            transcript: result.transcript,
            keywords: result.keywords,
            processed: result.processed,
            
            // 调试信息
            debug: {
                request: result.debug?.request || null,
                response: result.debug?.response || null,
                timestamp: new Date().toISOString(),
                audio_processed: true
            },
            
            // 原始数据
            raw_response: result.raw
        };

        if (result.confidence !== null) {
            displayResult.confidence = result.confidence;
        }

        return displayResult;
    }

    // 测试API连接
    async testConnection() {
        try {
            const response = await fetch(this.config.getUrlWithTimestamp(this.config.getHealthUrl()), {
                method: 'GET',
                headers: this.config.getDefaultHeaders()
            });

            return response.ok;
        } catch (error) {
            console.error('API连接测试失败:', error);
            return false;
        }
    }

    // 获取支持的音频格式
    getSupportedFormats() {
        return this.config.config.SUPPORTED_MIME_TYPES;
    }

    // 验证音频格式
    isFormatSupported(mimeType) {
        return this.config.isMimeTypeSupported(mimeType);
    }
}