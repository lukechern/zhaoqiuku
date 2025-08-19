// EventHandler.js - 事件处理模块
import { AudioRecorder } from './audio-recorder.js';

export class EventHandler {
    constructor(app) {
        this.app = app;
    }

    // 处理录音开始
    async handleRecordingStart() {
        if (this.app.isProcessing) return;

        try {
            // 初始化音频录制器（如果需要）
            if (!this.app.audioRecorder.audioStream) {
                const isWebView = this.app.appInitializer.detectWebView();
                
                if (isWebView) {
                    this.app.uiController.showMessage('WebView环境：正在请求麦克风权限...', 'info');
                    // WebView环境下给更多时间
                    await new Promise(resolve => setTimeout(resolve, 500));
                } else {
                    this.app.uiController.showMessage('正在请求麦克风权限...', 'info');
                }
                
                await this.app.audioRecorder.initialize();
            }

            // 开始录音
            await this.app.audioRecorder.startRecording();
            
            // 更新UI
            this.app.uiController.showRecordingState();
            this.app.uiController.vibrate([50]); // 震动反馈
            
            console.log('开始录音');

        } catch (error) {
            console.error('开始录音失败:', error);
            this.app.uiController.hideRecordingState();
            
            const isWebView = this.app.appInitializer.detectWebView();
            
            if (error.message.includes('权限') || error.name === 'NotAllowedError') {
                if (isWebView) {
                    this.app.uiController.showMessage(`
                        WebView环境权限问题：
                        1. 请确保应用已获得麦克风权限
                        2. 尝试重启应用或清除缓存
                        3. 如问题持续，请在系统浏览器中打开
                    `, 'error');
                } else {
                    this.app.uiController.showPermissionPrompt();
                }
            } else {
                this.app.uiController.showError('开始录音失败: ' + error.message);
            }
        }
    }

    // 处理录音停止
    handleRecordingStop() {
        if (!this.app.audioRecorder.isRecording) return;

        try {
            this.app.audioRecorder.stopRecording();
            this.app.uiController.hideRecordingState();
            this.app.uiController.vibrate([100]); // 震动反馈
            
            // 显示处理状态（加载状态）
            this.app.uiController.showProcessingState();
            
            console.log('停止录音');

        } catch (error) {
            console.error('停止录音失败:', error);
            this.app.uiController.showError('停止录音失败: ' + error.message);
            
            // 发生错误时也要还原麦克风按钮状态
            this.app.uiController.hideProcessingState();
        }
    }

    // 处理录音取消
    handleRecordingCancel() {
        if (!this.app.audioRecorder.isRecording) return;

        try {
            // 停止录音但不触发完成事件
            this.app.audioRecorder.cancelRecording();
            this.app.uiController.hideRecordingState();
            this.app.uiController.vibrate([50, 50]); // 取消震动反馈
            
            // 显示取消提示
            this.app.uiController.showMessage('录音已取消', 'info');
            
            console.log('录音已取消');

        } catch (error) {
            console.error('取消录音失败:', error);
            this.app.uiController.showError('取消录音失败: ' + error.message);
        }
    }

    // 处理录音完成
    async handleRecordingComplete(audioBlob, mimeType) {
        if (this.app.isProcessing) return;

        try {
            this.app.isProcessing = true;
            
            // 检查录音质量
            const sizeCheck = this.app.audioRecorder.checkAudioSize();
            if (!sizeCheck.valid) {
                throw new Error(`录音文件过大 (${sizeCheck.sizeMB}MB)，请录制更短的音频`);
            }

            // 启用控制按钮
            this.app.uiController.enableControls();
            
            // 显示处理状态
            this.app.uiController.showLoading('正在处理音频，请稍候...');
            
            // 发送到API
            const result = await this.app.apiClient.transcribeAudio(audioBlob, mimeType);
            
            // 格式化并显示结果
            const displayResult = this.app.apiClient.formatResultForDisplay(result);
            this.app.uiController.showResults(displayResult);
            
            // 等待TTS完成
            await this.waitForTTSCompletion();
            
            // 还原麦克风按钮状态
            this.app.uiController.hideProcessingState();
            
            console.log('音频处理完成:', result);

        } catch (error) {
            console.error('处理录音失败:', error);
            this.app.uiController.showError(error.message);
            
            // 发生错误时也要还原麦克风按钮状态
            this.app.uiController.hideProcessingState();
        } finally {
            this.app.isProcessing = false;
        }
    }
    
    // 等待TTS完成
    async waitForTTSCompletion() {
        // 等待一段时间确保TTS开始播放
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 等待TTS播放完成
        if (window.ttsService && window.ttsService.isPlaying) {
            // 创建一个轮询检查TTS是否完成
            return new Promise(resolve => {
                const checkInterval = setInterval(() => {
                    if (!window.ttsService.isPlaying) {
                        clearInterval(checkInterval);
                        resolve();
                    }
                }, 100);
            });
        }
    }

    // 处理播放
    handlePlayback() {
        try {
            this.app.audioRecorder.playRecording();
            this.app.uiController.vibrate([30]); // 轻微震动反馈
        } catch (error) {
            console.error('播放失败:', error);
            this.app.uiController.showError('播放失败: ' + error.message);
        }
    }

    // 处理清除
    handleClear() {
        try {
            // 清理录音数据
            this.app.audioRecorder.cleanup();
            
            // 重置UI
            this.app.uiController.clearResults();
            this.app.uiController.disableControls();
            this.app.uiController.resetTimer();
            
            // 重新初始化录音器
            this.app.audioRecorder = new AudioRecorder();
            this.app.audioRecorder.onRecordingComplete = (audioBlob, mimeType) => {
                this.handleRecordingComplete(audioBlob, mimeType);
            };
            
            this.app.uiController.vibrate([50]); // 震动反馈
            console.log('已清除录音数据');

        } catch (error) {
            console.error('清除失败:', error);
            this.app.uiController.showError('清除失败: ' + error.message);
        }
    }
}