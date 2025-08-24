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

// 新增：DOM监听器作为备用策略
function setupDOMObserver() {
    if (window.helpSystemDOMObserver) {
        return; // 已经设置过了
    }
    
    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            if (mutation.type === 'childList') {
                // 检查是否有新的header元素添加
                const header = document.querySelector('#headerTopContainer_7ree .header-top') || document.querySelector('.header-top');
                if (header && !window.helpSystem) {
                    console.log('🔍 DOM监听器检测到header，初始化帮助系统');
                    window.helpSystem = new HelpSystem();
                    observer.disconnect();
                    window.helpSystemDOMObserver = null;
                    break;
                }
            }
        }
    });
    
    // 监听整个文档的子节点变化
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    window.helpSystemDOMObserver = observer;
    
    // 10秒后自动断开监听器防止内存泄漏
    setTimeout(() => {
        if (window.helpSystemDOMObserver) {
            window.helpSystemDOMObserver.disconnect();
            window.helpSystemDOMObserver = null;
        }
    }, 10000);
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