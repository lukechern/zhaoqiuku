/**
 * UI 认证管理模块
 * 处理用户登录状态检查和登录相关UI
 */

// 检查用户认证状态
function checkAuthenticationStatus(elements) {
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
        clearLoginRequiredState(elements);
        return true;
    }

    console.log('用户未登录，显示登录提示');
    showLoginRequired(elements);
    return false;
}

// 清除登录要求状态
function clearLoginRequiredState(elements) {
    // 移除麦克风按钮的禁用样式
    if (elements.microphoneButton) {
        elements.microphoneButton.classList.remove('login-required');
    }

    // 如果当前显示的是登录提示，清除它
    if (elements.resultsContainer) {
        const container = elements.resultsContainer;
        if (container.querySelector('.login-required-message')) {
            clearResults(elements);
        }
    }
}

// 显示需要登录的提示并跳转
function showLoginRequired(elements) {
    // 显示特殊的登录提示消息
    const container = elements.resultsContainer;
    if (!container) return;

    container.innerHTML = `
        <div class="login-required-message">
            请先登录后再使用语音识别功能
            <br><small>即将跳转到登录页面...</small>
        </div>
    `;

    // 给麦克风按钮添加禁用样式
    if (elements.microphoneButton) {
        elements.microphoneButton.classList.add('login-required');
    }

    // 震动提示
    vibrate([100, 50, 100]);

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

// HTML转义
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 清除结果
function clearResults(elements) {
    if (elements.resultsContainer) {
        elements.resultsContainer.innerHTML = '<div class="placeholder">存放物品还是查找物品？<br>轻触麦克风问问AI助手</div>';
    }
}

// 震动反馈
function vibrate(pattern = [100]) {
    if ('vibrate' in navigator) {
        navigator.vibrate(pattern);
    }
}

// 导出函数到全局作用域
window.checkAuthenticationStatus = checkAuthenticationStatus;
window.clearLoginRequiredState = clearLoginRequiredState;
window.showLoginRequired = showLoginRequired;
window.escapeHtml = escapeHtml;
window.clearResults = clearResults;
window.vibrate = vibrate;