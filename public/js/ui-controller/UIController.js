// UIController.js - UI控制模块主类

export class UIController {
    constructor() {
        this.elements = {
            microphoneButton: document.getElementById('microphoneButton'),
            soundWaves: document.getElementById('soundWaves'),
            listeningIndicator: document.getElementById('listeningIndicator'),
            cancelIndicator: document.getElementById('cancelIndicator'),
            timer: document.getElementById('timer'),
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
            setTimeout(() => {
                this.elements.microphoneButton = document.getElementById('microphoneButton');
                if (this.elements.microphoneButton) {
                    this.setupTouchEvents();
                    console.log('麦克风按钮事件已延迟绑定');
                }
            }, 100);
        } else {
            this.setupTouchEvents();
        }

        this.setupButtonEvents();
        this.setupDebugControls();
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
        this.elements.microphoneButton.classList.add('recording');
        this.elements.soundWaves.classList.add('active', 'recording');
        this.elements.listeningIndicator.classList.add('active');
        this.elements.cancelIndicator.classList.add('active');
        this.elements.timer.classList.add('recording');

        // 在 results-json 区域显示"聆听中……"和计时器
        this.elements.resultsContainer.innerHTML = `
            <div class="results-json">
                <div class="listening-status">聆听中……</div>
                <div class="timer-display">${this.elements.timer.textContent}</div>
            </div>
        `;

        // 启动计时器
        this.startTimer();
    }

    // 隐藏录音状态
    hideRecordingState() {
        this.elements.microphoneButton.classList.remove('recording');
        this.elements.soundWaves.classList.remove('active', 'recording');
        this.elements.listeningIndicator.classList.remove('active');
        this.elements.cancelIndicator.classList.remove('active', 'canceling');
        this.elements.timer.classList.remove('recording');

        // 清除 results-json 区域的内容
        this.elements.resultsContainer.innerHTML = '<div class="placeholder">按住麦克风问AI（存放物品，或者查找物品），最长20秒</div>';

        this.stopTimer();
    }

    // 显示取消状态
    showCancelState() {
        this.elements.cancelIndicator.classList.add('canceling');
        this.elements.listeningIndicator.querySelector('span').textContent = '松手取消录音';
        this.vibrate([30, 30, 30]); // 震动提示
    }

    // 隐藏取消状态
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
                await window.ttsService.autoReadResponse(data);
            } else {
                console.log('TTS服务不可用或未配置');
            }
        } catch (error) {
            console.error('自动朗读失败:', error);
        }
    }

    // 清除结果
    clearResults() {
        this.elements.resultsContainer.innerHTML = '<div class="placeholder">按住麦克风问AI（存放物品，或者查找物品），最长20秒</div>';
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