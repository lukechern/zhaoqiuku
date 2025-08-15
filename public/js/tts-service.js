// Azure Speech Service TTS 服务模块
export class TTSService {
    constructor() {
        this.config = this.initializeConfig();
        this.isPlaying = false;
        this.currentAudio = null;
        this.audioContext = null;
        
        // 初始化音频上下文
        this.initAudioContext();
    }

    // 初始化配置，提供默认值
    initializeConfig() {
        const defaultConfig = {
            enabled: true,
            azure: {
                region: 'eastasia',
                voice: {
                    name: 'zh-CN-XiaoxiaoNeural',
                    rate: '0%',
                    pitch: '0%',
                    volume: '0%'
                },
                audioFormat: 'audio-16khz-128kbitrate-mono-mp3'
            },
            autoRead: {
                enabled: true,
                delay: 500,
                maxLength: 500,
                readFullContent: false
            },
            errorHandling: {
                showErrors: true,
                fallbackToAlert: false
            }
        };

        // 如果window.ttsConfig存在，合并配置
        if (window.ttsConfig) {
            return { ...defaultConfig, ...window.ttsConfig };
        }

        // 如果没有配置，使用默认配置
        console.warn('TTS配置未找到，使用默认配置');
        return defaultConfig;
    }

    // 初始化音频上下文
    initAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (error) {
            console.warn('无法创建音频上下文:', error);
        }
    }

    // 检查TTS是否可用
    isAvailable() {
        return this.config && this.config.enabled;
    }

    // 从API响应数据中提取需要朗读的文本
    extractTextToRead(data) {
        if (!data) return null;

        const autoReadConfig = this.config?.autoRead;
        if (!autoReadConfig) {
            // 如果没有配置，默认只朗读AI回复
            return (data.business_result && data.business_result.message) || 
                   data.transcript || 
                   null;
        }
        
        // 如果配置为只朗读AI回复部分
        if (!autoReadConfig.readFullContent && data.business_result && data.business_result.message) {
            return data.business_result.message;
        }
        
        // 如果配置为朗读完整内容，构建完整文本
        if (autoReadConfig.readFullContent) {
            let fullText = '';
            
            if (data.transcript) {
                fullText += `用户说：${data.transcript}。`;
            }
            
            if (data.business_result && data.business_result.message) {
                fullText += `AI回复：${data.business_result.message}`;
            }
            
            return fullText || null;
        }
        
        // 回退到AI回复或转录文本
        return (data.business_result && data.business_result.message) || 
               data.transcript || 
               null;
    }

    // 自动朗读API响应内容
    async autoReadResponse(data) {
        if (!this.config?.autoRead?.enabled || !this.isAvailable()) {
            return;
        }

        const textToRead = this.extractTextToRead(data);
        if (!textToRead) {
            console.log('没有找到需要朗读的文本');
            return;
        }

        // 应用延迟
        if (this.config.autoRead.delay > 0) {
            await new Promise(resolve => setTimeout(resolve, this.config.autoRead.delay));
        }

        // 限制文本长度
        let finalText = textToRead;
        if (this.config.autoRead.maxLength > 0 && textToRead.length > this.config.autoRead.maxLength) {
            finalText = textToRead.substring(0, this.config.autoRead.maxLength) + '...';
        }

        console.log('开始朗读:', finalText);
        await this.speak(finalText);
    }

    // 朗读指定文本
    async speak(text) {
        if (!this.isAvailable()) {
            console.warn('TTS服务不可用');
            if (this.config?.errorHandling?.fallbackToAlert) {
                alert(text);
            }
            return;
        }

        if (this.isPlaying) {
            this.stop();
        }

        try {
            // 限制文本长度
            let processedText = text;
            if (text.length > 500) {
                processedText = text.substring(0, 500) + '...';
            }
            
            // 调用TTS API
            const audioData = await this.callAzureTTS(processedText);
            
            // 播放音频
            await this.playAudio(audioData);
            
        } catch (error) {
            console.error('TTS朗读失败:', error);
            
            if (this.config?.errorHandling?.showErrors) {
                console.error('朗读失败:', error.message);
            }
            
            if (this.config?.errorHandling?.fallbackToAlert) {
                alert(text);
            }
        }
    }



    // 调用TTS API
    async callAzureTTS(text) {
        const voice = this.config?.azure?.voice || {
            name: 'zh-CN-XiaoxiaoNeural',
            rate: '0%',
            pitch: '0%',
            volume: '0%'
        };
        
        const response = await fetch('/api/tts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text: text,
                voice: voice.name,
                rate: voice.rate,
                pitch: voice.pitch,
                volume: voice.volume
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`TTS API错误 (${response.status}): ${errorData.error || 'Unknown error'}`);
        }

        return await response.arrayBuffer();
    }

    // 播放音频数据
    async playAudio(audioData) {
        return new Promise((resolve, reject) => {
            try {
                // 停止当前播放的音频
                this.stop();

                // 创建音频对象
                const blob = new Blob([audioData], { type: 'audio/mpeg' });
                const audioUrl = URL.createObjectURL(blob);
                
                this.currentAudio = new Audio(audioUrl);
                this.isPlaying = true;

                // 设置音频事件监听器
                this.currentAudio.onended = () => {
                    this.cleanup();
                    resolve();
                };

                this.currentAudio.onerror = (error) => {
                    this.cleanup();
                    reject(new Error('音频播放失败: ' + error.message));
                };

                this.currentAudio.onloadeddata = () => {
                    console.log('音频数据加载完成，开始播放');
                };

                // 开始播放
                this.currentAudio.play().catch(error => {
                    this.cleanup();
                    reject(new Error('音频播放启动失败: ' + error.message));
                });

            } catch (error) {
                this.cleanup();
                reject(error);
            }
        });
    }

    // 停止当前播放
    stop() {
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio.currentTime = 0;
        }
        this.cleanup();
    }

    // 清理资源
    cleanup() {
        this.isPlaying = false;
        
        if (this.currentAudio) {
            // 释放音频URL
            if (this.currentAudio.src) {
                URL.revokeObjectURL(this.currentAudio.src);
            }
            this.currentAudio = null;
        }
    }

    // 检查播放状态
    getPlayingStatus() {
        return {
            isPlaying: this.isPlaying,
            isAvailable: this.isAvailable()
        };
    }

    // 更新配置
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        window.ttsConfig = this.config;
    }
}

// 延迟创建全局TTS服务实例，确保配置已加载
if (typeof window !== 'undefined') {
    // 如果在浏览器环境中，延迟创建实例
    setTimeout(() => {
        if (!window.ttsService) {
            window.ttsService = new TTSService();
            console.log('TTS服务已初始化');
        }
    }, 100);
}