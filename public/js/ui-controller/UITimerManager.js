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

    // 更新计时器显示
    updateTimer() {
        if (!this.uiController.startTime) return;

        const elapsed = Math.floor((Date.now() - this.uiController.startTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;

        const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

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
                timerDisplay.textContent = '00:00';
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