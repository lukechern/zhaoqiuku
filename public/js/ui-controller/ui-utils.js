/**
 * UI 工具函数模块
 * 包含通用的工具函数
 */

// HTML转义（如果还没有定义）
function escapeHtml(text) {
    if (window.escapeHtml) {
        return window.escapeHtml(text);
    }
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 震动反馈（如果还没有定义）
function vibrate(pattern = [100]) {
    if (window.vibrate) {
        return window.vibrate(pattern);
    }
    if ('vibrate' in navigator) {
        navigator.vibrate(pattern);
    }
}

// 格式化AI消息（如果还没有定义）
function formatAiMessage(message) {
    if (window.formatAiMessage) {
        return window.formatAiMessage(message);
    }
    if (!message) return '';

    // 先转义所有HTML标签，然后将<br>标签还原
    const escapedMessage = escapeHtml(message);
    return escapedMessage.replace(/<br>/g, '<br>');
}

// 停止计时器
function stopTimer() {
    if (window.timerInterval) {
        clearInterval(window.timerInterval);
        window.timerInterval = null;
    }
}

// 启动计时器
function startTimer() {
    stopTimer(); // 先停止现有计时器

    window.startTime = Date.now();
    window.timerInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - window.startTime) / 1000);
        const remaining = Math.max(0, 20 - elapsed);

        // 更新计时器显示
        const timerDisplay = document.querySelector('.timer-display');
        if (timerDisplay) {
            timerDisplay.textContent = `您还可以说${remaining}秒`;
        }

        // 如果时间用完，自动停止录音
        if (remaining <= 0) {
            stopTimer();
            if (window.uiController && window.uiController.handlePressEnd) {
                window.uiController.handlePressEnd();
            }
        }
    }, 100);
}

// 重置计时器
function resetTimer() {
    stopTimer();
    window.startTime = null;
}

// 导出函数到全局作用域
window.escapeHtml = escapeHtml;
window.vibrate = vibrate;
window.formatAiMessage = formatAiMessage;
window.stopTimer = stopTimer;
window.startTimer = startTimer;
window.resetTimer = resetTimer;

// 全局状态变量
window.timerInterval = null;
window.startTime = null;