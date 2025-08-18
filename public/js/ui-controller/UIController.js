// UIController.js - UI控制模块主类

export class UIController {
    constructor() {
        this.elements = {
            microphoneButton: document.getElementById('microphoneButton'),
            soundWaves: document.getElementById('soundWaves'),
            listeningIndicator: null, // 已移除的元素，设为null
            cancelIndicator: document.getElementById('cancelIndicator'),
            timer: null, // 已移除的元素，设为null
            playbackBtn: document.getElementById('playbackBtn'),
            clearBtn: document.getElementById('clearBtn'),
            refreshBtn: document.getElementById('refreshBtn'),
            resultsContainer: document.getElementById('resultsContainer'),
            debugLevel: document.getElementById('debugLevel')
        };

        this.timerInterval = null;
        this.startTime = null;
        this.isRecording = false;
        this.startTouchY = null;
        this.currentTouchY = null;
        this.cancelThreshold = 80; // 向上滑动80px取消
        this.isCanceling = false;
        this.lastResultData = null;
    }

    // 初始化UI事件
    initialize() {
        // 确保DOM元素存在后再绑定事件
        if (!this.elements.microphoneButton) {
            console.error('麦克风按钮元素未找到，延迟初始化...');
            this.retryElementInitialization();
        } else {
            this.setupTouchEvents();
        }

        this.setupButtonEvents();
        this.setupDebugControls();
    }

    // 重试元素初始化
    retryElementInitialization() {
        const maxRetries = 10;
        let retries = 0;

        const tryInitialize = () => {
            retries++;
            console.log(`尝试初始化UI元素，第${retries}次...`);

            // 重新获取所有元素
            this.elements = {
                microphoneButton: document.getElementById('microphoneButton') || this.elements.microphoneButton,
                soundWaves: document.getElementById('soundWaves') || this.elements.soundWaves,
                listeningIndicator: null, // 已移除的元素，设为null
                cancelIndicator: document.getElementById('cancelIndicator') || this.elements.cancelIndicator,
                timer: null, // 已移除的元素，设为null
                playbackBtn: document.getElementById('playbackBtn') || this.elements.playbackBtn,
                clearBtn: document.getElementById('clearBtn') || this.elements.clearBtn,
                refreshBtn: document.getElementById('refreshBtn') || this.elements.refreshBtn,
                resultsContainer: document.getElementById('resultsContainer') || this.elements.resultsContainer,
                debugLevel: document.getElementById('debugLevel') || this.elements.debugLevel
            };

            // 检查关键元素是否已加载
            if (this.elements.microphoneButton) {
                console.log('UI元素初始化成功');
                this.setupTouchEvents();
            } else if (retries < maxRetries) {
                setTimeout(tryInitialize, 200);
            } else {
                console.error('UI元素初始化失败，达到最大重试次数');
            }
        };

        setTimeout(tryInitialize, 200);
    }

    // 设置调试控制 - 前台控制已禁用，只能通过配置文件或控制台设置
    setupDebugControls() {
        // 前台调试控制已隐藏，调试级别只能通过以下方式设置：
        // 1. 修改 config/debugConfig.js 中的 CURRENT_DEBUG_LEVEL
        // 2. 在控制台使用 setDebugLevel("level") 命令
        
        // 监听调试级别变化事件（来自控制台设置）
        window.addEventListener('debugLevelChanged', () => {
            // 如果有结果显示，重新格式化显示
            if (this.lastResultData) {
                this.showResults(this.lastResultData);
            }
        });
        
        console.log('🔧 调试控制提示:');
        console.log('- 修改 config/debugConfig.js 中的 CURRENT_DEBUG_LEVEL 来永久设置调试级别');
        console.log('- 使用 setDebugLevel("normal"|"debug"|"full_debug") 来临时设置调试级别');
        console.log('- 使用 showDebugLevels() 查看所有可用的调试级别');
    }

    // 检查用户认证状态
    checkAuthenticationStatus() {
        // 检查token是否存在
        const token = localStorage.getItem('zhaoqiuku_access_token');
        const hasAuthManager = !!window.authManager;
        const isAuthenticated = window.authManager && window.authManager.isAuthenticated;

        console.log('检查认证状态:', {
            hasToken: !!token,
            hasAuthManager: hasAuthManager,
            isAuthenticated: isAuthenticated,
            user: window.authManager && window.authManager.user && window.authManager.user.email
        });

        // 如果有token或者认证管理器显示已登录，则允许录音
        if (token || (hasAuthManager && isAuthenticated)) {
            console.log('用户已登录，允许录音');
            // 如果已登录，确保清除任何登录相关的样式
            this.clearLoginRequiredState();
            return true;
        }

        console.log('用户未登录，显示登录提示');
        this.showLoginRequired();
        return false;
    }

    // 清除登录要求状态
    clearLoginRequiredState() {
        // 移除麦克风按钮的禁用样式
        this.elements.microphoneButton.classList.remove('login-required');

        // 如果当前显示的是登录提示，清除它
        const container = this.elements.resultsContainer;
        if (container.querySelector('.login-required-message')) {
            this.clearResults();
        }
    }

    // 显示需要登录的提示并跳转
    showLoginRequired() {
        // 显示特殊的登录提示消息
        const container = this.elements.resultsContainer;
        container.innerHTML = `
            <div class="login-required-message">
                请先登录后再使用语音识别功能
                <br><small>即将跳转到登录页面...</small>
            </div>
        `;

        // 给麦克风按钮添加禁用样式
        this.elements.microphoneButton.classList.add('login-required');

        // 震动提示
        this.vibrate([100, 50, 100]);

        // 延迟跳转到登录页面
        setTimeout(() => {
            // 保存当前页面URL，登录后可以返回
            const currentUrl = window.location.href;
            const returnUrl = encodeURIComponent(currentUrl);

            // 跳转到登录页面，带上返回URL参数
            window.location.href = `auth.html?return=${returnUrl}`;
        }, 2000); // 2秒后跳转，让用户看到提示消息

        // 添加倒计时显示
        let countdown = 2;
        const countdownInterval = setInterval(() => {
            countdown--;
            if (countdown > 0) {
                const message = container.querySelector('.login-required-message small');
                if (message) {
                    message.textContent = `${countdown} 秒后跳转到登录页面...`;
                }
            } else {
                clearInterval(countdownInterval);
            }
        }, 1000);
    }

    // 处理按下开始
    handlePressStart() {
        console.log('handlePressStart 被调用');

        // 检查用户是否已登录
        if (!this.checkAuthenticationStatus()) {
            console.log('认证检查失败，阻止录音');
            return; // 如果未登录，不继续录音流程
        }

        console.log('认证检查通过，开始录音流程');
        this.isRecording = true;
        if (this.onRecordingStart) {
            this.onRecordingStart();
        }
    }

    // 处理按下结束
    handlePressEnd() {
        this.isRecording = false;
        if (this.onRecordingStop) {
            this.onRecordingStop();
        }
    }

    // 处理取消录音
    handleCancel() {
        this.isRecording = false;
        if (this.onRecordingCancel) {
            this.onRecordingCancel();
        }
        this.hideRecordingState();
        this.hideCancelState();
        this.resetTimer(); // 取消时重置计时器
    }

    // 显示录音状态
    showRecordingState() {
        // 添加元素存在性检查
        if (this.elements.microphoneButton) {
            this.elements.microphoneButton.classList.add('recording');
        }
        if (this.elements.soundWaves) {
            this.elements.soundWaves.classList.add('active', 'recording');
        }
        if (this.elements.cancelIndicator) {
            this.elements.cancelIndicator.classList.add('active');
        }
        if (this.elements.timer) {
            this.elements.timer.classList.add('recording');
        }

        // 在 results-json 区域显示"聆听中……"和计时器
        if (this.elements.resultsContainer) {
            this.elements.resultsContainer.innerHTML = `
                <div class="results-json">
                    <div class="listening-status">聆听中……</div>
                    <div class="timer-display">00:00</div>
                </div>
            `;
        }

        // 启动计时器
        if (this.startTimer) {
            this.startTimer();
        }
    }

    // 隐藏录音状态
    hideRecordingState() {
        // 添加元素存在性检查
        if (this.elements.microphoneButton) {
            this.elements.microphoneButton.classList.remove('recording');
        }
        if (this.elements.soundWaves) {
            this.elements.soundWaves.classList.remove('active', 'recording');
        }
        if (this.elements.cancelIndicator) {
            this.elements.cancelIndicator.classList.remove('active', 'canceling');
        }
        if (this.elements.timer) {
            this.elements.timer.classList.remove('recording');
        }

        // 清除 results-json 区域的内容
        if (this.elements.resultsContainer) {
            this.elements.resultsContainer.innerHTML = '<div class="placeholder">存放还是查找物品？按住麦克风问问AI</div>';
        }

        if (this.stopTimer) {
            this.stopTimer();
        }
    }

    // 显示取消状态
    showCancelState() {
        if (this.elements.cancelIndicator) {
            this.elements.cancelIndicator.classList.add('canceling');
        }
        // 通过resultsContainer更新取消状态文本
        if (this.elements.resultsContainer) {
            const statusElement = this.elements.resultsContainer.querySelector('.listening-status');
            if (statusElement) {
                statusElement.textContent = '松手取消录音';
            }
        }
        this.vibrate([30, 30, 30]); // 震动提示
    }

    // 隐藏取消状态
    hideCancelState() {
        if (this.elements.cancelIndicator) {
            this.elements.cancelIndicator.classList.remove('canceling');
        }
        // 通过resultsContainer恢复状态文本
        if (this.elements.resultsContainer) {
            const statusElement = this.elements.resultsContainer.querySelector('.listening-status');
            if (statusElement) {
                statusElement.textContent = '聆听中……';
            }
        }
    }

    // 显示结果
    showResults(data) {
        // 保存最后的结果数据，用于调试级别切换时重新显示
        this.lastResultData = data;

        const container = this.elements.resultsContainer;

        if (typeof data === 'string') {
            container.innerHTML = `<div class="results-json">${this.escapeHtml(data)}</div>`;
        } else {
            // 格式化显示，突出重要信息
            const formattedData = this.formatDebugData(data);
            container.innerHTML = `<div class="results-json">${formattedData}</div>`;
        }

        // 添加点击事件监听器到可播放的元素
        const playableElements = container.querySelectorAll('.playable');
        playableElements.forEach(element => {
            element.addEventListener('click', (event) => {
                // 阻止事件冒泡
                event.stopPropagation();
                
                // 添加播放状态样式和跑马灯效果
                element.classList.add('playing');
                if (window.runnerEffect_7ree) {
                    window.runnerEffect_7ree.addRunner(element);
                }
                
                // 检查是用户气泡还是AI气泡
                if (element.classList.contains('user-say')) {
                    // 点击的是用户气泡，播放本地录音
                    if (window.app && window.app.audioRecorder && window.app.audioRecorder.audioUrl) {
                        const audio = new Audio(window.app.audioRecorder.audioUrl);
                        audio.play().then(() => {
                            // 播放成功，监听播放结束事件
                            audio.onended = () => {
                                element.classList.remove('playing');
                                if (window.runnerEffect_7ree) {
                                    window.runnerEffect_7ree.removeRunner(element);
                                }
                            };
                        }).catch(() => {
                            // 播放出错，立即移除播放状态样式和跑马灯效果
                            element.classList.remove('playing');
                            if (window.runnerEffect_7ree) {
                                window.runnerEffect_7ree.removeRunner(element);
                            }
                        });
                    } else {
                        // 如果没有录音播放功能，立即移除播放状态样式和跑马灯效果
                        element.classList.remove('playing');
                        if (window.runnerEffect_7ree) {
                            window.runnerEffect_7ree.removeRunner(element);
                        }
                    }
                } else if (element.classList.contains('ai-reply')) {
                    // 点击的是AI气泡，播放TTS缓存
                    if (window.ttsService && window.ttsService.isPlaying) {
                        window.ttsService.stop();
                    }
                    
                    // 从元素获取数据
                    const message = element.getAttribute('data-message');
                    
                    // 检查是否有缓存的TTS音频数据
                    if (window.ttsService && window.ttsService.cachedAudioData && window.ttsService.cachedText === message) {
                        // 播放缓存的TTS音频
                        try {
                            window.ttsService.playAudio(window.ttsService.cachedAudioData).then(() => {
                                // 播放完成，移除播放状态样式和跑马灯效果
                                element.classList.remove('playing');
                                if (window.runnerEffect_7ree) {
                                    window.runnerEffect_7ree.removeRunner(element);
                                }
                            }).catch(() => {
                                // 播放出错，移除播放状态样式和跑马灯效果
                                element.classList.remove('playing');
                                if (window.runnerEffect_7ree) {
                                    window.runnerEffect_7ree.removeRunner(element);
                                }
                            });
                        } catch (error) {
                            console.error('播放缓存TTS失败:', error);
                            element.classList.remove('playing');
                            if (window.runnerEffect_7ree) {
                                window.runnerEffect_7ree.removeRunner(element);
                            }
                        }
                    } else if (message && window.ttsService && window.ttsService.isAvailable()) {
                        // 如果没有缓存或消息不匹配，重新生成TTS
                        window.ttsService.speak(message).then(() => {
                            // 播放完成，移除播放状态样式和跑马灯效果
                            element.classList.remove('playing');
                            if (window.runnerEffect_7ree) {
                                window.runnerEffect_7ree.removeRunner(element);
                            }
                        }).catch(() => {
                            // 播放出错，移除播放状态样式和跑马灯效果
                            element.classList.remove('playing');
                            if (window.runnerEffect_7ree) {
                                window.runnerEffect_7ree.removeRunner(element);
                            }
                        });
                    } else {
                        // 如果没有TTS功能，立即移除播放状态样式和跑马灯效果
                        setTimeout(() => {
                            element.classList.remove('playing');
                            if (window.runnerEffect_7ree) {
                                window.runnerEffect_7ree.removeRunner(element);
                            }
                        }, 1000);
                    }
                }
            });
        });

        // 自动滚动到顶部
        container.scrollTop = 0;

        // 自动朗读API响应内容
        this.autoReadResponse(data);
    }

    // 自动朗读API响应内容
    async autoReadResponse(data) {
        try {
            // 检查TTS服务是否可用
            if (window.ttsService && window.ttsService.isAvailable()) {
                // 提取需要朗读的消息内容
                let message = '';
                
                // 根据数据结构提取消息
                if (typeof data === 'string') {
                    message = data;
                } else if (data.business_result && data.business_result.message) {
                    message = data.business_result.message;
                } else if (data.message) {
                    message = data.message;
                }
                
                // 如果有消息内容，调用TTS服务朗读
                if (message) {
                    await window.ttsService.speak(message);
                } else {
                    console.log('没有可朗读的消息内容');
                }
            } else {
                console.log('TTS服务不可用或未配置');
            }
        } catch (error) {
            console.error('自动朗读失败:', error);
        }
    }

    // 清除结果
    clearResults() {
        this.elements.resultsContainer.innerHTML = '<div class="placeholder">存放还是查找物品？按住麦克风问问AI</div>';
    }

    // HTML转义
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // 添加震动反馈（如果支持）
    vibrate(pattern = [100]) {
        if ('vibrate' in navigator) {
            navigator.vibrate(pattern);
        }
    }
}