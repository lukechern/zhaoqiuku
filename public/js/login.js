/*
 * ========================================
 * 🔐 登录页面逻辑
 * ========================================
 */

class LoginManager {
    constructor() {
        this.currentStep = 'login';
        this.email = '';

        this.initializeElements();
        this.bindEvents();
        this.checkExistingAuth();
    }

    initializeElements() {
        // 步骤元素
        this.loginStep = document.getElementById('loginStep');
        this.successStep = document.getElementById('successStep');
        this.loading = document.getElementById('loading');

        // 表单元素
        this.emailInput = document.getElementById('email');
        this.welcomeMessage = document.getElementById('welcomeMessage');

        // 按钮元素
        this.loginBtn = document.getElementById('loginBtn');
        this.goToAppBtn = document.getElementById('goToAppBtn');

        // 错误信息元素
        this.emailError = document.getElementById('emailError');

        // 其他元素
        this.loadingText = document.getElementById('loadingText');
    }

    bindEvents() {
        // 登录按钮
        this.loginBtn.addEventListener('click', () => this.handleLogin());

        // 前往应用
        this.goToAppBtn.addEventListener('click', () => this.goToApp());

        // 输入框事件
        this.emailInput.addEventListener('input', () => this.clearError());
        this.emailInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleLogin();
        });

        // 监听认证状态变化
        window.addEventListener('authStateChange', (e) => {
            this.handleAuthStateChange(e.detail);
        });
    }

    /**
     * 检查现有认证状态
     */
    checkExistingAuth() {
        if (window.authManager && window.authManager.isAuthenticated) {
            const user = window.authManager.user;
            this.showSuccess(user);
        }
    }

    /**
     * 验证邮箱格式
     */
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * 清除错误信息
     */
    clearError() {
        this.emailError.textContent = '';
        this.emailInput.classList.remove('error');
    }

    /**
     * 显示错误信息
     */
    showError(message) {
        this.emailError.textContent = message;
        this.emailInput.classList.add('error');
    }

    /**
     * 显示加载状态
     */
    showLoading(text) {
        this.loadingText.textContent = text;
        this.loading.classList.remove('hidden');
        document.getElementById('loginForm').style.display = 'none';
    }

    /**
     * 隐藏加载状态
     */
    hideLoading() {
        this.loading.classList.add('hidden');
        document.getElementById('loginForm').style.display = 'block';
    }

    /**
     * 切换步骤
     */
    switchStep(step) {
        // 隐藏所有步骤
        this.loginStep.classList.add('hidden');
        this.successStep.classList.add('hidden');

        // 显示目标步骤
        if (step === 'login') {
            this.loginStep.classList.remove('hidden');
        } else if (step === 'success') {
            this.successStep.classList.remove('hidden');
        }

        this.currentStep = step;
    }

    /**
     * 处理登录
     */
    async handleLogin() {
        const email = this.emailInput.value.trim();

        // 验证邮箱
        if (!email) {
            this.showError('请输入邮箱地址');
            return;
        }

        if (!this.validateEmail(email)) {
            this.showError('请输入有效的邮箱地址');
            return;
        }

        this.email = email;
        this.showLoading('正在登录...');

        try {
            const result = await window.authManager.login(email);

            this.hideLoading();

            if (result.success) {
                this.showSuccess(result.user);
            } else {
                this.handleLoginError(result);
            }
        } catch (error) {
            console.error('登录错误:', error);
            this.hideLoading();
            this.showError('网络错误，请检查网络连接后重试');
        }
    }

    /**
     * 处理登录错误
     */
    handleLoginError(result) {
        switch (result.code) {
            case 'USER_NOT_FOUND':
                this.showError('该邮箱尚未注册，请先注册');
                break;
            case 'USER_NOT_VERIFIED':
                this.showError('请先完成邮箱验证');
                break;
            case 'USER_INACTIVE':
                this.showError('账户已被禁用，请联系客服');
                break;
            default:
                this.showError(result.message || result.error || '登录失败，请重试');
        }
    }

    /**
     * 显示登录成功
     */
    showSuccess(user) {
        this.welcomeMessage.textContent = `欢迎回来，${user.email}`;
        this.switchStep('success');
    }

    /**
     * 处理认证状态变化
     */
    handleAuthStateChange(detail) {
        if (detail.type === 'login' && detail.isAuthenticated) {
            this.showSuccess(detail.user);
        } else if (detail.type === 'logout') {
            this.switchStep('login');
            this.clearError();
            this.emailInput.value = '';
        }
    }

    /**
     * 前往应用
     */
    goToApp() {
        window.location.href = 'index.html';
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    new LoginManager();
});