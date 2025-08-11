// UI控制模块
class UIController {
    constructor() {
        this.elements = {
            microphoneButton: document.getElementById('microphoneButton'),
            soundWaves: document.getElementById('soundWaves'),
            listeningIndicator: document.getElementById('listeningIndicator'),
            timer: document.getElementById('timer'),
            playbackBtn: document.getElementById('playbackBtn'),
            clearBtn: document.getElementById('clearBtn'),
            resultsContainer: document.getElementById('resultsContainer')
        };
        
        this.timerInterval = null;
        this.startTime = null;
    }

    // 初始化UI事件
    initialize() {
        this.setupTouchEvents();
        this.setupButtonEvents();
    }

    // 设置触摸事件
    setupTouchEvents() {
        const button = this.elements.microphoneButton;
        
        // 触摸事件
        button.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handlePressStart();
        }, { passive: false });

        button.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.handlePressEnd();
        }, { passive: false });

        button.addEventListener('touchcancel', (e) => {
            e.preventDefault();
            this.handlePressEnd();
        }, { passive: false });

        // 鼠标事件（用于桌面测试）
        button.addEventListener('mousedown', (e) => {
            e.preventDefault();
            this.handlePressStart();
        });

        document.addEventListener('mouseup', (e) => {
            this.handlePressEnd();
        });

        // 防止上下文菜单
        button.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
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
    }

    // 处理按下开始
    handlePressStart() {
        if (this.onRecordingStart) {
            this.onRecordingStart();
        }
    }

    // 处理按下结束
    handlePressEnd() {
        if (this.onRecordingStop) {
            this.onRecordingStop();
        }
    }

    // 显示录音状态
    showRecordingState() {
        this.elements.microphoneButton.classList.add('recording');
        this.elements.soundWaves.classList.add('active', 'recording');
        this.elements.listeningIndicator.classList.add('active');
        this.elements.timer.classList.add('recording');
        
        this.startTimer();
    }

    // 隐藏录音状态
    hideRecordingState() {
        this.elements.microphoneButton.classList.remove('recording');
        this.elements.soundWaves.classList.remove('active', 'recording');
        this.elements.listeningIndicator.classList.remove('active');
        this.elements.timer.classList.remove('recording');
        
        this.stopTimer();
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
        const container = this.elements.resultsContainer;
        
        if (typeof data === 'string') {
            container.innerHTML = `<div class="results-json">${this.escapeHtml(data)}</div>`;
        } else {
            container.innerHTML = `<div class="results-json">${JSON.stringify(data, null, 2)}</div>`;
        }
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