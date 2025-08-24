// 温馨提示更新模块（从 HelpSystem 拆分便于后续扩展 AB 实验等）_7ree
// 兼容：将更新方法挂到原型，便于按需替换
(function attachWarmTipsUpdater_7ree(){
    if (!window.HelpSystem || !window.HelpSystem.prototype) return;

    // updateWarmTipsContent 已移除（历史兼容不再需要）_7ree
    window.HelpSystem.prototype.updateWarmTipsInModal = function(){
        try {
            const warmTipsText = this.modal?.querySelector('#warmTipsText');
            if (!warmTipsText) return;

            if (window.disableWarmTipsEmail_7ree === true) {
                // 使用静态文案，不读取邮箱信息_7ree
                warmTipsText.innerHTML = `欢迎使用 <strong>找秋裤</strong>。请注意涉及<strong>机密、隐私、贵重</strong>等物品不要使用本工具记录哦。`;
                return;
            }

            const isAuthenticated = !!window.authManager?.isAuthenticated;
            const userEmail = window.authManager?.user?.email;
            let warmTipsHtml_7ree = '';

            if (isAuthenticated && userEmail) {
                warmTipsHtml_7ree = `欢迎您，<strong>${userEmail}</strong>。<strong>找秋裤</strong>是一款AI驱动的自然语音记录和查找日常物品存放位置的小工具，请特别注意涉及<strong>机密、隐私、贵重</strong>等物品不要使用本工具记录哦。`;
            } else {
                const loginLink = '<a href="/auth.html" class="help-login-btn_7ree" aria-label="登录">登录</a>';
                warmTipsHtml_7ree = `欢迎您，请${loginLink}后使用。<strong>找秋裤</strong>是一款AI驱动的自然语音记录和查找日常物品存放位置的小工具，请特别注意涉及<strong>机密、隐私、贵重</strong>等物品不要使用本工具记录哦。`;
            }

            warmTipsText.innerHTML = warmTipsHtml_7ree;
        } catch (error) {
            console.warn('在模态框中更新温馨提示内容失败:', error);
        }
    };
})();