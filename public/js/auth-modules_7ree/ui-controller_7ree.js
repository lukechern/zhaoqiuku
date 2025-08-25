/*
 * ========================================
 * 🎨 UI控制器模块
 * ========================================
 * 处理UI相关的所有功能
 */

class UIController_7ree {
    constructor(authManager) {
        this.authManager = authManager;
        this.currentStep = 'email';
        
        // UI相关DOM元素
        this.emailStep = null;
        this.verifyStep = null;
        this.successStep = null;
        this.loading = null;
        this.authForm = null;
        this.loadingText = null;
        
        // 表单元素
        this.emailInput = null;
        this.emailDisplay = null;
        this.userTypeHint = null;
        this.emailError = null;
        
        // 按钮元素
        this.sendCodeBtn = null;
        this.goToAppBtn = null;
        
        // 成功页面元素
        this.successTitle = null;
        this.successMessage = null;
        
        // 服务器时间元素（_7ree）
        this.serverTime_7ree = null;
    }

    // 初始化UI相关DOM元素
    initializeElements() {
        // 步骤元素
        this.emailStep = document.getElementById('emailStep');
        this.verifyStep = document.getElementById('verifyStep');
        this.successStep = document.getElementById('successStep');
        this.loading = document.getElementById('loading');
        this.authForm = document.getElementById('authForm');
        this.loadingText = document.getElementById('loadingText');
        
        // 表单元素
        this.emailInput = document.getElementById('email');
        this.emailClearBtn = document.getElementById('emailClearBtn');
        this.emailDisplay = document.getElementById('emailDisplay');
        this.userTypeHint = document.getElementById('userTypeHint');
        this.emailError = document.getElementById('emailError');
        
        // 按钮元素
        this.sendCodeBtn = document.getElementById('sendCodeBtn');
        this.goToAppBtn = document.getElementById('goToAppBtn');
        
        // 成功页面元素
        this.successTitle = document.getElementById('successTitle');
        this.successMessage = document.getElementById('successMessage');
        
        // 服务器时间元素（_7ree）
        this.serverTime_7ree = document.getElementById('serverTime_7ree');
        
        // 启动服务器时间更新（_7ree）
        this.startServerTimeUpdate_7ree();
        
        // 初始化邮箱自动填充
        this.initializeEmailAutofill();
        
        // 初始化时刷新进度（_7ree）
        this.authManager.progressManager_7ree.updateProgressBar_7ree(this.currentStep);
    }

    // 绑定UI相关事件
    bindEvents() {
        // 获取验证码
        this.sendCodeBtn.addEventListener('click', () => this.authManager.sendVerificationCode());
        
        // 前往应用
        this.goToAppBtn.addEventListener('click', () => this.authManager.goToApp());

        // 输入框事件
        this.emailInput.addEventListener('input', () => {
            this.clearEmailError();
            this.updateEmailClearButton();
        });
        this.emailInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.authManager.sendVerificationCode();
        });
        
        // 清空按钮事件
        this.emailClearBtn.addEventListener('click', () => this.clearEmailInput());
    }

    // 显示加载状态
    showLoading(text) {
        this.loadingText.textContent = text;
        this.loading.classList.remove('hidden');
        // this.authForm.style.display = 'none';
        if (this.authForm) {
            this.authForm.classList.add('hidden');
        }
    }

    // 隐藏加载状态
    hideLoading() {
        this.loading.classList.add('hidden');
        // this.authForm.style.display = 'block';
        if (this.authForm) {
            this.authForm.classList.remove('hidden');
        }
    }

    // 切换步骤
    switchStep(step) {
        // 隐藏所有步骤
        this.emailStep.classList.add('hidden');
        this.verifyStep.classList.add('hidden');
        this.successStep.classList.add('hidden');
        if (this.authManager.invitationManager_7ree.invitationStep_7ree) {
            this.authManager.invitationManager_7ree.invitationStep_7ree.classList.add('hidden');
        }

        // 显示目标步骤
        if (step === 'email') {
            this.emailStep.classList.remove('hidden');
        } else if (step === 'verify') {
            this.verifyStep.classList.remove('hidden');
            // 聚焦到验证码输入框
            this.authManager.verificationManager_7ree.focusVerifyCodeInput();
        } else if (step === 'success') {
            this.successStep.classList.remove('hidden');
        } else if (step === 'invitation' && this.authManager.invitationManager_7ree.invitationStep_7ree) {
            this.authManager.invitationManager_7ree.invitationStep_7ree.classList.remove('hidden');
        }

        this.currentStep = step;
        
        // 更新进度条（_7ree）
        this.authManager.progressManager_7ree.updateProgressBar_7ree(step);
        if (step === 'success') {
            this.authManager.progressManager_7ree.markProgressComplete_7ree();
        }
    }

    // 清除邮箱错误信息
    clearEmailError() {
        this.emailError.textContent = '';
        this.emailInput.classList.remove('error');
    }

    // 显示邮箱错误信息
    showEmailError(message) {
        this.emailError.textContent = message;
        this.emailInput.classList.add('error');
    }

    // 设置邮箱显示
    setEmailDisplay(email) {
        this.emailDisplay.textContent = email;
    }

    // 设置用户类型提示
    setUserTypeHint(userType) {
        if (userType === 'new') {
            this.userTypeHint.textContent = '检测到新用户，验证后将自动为您创建账户';
        } else {
            this.userTypeHint.textContent = '欢迎回来！验证后即可登录';
        }
    }

    // 设置成功页面信息
    setSuccessInfo(userType, user, returnUrl) {
        if (userType === 'new') {
            this.successTitle.textContent = '注册成功！';
            this.successMessage.textContent = '欢迎加入AI语音寻物助手';
        } else {
            this.successTitle.textContent = '登录成功！';
            this.successMessage.textContent = `欢迎回来，${user.email}`;
        }
        
        // 根据是否有返回URL更新按钮文本
        if (returnUrl) {
            this.goToAppBtn.textContent = '返回应用';
        } else {
            this.goToAppBtn.textContent = '开始使用';
        }
    }

    // 启动服务器时间更新（_7ree）
    startServerTimeUpdate_7ree() {
        if (!this.serverTime_7ree) return;
    
        const timeZone_7ree = 'Asia/Shanghai';
        const formatter_7ree = new Intl.DateTimeFormat('zh-CN', {
            timeZone: timeZone_7ree,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
    
        const updateTime = () => {
            const now = new Date();
            // 格式: 2025-08-21 00:21:46
            const parts = formatter_7ree.formatToParts(now);
            const get = t => parts.find(p => p.type === t).value;
            const timeString = `${get('year')}-${get('month')}-${get('day')} ${get('hour')}:${get('minute')}:${get('second')}`;
            this.serverTime_7ree.textContent = timeString;
        };
    
        updateTime();
        setInterval(updateTime, 1000);
    }

    // 显示表单（避免初始闪烁）
    showAuthForm() {
        this.authForm?.classList.remove('hidden');
    }

    // 获取当前步骤
    getCurrentStep() {
        return this.currentStep;
    }

    // 验证邮箱格式
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // 获取邮箱输入值
    getEmailInput() {
        return this.emailInput.value.trim();
    }

    // 聚焦邮箱输入框
    focusEmailInput() {
        setTimeout(() => this.emailInput?.focus(), 0);
    }

    // 聚焦验证码输入框
    focusVerifyCodeInput() {
        this.authManager.verificationManager_7ree.verifyCodeInput.focus();
    }

    // 初始化邮箱自动填充
    initializeEmailAutofill() {
        const savedEmail = localStorage.getItem('userEmail');
        if (savedEmail && this.emailInput) {
            this.emailInput.value = savedEmail;
            this.updateEmailClearButton();
        }
    }

    // 保存邮箱到本地存储
    saveEmailToStorage(email) {
        if (email && email.trim()) {
            localStorage.setItem('userEmail', email.trim());
        }
    }

    // 清空邮箱输入框
    clearEmailInput() {
        if (this.emailInput) {
            this.emailInput.value = '';
            this.emailInput.focus();
            this.updateEmailClearButton();
            this.clearEmailError();
        }
    }

    // 更新清空按钮显示状态
    updateEmailClearButton() {
        if (this.emailClearBtn && this.emailInput) {
            if (this.emailInput.value.trim()) {
                this.emailClearBtn.classList.remove('hidden');
            } else {
                this.emailClearBtn.classList.add('hidden');
            }
        }
    }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UIController_7ree;
} else if (typeof window !== 'undefined') {
    window.UIController_7ree = UIController_7ree;
}