// 音频录制模块
import { VolumeVisualizer } from './volume-visualizer.js';

export class AudioRecorder {
    constructor() {
        this.mediaRecorder = null;
        this.audioStream = null;
        this.audioChunks = [];
        this.isRecording = false;
        this.recordingStartTime = null;
        this.maxRecordingTime = 2000000; // 20秒
        this.recordingTimer = null;
        this.audioBlob = null;
        this.audioUrl = null;
        this.volumeVisualizer = null;
    }

    // 初始化音频权限
    async initialize() {
        try {
            // 检查是否在WebView环境中
            const isWebView = this.detectWebView();
            console.log('WebView环境检测:', isWebView);

            // 检查基础API支持
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('浏览器不支持音频录制功能');
            }

            // 尝试获取权限，WebView环境使用更宽松的配置
            const constraints = isWebView ? {
                audio: true  // WebView中使用简单配置
            } : {
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 44100
                }
            };

            this.audioStream = await navigator.mediaDevices.getUserMedia(constraints);
            console.log('音频流获取成功');
            return true;
        } catch (error) {
            console.error('无法获取麦克风权限:', error);
            
            // 根据错误类型提供不同的提示
            if (error.name === 'NotAllowedError') {
                throw new Error('麦克风权限被拒绝，请在应用设置中允许麦克风权限');
            } else if (error.name === 'NotFoundError') {
                throw new Error('未找到麦克风设备');
            } else if (error.name === 'NotSupportedError') {
                throw new Error('当前环境不支持音频录制');
            } else {
                throw new Error('获取麦克风权限失败: ' + error.message);
            }
        }
    }

    // 检测是否在WebView环境中
    detectWebView() {
        const userAgent = navigator.userAgent;
        
        // 检测Android WebView
        const isAndroidWebView = /Android.*wv\)|.*WebView.*Android/i.test(userAgent);
        
        // 检测其他WebView标识
        const hasWebViewMarkers = /WebView|wv|WebKit.*Mobile/i.test(userAgent);
        
        // 检测是否缺少某些浏览器特有功能
        const lacksFeatures = !window.chrome || !window.chrome.runtime;
        
        return isAndroidWebView || (hasWebViewMarkers && lacksFeatures);
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

            // 启动音量可视化
            this.startVolumeVisualizer();

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

        // 停止音量可视化
        this.stopVolumeVisualizer();
    }

    // 取消录音（不触发完成事件）
    cancelRecording() {
        if (!this.isRecording || !this.mediaRecorder) return;

        this.isRecording = false;
        
        if (this.recordingTimer) {
            clearTimeout(this.recordingTimer);
            this.recordingTimer = null;
        }

        // 移除完成事件处理器，防止触发
        const originalHandler = this.onRecordingComplete;
        this.onRecordingComplete = null;

        if (this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.stop();
        }

        // 清理数据
        this.audioChunks = [];
        if (this.audioUrl) {
            URL.revokeObjectURL(this.audioUrl);
            this.audioUrl = null;
        }
        this.audioBlob = null;

        // 恢复事件处理器
        setTimeout(() => {
            this.onRecordingComplete = originalHandler;
        }, 100);
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
        // WebView环境优先使用更兼容的格式
        const isWebView = this.detectWebView();
        
        const types = isWebView ? [
            'audio/webm',           // WebView中最兼容
            'audio/mp4',
            'audio/3gpp',           // Android原生支持
            'audio/wav',
            'audio/webm;codecs=opus',
            'audio/ogg;codecs=opus'
        ] : [
            'audio/webm;codecs=opus',
            'audio/webm',
            'audio/mp4',
            'audio/ogg;codecs=opus',
            'audio/wav'
        ];

        for (const type of types) {
            if (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(type)) {
                console.log('选择音频格式:', type);
                return type;
            }
        }
        
        // 如果都不支持，返回最基础的格式
        console.warn('未找到支持的音频格式，使用默认格式');
        return isWebView ? 'audio/webm' : 'audio/webm';
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
        // 停止音量可视化
        this.destroyVolumeVisualizer();

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

    // 设置音量可视化容器
    setVolumeVisualizerContainer(container) {
        this.volumeVisualizerContainer = container;
    }

    // 启动音量可视化
    startVolumeVisualizer() {
        if (!this.volumeVisualizerContainer || !this.audioStream) return;

        try {
            if (!this.volumeVisualizer) {
                this.volumeVisualizer = new VolumeVisualizer(this.audioStream, this.volumeVisualizerContainer);
            }
            this.volumeVisualizer.start();
        } catch (error) {
            console.error('启动音量可视化失败:', error);
        }
    }

    // 停止音量可视化
    stopVolumeVisualizer() {
        if (this.volumeVisualizer) {
            this.volumeVisualizer.stop();
        }
    }

    // 销毁音量可视化
    destroyVolumeVisualizer() {
        if (this.volumeVisualizer) {
            this.volumeVisualizer.destroy();
            this.volumeVisualizer = null;
        }
    }
}