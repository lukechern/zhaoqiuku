// 音频录制模块
class AudioRecorder {
    constructor() {
        this.mediaRecorder = null;
        this.audioStream = null;
        this.audioChunks = [];
        this.isRecording = false;
        this.recordingStartTime = null;
        this.maxRecordingTime = 20000; // 20秒
        this.recordingTimer = null;
        this.audioBlob = null;
        this.audioUrl = null;
    }

    // 初始化音频权限
    async initialize() {
        try {
            this.audioStream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 44100
                } 
            });
            return true;
        } catch (error) {
            console.error('无法获取麦克风权限:', error);
            throw new Error('请允许访问麦克风权限');
        }
    }

    // 开始录音
    async startRecording() {
        if (this.isRecording) return;

        try {
            if (!this.audioStream) {
                await this.initialize();
            }

            this.audioChunks = [];
            this.recordingStartTime = Date.now();
            
            // 设置录音格式
            const options = {
                mimeType: this.getSupportedMimeType()
            };

            this.mediaRecorder = new MediaRecorder(this.audioStream, options);
            
            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data && event.data.size > 0) {
                    this.audioChunks.push(event.data);
                }
            };

            this.mediaRecorder.onstop = () => {
                this.handleRecordingStop();
            };

            this.mediaRecorder.start(100); // 每100ms收集一次数据
            this.isRecording = true;

            // 设置最大录音时间
            this.recordingTimer = setTimeout(() => {
                this.stopRecording();
            }, this.maxRecordingTime);

            return true;
        } catch (error) {
            console.error('开始录音失败:', error);
            throw error;
        }
    }

    // 停止录音
    stopRecording() {
        if (!this.isRecording || !this.mediaRecorder) return;

        this.isRecording = false;
        
        if (this.recordingTimer) {
            clearTimeout(this.recordingTimer);
            this.recordingTimer = null;
        }

        if (this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.stop();
        }
    }

    // 处理录音停止
    handleRecordingStop() {
        if (this.audioChunks.length === 0) return;

        const mimeType = this.getSupportedMimeType();
        this.audioBlob = new Blob(this.audioChunks, { type: mimeType });
        
        // 清理旧的URL
        if (this.audioUrl) {
            URL.revokeObjectURL(this.audioUrl);
        }
        
        this.audioUrl = URL.createObjectURL(this.audioBlob);
        
        // 触发录音完成事件
        if (this.onRecordingComplete) {
            this.onRecordingComplete(this.audioBlob, mimeType);
        }
    }

    // 获取支持的音频格式
    getSupportedMimeType() {
        const types = [
            'audio/webm;codecs=opus',
            'audio/webm',
            'audio/mp4',
            'audio/ogg;codecs=opus',
            'audio/wav'
        ];

        for (const type of types) {
            if (MediaRecorder.isTypeSupported(type)) {
                return type;
            }
        }
        
        return 'audio/webm'; // 默认格式
    }

    // 播放录音
    playRecording() {
        if (!this.audioUrl) return;
        
        const audio = new Audio(this.audioUrl);
        audio.play().catch(error => {
            console.error('播放录音失败:', error);
        });
    }

    // 获取录音时长
    getRecordingDuration() {
        if (!this.recordingStartTime) return 0;
        return Date.now() - this.recordingStartTime;
    }

    // 清理资源
    cleanup() {
        if (this.recordingTimer) {
            clearTimeout(this.recordingTimer);
            this.recordingTimer = null;
        }

        if (this.audioUrl) {
            URL.revokeObjectURL(this.audioUrl);
            this.audioUrl = null;
        }

        if (this.audioStream) {
            this.audioStream.getTracks().forEach(track => track.stop());
            this.audioStream = null;
        }

        this.audioChunks = [];
        this.audioBlob = null;
        this.isRecording = false;
    }

    // 将音频转换为Base64
    async audioToBase64() {
        if (!this.audioBlob) return null;
        
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const base64 = reader.result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(this.audioBlob);
        });
    }

    // 检查音频大小
    checkAudioSize() {
        if (!this.audioBlob) return { valid: false, size: 0 };
        
        const maxSize = 20 * 1024 * 1024; // 20MB
        const size = this.audioBlob.size;
        
        return {
            valid: size <= maxSize,
            size: size,
            sizeMB: (size / 1024 / 1024).toFixed(2)
        };
    }
}