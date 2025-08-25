// 帮助系统核心模块（拆分自 js/help-system.js）_7ree
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
        // 新增：首次登录自动弹出相关配置
        this.autoShowConfig = {
            storageKey: 'zhaoqiuku_help_shown',
            validityPeriod: 3 * 30 * 24 * 60 * 60 * 1000, // 3个月（毫秒）
            hasShownForCurrentLogin: false
        };
        this.init();
    }

    async init() {
        // 按职责拆分：帮助按钮由 help-init_7ree.js 的 createHelpIcon_7ree 负责创建
        // 延迟创建模态框：首次点击时再加载
        this.bindEvents();
        
        // 检查当前是否已经登录，如果是则检查是否需要自动弹出
        setTimeout(() => {
            if (window.authManager && window.authManager.isAuthenticated && !this.autoShowConfig.hasShownForCurrentLogin) {
                console.log('初始化时检测到已登录状态，检查是否需要自动弹出帮助');
                this.checkAndShowFirstTimeHelp();
            }
        }, 2000); // 延迟2秒确保所有组件都已加载
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
        // 已按需求移除骨架图加载方式_7ree，改为空容器，真实内容由异步加载填充
        this.modal.innerHTML = '';
        
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
            // 已彻底移除 updateWarmTipsContent（历史兼容已不再需要）_7ree

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
                        <button class="help-footer-btn" id="helpCloseBtn">我知道了</button>
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
                // 如果是自动弹出的帮助，记录用户已查看
                if (this.isAutoShown) {
                    this.markHelpAsShown();
                    this.isAutoShown = false;
                }
                this.hideModal();
            }
        });

        // 关闭按钮（随着内容替换需要重复绑定）
        this.modal?.querySelector('.help-modal-close')?.addEventListener('click', () => {
            // 如果是自动弹出的帮助，记录用户已查看
            if (this.isAutoShown) {
                this.markHelpAsShown();
                this.isAutoShown = false;
            }
            this.hideModal();
        });

        // Footer关闭按钮（随着内容替换需要重复绑定）
        this.modal?.querySelector('#helpCloseBtn')?.addEventListener('click', () => {
            // 如果是自动弹出的帮助，记录用户已查看
            if (this.isAutoShown) {
                this.markHelpAsShown();
                this.isAutoShown = false;
            }
            this.hideModal();
        });

        // 全局事件与认证事件只绑定一次_7ree
        if (!this.globalEventsBound_7ree) {
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.isOpen) {
                    // 如果是自动弹出的帮助，记录用户已查看
                    if (this.isAutoShown) {
                        this.markHelpAsShown();
                        this.isAutoShown = false;
                    }
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

        // 新增：监听认证状态恢复事件（用于首次登录自动弹出）
        window.addEventListener('authStateChange', (event) => {
            const { type, isAuthenticated } = event.detail;
            if ((type === 'login' || type === 'restore') && isAuthenticated && !this.autoShowConfig.hasShownForCurrentLogin) {
                console.log('检测到用户登录，检查是否需要自动弹出帮助');
                this.checkAndShowFirstTimeHelp();
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

    // 在模态框中更新温馨提示内容（由 warmer 模块托管）_7ree
     updateWarmTipsInModal() {
        // 具体实现由 js/help/help-warmer_7ree.js 动态挂载到原型_7ree
    }

    // 获取默认帮助内容（fallback）
    getDefaultHelpContent() {
        // 已按需求清空默认帮助内容_7ree（现在帮助内容直接读取外部片段）
        return '';
    }

    // 新增：检查是否需要自动弹出首次帮助
    checkAndShowFirstTimeHelp() {
        try {
            // 检查是否在有效期内已经显示过
            const lastShownData = localStorage.getItem(this.autoShowConfig.storageKey);
            const now = Date.now();
            
            if (lastShownData) {
                const { timestamp } = JSON.parse(lastShownData);
                const timeSinceLastShown = now - timestamp;
                
                // 如果在3个月有效期内，不再自动弹出
                if (timeSinceLastShown < this.autoShowConfig.validityPeriod) {
                    console.log('帮助卡片在有效期内已显示过，跳过自动弹出');
                    return;
                }
            }
            
            // 延迟1秒后自动弹出，确保页面完全加载
            setTimeout(() => {
                console.log('首次登录，自动弹出帮助卡片');
                this.isAutoShown = true; // 标记为自动弹出
                this.autoShowConfig.hasShownForCurrentLogin = true;
                this.showModal();
            }, 1000);
            
        } catch (error) {
            console.error('检查首次帮助弹出失败:', error);
        }
    }

    // 新增：标记帮助已显示
    markHelpAsShown() {
        try {
            const data = {
                timestamp: Date.now(),
                version: '1.0'
            };
            localStorage.setItem(this.autoShowConfig.storageKey, JSON.stringify(data));
            console.log('已记录帮助卡片显示状态');
        } catch (error) {
            console.error('记录帮助显示状态失败:', error);
        }
    }

    // 新增：重置帮助显示状态（用于测试或管理员功能）
    resetHelpShowStatus() {
        try {
            localStorage.removeItem(this.autoShowConfig.storageKey);
            this.autoShowConfig.hasShownForCurrentLogin = false;
            console.log('已重置帮助显示状态');
        } catch (error) {
            console.error('重置帮助显示状态失败:', error);
        }
    }
}

// 暴露到全局，便于其他脚本调用
try { 
    window.HelpSystem = HelpSystem; 
    
    // 开发者工具：重置帮助显示状态（用于测试）
    window.resetHelpStatus = function() {
        if (window.helpSystem) {
            window.helpSystem.resetHelpShowStatus();
            console.log('✅ 帮助显示状态已重置，下次登录将自动弹出帮助');
        } else {
            console.log('❌ 帮助系统未初始化');
        }
    };
    
    // 开发者工具：手动触发首次帮助检查
    window.testFirstTimeHelp = function() {
        if (window.helpSystem) {
            window.helpSystem.autoShowConfig.hasShownForCurrentLogin = false;
            window.helpSystem.checkAndShowFirstTimeHelp();
            console.log('✅ 已触发首次帮助检查');
        } else {
            console.log('❌ 帮助系统未初始化');
        }
    };
} catch (e) { /* ignore */ }