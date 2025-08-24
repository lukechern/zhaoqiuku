// 帮助系统模块
class HelpSystem {
    constructor() {
        this.modal = null;
        this.overlay = null;
        this.isOpen = false;
        this.init();
    }

    async init() {
        this.createHelpIcon();
        await this.createModal();
        this.bindEvents();
    }

    createHelpIcon() {
        // 获取左侧功能按钮容器
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

        // 绑定点击事件
        helpBtn.addEventListener('click', () => this.showModal());
    }

    async createModal() {
        // 检查是否已存在模态框
        if (document.querySelector('.help-modal-overlay')) return;

        // 创建模态框遮罩层
        this.overlay = document.createElement('div');
        this.overlay.className = 'help-modal-overlay';

        // 创建模态框内容
        this.modal = document.createElement('div');
        this.modal.className = 'help-modal';

        // 加载帮助内容
        let helpBodyContent = '';
        try {
            const response = await fetch('components/help-body_7ree.html');
            if (response.ok) {
                helpBodyContent = await response.text();
            } else {
                console.warn('无法加载帮助内容组件，使用默认内容');
                helpBodyContent = this.getDefaultHelpContent();
            }
        } catch (error) {
            console.warn('加载帮助内容失败：', error);
            helpBodyContent = this.getDefaultHelpContent();
        }

        // 动态更新温馨提示内容
        helpBodyContent = this.updateWarmTipsContent(helpBodyContent);
        
        this.modal.innerHTML = `
            <div class="help-modal-header">
                <h3 class="help-modal-title">使用帮助</h3>
                <button class="help-modal-close" aria-label="关闭帮助">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
            <div class="help-modal-content">
                ${helpBodyContent}
            </div>
            <div class="help-modal-footer">
                <button class="help-footer-btn" id="helpCloseBtn">谢谢，我知道了</button>
            </div>
        `;

        this.overlay.appendChild(this.modal);
        document.body.appendChild(this.overlay);
    }

    bindEvents() {
        // 点击遮罩层关闭
        this.overlay?.addEventListener('click', (e) => {
            if (e.target === this.overlay) {
                this.hideModal();
            }
        });

        // 关闭按钮
        this.modal?.querySelector('.help-modal-close')?.addEventListener('click', () => {
            this.hideModal();
        });

        // Footer关闭按钮
        this.modal?.querySelector('#helpCloseBtn')?.addEventListener('click', () => {
            this.hideModal();
        });

        // ESC键关闭
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.hideModal();
            }
        });

        // 监听用户登录状态变化
        this.bindAuthEvents();
    }

    // 绑定认证相关事件
    bindAuthEvents() {
        // 监听认证状态变化事件
        document.addEventListener('authStateChanged', (event) => {
            console.log('检测到认证状态变化，更新温馨提示内容');
            // 如果模态框已打开，实时更新内容
            if (this.isOpen && this.modal) {
                this.updateWarmTipsInModal();
            }
        });

        // 监听用户登录事件
        document.addEventListener('userLoggedIn', (event) => {
            console.log('用户登录，更新温馨提示内容');
            if (this.isOpen && this.modal) {
                this.updateWarmTipsInModal();
            }
        });

        // 监听用户登出事件
        document.addEventListener('userLoggedOut', (event) => {
            console.log('用户登出，更新温馨提示内容');
            if (this.isOpen && this.modal) {
                this.updateWarmTipsInModal();
            }
        });
    }

    showModal() {
        if (!this.overlay) return;

        // 每次打开时更新温馨提示内容
        const warmTipsText = this.modal?.querySelector('#warmTipsText');
        if (warmTipsText) {
            this.updateWarmTipsInModal();
        }

        this.isOpen = true;
        this.overlay.classList.add('show');

        // 阻止背景滚动
        document.body.style.overflow = 'hidden';

        // 聚焦到模态框
        setTimeout(() => {
            this.modal?.focus();
        }, 100);
    }

    hideModal() {
        if (!this.overlay) return;
        
        this.isOpen = false;
        this.overlay.classList.remove('show');
        
        // 恢复背景滚动
        document.body.style.overflow = '';
    }

    // 销毁帮助系统
    destroy() {
        if (this.overlay) {
            this.overlay.remove();
            this.overlay = null;
            this.modal = null;
        }

        // 移除帮助按钮
        const helpBtn = document.querySelector('.help-toggle-btn');
        if (helpBtn) {
            helpBtn.remove();
        }
    }

    // 更新温馨提示内容
    updateWarmTipsContent(helpBodyContent) {
        try {
            // 检查用户登录状态
            const isAuthenticated = window.authManager?.isAuthenticated;
            const userEmail = window.authManager?.user?.email;

            if (isAuthenticated && userEmail) {
                // 用户已登录，显示用户邮箱
                const updatedContent = helpBodyContent.replace(
                    /欢迎您使用 <strong>找秋裤<\/strong>/,
                    `欢迎您 <strong>${userEmail}</strong> 使用 <strong>找秋裤</strong>`
                );
                return updatedContent;
            } else {
                // 用户未登录，显示登录提示
                const loginLink = '<a href="#" onclick="window.showLoginRequired?.(); return false;" style="color: #007bff; text-decoration: underline;">请登录</a>';
                const updatedContent = helpBodyContent.replace(
                    /欢迎您使用 <strong>找秋裤<\/strong>/,
                    `欢迎您，${loginLink}后使用 <strong>找秋裤</strong>`
                );
                return updatedContent;
            }
        } catch (error) {
            console.warn('更新温馨提示内容失败:', error);
            return helpBodyContent; // 返回原始内容作为fallback
        }
    }

    // 在模态框中更新温馨提示内容
    updateWarmTipsInModal() {
        try {
            const warmTipsText = this.modal?.querySelector('#warmTipsText');
            if (!warmTipsText) return;

            const isAuthenticated = window.authManager?.isAuthenticated;
            const userEmail = window.authManager?.user?.email;
            var wormTipsHtml;

            if (isAuthenticated && userEmail) {
                // 用户已登录，显示用户邮箱
                wormTipsHtml = `欢迎您，<strong>${userEmail}</strong>。<strong>找秋裤</strong>`;
            } else {
                // 用户未登录，显示登录提示
                const loginLink = '<a href="#" onclick="window.showLoginRequired?.(); return false;" style="color: #007bff; text-decoration: underline;">请登录</a>';
                wormTipsHtml = `欢迎您，${loginLink}后使用。<strong>找秋裤</strong>`;
            }
                wormTipsHtml += `是一款AI驱动的自然语音记录和查找日常物品存放位置的小工具，请特别注意涉及<strong>机密、隐私、贵重</strong>等物品不要使用本工具记录哦。`;

                warmTipsText.innerHTML = wormTipsHtml;

        } catch (error) {
            console.warn('在模态框中更新温馨提示内容失败:', error);
        }
    }

    // 获取默认帮助内容（fallback）
    getDefaultHelpContent() {
        return `
            <div class="help-section">
                <h4 class="help-section-title">
                    <img src="img/microphone.svg" alt="" class="help-section-icon">
                    语音功能
                </h4>
                <p class="help-section-content">通过语音指令记录和查找物品存放位置</p>
                <ul class="help-feature-list">
                    <li class="help-feature-item">
                        <span class="help-feature-icon">🗣️</span>
                        <span>按住麦克风按钮录音，松开即可发送</span>
                    </li>
                    <li class="help-feature-item">
                        <span class="help-feature-icon">📍</span>
                        <span>说"把XX放在XX位置"来记录物品</span>
                    </li>
                    <li class="help-feature-item">
                        <span class="help-feature-icon">🔍</span>
                        <span>说"XX在哪里"来查找物品位置</span>
                    </li>
                </ul>
            </div>
            <div class="help-section">
                <h4 class="help-section-title">
                    <img src="img/history.svg" alt="" class="help-section-icon">
                    历史记录
                </h4>
                <p class="help-section-content">查看和管理之前的语音记录</p>
            </div>
            <div class="help-section">
                <h4 class="help-section-title">
                    <img src="img/sound.svg" alt="" class="help-section-icon">
                    语音反馈
                </h4>
                <p class="help-section-content">AI助手会用语音回复您的问题</p>
            </div>
        `;
    }
}

// 添加帮助按钮样式到页面
function addHelpButtonStyles() {
    const existingStyle = document.querySelector('#help-button-styles');
    if (existingStyle) return;

    const style = document.createElement('style');
    style.id = 'help-button-styles';
    style.textContent = `
        .help-toggle-btn {
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            border: none;
            background: transparent;
            cursor: pointer;
            border-radius: 8px;
            transition: background 0.2s ease, opacity 0.2s ease;
        }

        .help-toggle-btn:hover {
            background: rgba(0, 0, 0, 0.06);
        }

        @media (prefers-color-scheme: dark) {
            .help-toggle-btn:hover {
                background: rgba(255, 255, 255, 0.08);
            }
        }

        .help-icon {
            width: 18px;
            height: 18px;
            filter: brightness(0) saturate(100%) invert(60%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(100%) contrast(100%);
            transition: filter 0.2s ease;
        }

        .help-toggle-btn:hover .help-icon {
            filter: brightness(0) saturate(100%) invert(80%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(100%) contrast(100%);
        }
    `;
    document.head.appendChild(style);
}

// 初始化帮助系统
function initHelpSystem() {
    // 只在index页面初始化帮助系统
    const isIndexPage = window.location.pathname.includes('index.html') || 
                       window.location.pathname === '/' || 
                       window.location.pathname.endsWith('/');
    
    if (!isIndexPage) return;

    addHelpButtonStyles();
    
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
    
    // 策略二：快速轮询（减少重试次数和间隔）
    let retries = 0;
    const maxRetries = 15; // 从30减少到15
    const retryInterval = 100; // 从200ms减少到100ms
    
    const fastRetryTimer = setInterval(() => {
        if (initHelp() || retries >= maxRetries) {
            clearInterval(fastRetryTimer);
            if (retries >= maxRetries) {
                console.warn('⚠️ 帮助系统初始化超时，将在DOM准备好后重试');
                // 备用策略：使用MutationObserver监听 DOM 变化
                setupDOMObserver();
            }
        }
        retries++;
    }, retryInterval);
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
window.HelpSystem = HelpSystem;
window.initHelpSystem = initHelpSystem;