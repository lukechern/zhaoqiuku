// UIController.js - UI控制模块主类

import { StreamRenderer_7ree } from '../stream-renderer_7ree.js';

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
        
        // 播放状态追踪_7ree
        this.currentPlayingElement_7ree = null;  // 当前正在播放的气泡元素
        this.currentPlayingAudio_7ree = null;    // 当前播放的音频对象(用于用户气泡)
        
        // 流式渲染器_7ree
        this.streamRenderer_7ree = new StreamRenderer_7ree();
    }

    // 初始化UI事件
    initialize() {
        // 确保DOM元素存在后再绑定事件
        if (!this.elements.microphoneButton) {
            console.error('麦克风按钮元素未找到，延迟初始化...');
            this.retryElementInitialization();
        } else {
            this.setupTouchEvents();
            // 新增：初始化左右双按钮
            if (this.setupDualButtons_7ree) {
                this.setupDualButtons_7ree();
            }
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
        // 隐藏麦克风按钮
        if (this.elements.microphoneButton) {
            this.elements.microphoneButton.style.display = 'none';
        }
        // 水波动效上移到计时器位置
        if (this.elements.soundWaves) {
            this.elements.soundWaves.classList.add('active', 'recording', 'moved-to-timer_7ree');
        }
        // 录音期间改用左右按钮，不再显示“上滑取消”
        if (this.elements.cancelIndicator) {
            this.elements.cancelIndicator.classList.remove('active', 'canceling');
        }
        if (this.elements.timer) {
            this.elements.timer.classList.add('recording');
        }

        // 在 results-json 区域显示"请告诉AI，您是想记录物品的存放位置，或者查找物品…"和计时器（不显示动画效果）
        if (this.elements.resultsContainer) {
            this.elements.resultsContainer.innerHTML = `
                <div class="results-json">
                    <div class="listening-status">请告诉我，您是想记录物品位置，还是查找物品…</div>
                    <div class="timer-display">还可以说20秒</div>
                </div>
            `;
        }

        // 启动计时器
        if (this.startTimer) {
            this.startTimer();
        }

        // 新增：显示左右双按钮
        if (this.showDualButtons_7ree) {
            this.showDualButtons_7ree();
        }
    }

    // 隐藏录音状态
    hideRecordingState() {
        // 恢复麦克风按钮显示
        if (this.elements.microphoneButton) {
            this.elements.microphoneButton.style.display = '';
            this.elements.microphoneButton.classList.remove('recording');
        }
        // 移除水波动效（现在整合在loading-dots中，通过清空resultsContainer来处理）
        if (this.elements.cancelIndicator) {
            this.elements.cancelIndicator.classList.remove('active', 'canceling');
        }
        if (this.elements.timer) {
            this.elements.timer.classList.remove('recording');
        }

        // 清除 results-json 区域的内容，但不立即显示placeholder
        // 这样可以让后续的showLoading正常显示
        if (this.elements.resultsContainer) {
            this.elements.resultsContainer.innerHTML = '';
        }

        if (this.stopTimer) {
            this.stopTimer();
        }

        // 新增：隐藏左右双按钮
        if (this.hideDualButtons_7ree) {
            this.hideDualButtons_7ree();
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
                statusElement.textContent = '请告诉AI，您是想记录物品的存放位置，或者查找物品…';
            }
        }
    }

    // 显示结果 - 使用流式渲染器
    async showResults(data) {
        // 保存最后的结果数据，用于调试级别切换时重新显示
        this.lastResultData = data;

        const container = this.elements.resultsContainer;

        // 使用流式渲染器渲染结果
        if (typeof data === 'string') {
            // 如果是字符串，使用原始方式显示
            container.innerHTML = `<div class="results-json">${this.escapeHtml(data)}</div>`;
        } else {
            // 使用流式渲染器，自动触发TTS并等待完成（注意：renderResults内部已不再等待TTS）
            await this.streamRenderer_7ree.renderResults(data, container, true);
        }

        // 自动滚动到顶部
        container.scrollTop = 0;

        // 注意：TTS朗读现在在流式渲染器中异步处理，无需在此调用
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

    // 停止当前播放_7ree
    stopCurrentPlaying_7ree() {
        try {
            // 移除playing样式
            if (this.currentPlayingElement_7ree) {
                this.currentPlayingElement_7ree.classList.remove('playing');
            }
            // 停止用户气泡的本地音频
            if (this.currentPlayingAudio_7ree) {
                try { this.currentPlayingAudio_7ree.pause(); } catch (_) {}
                try { this.currentPlayingAudio_7ree.currentTime = 0; } catch (_) {}
                this.currentPlayingAudio_7ree = null;
            }
            // 停止TTS播放
            if (window.ttsService && window.ttsService.isPlaying) {
                try { window.ttsService.stop(); } catch (_) {}
            }
        } finally {
            this.currentPlayingElement_7ree = null;
        }
    }

    // 显示处理状态（加载状态）
    showProcessingState() {
        console.log('显示处理状态（加载状态）');
        if (this.elements.microphoneButton) {
            // 保存原始内容
            if (!this.elements.microphoneButton.dataset.originalContent) {
                this.elements.microphoneButton.dataset.originalContent = this.elements.microphoneButton.innerHTML;
            }
            
            // 替换为加载动画，包含水波纹效果
            this.elements.microphoneButton.innerHTML = `
                <div class="loading-dots">
                    <div class="loading-dot"></div>
                    <div class="loading-dot"></div>
                    <div class="loading-dot"></div>
                    <div class="sound-waves_7ree active recording" id="soundWaves_7ree">
                        <div class="wave_7ree"></div>
                        <div class="wave_7ree"></div>
                        <div class="wave_7ree"></div>
                        <div class="wave_7ree"></div>
                        <div class="wave_7ree"></div>
                    </div>
                </div>
            `;
            
            // 添加加载状态样式
            this.elements.microphoneButton.classList.add('loading');
            
            // 禁用按钮
            this.elements.microphoneButton.disabled = true;
        }
    }

    // 隐藏处理状态（还原为空闲状态）
    hideProcessingState() {
        console.log('隐藏处理状态（还原为空闲状态）');
        if (this.elements.microphoneButton) {
            // 移除加载状态样式
            this.elements.microphoneButton.classList.remove('loading');
            
            // 启用按钮
            this.elements.microphoneButton.disabled = false;
            
            // 恢复原始内容
            if (this.elements.microphoneButton.dataset.originalContent) {
                this.elements.microphoneButton.innerHTML = this.elements.microphoneButton.dataset.originalContent;
            } else {
                // 如果没有保存原始内容，使用默认内容
                this.elements.microphoneButton.innerHTML = `
                    <img src="img/microphone.svg" alt="麦克风图标" class="microphone-icon">
                `;
            }
        }
        
        // 如果结果容器为空（没有显示结果），则显示placeholder
        if (this.elements.resultsContainer && this.elements.resultsContainer.innerHTML.trim() === '') {
            this.elements.resultsContainer.innerHTML = '<div class="placeholder">存放还是查找物品？按住麦克风问问AI</div>';
        }
    }
}