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
        if (!header) return;

        let functionContainer = header.querySelector('.function-buttons');
        if (!functionContainer) {
            functionContainer = header.querySelector('#functionButtons');
        }
        if (!functionContainer) {
            console.warn('未找到功能按钮容器，创建一个');
            return;
        }

        // 检查是否已存在帮助按钮
        if (functionContainer.querySelector('.help-toggle-btn')) return;

        // 创建帮助按钮
        const helpBtn = document.createElement('button');
        helpBtn.className = 'help-toggle-btn';
        helpBtn.setAttribute('aria-label', '帮助信息');
        helpBtn.innerHTML = '<img src="img/help.svg" alt="帮助" class="help-icon">';
        
        functionContainer.appendChild(helpBtn);

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
        
        this.modal.innerHTML = `
            <div class="help-modal-header">
                <h3 class="help-modal-title">找秋裤使用帮助</h3>
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
    }

    showModal() {
        if (!this.overlay) return;
        
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
    
    // 等待页面组件加载完成后再初始化
    const initHelp = () => {
        const header = document.querySelector('#headerTopContainer_7ree .header-top') || document.querySelector('.header-top');
        if (header) {
            window.helpSystem = new HelpSystem();
            return true;
        }
        return false;
    };

    // 尝试初始化，如果失败则等待
    if (!initHelp()) {
        let retries = 0;
        const maxRetries = 30;
        const timer = setInterval(() => {
            if (initHelp() || retries >= maxRetries) {
                clearInterval(timer);
            }
            retries++;
        }, 200);
    }
}

// 页面加载完成后初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHelpSystem);
} else {
    initHelpSystem();
}

// 暴露到全局，便于其他脚本调用
window.HelpSystem = HelpSystem;
window.initHelpSystem = initHelpSystem;