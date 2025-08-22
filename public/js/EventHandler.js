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
                    this.app.uiController.showMessage('正在唤醒AI助手...', 'info');
                    // WebView环境下给更多时间
                    await new Promise(resolve => setTimeout(resolve, 200));
                } else {
                    this.app.uiController.showMessage('正在唤醒AI助手...', 'info');
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
        console.log('处理录音停止');
        if (!this.app.audioRecorder.isRecording) return;

        try {
            this.app.audioRecorder.stopRecording();
            this.app.uiController.hideRecordingState();
            
            // 额外确保UI元素被正确隐藏_7ree
            this.ensureUICleanup_7ree();
            
            this.app.uiController.vibrate([100]); // 震动反馈
            
            // 显示处理状态（加载状态）
            this.app.uiController.showProcessingState();
            // 在结果区域显示“正在处理音频”提示，避免被占位符覆盖
            if (this.app.uiController.showLoading) {
                this.app.uiController.showLoading('AI助手正在思考中，请您稍候…');
            }
            
            console.log('停止录音');

        } catch (error) {
            console.error('停止录音失败:', error);
            this.app.uiController.showError('停止录音失败: ' + error.message);
            
            // 发生错误时也要还原麦克风按钮状态
            this.app.uiController.hideProcessingState();
            // 错误时也确保UI清理_7ree
            this.ensureUICleanup_7ree();
        }
    }

    // 确保UI元素被正确清理的方法_7ree
    ensureUICleanup_7ree() {
        try {
            // 强制移除水波纹动效的所有相关类
            const soundWaves = document.getElementById('soundWaves');
            if (soundWaves) {
                soundWaves.classList.remove('active', 'recording', 'moved-to-timer_7ree');
                console.log('强制清理水波纹动效类');
            }
            
            // 强制隐藏双按钮
            const dualButtons = document.getElementById('dualRecordingButtons_7ree');
            if (dualButtons) {
                dualButtons.classList.remove('show');
                dualButtons.setAttribute('aria-hidden', 'true');
                console.log('强制隐藏双按钮');
            }
            
            // 确保麦克风按钮显示
            const micButton = document.getElementById('microphoneButton');
            if (micButton) {
                micButton.style.display = '';
                micButton.classList.remove('recording');
            }
            
        } catch (error) {
            console.error('UI清理失败:', error);
        }
    }

    // 处理录音取消
    handleRecordingCancel() {
        if (!this.app.audioRecorder.isRecording) return;

        try {
            // 停止录音但不触发完成事件
            this.app.audioRecorder.cancelRecording();
            this.app.uiController.hideRecordingState();
            
            // 额外确保UI元素被正确隐藏_7ree
            this.ensureUICleanup_7ree();
            
            this.app.uiController.vibrate([50, 50]); // 取消震动反馈
            
            // 显示取消提示，然后延迟恢复placeholder
            this.app.uiController.showMessage('录音已取消', 'info');
            
            // 2秒后恢复placeholder状态
            setTimeout(() => {
                if (this.app.uiController.elements.resultsContainer) {
                    this.app.uiController.elements.resultsContainer.innerHTML = '<div class="placeholder">存放物品还是查找物品？<br>轻触麦克风问问AI助手…</div>';
                }
            }, 2000);
            
            console.log('录音已取消');

        } catch (error) {
            console.error('取消录音失败:', error);
            this.app.uiController.showError('取消录音失败: ' + error.message);
            // 错误时也确保UI清理_7ree
            this.ensureUICleanup_7ree();
            
            // 错误时也需要恢复placeholder
            setTimeout(() => {
                if (this.app.uiController.elements.resultsContainer) {
                    this.app.uiController.elements.resultsContainer.innerHTML = '<div class="placeholder">存放物品还是查找物品？<br>轻触麦克风问问AI助手…</div>';
                }
            }, 2000);
        }
    }

    // 处理录音完成
    async handleRecordingComplete(audioBlob, mimeType) {
        if (this.app.isProcessing) return;

        try {
            this.app.isProcessing = true;

            // 确保无论是手动停止还是自动停止（20秒超时），都先隐藏录音UI与动效_7ree
            this.app.uiController.hideRecordingState();
            this.ensureUICleanup_7ree();
            
            // 检查录音质量
            const sizeCheck = this.app.audioRecorder.checkAudioSize();
            if (!sizeCheck.valid) {
                throw new Error(`录音文件过大 (${sizeCheck.sizeMB}MB)，请录制更短的音频`);
            }

            // 启用控制按钮
            this.app.uiController.enableControls();
            
            // 显示处理状态
            this.app.uiController.showProcessingState();
            // 在结果区域显示"正在处理音频"提示
            if (this.app.uiController.showLoading) {
                this.app.uiController.showLoading('AI助手正在思考中，请您稍候…');
            }
            
            // 发送到API
            const result = await this.app.apiClient.transcribeAudio(audioBlob, mimeType);
            
            // 格式化并显示结果，不等待TTS播放完成
            const displayResult = this.app.apiClient.formatResultForDisplay(result);
            await this.app.uiController.showResults(displayResult);
            
            console.log('音频处理完成，结果已显示（TTS后台异步播放）');
            
            // 等待TTS播放完成后再还原麦克风按钮状态_7ree
            if (window.streamRenderer_7ree && typeof window.streamRenderer_7ree.waitForTTSCompletion === 'function') {
                await window.streamRenderer_7ree.waitForTTSCompletion();
            }
            
            // 朗读完成后延迟1秒再还原状态_7ree
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // 还原麦克风按钮状态
            this.app.uiController.hideProcessingState();
            
            console.log('麦克风按钮状态已还原');

        } catch (error) {
            console.error('处理录音失败:', error);
            this.app.uiController.showError(error.message);
            
            // 发生错误时也要还原麦克风按钮状态
            this.app.uiController.hideProcessingState();
        } finally {
            this.app.isProcessing = false;
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