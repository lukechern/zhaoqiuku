// UI控制模块
class UIController {
    constructor() {
        this.elements = {
            microphoneButton: document.getElementById('microphoneButton'),
            soundWaves: document.getElementById('soundWaves'),
            listeningIndicator: document.getElementById('listeningIndicator'),
            cancelIndicator: document.getElementById('cancelIndicator'),
            timer: document.getElementById('timer'),
            playbackBtn: document.getElementById('playbackBtn'),
            clearBtn: document.getElementById('clearBtn'),
            resultsContainer: document.getElementById('resultsContainer')
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
        this.setupTouchEvents();
        this.setupButtonEvents();
    }

    // 设置触摸事件
    setupTouchEvents() {
        const button = this.elements.microphoneButton;
        
        // 触摸事件
        button.addEventListener('touchstart', (e) => {
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
    }

    // 处理触摸开始
    handleTouchStart(e) {
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
    }

    // 处理按下开始
    handlePressStart() {
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
        let html = '';
        
        // 显示主要结果
        if (data.transcript) {
            html += `<div style="color: var(--success); font-weight: bold; margin-bottom: 10px;">
                📝 识别结果: ${this.escapeHtml(data.transcript)}
            </div>`;
        }
        
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
        
        // 显示请求信息
        if (data.debug && data.debug.request) {
            html += `<div style="color: var(--text-secondary); margin: 15px 0 5px 0; font-weight: bold;">
                📤 API 请求:
            </div>`;
            html += `<pre style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 10px;">${JSON.stringify(data.debug.request, null, 2)}</pre>`;
        }
        
        // 显示响应信息
        if (data.debug && data.debug.response) {
            html += `<div style="color: var(--text-secondary); margin: 15px 0 5px 0; font-weight: bold;">
                📥 API 响应:
            </div>`;
            html += `<pre style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 10px;">${JSON.stringify(data.debug.response, null, 2)}</pre>`;
        }
        
        // 显示原始响应
        if (data.raw_response) {
            html += `<div style="color: var(--text-secondary); margin: 15px 0 5px 0; font-weight: bold;">
                🔍 原始响应:
            </div>`;
            html += `<pre style="font-size: 0.8rem; color: var(--text-muted);">${JSON.stringify(data.raw_response, null, 2)}</pre>`;
        }
        
        // 如果没有特殊格式，显示完整JSON
        if (!html) {
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