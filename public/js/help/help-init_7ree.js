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
                    // 迁移：初始化后创建帮助按钮_7ree
                    try { createHelpIcon_7ree(); } catch (e) { console.warn('创建帮助按钮失败：', e); }
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
    helpBtn.addEventListener('click', () => {
        try {
            if (!window.helpSystem) {
                window.helpSystem = new HelpSystem();
            }
            window.helpSystem.showModal();
        } catch (e) {
            console.error('❌ 打开帮助失败：', e);
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