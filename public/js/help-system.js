// 帮助系统模块
// 新增：控制是否在温馨提示中使用邮箱_7ree（默认启用动态显示）
const disableWarmTipsEmail_7ree = false;
try { window.disableWarmTipsEmail_7ree = disableWarmTipsEmail_7ree; } catch (e) { /* ignore in non-browser */ }

class HelpSystem {
    constructor() {
        this.modal = null;
        this.overlay = null;
        this.isOpen = false;
        this.modalLoadingPromise_7ree = null; // 新增：异步加载中的Promise引用
        this.modalLoaded_7ree = false; // 新增：内容是否已经加载完成
        // 新增：缓存被剥离的温馨提示片段HTML_7ree
        this.warmSectionHTML_7ree = null;
        // 新增：避免重复绑定全局事件_7ree
        this.globalEventsBound_7ree = false;
        this.init();
    }

    async init() {
        this.createHelpIcon();
        // 延迟创建模态框：首次点击时再加载
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

        // 绑定点击事件（首次点击时再创建模态框并加载外部片段）_7ree
        helpBtn.addEventListener('click', () => this.showModal());
    }

    // 新增：先创建模态框骨架，立即给用户反馈_7ree
    createModalSkeleton_7ree() {
        if (this.overlay) return; // 已创建则跳过

        // 创建模态框遮罩层
        this.overlay = document.createElement('div');
        this.overlay.className = 'help-modal-overlay';

        // 创建模态框容器
        this.modal = document.createElement('div');
        this.modal.className = 'help-modal';

        // 骨架内容：标题 + 关闭按钮 + 加载提示
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
                <div class="help-loading_7ree" style="display:flex;align-items:center;gap:8px;">
                    <img src="img/loading-spinner.svg" alt="加载中" style="width:24px;height:24px;">
                    <span>正在加载帮助内容…</span>
                </div>
            </div>
            <div class="help-modal-footer">
                <button class="help-footer-btn" id="helpCloseBtn">关闭</button>
            </div>
        `;

        this.overlay.appendChild(this.modal);
        document.body.appendChild(this.overlay);
    }

    // 新增：异步加载真实帮助内容并替换骨架_7ree
    async loadHelpContentAsync_7ree() {
        if (this.modalLoaded_7ree) return; // 已加载过则不必重复
        if (this.modalLoadingPromise_7ree) return this.modalLoadingPromise_7ree; // 防抖

        this.modalLoadingPromise_7ree = (async () => {
            let helpBodyContent = '';
            try {
                // 优先使用并发预取的内容_7ree
                if (window.preloadedHelpBodyHtml_7ree) {
                    helpBodyContent = window.preloadedHelpBodyHtml_7ree;
                } else {
                    const response = await fetch('components/help-body_7ree.html');
                    if (response.ok) {
                        helpBodyContent = await response.text();
                        // 缓存到全局，供后续直接使用_7ree
                        window.preloadedHelpBodyHtml_7ree = helpBodyContent;
                    } else {
                        console.warn('无法加载帮助内容组件，使用默认内容');
                        helpBodyContent = this.getDefaultHelpContent();
                    }
                }
            } catch (error) {
                console.warn('加载帮助内容失败：', error);
                helpBodyContent = this.getDefaultHelpContent();
            }

            // 不再进行字符串级 warmTips 替换，改由 DOM 中的 #warmTipsText 动态填充_7ree
            // this.updateWarmTipsContent 已废弃为 no-op

            // 剥离 warmTipsSection，先渲染其余部分，warmTips 后台再插入_7ree
            try {
                const wrapper_7ree = document.createElement('div');
                wrapper_7ree.innerHTML = helpBodyContent;
                const warmSection_7ree = wrapper_7ree.querySelector('#warmTipsSection');
                this.warmSectionHTML_7ree = null;
                if (warmSection_7ree) {
                    this.warmSectionHTML_7ree = warmSection_7ree.outerHTML;
                    warmSection_7ree.remove();
                }
                helpBodyContent = wrapper_7ree.innerHTML;
            } catch (e) {
                console.warn('剥离 warmTipsSection 失败，将继续渲染全部内容：', e);
            }

            // 替换为真实内容（此时不包含 warmTipsSection）_7ree
            if (this.modal) {
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

                // 内容替换后，需重新绑定内部关闭按钮事件
                this.bindEvents();

                // 在后台插入 warmTipsSection（如果有）_7ree
                if (this.warmSectionHTML_7ree) {
                    this.scheduleWarmTipsInsert_7ree();
                }
            }

            this.modalLoaded_7ree = true;
        })();

        try {
            await this.modalLoadingPromise_7ree;
        } finally {
            this.modalLoadingPromise_7ree = null;
        }
    }

    // 精简：不再有同步抓取逻辑，统一走骨架+异步加载_7ree
    async createModal() {
        if (!this.overlay) {
            this.createModalSkeleton_7ree();
            this.bindEvents();
        }
        await this.loadHelpContentAsync_7ree();
    }

    bindEvents() {
        // 点击遮罩层关闭（仅在 overlay 存在时绑定）
        this.overlay?.addEventListener('click', (e) => {
            if (e.target === this.overlay) {
                this.hideModal();
            }
        });

        // 关闭按钮（随着内容替换需要重复绑定）
        this.modal?.querySelector('.help-modal-close')?.addEventListener('click', () => {
            this.hideModal();
        });

        // Footer关闭按钮（随着内容替换需要重复绑定）
        this.modal?.querySelector('#helpCloseBtn')?.addEventListener('click', () => {
            this.hideModal();
        });

        // 全局事件与认证事件只绑定一次_7ree
        if (!this.globalEventsBound_7ree) {
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.isOpen) {
                    this.hideModal();
                }
            });
            this.bindAuthEvents();
            this.globalEventsBound_7ree = true;
        }
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

    async showModal() {
        // 首次打开：立即创建骨架并开始异步加载真实内容_7ree
        if (!this.overlay) {
            this.createModalSkeleton_7ree();
            this.bindEvents();
            // 开始异步加载，但不阻塞UI反馈
            this.loadHelpContentAsync_7ree();
        } else if (!this.modalLoaded_7ree && !this.modalLoadingPromise_7ree) {
            // 已经有骨架但内容未加载，补充启动一次
            this.loadHelpContentAsync_7ree();
        }

        if (!this.overlay) return;

        // 显示模态框：立即给出视觉反馈
        this.isOpen = true;
        this.overlay.classList.add('show');

        // 每次打开时更新温馨提示内容（如果已存在对应元素）
        const warmTipsText = this.modal?.querySelector('#warmTipsText');
        if (warmTipsText) {
            this.updateWarmTipsInModal();
        }

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

    // 新增：后台调度插入 warmTipsSection（避免阻塞首次渲染）_7ree
    scheduleWarmTipsInsert_7ree() {
        const run_7ree = () => this.insertWarmTipsSection_7ree();
        try {
            if ('requestIdleCallback' in window) {
                requestIdleCallback(run_7ree, { timeout: 1000 });
            } else {
                setTimeout(run_7ree, 0);
            }
        } catch (e) {
            setTimeout(run_7ree, 0);
        }
    }

    // 新增：真正插入 warmTipsSection 并填充动态/静态提示文案_7ree
    insertWarmTipsSection_7ree() {
        try {
            if (!this.modal || !this.warmSectionHTML_7ree) return;
            const contentEl_7ree = this.modal.querySelector('.help-modal-content');
            if (!contentEl_7ree) return;

            const tmp_7ree = document.createElement('div');
            tmp_7ree.innerHTML = this.warmSectionHTML_7ree;
            const section_7ree = tmp_7ree.firstElementChild;
            if (!section_7ree) return;

            contentEl_7ree.insertBefore(section_7ree, contentEl_7ree.firstChild);

            // 插入后立即填充文案
            this.updateWarmTipsInModal();
        } catch (e) {
            console.warn('插入 warmTipsSection 失败：', e);
        }
    }

    // 更新温馨提示内容（已废弃：不再对整体HTML做字符串替换，仅保留兼容返回）
    updateWarmTipsContent(helpBodyContent) {
        return helpBodyContent;
    }

    // 在模态框中更新温馨提示内容（补全邮箱显示）_7ree
    updateWarmTipsInModal() {
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
                const loginLink = '<a href="#" onclick="window.showLoginRequired?.(); return false;" style="color: #007bff; text-decoration: underline;">请登录</a>';
                warmTipsHtml_7ree = `欢迎您，${loginLink}后使用。<strong>找秋裤</strong>是一款AI驱动的自然语音记录和查找日常物品存放位置的小工具，请特别注意涉及<strong>机密、隐私、贵重</strong>等物品不要使用本工具记录哦。`;
            }

            warmTipsText.innerHTML = warmTipsHtml_7ree;
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

// 初始化帮助系统
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