// Azure Speech Service TTS 服务模块
export class TTSService {
    constructor() {
        this.isPlaying = false;
        this.currentAudio = null;
        this.audioContext = null;
        this.cachedAudioData = null;  // 添加缓存音频数据
        this.cachedText = null;       // 添加缓存文本

        // 初始化音频上下文
        this.initAudioContext();
    }

    // 初始化音频上下文
    initAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (error) {
            console.warn('无法创建音频上下文:', error);
        }
    }

    // 检查TTS是否可用（总是可用，具体配置由后端决定）
    isAvailable() {
        return true;
    }

    // 从API响应数据中提取需要朗读的文本
    extractTextToRead(data) {
        if (!data) return null;

        // 默认只朗读AI回复
        return (data.business_result && data.business_result.message) ||
            data.transcript ||
            null;
    }

    // 自动朗读API响应内容（已废弃，现在使用流式渲染器异步处理）
    async autoReadResponse(data) {
        console.log('autoReadResponse已废弃，TTS现在在流式渲染器中异步处理');
        // 保留此方法以兼容旧代码，但不执行任何操作
        return;
    }

    // 朗读指定文本
    async speak(text) {
        if (this.isPlaying) {
            this.stop();
        }

        try {
            // 限制文本长度
            let processedText = text;
            if (text.length > 500) {
                processedText = text.substring(0, 500) + '...';
            }

            // 检查是否有缓存
            if (this.cachedText === processedText && this.cachedAudioData) {
                // 使用缓存的音频数据
                console.log('使用缓存的TTS音频');
                await this.playAudio(this.cachedAudioData);
                return;
            }

            // 调用TTS API（只传递文本，参数由后端决定）
            const audioData = await this.callAzureTTS(processedText);

            // 如果TTS服务未配置，静默跳过
            if (audioData === null) {
                console.log('TTS服务未配置，跳过语音播放');
                return;
            }

            // 缓存音频数据和文本
            this.cachedAudioData = audioData;
            this.cachedText = processedText;

            // 播放音频
            await this.playAudio(audioData);

        } catch (error) {
            console.error('TTS朗读失败:', error);
            console.error('朗读失败:', error.message);
        }
    }

    // 调用TTS API
    async callAzureTTS(text) {
        const response = await fetch('/api/tts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text: text
                // 不再传递语音参数，全部由后端配置决定
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));

            // 如果是TTS服务未配置，给出友好提示
            if (response.status === 503 && errorData.code === 'TTS_NOT_CONFIGURED') {
                console.warn('TTS服务未配置，跳过语音播放');
                return null; // 返回null表示跳过播放
            }

            throw new Error(`TTS API错误 (${response.status}): ${errorData.error || 'Unknown error'}`);
        }

        return await response.arrayBuffer();
    }

    // 播放音频数据
    async playAudio(audioData) {
        return new Promise(async (resolve, reject) => {
            try {
                this.isPlaying = true;

                // 创建音频缓冲区
                const audioBuffer = await this.audioContext.decodeAudioData(audioData.slice(0));

                // 创建音频源
                const source = this.audioContext.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(this.audioContext.destination);

                // 播放完成处理（在播放结束时才resolve）
                source.onended = () => {
                    this.isPlaying = false;
                    this.currentAudio = null;
                    resolve();
                };

                // 保存引用以便停止
                this.currentAudio = source;

                // 开始播放
                source.start();
            } catch (error) {
                this.isPlaying = false;
                this.currentAudio = null;
                reject(new Error(`播放音频失败: ${error.message}`));
            }
        });
    }

    // 停止播放
    stop() {
        if (this.currentAudio) {
            this.currentAudio.stop();
            this.currentAudio = null;
        }
        this.isPlaying = false;
    }

    // 清理资源
    destroy() {
        this.stop();
        if (this.audioContext) {
            this.audioContext.close();
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

