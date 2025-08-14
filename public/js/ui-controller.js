// UI控制模块
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

    // 设置触摸事件
    setupTouchEvents() {
        const button = this.elements.microphoneButton;

        if (!button) {
            console.error('麦克风按钮元素不存在，无法绑定事件');
            return;
        }

        console.log('正在为麦克风按钮绑定事件...', button);

        // 触摸事件
        button.addEventListener('touchstart', (e) => {
            console.log('touchstart 事件被触发', e);
            e.preventDefault();
            this.handleTouchStart(e);
        }, { passive: false });

        button.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.handleTouchMove(e);
        }, { passive: false });

        button.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.handleTouchEnd(e);
        }, { passive: false });

        button.addEventListener('touchcancel', (e) => {
            e.preventDefault();
            this.handleTouchEnd(e);
        }, { passive: false });

        // 鼠标事件（用于桌面测试）
        button.addEventListener('mousedown', (e) => {
            console.log('mousedown 事件被触发', e);
            e.preventDefault();
            this.handleMouseStart(e);
        });

        document.addEventListener('mousemove', (e) => {
            this.handleMouseMove(e);
        });

        document.addEventListener('mouseup', (e) => {
            this.handleMouseEnd(e);
        });

        // 防止上下文菜单
        button.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });

        // 添加简单的点击测试事件
        button.addEventListener('click', (e) => {
            console.log('麦克风按钮被点击了！');
        });

        console.log('麦克风按钮事件绑定完成');
    }

    // 处理触摸开始
    handleTouchStart(e) {
        console.log('handleTouchStart 被调用');
        const touch = e.touches[0];
        this.startTouchY = touch.clientY;
        this.currentTouchY = touch.clientY;
        this.isCanceling = false;
        this.handlePressStart();
    }

    // 处理触摸移动
    handleTouchMove(e) {
        if (!this.isRecording) return;

        const touch = e.touches[0];
        this.currentTouchY = touch.clientY;

        const deltaY = this.startTouchY - this.currentTouchY;

        if (deltaY > this.cancelThreshold) {
            // 向上滑动超过阈值，显示取消状态
            if (!this.isCanceling) {
                this.isCanceling = true;
                this.showCancelState();
            }
        } else {
            // 回到正常录音状态
            if (this.isCanceling) {
                this.isCanceling = false;
                this.hideCancelState();
            }
        }
    }

    // 处理触摸结束
    handleTouchEnd(e) {
        if (this.isCanceling) {
            this.handleCancel();
        } else {
            this.handlePressEnd();
        }

        this.startTouchY = null;
        this.currentTouchY = null;
        this.isCanceling = false;
    }

    // 处理鼠标开始（桌面测试）
    handleMouseStart(e) {
        console.log('handleMouseStart 被调用');
        this.startTouchY = e.clientY;
        this.currentTouchY = e.clientY;
        this.isCanceling = false;
        this.handlePressStart();
    }

    // 处理鼠标移动（桌面测试）
    handleMouseMove(e) {
        if (!this.isRecording) return;

        this.currentTouchY = e.clientY;
        const deltaY = this.startTouchY - this.currentTouchY;

        if (deltaY > this.cancelThreshold) {
            if (!this.isCanceling) {
                this.isCanceling = true;
                this.showCancelState();
            }
        } else {
            if (this.isCanceling) {
                this.isCanceling = false;
                this.hideCancelState();
            }
        }
    }

    // 处理鼠标结束（桌面测试）
    handleMouseEnd(e) {
        if (!this.isRecording) return;

        if (this.isCanceling) {
            this.handleCancel();
        } else {
            this.handlePressEnd();
        }

        this.startTouchY = null;
        this.currentTouchY = null;
        this.isCanceling = false;
    }

    // 设置按钮事件
    setupButtonEvents() {
        this.elements.playbackBtn.addEventListener('click', () => {
            if (this.onPlayback) {
                this.onPlayback();
            }
        });

        this.elements.clearBtn.addEventListener('click', () => {
            if (this.onClear) {
                this.onClear();
            }
        });

        this.elements.refreshBtn.addEventListener('click', () => {
            this.handleRefresh();
        });
    }

    // 处理刷新按钮点击
    handleRefresh() {
        // 添加一个简单的确认提示
        if (confirm('确定要刷新页面吗？未保存的数据将丢失。')) {
            // 强制刷新，绕过缓存
            window.location.reload(true);

            // 如果上面的方法不起作用，尝试其他方法
            setTimeout(() => {
                window.location.href = window.location.href + '?_refresh=' + Date.now();
            }, 100);
        }
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

    // 检查用户认证状态
    checkAuthenticationStatus() {
        // 检查token是否存在
        const token = localStorage.getItem('zhaoqiuku_access_token');
        const hasAuthManager = !!window.authManager;
        const isAuthenticated = window.authManager?.isAuthenticated;

        console.log('检查认证状态:', {
            hasToken: !!token,
            hasAuthManager: hasAuthManager,
            isAuthenticated: isAuthenticated,
            user: window.authManager?.user?.email
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

        this.startTimer();
    }

    // 隐藏录音状态
    hideRecordingState() {
        this.elements.microphoneButton.classList.remove('recording');
        this.elements.soundWaves.classList.remove('active', 'recording');
        this.elements.listeningIndicator.classList.remove('active');
        this.elements.cancelIndicator.classList.remove('active', 'canceling');
        this.elements.timer.classList.remove('recording');

        this.stopTimer();
    }

    // 显示取消状态
    showCancelState() {
        this.elements.cancelIndicator.classList.add('canceling');
        this.elements.listeningIndicator.querySelector('span').textContent = '松手取消录音';
        this.vibrate([30, 30, 30]); // 震动提示
    }

    // 隐藏取消状态
    hideCancelState() {
        this.elements.cancelIndicator.classList.remove('canceling');
        this.elements.listeningIndicator.querySelector('span').textContent = '聆听中...';
    }

    // 开始计时器
    startTimer() {
        this.startTime = Date.now();
        this.updateTimer();

        this.timerInterval = setInterval(() => {
            this.updateTimer();
        }, 100);
    }

    // 停止计时器
    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        // 确保停止时保持最后的时间显示
        if (this.startTime) {
            this.updateTimer();
        }
    }

    // 更新计时器显示
    updateTimer() {
        if (!this.startTime) return;

        const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;

        const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        this.elements.timer.textContent = timeString;
    }

    // 重置计时器
    resetTimer() {
        this.elements.timer.textContent = '00:00';
        this.startTime = null;
    }

    // 启用控制按钮
    enableControls() {
        this.elements.playbackBtn.disabled = false;
        this.elements.clearBtn.disabled = false;
    }

    // 禁用控制按钮
    disableControls() {
        this.elements.playbackBtn.disabled = true;
        this.elements.clearBtn.disabled = true;
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

        // 自动滚动到顶部
        container.scrollTop = 0;
    }

    // 格式化调试数据显示
    formatDebugData(data) {
        const debugConfig = window.debugConfig.getCurrentConfig();
        let html = '';

        // 显示当前调试级别
        html += `<div style="color: var(--text-muted); font-size: 0.8rem; margin-bottom: 10px; text-align: right;">
            调试级别: ${window.debugConfig.getCurrentLevelName()}
        </div>`;

        // 显示业务处理结果（如果有）
        if (data.business_result) {
            const business = data.business_result;
            const resultColor = business.success ? 'var(--success)' : 'var(--error)';

            // 显示用户提问和AI回复的对话格式（合并在同一个div中）
            html += `<div style="margin-bottom: 15px; padding: 15px; border-radius: 12px; background: rgba(102, 126, 234, 0.05); border: 1px solid rgba(102, 126, 234, 0.1);">
                <div style="color: var(--primary-color); font-weight: bold; margin-bottom: 6px; font-size: 1rem;">
                    📝 用户说: ${this.escapeHtml(data.transcript)}
                </div>
                <div style="color: ${resultColor}; font-weight: bold; font-size: 1rem; line-height: 1.4;">
                    📝 AI回复：${this.escapeHtml(business.message)}
                </div>
            </div>`;
        } else if (debugConfig.showTranscript && data.transcript) {
            // 如果没有业务结果，但有转录结果且在调试模式下，显示转录结果
            html += `<div style="color: var(--success); font-weight: bold; margin-bottom: 10px; font-size: 1.1rem;">
                📝 识别结果: ${this.escapeHtml(data.transcript)}
            </div>`;
        }

        // 显示操作详情（仅在调试模式下）
        if (debugConfig.showApiResponse) {
            if (data.action) {
                const actionNames = {
                    'put': '存放物品',
                    'get': '查找物品',
                    'unknown': '未知操作'
                };
                html += `<div style="color: var(--primary-color); margin-bottom: 10px;">
                        🎯 操作类型: ${actionNames[data.action] || data.action}
                    </div>`;
            }

            if (data.object) {
                html += `<div style="color: var(--primary-color); margin-bottom: 10px;">
                        📦 物品名称: ${this.escapeHtml(data.object)}
                    </div>`;
            }

            if (data.location) {
                html += `<div style="color: var(--primary-color); margin-bottom: 10px;">
                        📍 存放位置: ${this.escapeHtml(data.location)}
                    </div>`;
            }
        }

        // 2. 显示API响应的关键信息（调试模式及以上）
        if(debugConfig.showApiResponse) {
            if (data.keywords && data.keywords.length > 0) {
                html += `<div style="color: var(--primary-color); margin-bottom: 10px;">
                    🏷️ 关键词: ${data.keywords.map(k => this.escapeHtml(k)).join(', ')}
                </div>`;
            }

            if (data.confidence !== undefined && data.confidence !== null) {
                html += `<div style="color: var(--warning); margin-bottom: 10px;">
                    📊 置信度: ${data.confidence}
                </div>`;
            }

            // 显示解析后的API响应
            if (data.raw_response) {
                // 使用传统方式检查，避免可选链操作符导致的兼容性问题
                let rawResponse = data.raw_response;
                if (rawResponse !== undefined && rawResponse !== null) {
                    html += `<div style="color: var(--text-secondary); margin: 15px 0 5px 0; font-weight: bold;">
                        📋 API 响应内容:
                    </div>`;
                    html += `<pre style="font-size: 0.85rem; color: var(--text-primary); background: var(--background); border: 1px solid var(--border); border-radius: 8px; padding: 10px; margin-bottom: 10px;">${JSON.stringify(rawResponse, null, 2)}</pre>`;
                }
            }
        }

        // 3. 显示完整调试信息（完整调试模式）
        if(debugConfig.showRequestInfo && data.debug && data.debug.request) {
            html += `<div style="color: var(--text-secondary); margin: 15px 0 5px 0; font-weight: bold;">
                📤 API 请求详情:
            </div>`;
            html += `<pre style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 10px;">${JSON.stringify(data.debug.request, null, 2)}</pre>`;
        }

        if (debugConfig.showRequestInfo && data.debug && data.debug.response) {
            html += `<div style="color: var(--text-secondary); margin: 15px 0 5px 0; font-weight: bold;">
                📥 API 响应详情:
            </div>`;
            html += `<pre style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 10px;">${JSON.stringify(data.debug.response, null, 2)}</pre>`;
        }

        // 如果是正常模式但没有识别结果，显示简单提示
        if (debugConfig.currentLevel === 'normal' && !data.transcript) {
            html = `<div style="color: var(--text-muted); text-align: center; font-style: italic;">
                未能识别语音内容，请重试
            </div>`;
        }

        // 如果没有任何内容，显示完整JSON作为后备
        if (!html.trim()) {
            html = `<pre style="font-size: 0.85rem;">${JSON.stringify(data, null, 2)}</pre>`;
        }

        return html;
    }

    // 显示加载状态
    showLoading(message = '处理中...') {
        this.elements.resultsContainer.innerHTML = `<div class="loading">${message}</div>`;
    }

    // 显示错误
    showError(error) {
        const errorMessage = typeof error === 'string' ? error : error.message || '发生未知错误';
        this.elements.resultsContainer.innerHTML = `
            <div style="color: var(--error); text-align: center;">
                <strong>错误:</strong> ${this.escapeHtml(errorMessage)}
            </div>
        `;
    }

    // 清除结果
    clearResults() {
        this.elements.resultsContainer.innerHTML = '<div class="placeholder">等待语音输入...</div>';
    }

    // 显示提示消息
    showMessage(message, type = 'info') {
        const colors = {
            info: 'var(--primary-color)',
            success: 'var(--success)',
            warning: 'var(--warning)',
            error: 'var(--error)'
        };

        this.elements.resultsContainer.innerHTML = `
            <div style="color: ${colors[type]}; text-align: center;">
                ${this.escapeHtml(message)}
            </div>
        `;
    }

    // HTML转义
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // 显示权限请求提示
    showPermissionPrompt() {
        this.showMessage('请允许访问麦克风权限以使用语音功能', 'warning');
    }

    // 显示不支持提示
    showUnsupportedPrompt() {
        this.showError('您的浏览器不支持语音录制功能，请使用现代浏览器');
    }

    // 添加震动反馈（如果支持）
    vibrate(pattern = [100]) {
        if ('vibrate' in navigator) {
            navigator.vibrate(pattern);
        }
    }
}