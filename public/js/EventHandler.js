// EventHandler.js - 事件处理模块
import { AudioRecorder } from './audio-recorder.js';

export class EventHandler {
    constructor(app) {
        this.app = app;
        // 新增：取消占位符定时器句柄，防止竞态覆盖UI_7ree
        this.cancelPlaceholderTimeout_7ree = null;
        
        // 新增：初始化静音自动结束功能
        this.initSilenceAutoStop();
    }

    // 新增：初始化静音自动结束功能
    initSilenceAutoStop() {
        // 设置音频录制器的静音自动结束回调
        this.app.audioRecorder.setSilenceAutoStopCallback(() => {
            console.log('检测到用户静音超时4秒，自动结束录音');
            this.handleSilenceAutoStop();
        });
    }
    
    // 新增：处理静音自动结束录音
    handleSilenceAutoStop() {
        if (!this.app.audioRecorder.isRecording) {
            console.log('当前未在录音，忽略静音自动结束');
            return;
        }
        
        console.log('执行静音自动结束录音流程');
        
        // 直接调用停止录音方法，这会触发正常的录音完成流程
        this.handleRecordingStop();
        
        // 可选：显示提示信息
        setTimeout(() => {
            this.app.uiController.showMessage('检测到您停止说话，已自动结束录音', 'info');
        }, 100);
    }

    // 处理录音开始
    async handleRecordingStart() {
        if (this.app.isProcessing) return;

        // 新增：开始录音前，清理任何尚未触发的取消占位符定时器_7ree
        this.clearCancelPlaceholderTimeout_7ree();

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

        // 新增：停止前也清理可能存在的取消占位符定时器_7ree
        this.clearCancelPlaceholderTimeout_7ree();

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
        console.log('处理录音取消');
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
            
            // 新增：先清理旧的占位符定时器，再设置新的，并保存句柄_7ree
            this.clearCancelPlaceholderTimeout_7ree();
            console.log('设置延迟恢复占位符');
            this.cancelPlaceholderTimeout_7ree = setTimeout(() => {
                console.log('延迟恢复占位符');
                if (this.app.uiController.elements.resultsContainer) {
                    this.app.uiController.elements.resultsContainer.innerHTML = '<div class="placeholder">存放物品还是查找物品？<br>轻触麦克风问问AI助手…</div>';
                }
                // 触发后清空句柄_7ree
                this.cancelPlaceholderTimeout_7ree = null;
            }, 2000);
            
            console.log('录音已取消');

        } catch (error) {
            console.error('取消录音失败:', error);
            this.app.uiController.showError('取消录音失败: ' + error.message);
            // 错误时也确保UI清理_7ree
            this.ensureUICleanup_7ree();
            
            // 错误时也需要恢复placeholder（同样受控于句柄，避免竞态）
            this.clearCancelPlaceholderTimeout_7ree();
            console.log('错误处理中设置延迟恢复占位符');
            this.cancelPlaceholderTimeout_7ree = setTimeout(() => {
                console.log('延迟恢复占位符');
                if (this.app.uiController.elements.resultsContainer) {
                    this.app.uiController.elements.resultsContainer.innerHTML = '<div class="placeholder">存放物品还是查找物品？<br>轻触麦克风问问AI助手…</div>';
                }
                this.cancelPlaceholderTimeout_7ree = null;
            }, 2000);
        }
    }

    // 处理录音完成
    async handleRecordingComplete(audioBlob, mimeType) {
        if (this.app.isProcessing) return;

        // 新增：完成前清理取消占位符定时器，避免覆盖结果或后续录音UI_7ree
        this.clearCancelPlaceholderTimeout_7ree();

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
            
            // 异步播放AI思考提示音频
            this.playAIThinkingSound();
            
            // 发送到API
            const result = await this.app.apiClient.transcribeAudio(audioBlob, mimeType);
            
            // 检查API调用是否成功
            if (!result.success) {
                // API返回业务逻辑错误，不是异常
                console.log('API返回错误:', result.error);
                this.app.uiController.isRecording = false;
                this.app.uiController.hideProcessingState();
                this.app.uiController.showError(result.error);
                return;
            }
            
            // 检测意图不明确的情况并播放对应提示音
            if (result.action === 'unknown') {
                console.log('🔊 检测到意图不明确，播放Unknow.mp3');
                this.playUnknownIntentSound();
            }
            
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
            
            // 播放错误提示音
            this.playErrorSound();
            
            // 发生错误时要先重置录音状态，再显示错误
            this.app.uiController.isRecording = false;
            this.app.uiController.hideProcessingState();
            
            // 显示错误信息
            this.app.uiController.showError(error.message);
        } finally {
            this.app.isProcessing = false;
        }
    }

    // 新增：统一清理取消占位符定时器的方法_7ree
    clearCancelPlaceholderTimeout_7ree() {
        if (this.cancelPlaceholderTimeout_7ree) {
            console.log('清理取消占位符定时器');
            clearTimeout(this.cancelPlaceholderTimeout_7ree);
            this.cancelPlaceholderTimeout_7ree = null;
        }
    }

    // 新增：异步播放AI思考提示音频
    playAIThinkingSound() {
        try {
            const audio = new Audio('/mp3/AIthinking.mp3');
            
            // 设置音量（可选）
            audio.volume = 0.7;
            
            // 异步播放，不等待播放完成
            audio.play().catch(error => {
                console.warn('AI思考提示音播放失败:', error);
                // 音频播放失败不影响主流程，只记录警告
            });
            
            console.log('AI思考提示音开始播放');
        } catch (error) {
            console.warn('创建AI思考提示音失败:', error);
            // 不抛出异常，保证主流程不受影响
        }
    }

    // 新增：异步播放意图不明确提示音频
    playUnknownIntentSound() {
        try {
            const audio = new Audio('/mp3/Unknow.mp3');
            
            // 设置音量（可选）
            audio.volume = 0.7;
            
            // 异步播放，不等待播放完成
            audio.play().catch(error => {
                console.warn('意图不明确提示音播放失败:', error);
                // 音频播放失败不影响主流程，只记录警告
            });
            
            console.log('意图不明确提示音开始播放');
        } catch (error) {
            console.warn('创建意图不明确提示音失败:', error);
            // 不抛出异常，保证主流程不受影响
        }
    }

    // 新增：异步播放错误提示音频
    playErrorSound() {
        try {
            const audio = new Audio('/mp3/unclear.mp3');
            
            // 设置音量（可选）
            audio.volume = 0.7;
            
            // 异步播放，不等待播放完成
            audio.play().catch(error => {
                console.warn('错误提示音播放失败:', error);
                // 音频播放失败不影响主流程，只记录警告
            });
            
            console.log('错误提示音开始播放');
        } catch (error) {
            console.warn('创建错误提示音失败:', error);
            // 不抛出异常，保证主流程不受影响
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