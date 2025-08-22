// UITimerManager.js - UI计时器管理器

export class UITimerManager {
    constructor(uiController) {
        this.uiController = uiController;
    }

    // 开始计时器
    startTimer() {
        this.uiController.startTime = Date.now();
        this.updateTimer();

        this.uiController.timerInterval = setInterval(() => {
            this.updateTimer();
        }, 100);
    }

    // 停止计时器
    stopTimer() {
        if (this.uiController.timerInterval) {
            clearInterval(this.uiController.timerInterval);
            this.uiController.timerInterval = null;
        }
        // 确保停止时保持最后的时间显示
        if (this.uiController.startTime) {
            this.updateTimer();
        }
    }

    // 更新计时器显示（20秒倒计时）
    updateTimer() {
        if (!this.uiController.startTime) return;

        const elapsed = Math.floor((Date.now() - this.uiController.startTime) / 1000);
        const maxRecordingTime = 2000; // 最大录音时间20秒
        const remaining = Math.max(0, maxRecordingTime - elapsed);

        const timeString = `您还可以说${remaining}秒`;

        // 更新resultsContainer中的计时器显示
        if (this.uiController.elements.resultsContainer) {
            const timerDisplay = this.uiController.elements.resultsContainer.querySelector('.timer-display');
            if (timerDisplay) {
                timerDisplay.textContent = timeString;
            }
        }
    }

    // 重置计时器
    resetTimer() {
        // 更新resultsContainer中的计时器显示
        if (this.uiController.elements.resultsContainer) {
            const timerDisplay = this.uiController.elements.resultsContainer.querySelector('.timer-display');
            if (timerDisplay) {
                timerDisplay.textContent = '您还可以说20秒';
            }
        }
        this.uiController.startTime = null;
    }

    // 启用控制按钮
    enableControls() {
        if (this.uiController.elements.playbackBtn) {
            this.uiController.elements.playbackBtn.disabled = false;
        }
        if (this.uiController.elements.clearBtn) {
            this.uiController.elements.clearBtn.disabled = false;
        }
    }

    // 禁用控制按钮
    disableControls() {
        if (this.uiController.elements.playbackBtn) {
            this.uiController.elements.playbackBtn.disabled = true;
        }
        if (this.uiController.elements.clearBtn) {
            this.uiController.elements.clearBtn.disabled = true;
        }
    }
}