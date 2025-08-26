// 帮助系统初始化模块（拆分自 js/help-system.js）_7ree
// 添加帮助按钮样式到页面（已迁移至外部CSS: css/help-modal.css）。原函数 addHelpButtonStyles 已移除，避免重复注入与样式闪烁。
function initHelpSystem() {
    // 只在index页面初始化帮助系统
    const isIndexPage = window.location.pathname.includes('index.html') || 
                       window.location.pathname === '/' || 
                       window.location.pathname.endsWith('/');
    
    if (!isIndexPage) return;

    // 删除：样式注入调用，改为外部CSS提供样式
    // addHelpButtonStyles();
    
    // 优化初始化策略：减少等待时间，提高WebView性能
    const initHelp = () => {
        const header = document.querySelector('#headerTopContainer_7ree .header-top') || document.querySelector('.header-top');
        if (header) {
            // 立即创建帮助系统
            window.helpSystem = new HelpSystem();
            // 迁移：在初始化成功后创建帮助按钮_7ree
            try { createHelpIcon_7ree(); } catch (e) { console.warn('创建帮助按钮失败：', e); }
            console.log('✅ 帮助系统初始化成功');
            return true;
        }
        return false;
    };

    // 策略一：立即尝试初始化
    if (initHelp()) {
        return;
    }
    
    // 简化：移除快速轮询，仅使用 MutationObserver 监听 DOM 变化
    setupDOMObserver();
}

// 优化：使用轻量级轮询替代MutationObserver，减少性能开销
function setupDOMObserver() {
    if (window.helpSystemDOMObserver) {
        return; // 已经设置过了
    }
    
    let attempts = 0;
    const maxAttempts = 20; // 最多尝试20次
    
    const checkForHeader = () => {
        attempts++;
        const header = document.querySelector('#headerTopContainer_7ree .header-top') || document.querySelector('.header-top');
        
        if (header && !window.helpSystem) {
            console.log('🔍 轮询检测到header，初始化帮助系统');
            window.helpSystem = new HelpSystem();
            // 迁移：初始化后创建帮助按钮_7ree
            try { createHelpIcon_7ree(); } catch (e) { console.warn('创建帮助按钮失败：', e); }
            window.helpSystemDOMObserver = null;
            return;
        }
        
        if (attempts < maxAttempts) {
            // 使用递增延迟，减少CPU占用
            const delay = Math.min(100 + attempts * 50, 500);
            setTimeout(checkForHeader, delay);
        } else {
            console.warn('⚠️ 帮助系统初始化超时，header未找到');
            window.helpSystemDOMObserver = null;
        }
    };
    
    window.helpSystemDOMObserver = true; // 标记已设置
    checkForHeader();
}

// 新增：创建帮助按钮职责迁移至 init 模块_7ree
function createHelpIcon_7ree() {
    // 获取右侧功能按钮容器
    const header = document.querySelector('#headerTopContainer_7ree .header-top') || document.querySelector('.header-top');
    if (!header) {
        console.warn('⚠️ 未找到header容器');
        return;
    }

    let functionContainer = header.querySelector('.function-buttons');
    if (!functionContainer) {
        functionContainer = header.querySelector('#functionButtons');
    }
    
    // 如果未找到容器，尝试创建一个
    if (!functionContainer) {
        console.log('🔧 未找到功能按钮容器，尝试创建...');
        const headerLeft = header.querySelector('.header-left') || header.querySelector('#headerLeft');
        if (headerLeft) {
            functionContainer = document.createElement('div');
            functionContainer.className = 'function-buttons';
            functionContainer.id = 'functionButtons';
            headerLeft.appendChild(functionContainer);
            console.log('✅ 功能按钮容器创建成功');
        } else {
            console.error('❌ 无法找到合适的父容器来创建功能按钮');
            return;
        }
    }

    // 检查是否已存在帮助按钮
    if (functionContainer.querySelector('.help-toggle-btn')) {
        console.log('🔄 帮助按钮已存在，跳过创建');
        return;
    }

    // 创建帮助按钮
    const helpBtn = document.createElement('button');
    helpBtn.className = 'help-toggle-btn';
    helpBtn.setAttribute('aria-label', '帮助信息');
    helpBtn.innerHTML = '<img src="img/help.svg" alt="帮助" class="help-icon">';
    
    // 优化：直接显示按钮，避免额外的可见性延迟
    helpBtn.style.opacity = '1';
    helpBtn.style.visibility = 'visible';
    
    functionContainer.appendChild(helpBtn);
    console.log('✅ 帮助按钮创建成功');

    // 绑定点击事件（首次点击时再创建模态框并加载外部片段）_7ree
    helpBtn.addEventListener('click', async () => {
        const startTime = performance.now();
        console.log('🎯 帮助按钮被点击，开始处理...');
        
        try {
            if (!window.helpSystem) {
                console.log('🔧 创建帮助系统实例...');
                const createStart = performance.now();
                window.helpSystem = new HelpSystem();
                console.log(`✅ 帮助系统创建完成，耗时: ${(performance.now() - createStart).toFixed(2)}ms`);
            }
            
            console.log('📖 显示帮助模态框...');
            const showStart = performance.now();
            await window.helpSystem.showModal();
            console.log(`✅ 帮助模态框显示完成，耗时: ${(performance.now() - showStart).toFixed(2)}ms`);
            
            const totalTime = performance.now() - startTime;
            console.log(`🎉 帮助按钮处理完成，总耗时: ${totalTime.toFixed(2)}ms`);
            
            // 如果耗时超过1秒，记录警告
            if (totalTime > 1000) {
                console.warn(`⚠️ 帮助按钮响应较慢: ${totalTime.toFixed(2)}ms`);
            }
        } catch (e) {
            console.error('❌ 打开帮助失败：', e);
            const errorTime = performance.now() - startTime;
            console.error(`❌ 错误发生时间: ${errorTime.toFixed(2)}ms`);
        }
    });
}

// 页面加载完成后初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHelpSystem);
} else {
    // DOM已经加载完成，立即初始化
    initHelpSystem();
}

// WebView优化：提供快速初始化接口
window.fastInitHelpSystem = () => {
    console.log('🚀 快速初始化帮助系统被调用');
    if (!window.helpSystem) {
        initHelpSystem();
    }
};

// 暴露到全局，便于其他脚本调用
window.initHelpSystem = initHelpSystem;
window.createHelpIcon_7ree = createHelpIcon_7ree;

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
                warmTipsHtml_7ree = `欢迎您，<strong>${userEmail}</strong>。`;
            } else {
                const loginLink = '<a href="/auth.html" class="help-login-btn_7ree" aria-label="登录">登录</a>';
                warmTipsHtml_7ree = `欢迎您，请${loginLink}后使用。`;
            }
            warmTipsHtml_7ree = warmTipsHtml_7ree + `<br><strong>找秋裤</strong>是一款AI驱动的自然语音记录和查找日常物品存放位置的小工具。<br>请特别注意涉及<strong>机密、隐私、贵重</strong>等物品不要使用本工具记录哦。`;
            warmTipsText.innerHTML = warmTipsHtml_7ree;
        } catch (error) {
            console.warn('在模态框中更新温馨提示内容失败:', error);
        }
    };
})();