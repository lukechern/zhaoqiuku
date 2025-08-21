/*
 * ========================================
 * 🎫 邀请码管理器模块
 * ========================================
 * 处理邀请码相关的所有功能
 */

class InvitationManager_7ree {
    constructor(authManager) {
        this.authManager = authManager;
        this.invitationEnabled_7ree = false;
        this.invitationVerified_7ree = false;
        this.invitationCode_7ree = '';
        
        // 邀请码相关DOM元素
        this.invitationStep_7ree = null;
        this.invitationInput_7ree = null;
        this.invitationError_7ree = null;
        this.validateInvitationBtn_7ree = null;
    }

    // 初始化邀请码相关DOM元素
    initializeElements() {
        this.invitationStep_7ree = document.getElementById('invitationStep_7ree');
        this.invitationInput_7ree = document.getElementById('invitationCode_7ree');
        this.invitationError_7ree = document.getElementById('invitationError_7ree');
        this.validateInvitationBtn_7ree = document.getElementById('validateInvitationBtn_7ree');
    }

    // 绑定邀请码相关事件
    bindEvents() {
        if (this.validateInvitationBtn_7ree) {
            this.validateInvitationBtn_7ree.addEventListener('click', async () => {
                this.clearError();
                const code = (this.invitationInput_7ree?.value || '').trim();
                if (!code) {
                    this.showError('请输入邀请码');
                    return;
                }
                // 先后端校验，校验通过后才进入邮箱步骤（_7ree）
                this.authManager.uiController_7ree.showLoading('正在校验邀请码...');
                try {
                    const resp = await fetch('/api/invitation-config', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ invitation_7ree: code })
                    });
                    const result = await resp.json().catch(() => ({}));
                    if (resp.ok && result && result.valid) {
                        this.invitationCode_7ree = code;
                        this.invitationVerified_7ree = true;
                        this.authManager.uiController_7ree.hideLoading();
                        this.authManager.uiController_7ree.switchStep('email');
                        // 邀请码验证通过后，点亮第一个进度节点（_7ree）
                        this.authManager.progressManager_7ree && this.authManager.progressManager_7ree.setStepCompletedManually_7ree && this.authManager.progressManager_7ree.setStepCompletedManually_7ree(1);
                        setTimeout(() => this.authManager.uiController_7ree.focusEmailInput(), 0);
                    } else {
                        this.authManager.uiController_7ree.hideLoading();
                        this.showError(result?.error || '邀请码无效或已过期');
                        // 验证失败后清空输入框，便于用户重新输入（_7ree）
                        this.clearInvitationCode_7ree();
                    }
                } catch (err) {
                    // 静默处理：不在控制台打印 error（_7ree）
                    this.authManager.uiController_7ree.hideLoading();
                    this.showError('网络错误，请稍后重试');
                }
            });
            this.invitationInput_7ree?.addEventListener('input', () => this.clearError());
            this.invitationInput_7ree?.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.validateInvitationBtn_7ree.click();
            });
        }
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
            this.authManager.uiController_7ree.switchStep('invitation');
            this.invitationInput_7ree?.focus();
        } else {
            // 保持原有默认：显示邮箱步骤
            this.authManager.uiController_7ree.switchStep('email');
        }
        // 拉取结束后再显示表单，避免初始闪烁（_7ree）
        this.authManager.uiController_7ree.showAuthForm();
    }

    // 清除邀请码错误信息
    clearError() {
        if (this.invitationError_7ree) this.invitationError_7ree.textContent = '';
        if (this.invitationInput_7ree) this.invitationInput_7ree.classList.remove('error');
    }

    // 显示邀请码错误信息
    showError(message) {
        if (this.invitationError_7ree) this.invitationError_7ree.textContent = message;
        if (this.invitationInput_7ree) this.invitationInput_7ree.classList.add('error');
    }

    // 清空邀请码输入框并聚焦（_7ree）
    clearInvitationCode_7ree() {
        if (this.invitationInput_7ree) {
            this.invitationInput_7ree.value = '';
            // 保留 error 样式以提示错误；当用户再次输入时会自动移除（_7ree）
            setTimeout(() => this.invitationInput_7ree?.focus(), 0);
        }
    }

    // 检查邀请码是否已验证
    isInvitationRequired() {
        return this.invitationEnabled_7ree && !this.invitationVerified_7ree;
    }

    // 获取邀请码
    getInvitationCode() {
        return this.invitationEnabled_7ree ? (this.invitationCode_7ree || '') : undefined;
    }

    // 检查是否启用邀请码
    isInvitationEnabled() {
        return this.invitationEnabled_7ree;
    }

    // 检查邀请码是否已验证
    isInvitationVerified() {
        return this.invitationVerified_7ree;
    }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = InvitationManager_7ree;
} else if (typeof window !== 'undefined') {
    window.InvitationManager_7ree = InvitationManager_7ree;
}