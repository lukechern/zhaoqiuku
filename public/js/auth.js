/*
 * ========================================
 * 🔐 统一认证页面逻辑 - 模块化版本
 * ========================================
 * 主控制器，协调各个功能模块
 * 包含邀请码管理、验证码管理、UI控制、进度条管理等模块
 */

class UnifiedAuthManager {
    constructor() {
        // 当前步骤
        this.currentStep = 'email';
        this.email = '';
        this.verificationCode = '';
        this.userType = null; // 'new' | 'existing'
        this.verifyCodeFailedOnce_7ree = false; // 验证码是否曾经失败过（_7ree）
        
        // 获取返回URL参数
        this.returnUrl = this.getReturnUrl();
        
        // 功能模块实例
        this.invitationManager_7ree = null;
        this.verificationManager_7ree = null;
        this.uiController_7ree = null;
        this.progressManager_7ree = null;
        
        // 初始化模块
        this.initializeModules();
        
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

    // 初始化所有功能模块
    initializeModules() {
        // 初始化进度条管理器
        this.progressManager_7ree = new ProgressManager_7ree();
        this.progressManager_7ree.initializeElements();
        
        // 初始化UI控制器
        this.uiController_7ree = new UIController_7ree(this);
        this.uiController_7ree.initializeElements();
        this.uiController_7ree.bindEvents();
        
        // 初始化验证码管理器
        this.verificationManager_7ree = new VerificationManager_7ree(this);
        this.verificationManager_7ree.initializeElements();
        this.verificationManager_7ree.bindEvents();
        
        // 初始化邀请码管理器
        this.invitationManager_7ree = new InvitationManager_7ree(this);
        this.invitationManager_7ree.initializeElements();
        this.invitationManager_7ree.bindEvents();
        
        // 如果已登录，直接显示成功页面（_7ree）
        if (window.authManager && window.authManager.isAuthenticated) {
            const user = window.authManager.user || {};
            this.uiController_7ree.setSuccessInfo('existing', user, this.returnUrl);
            this.uiController_7ree.switchStep('success');
            this.uiController_7ree.showAuthForm();
            return;
        }
        
        // 初始化邀请码流程
        this.invitationManager_7ree.initInvitationFlow_7ree();
        
        // 显示表单（避免初始闪烁）
        this.uiController_7ree.showAuthForm();
    }

    // 验证邮箱格式
    validateEmail(email) {
        return this.uiController_7ree.validateEmail(email);
    }

    // 发送验证码
    async sendVerificationCode() {
        const email = this.uiController_7ree.getEmailInput();
        
        if (!email) {
            this.uiController_7ree.showEmailError('请输入邮箱地址');
            return;
        }
        
        if (!this.validateEmail(email)) {
            this.uiController_7ree.showEmailError('请输入有效的邮箱地址');
            return;
        }
        
        // 若已启用邀请码且尚未验证，先引导到邀请码步骤（_7ree）
        if (this.invitationManager_7ree && this.invitationManager_7ree.isInvitationRequired && this.invitationManager_7ree.isInvitationRequired()) {
            this.uiController_7ree.switchStep('invitation');
            if (this.invitationManager_7ree.showError) {
                this.invitationManager_7ree.showError('请先输入并验证邀请码');
            }
            if (this.invitationManager_7ree.invitationInput_7ree) {
                this.invitationManager_7ree.invitationInput_7ree.focus();
            }
            return;
        }
        
        this.email = email;
        this.uiController_7ree.clearEmailError();
        this.uiController_7ree.showLoading('正在发送验证码...');
        
        try {
            const response = await fetch('/api/unified-auth', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    action: 'send_code',
                    email: this.email,
                    invitation_7ree: this.invitationManager_7ree ? this.invitationManager_7ree.getInvitationCode() : undefined
                })
            });
            
            let result;
            try {
                result = await response.json();
            } catch (parseErr) {
                // 解析失败时读取文本，给出更友好的错误提示（_7ree）
                const text = await response.text();
                throw new Error(text || '服务器返回格式错误');
            }
            
            if (response.ok) {
                this.userType = result.userType;
                this.uiController_7ree.setEmailDisplay(this.email);
                this.uiController_7ree.setUserTypeHint(this.userType);
                
                // 成功后直接进入验证码步骤并开始倒计时（_7ree）
                this.uiController_7ree.switchStep('verify');
                this.verificationManager_7ree.clearVerifyCode_7ree();
                this.verificationManager_7ree.startCountdown();
            } else {
                // 邀请码错误时，回退到邀请码步骤（_7ree）
                if (result && result.error && /邀请码/.test(result.error)) {
                    this.uiController_7ree.switchStep('invitation');
                    if (this.invitationManager_7ree) {
                        this.invitationManager_7ree.showError(result.error);
                        this.invitationManager_7ree.invitationInput_7ree?.focus();
                    }
                } else {
                    this.uiController_7ree.showEmailError((result && (result.message || result.error)) || '发送验证码失败，请重试');
                }
            }
        } catch (error) {
            // console.error('发送验证码失败:', error); // 保持安静的控制台（_7ree）
            this.uiController_7ree.showEmailError('网络错误，请检查网络连接后重试');
        } finally {
            this.uiController_7ree.hideLoading();
        }
    }

    // 验证验证码
    async verifyCode() {
        return await this.verificationManager_7ree.verifyCode();
    }

    // 重新发送验证码
    async resendVerificationCode() {
        return await this.verificationManager_7ree.resendVerificationCode();
    }

    // 前往应用
    goToApp() {
        if (this.returnUrl) {
            console.log('跳转到返回URL:', this.returnUrl);
            window.location.href = this.returnUrl;
        } else {
            console.log('跳转到默认首页');
            window.location.href = 'index.html';
        }
    }

    // 获取验证码（_7ree）
    getVerifyCode_7ree() {
        return this.verificationManager_7ree.getVerifyCode_7ree();
    }

    // 设置验证码（_7ree）
    setVerifyCode_7ree(code) {
        this.verificationManager_7ree.setVerifyCode_7ree(code);
    }

    // 清空验证码（_7ree）
    clearVerifyCode_7ree() {
        this.verificationManager_7ree.clearVerifyCode_7ree();
    }

    // 显示验证码错误（_7ree）
    showVerifyCodeError_7ree() {
        this.verificationManager_7ree.showVerifyCodeError_7ree();
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    // 防止重复初始化（_7ree）
    if (window.__UnifiedAuthManagerInited_7ree) {
        console.log('UnifiedAuthManager已经初始化，跳过重复初始化');
        return;
    }
    
    new UnifiedAuthManager();
});