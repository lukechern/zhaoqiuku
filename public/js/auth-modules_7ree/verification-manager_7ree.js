/*
 * ========================================
 * 🔢 验证码管理器模块
 * ========================================
 * 处理验证码相关的所有功能
 */

class VerificationManager_7ree {
    constructor(authManager) {
        this.authManager = authManager;
        this.countdownTimer = null;
        this.countdownSeconds = 60;
        this.verifyCodeFailedOnce_7ree = false; // 验证码是否曾经失败过（_7ree）
        
        // 验证码相关DOM元素
        this.verifyCodeInput = null;
        this.verifyCodeInputs_7ree = null;
        this.verifyBtn = null;
        this.resendBtn = null;
        this.countdown = null;
        this.resendText = null;
        this.verifyError = null;
    }

    // 初始化验证码相关DOM元素
    initializeElements() {
        this.verifyCodeInput = document.getElementById('verifyCode');
        this.verifyCodeInputs_7ree = document.querySelectorAll('.verify-code-input_7ree');
        this.verifyBtn = document.getElementById('verifyBtn');
        this.resendBtn = document.getElementById('resendBtn');
        this.countdown = document.getElementById('countdown');
        this.resendText = document.getElementById('resendText');
        this.verifyError = document.getElementById('verifyError');
        
        // 初始化验证码输入框交互（_7ree）
        this.initVerifyCodeInputs_7ree();
    }

    // 绑定验证码相关事件
    bindEvents() {
        // 重新发送验证码
        this.resendBtn.addEventListener('click', () => this.resendVerificationCode());
        
        // 验证验证码
        this.verifyBtn.addEventListener('click', () => this.verifyCode());

        this.verifyCodeInput.addEventListener('input', () => {
            this.clearError();
        });
        this.verifyCodeInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.verifyCode();
        });
    }

    // 重新发送验证码
    async resendVerificationCode() {
        if (this.resendBtn.disabled) return;
        
        this.authManager.uiController_7ree.showLoading('正在重新发送验证码...');

        try {
            const response = await fetch('/api/unified-auth', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    action: 'send_code',
                    email: this.authManager.email,
                    invitation_7ree: this.authManager.invitationManager_7ree.getInvitationCode()
                })
            });

            const result = await response.json();

            if (response.ok) {
                this.authManager.uiController_7ree.hideLoading();
                this.startCountdown();
                this.clearError();
            } else {
                this.authManager.uiController_7ree.hideLoading();
                // 邀请码错误时，回退到邀请码步骤
                if (result.error && /邀请码/.test(result.error)) {
                    this.authManager.uiController_7ree.switchStep('invitation');
                    this.authManager.invitationManager_7ree.showError(result.error);
                    this.authManager.invitationManager_7ree.invitationInput_7ree?.focus();
                    return;
                }
                this.showError(result.error || '重新发送失败，请重试');
            }
        } catch (error) {
            // console.error('重新发送验证码错误:', error); // 已注释，避免控制台错误日志（_7ree）
            this.authManager.uiController_7ree.hideLoading();
            this.showError('网络错误，请重试');
        }
    }

    // 验证验证码
    async verifyCode() {
        const code = this.verifyCodeInput.value.trim();

        if (!code) {
            this.showError('请输入验证码');
            return;
        }

        if (code.length !== 6) {
            this.showError('验证码必须是6位数字');
            return;
        }

        this.authManager.uiController_7ree.showLoading('正在验证...');

        try {
            const response = await fetch('/api/unified-auth', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    action: 'verify_code',
                    email: this.authManager.email,
                    code: code
                })
            });

            const result = await response.json();

            if (response.ok) {
                this.authManager.uiController_7ree.hideLoading();
                
                // 保存认证状态
                if (result.auth && window.authManager) {
                    window.authManager.saveAuthState(result);
                    console.log('认证成功，已自动登录');
                }
                
                // 显示成功信息
                if (result.userType === 'new') {
                    this.authManager.successTitle.textContent = '注册成功！';
                    this.authManager.successMessage.textContent = '欢迎加入AI语音寻物助手';
                } else {
                    this.authManager.successTitle.textContent = '登录成功！';
                    this.authManager.successMessage.textContent = `欢迎回来，${result.user.email}`;
                }
                
                // 根据是否有返回URL更新按钮文本
                if (this.authManager.returnUrl) {
                    this.authManager.goToAppBtn.textContent = '返回应用';
                } else {
                    this.authManager.goToAppBtn.textContent = '开始使用';
                }
                
                // 验证成功，重置失败标志（_7ree）
                this.verifyCodeFailedOnce_7ree = false;
                
                this.authManager.uiController_7ree.switchStep('success');
                this.clearCountdown();
            } else {
                this.authManager.uiController_7ree.hideLoading();
                // 验证失败，设置失败标志（_7ree）
                this.verifyCodeFailedOnce_7ree = true;
                this.showVerifyCodeError_7ree(); // 使用新的错误显示方法（_7ree）
                this.showError(result.error || '验证码错误，请重试');
                this.verifyCodeInput.select();
            }
        } catch (error) {
            // console.error('验证验证码错误:', error); // 已注释，避免控制台错误日志（_7ree）
            this.authManager.uiController_7ree.hideLoading();
            // 验证失败，设置失败标志（_7ree）
            this.verifyCodeFailedOnce_7ree = true;
            this.showVerifyCodeError_7ree(); // 使用新的错误显示方法（_7ree）
            this.showError('验证失败，请重试');
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

    // 清除验证码错误信息
    clearError() {
        this.verifyError.textContent = '';
        this.verifyCodeInput.classList.remove('error');
    }

    // 显示验证码错误信息
    showError(message) {
        this.verifyError.textContent = message;
        this.verifyCodeInput.classList.add('error');
    }

    // 初始化验证码输入框交互（_7ree）
    initVerifyCodeInputs_7ree() {
        if (!this.verifyCodeInputs_7ree || this.verifyCodeInputs_7ree.length === 0) return;
        
        this.verifyCodeInputs_7ree.forEach((input, index) => {
            // 输入事件：只允许数字，自动跳转到下一个输入框
            input.addEventListener('input', (e) => {
                const value = e.target.value;
                
                // 只允许数字
                if (!/^[0-9]$/.test(value)) {
                    e.target.value = '';
                    return;
                }
                
                // 添加填充样式
                e.target.classList.add('filled');
                
                // 自动跳转到下一个输入框
                if (value && index < this.verifyCodeInputs_7ree.length - 1) {
                    this.verifyCodeInputs_7ree[index + 1].focus();
                }
                
                // 更新隐藏的验证码输入框
                this.updateVerifyCode_7ree();
                
                // 如果所有输入框都填满，自动验证（但验证失败过一次后不再自动验证）（_7ree）
                if (this.getVerifyCode_7ree().length === 6 && !this.verifyCodeFailedOnce_7ree) {
                    setTimeout(() => this.verifyCode(), 100);
                }
            });
            
            // 键盘事件：处理退格键
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Backspace') {
                    if (!e.target.value && index > 0) {
                        // 如果当前输入框为空，跳转到前一个输入框并清空
                        this.verifyCodeInputs_7ree[index - 1].focus();
                        this.verifyCodeInputs_7ree[index - 1].value = '';
                        this.verifyCodeInputs_7ree[index - 1].classList.remove('filled');
                    } else {
                        // 清空当前输入框
                        e.target.classList.remove('filled');
                    }
                    this.updateVerifyCode_7ree();
                } else if (e.key === 'ArrowLeft' && index > 0) {
                    this.verifyCodeInputs_7ree[index - 1].focus();
                } else if (e.key === 'ArrowRight' && index < this.verifyCodeInputs_7ree.length - 1) {
                    this.verifyCodeInputs_7ree[index + 1].focus();
                } else if (e.key === 'Enter') {
                    this.verifyCode();
                }
            });
            
            // 粘贴事件：处理粘贴验证码
            input.addEventListener('paste', (e) => {
                e.preventDefault();
                const pasteData = e.clipboardData.getData('text');
                const digits = pasteData.replace(/\D/g, '').slice(0, 6);
                
                if (digits.length > 0) {
                    this.setVerifyCode_7ree(digits);
                }
            });
            
            // 焦点事件：选中内容
            input.addEventListener('focus', (e) => {
                e.target.select();
            });
        });
    }

    // 更新隐藏的验证码输入框（_7ree）
    updateVerifyCode_7ree() {
        const code = this.getVerifyCode_7ree();
        if (this.verifyCodeInput) {
            this.verifyCodeInput.value = code;
        }
    }

    // 获取当前验证码（_7ree）
    getVerifyCode_7ree() {
        if (!this.verifyCodeInputs_7ree) return '';
        return Array.from(this.verifyCodeInputs_7ree).map(input => input.value).join('');
    }

    // 设置验证码（_7ree）
    setVerifyCode_7ree(code) {
        if (!this.verifyCodeInputs_7ree) return;
        
        const digits = code.toString().slice(0, 6);
        this.verifyCodeInputs_7ree.forEach((input, index) => {
            if (index < digits.length) {
                input.value = digits[index];
                input.classList.add('filled');
            } else {
                input.value = '';
                input.classList.remove('filled');
            }
        });
        
        this.updateVerifyCode_7ree();
        
        // 焦点到下一个空输入框或最后一个
        const nextEmptyIndex = digits.length < 6 ? digits.length : 5;
        if (this.verifyCodeInputs_7ree[nextEmptyIndex]) {
            this.verifyCodeInputs_7ree[nextEmptyIndex].focus();
        }
    }

    // 清空验证码输入框（_7ree）
    clearVerifyCode_7ree() {
        if (this.verifyCodeInputs_7ree) {
            this.verifyCodeInputs_7ree.forEach(input => {
                input.value = '';
                input.classList.remove('filled', 'error');
            });
            // 聚焦到第一个输入框
            if (this.verifyCodeInputs_7ree[0]) {
                this.verifyCodeInputs_7ree[0].focus();
            }
        }
        
        // 清空隐藏的原始输入框
        if (this.verifyCodeInput) {
            this.verifyCodeInput.value = '';
        }
        
        // 重置失败标志，允许重新自动验证（_7ree）
        this.verifyCodeFailedOnce_7ree = false;
    }

    // 显示验证码错误状态（_7ree）
    showVerifyCodeError_7ree() {
        if (this.verifyCodeInputs_7ree) {
            this.verifyCodeInputs_7ree.forEach(input => {
                input.classList.add('error');
                // 添加震动动画
                input.style.animation = 'shake_7ree 0.5s ease-in-out';
                setTimeout(() => {
                    input.style.animation = '';
                }, 500);
            });
            
            // 验证失败后自动清空所有输入框并聚焦到第一个（_7ree）
            setTimeout(() => {
                this.clearVerifyCode_7ree();
            }, 600); // 等待震动动画完成后再清空
        }
    }

    // 聚焦到验证码输入框
    focusVerifyCodeInput() {
        // 自动聚焦到第一个验证码输入框（_7ree）
        setTimeout(() => {
            if (this.verifyCodeInputs_7ree && this.verifyCodeInputs_7ree[0]) {
                this.verifyCodeInputs_7ree[0].focus();
            }
        }, 100);
    }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VerificationManager_7ree;
} else if (typeof window !== 'undefined') {
    window.VerificationManager_7ree = VerificationManager_7ree;
}