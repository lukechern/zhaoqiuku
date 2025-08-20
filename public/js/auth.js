/*
 * ========================================
 * 🔐 统一认证页面逻辑
 * ========================================
 * 合并注册和登录流程的统一认证
 */

class UnifiedAuthManager {
    constructor() {
        this.currentStep = 'email';
        this.email = '';
        this.verificationCode = '';
        this.userType = null; // 'new' | 'existing'
        this.countdownTimer = null;
        this.countdownSeconds = 60;
        
        // 获取返回URL参数
        this.returnUrl = this.getReturnUrl();
        
        this.initializeElements();
        this.bindEvents();
        
        // 初始化邀请码流程（_7ree）
        this.initInvitationFlow_7ree();

        // 标记已初始化，防止重复实例化（_7ree）
        if (typeof window !== 'undefined') {
            window.__UnifiedAuthManagerInited_7ree = true;
            window.__UnifiedAuthManagerInstance_7ree = this;
        }
    }

    // 获取返回URL参数
    getReturnUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        const returnUrl = urlParams.get('return');
        
        if (returnUrl) {
            try {
                // 解码并验证URL
                const decodedUrl = decodeURIComponent(returnUrl);
                console.log('检测到返回URL:', decodedUrl);
                return decodedUrl;
            } catch (error) {
                console.error('返回URL解码失败:', error);
                return null;
            }
        }
        
        return null;
    }

    initializeElements() {
        // 步骤元素
        this.emailStep = document.getElementById('emailStep');
        this.verifyStep = document.getElementById('verifyStep');
        this.successStep = document.getElementById('successStep');
        this.loading = document.getElementById('loading');
        // 邀请码步骤元素（_7ree）
        this.invitationStep_7ree = document.getElementById('invitationStep_7ree');
        this.invitationInput_7ree = document.getElementById('invitationCode_7ree');
        this.invitationError_7ree = document.getElementById('invitationError_7ree');
        this.validateInvitationBtn_7ree = document.getElementById('validateInvitationBtn_7ree');

        // 表单元素
        this.emailInput = document.getElementById('email');
        this.verifyCodeInput = document.getElementById('verifyCode');
        this.emailDisplay = document.getElementById('emailDisplay');
        this.userTypeHint = document.getElementById('userTypeHint');

        // 按钮元素
        this.sendCodeBtn = document.getElementById('sendCodeBtn');
        this.resendBtn = document.getElementById('resendBtn');
        this.verifyBtn = document.getElementById('verifyBtn');
        this.goToAppBtn = document.getElementById('goToAppBtn');

        // 错误信息元素
        this.emailError = document.getElementById('emailError');
        this.verifyError = document.getElementById('verifyError');

        // 其他元素
        this.loadingText = document.getElementById('loadingText');
        this.resendText = document.getElementById('resendText');
        this.countdown = document.getElementById('countdown');
        this.successTitle = document.getElementById('successTitle');
        this.successMessage = document.getElementById('successMessage');
    }

    bindEvents() {
        // 获取验证码
        this.sendCodeBtn.addEventListener('click', () => this.sendVerificationCode());
        
        // 重新发送验证码
        this.resendBtn.addEventListener('click', () => this.resendVerificationCode());
        
        // 验证验证码
        this.verifyBtn.addEventListener('click', () => this.verifyCode());
        
        // 前往应用
        this.goToAppBtn.addEventListener('click', () => this.goToApp());

        // 输入框事件
        this.emailInput.addEventListener('input', () => this.clearError('email'));
        this.emailInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendVerificationCode();
        });

        this.verifyCodeInput.addEventListener('input', () => {
            this.clearError('verify');
            // 自动验证6位验证码
            if (this.verifyCodeInput.value.length === 6) {
                this.verifyCode();
            }
        });
        this.verifyCodeInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.verifyCode();
        });

        // 邀请码事件（_7ree）
        if (this.validateInvitationBtn_7ree) {
            this.validateInvitationBtn_7ree.addEventListener('click', () => {
                this.clearError('invitation');
                const code = (this.invitationInput_7ree?.value || '').trim();
                if (!code) {
                    this.showError('invitation', '请输入邀请码');
                    return;
                }
                // 本地仅记录，不在此时请求后端，真正校验发生在发送验证码接口
                this.invitationCode_7ree = code;
                this.invitationVerified_7ree = true;
                this.switchStep('email');
                setTimeout(() => this.emailInput?.focus(), 0);
            });
            this.invitationInput_7ree?.addEventListener('input', () => this.clearError('invitation'));
            this.invitationInput_7ree?.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.validateInvitationBtn_7ree.click();
            });
        }
    }

    // 验证邮箱格式
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // 清除错误信息
    clearError(type) {
        if (type === 'email') {
            this.emailError.textContent = '';
            this.emailInput.classList.remove('error');
        } else if (type === 'verify') {
            this.verifyError.textContent = '';
            this.verifyCodeInput.classList.remove('error');
        } else if (type === 'invitation') { // _7ree
            if (this.invitationError_7ree) this.invitationError_7ree.textContent = '';
            if (this.invitationInput_7ree) this.invitationInput_7ree.classList.remove('error');
        }
    }

    // 显示错误信息
    showError(type, message) {
        if (type === 'email') {
            this.emailError.textContent = message;
            this.emailInput.classList.add('error');
        } else if (type === 'verify') {
            this.verifyError.textContent = message;
            this.verifyCodeInput.classList.add('error');
        } else if (type === 'invitation') { // _7ree
            if (this.invitationError_7ree) this.invitationError_7ree.textContent = message;
            if (this.invitationInput_7ree) this.invitationInput_7ree.classList.add('error');
        }
    }

    // 显示加载状态
    showLoading(text) {
        this.loadingText.textContent = text;
        this.loading.classList.remove('hidden');
        document.getElementById('authForm').style.display = 'none';
    }

    // 隐藏加载状态
    hideLoading() {
        this.loading.classList.add('hidden');
        document.getElementById('authForm').style.display = 'block';
    }

    // 切换步骤
    switchStep(step) {
        // 隐藏所有步骤
        this.emailStep.classList.add('hidden');
        this.verifyStep.classList.add('hidden');
        this.successStep.classList.add('hidden');
        if (this.invitationStep_7ree) this.invitationStep_7ree.classList.add('hidden');

        // 显示目标步骤
        if (step === 'email') {
            this.emailStep.classList.remove('hidden');
        } else if (step === 'verify') {
            this.verifyStep.classList.remove('hidden');
        } else if (step === 'success') {
            this.successStep.classList.remove('hidden');
        } else if (step === 'invitation' && this.invitationStep_7ree) { // _7ree
            this.invitationStep_7ree.classList.remove('hidden');
        }

        this.currentStep = step;
    }

    // 初始化邀请码流程（_7ree）
    async initInvitationFlow_7ree() {
        try {
            const res = await fetch('/api/invitation-config');
            if (!res.ok) throw new Error('failed');
            const data = await res.json();
            this.invitationEnabled_7ree = !!data.enabled;
        } catch (e) {
            this.invitationEnabled_7ree = false;
        }

        if (this.invitationEnabled_7ree && this.invitationStep_7ree) {
            // 显示邀请码步骤，阻止直接发送验证码
            this.switchStep('invitation');
            this.invitationInput_7ree?.focus();
        } else {
            // 保持原有默认：显示邮箱步骤
            this.switchStep('email');
        }
    }

    // 发送验证码
    async sendVerificationCode() {
        const email = this.emailInput.value.trim();

        // 若启用邀请码但未完成邀请码步骤，则阻止
        if (this.invitationEnabled_7ree && !this.invitationVerified_7ree) {
            this.switchStep('invitation');
            this.showError('invitation', '请先输入邀请码');
            return;
        }

        // 验证邮箱
        if (!email) {
            this.showError('email', '请输入邮箱地址');
            return;
        }

        if (!this.validateEmail(email)) {
            this.showError('email', '请输入有效的邮箱地址');
            return;
        }

        this.email = email;
        this.showLoading('正在发送验证码...');

        try {
            const response = await fetch('/api/unified-auth', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    action: 'send_code',
                    email: email,
                    invitation_7ree: this.invitationEnabled_7ree ? (this.invitationCode_7ree || '') : undefined
                })
            });

            const result = await response.json();

            if (response.ok) {
                this.hideLoading();
                this.userType = result.userType;
                this.emailDisplay.textContent = email;
                
                // 根据用户类型显示不同的提示
                if (result.userType === 'new') {
                    this.userTypeHint.textContent = '检测到新用户，验证后将自动为您创建账户';
                } else {
                    this.userTypeHint.textContent = '欢迎回来！验证后即可登录';
                }
                
                this.switchStep('verify');
                this.startCountdown();
                this.verifyCodeInput.focus();
            } else {
                this.hideLoading();
                // 邀请码错误时，回退到邀请码步骤
                if (result.error && /邀请码/.test(result.error)) {
                    this.switchStep('invitation');
                    this.showError('invitation', result.error);
                    this.invitationInput_7ree?.focus();
                    return;
                }
                this.showError('email', result.error || '发送验证码失败，请重试');
            }
        } catch (error) {
            console.error('发送验证码错误:', error);
            this.hideLoading();
            this.showError('email', '网络错误，请检查网络连接后重试');
        }
    }

    // 重新发送验证码
    async resendVerificationCode() {
        if (this.resendBtn.disabled) return;
        
        this.showLoading('正在重新发送验证码...');

        try {
            const response = await fetch('/api/unified-auth', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    action: 'send_code',
                    email: this.email,
                    invitation_7ree: this.invitationEnabled_7ree ? (this.invitationCode_7ree || '') : undefined
                })
            });

            const result = await response.json();

            if (response.ok) {
                this.hideLoading();
                this.startCountdown();
                this.clearError('verify');
            } else {
                this.hideLoading();
                // 邀请码错误时，回退到邀请码步骤
                if (result.error && /邀请码/.test(result.error)) {
                    this.switchStep('invitation');
                    this.showError('invitation', result.error);
                    this.invitationInput_7ree?.focus();
                    return;
                }
                this.showError('verify', result.error || '重新发送失败，请重试');
            }
        } catch (error) {
            console.error('重新发送验证码错误:', error);
            this.hideLoading();
            this.showError('verify', '网络错误，请重试');
        }
    }

    // 验证验证码
    async verifyCode() {
        const code = this.verifyCodeInput.value.trim();

        if (!code) {
            this.showError('verify', '请输入验证码');
            return;
        }

        if (code.length !== 6) {
            this.showError('verify', '验证码必须是6位数字');
            return;
        }

        this.showLoading('正在验证...');

        try {
            const response = await fetch('/api/unified-auth', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    action: 'verify_code',
                    email: this.email,
                    code: code
                })
            });

            const result = await response.json();

            if (response.ok) {
                this.hideLoading();
                
                // 保存认证状态
                if (result.auth && window.authManager) {
                    window.authManager.saveAuthState(result);
                    console.log('认证成功，已自动登录');
                }
                
                // 显示成功信息
                if (result.userType === 'new') {
                    this.successTitle.textContent = '注册成功！';
                    this.successMessage.textContent = '欢迎加入AI语音寻物助手';
                } else {
                    this.successTitle.textContent = '登录成功！';
                    this.successMessage.textContent = `欢迎回来，${result.user.email}`;
                }
                
                // 根据是否有返回URL更新按钮文本
                if (this.returnUrl) {
                    this.goToAppBtn.textContent = '返回应用';
                } else {
                    this.goToAppBtn.textContent = '开始使用';
                }
                
                this.switchStep('success');
                this.clearCountdown();
            } else {
                this.hideLoading();
                this.showError('verify', result.error || '验证码错误，请重试');
                this.verifyCodeInput.select();
            }
        } catch (error) {
            console.error('验证验证码错误:', error);
            this.hideLoading();
            this.showError('verify', '网络错误，请重试');
        }
    }

    // 开始倒计时
    startCountdown() {
        this.countdownSeconds = 60;
        this.resendBtn.disabled = true;
        this.resendText.textContent = '重新发送';
        this.countdown.textContent = `(${this.countdownSeconds}s)`;
        this.countdown.classList.remove('hidden');

        this.countdownTimer = setInterval(() => {
            this.countdownSeconds--;
            this.countdown.textContent = `(${this.countdownSeconds}s)`;

            if (this.countdownSeconds <= 0) {
                this.clearCountdown();
            }
        }, 1000);
    }

    // 清除倒计时
    clearCountdown() {
        if (this.countdownTimer) {
            clearInterval(this.countdownTimer);
            this.countdownTimer = null;
        }
        this.resendBtn.disabled = false;
        this.countdown.classList.add('hidden');
    }

    // 前往应用
    goToApp() {
        if (this.returnUrl) {
            console.log('返回到原页面:', this.returnUrl);
            window.location.href = this.returnUrl;
        } else {
            console.log('前往主页');
            window.location.href = 'index.html';
        }
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    new UnifiedAuthManager();
});