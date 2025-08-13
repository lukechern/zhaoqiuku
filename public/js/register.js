/*
 * ========================================
 * 📝 注册页面逻辑
 * ========================================
 */

class RegisterManager {
    constructor() {
        this.currentStep = 'email';
        this.email = '';
        this.verificationCode = '';
        this.countdownTimer = null;
        this.countdownSeconds = 60;
        
        this.initializeElements();
        this.bindEvents();
    }

    initializeElements() {
        // 步骤元素
        this.emailStep = document.getElementById('emailStep');
        this.verifyStep = document.getElementById('verifyStep');
        this.successStep = document.getElementById('successStep');
        this.loading = document.getElementById('loading');

        // 表单元素
        this.emailInput = document.getElementById('email');
        this.verifyCodeInput = document.getElementById('verifyCode');
        this.emailDisplay = document.getElementById('emailDisplay');

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
    }

    bindEvents() {
        // 发送验证码
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
        }
    }

    // 显示加载状态
    showLoading(text) {
        this.loadingText.textContent = text;
        this.loading.classList.remove('hidden');
        document.getElementById('registerForm').style.display = 'none';
    }

    // 隐藏加载状态
    hideLoading() {
        this.loading.classList.add('hidden');
        document.getElementById('registerForm').style.display = 'block';
    }

    // 切换步骤
    switchStep(step) {
        // 隐藏所有步骤
        this.emailStep.classList.add('hidden');
        this.verifyStep.classList.add('hidden');
        this.successStep.classList.add('hidden');

        // 显示目标步骤
        if (step === 'email') {
            this.emailStep.classList.remove('hidden');
        } else if (step === 'verify') {
            this.verifyStep.classList.remove('hidden');
        } else if (step === 'success') {
            this.successStep.classList.remove('hidden');
        }

        this.currentStep = step;
    }

    // 发送验证码
    async sendVerificationCode() {
        const email = this.emailInput.value.trim();

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
            const response = await fetch('/api/send-verification-code', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email })
            });

            const result = await response.json();

            if (response.ok) {
                this.hideLoading();
                this.emailDisplay.textContent = email;
                this.switchStep('verify');
                this.startCountdown();
                this.verifyCodeInput.focus();
            } else {
                this.hideLoading();
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
            const response = await fetch('/api/send-verification-code', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: this.email })
            });

            const result = await response.json();

            if (response.ok) {
                this.hideLoading();
                this.startCountdown();
                this.clearError('verify');
            } else {
                this.hideLoading();
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
            const response = await fetch('/api/verify-code', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    email: this.email,
                    code: code
                })
            });

            const result = await response.json();

            if (response.ok) {
                this.hideLoading();
                
                // 保存认证状态（如果返回了认证信息）
                if (result.auth && window.authManager) {
                    window.authManager.saveAuthState(result);
                    console.log('注册成功，已自动登录');
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
        window.location.href = 'index.html';
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    new RegisterManager();
});