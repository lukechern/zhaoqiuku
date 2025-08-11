// 主应用程序
class VoiceRecognitionApp {
    constructor() {
        this.audioRecorder = new AudioRecorder();
        this.uiController = new UIController();
        this.apiClient = new APIClient();
        
        this.isInitialized = false;
        this.isProcessing = false;
    }

    // 初始化应用
    async initialize() {
        try {
            // 检查浏览器支持
            if (!this.checkBrowserSupport()) {
                this.uiController.showUnsupportedPrompt();
                return;
            }

            // 初始化UI
            this.uiController.initialize();
            this.setupEventHandlers();

            // 显示初始状态
            this.uiController.clearResults();
            this.uiController.disableControls();

            this.isInitialized = true;
            console.log('语音识别应用初始化完成');

        } catch (error) {
            console.error('应用初始化失败:', error);
            this.uiController.showError('应用初始化失败: ' + error.message);
        }
    }

    // 检查浏览器支持
    checkBrowserSupport() {
        const requiredFeatures = [
            'navigator.mediaDevices',
            'navigator.mediaDevices.getUserMedia',
            'MediaRecorder',
            'fetch'
        ];

        for (const feature of requiredFeatures) {
            if (!this.hasFeature(feature)) {
                console.error(`浏览器不支持: ${feature}`);
                return false;
            }
        }

        return true;
    }

    // 检查功能是否存在
    hasFeature(featurePath) {
        const parts = featurePath.split('.');
        let obj = window;
        
        for (const part of parts) {
            if (!(part in obj)) {
                return false;
            }
            obj = obj[part];
        }
        
        return true;
    }

    // 设置事件处理器
    setupEventHandlers() {
        // 录音事件
        this.uiController.onRecordingStart = () => this.handleRecordingStart();
        this.uiController.onRecordingStop = () => this.handleRecordingStop();
        
        // 控制按钮事件
        this.uiController.onPlayback = () => this.handlePlayback();
        this.uiController.onClear = () => this.handleClear();
        
        // 录音完成事件
        this.audioRecorder.onRecordingComplete = (audioBlob, mimeType) => {
            this.handleRecordingComplete(audioBlob, mimeType);
        };
    }

    // 处理录音开始
    async handleRecordingStart() {
        if (this.isProcessing) return;

        try {
            // 初始化音频录制器（如果需要）
            if (!this.audioRecorder.audioStream) {
                this.uiController.showMessage('正在请求麦克风权限...', 'info');
                await this.audioRecorder.initialize();
            }

            // 开始录音
            await this.audioRecorder.startRecording();
            
            // 更新UI
            this.uiController.showRecordingState();
            this.uiController.vibrate([50]); // 震动反馈
            
            console.log('开始录音');

        } catch (error) {
            console.error('开始录音失败:', error);
            this.uiController.hideRecordingState();
            
            if (error.message.includes('权限')) {
                this.uiController.showPermissionPrompt();
            } else {
                this.uiController.showError('开始录音失败: ' + error.message);
            }
        }
    }

    // 处理录音停止
    handleRecordingStop() {
        if (!this.audioRecorder.isRecording) return;

        try {
            this.audioRecorder.stopRecording();
            this.uiController.hideRecordingState();
            this.uiController.vibrate([100]); // 震动反馈
            
            console.log('停止录音');

        } catch (error) {
            console.error('停止录音失败:', error);
            this.uiController.showError('停止录音失败: ' + error.message);
        }
    }

    // 处理录音完成
    async handleRecordingComplete(audioBlob, mimeType) {
        if (this.isProcessing) return;

        try {
            this.isProcessing = true;
            
            // 检查录音质量
            const sizeCheck = this.audioRecorder.checkAudioSize();
            if (!sizeCheck.valid) {
                throw new Error(`录音文件过大 (${sizeCheck.sizeMB}MB)，请录制更短的音频`);
            }

            // 启用控制按钮
            this.uiController.enableControls();
            
            // 显示处理状态
            this.uiController.showLoading('正在处理音频，请稍候...');
            
            // 发送到API
            const result = await this.apiClient.transcribeAudio(audioBlob, mimeType);
            
            // 格式化并显示结果
            const displayResult = this.apiClient.formatResultForDisplay(result);
            this.uiController.showResults(displayResult);
            
            console.log('音频处理完成:', result);

        } catch (error) {
            console.error('处理录音失败:', error);
            this.uiController.showError(error.message);
        } finally {
            this.isProcessing = false;
        }
    }

    // 处理播放
    handlePlayback() {
        try {
            this.audioRecorder.playRecording();
            this.uiController.vibrate([30]); // 轻微震动反馈
        } catch (error) {
            console.error('播放失败:', error);
            this.uiController.showError('播放失败: ' + error.message);
        }
    }

    // 处理清除
    handleClear() {
        try {
            // 清理录音数据
            this.audioRecorder.cleanup();
            
            // 重置UI
            this.uiController.clearResults();
            this.uiController.disableControls();
            this.uiController.resetTimer();
            
            // 重新初始化录音器
            this.audioRecorder = new AudioRecorder();
            this.audioRecorder.onRecordingComplete = (audioBlob, mimeType) => {
                this.handleRecordingComplete(audioBlob, mimeType);
            };
            
            this.uiController.vibrate([50]); // 震动反馈
            console.log('已清除录音数据');

        } catch (error) {
            console.error('清除失败:', error);
            this.uiController.showError('清除失败: ' + error.message);
        }
    }

    // 应用销毁
    destroy() {
        try {
            this.audioRecorder.cleanup();
            console.log('应用已销毁');
        } catch (error) {
            console.error('销毁应用失败:', error);
        }
    }
}

// 应用启动
document.addEventListener('DOMContentLoaded', async () => {
    const app = new VoiceRecognitionApp();
    
    try {
        await app.initialize();
    } catch (error) {
        console.error('应用启动失败:', error);
    }
    
    // 页面卸载时清理资源
    window.addEventListener('beforeunload', () => {
        app.destroy();
    });
    
    // 全局错误处理
    window.addEventListener('error', (event) => {
        console.error('全局错误:', event.error);
    });
    
    window.addEventListener('unhandledrejection', (event) => {
        console.error('未处理的Promise拒绝:', event.reason);
    });
});