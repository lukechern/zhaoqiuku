// 用户头部导航栏管理器
// 负责管理顶部导航栏的用户状态显示和页面特定功能

class UserHeaderManager {
    constructor() {
        this.currentPage = this.getCurrentPage();
        this.isInitialized = false;
        this.init();
    }

    init() {
        // 等待DOM加载完成
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }

        // 监听认证状态变化
        window.addEventListener('authStateChange', (event) => {
            this.handleAuthStateChange(event.detail);
        });
    }

    setup() {
        this.updateAuthSection();
        this.updateWelcomeSection();
        this.updateFunctionSection();
        this.bindEvents();
        this.isInitialized = true;

        console.log('UserHeaderManager 初始化完成，当前页面:', this.currentPage);
    }

    getCurrentPage() {
        const path = window.location.pathname;
        if (path.includes('history.html')) {
            return 'history';
        } else if (path.includes('index.html') || path === '/' || path.endsWith('/')) {
            return 'index';
        } else if (path.includes('auth.html')) {
            return 'auth';
        }
        return 'other';
    }

    updateAuthSection() {
        const authSection = document.getElementById('authSection');
        const authLinks = document.getElementById('authLinks');
        const logoutSection = document.getElementById('logoutSection');

        if (!authSection || !authLinks || !logoutSection) return;

        const isAuthenticated = window.authManager?.isAuthenticated || false;

        if (isAuthenticated) {
            // 已登录：显示登出按钮
            authLinks.classList.add('hidden');
            logoutSection.classList.remove('hidden');

            // 绑定登出事件
            const logoutBtn = document.getElementById('logoutBtn');
            if (logoutBtn && !logoutBtn.hasAttribute('data-event-bound')) {
                logoutBtn.addEventListener('click', () => this.handleLogout());
                logoutBtn.setAttribute('data-event-bound', 'true');
            }
        } else {
            // 未登录：显示登录链接
            logoutSection.classList.add('hidden');
            authLinks.classList.remove('hidden');

            // 创建登录链接
            if (!authLinks.querySelector('.auth-link')) {
                authLinks.innerHTML = `
                    <a href="auth.html" class="auth-link" id="loginLink">登录</a>
                `;
            }
        }
    }

    updateWelcomeSection() {
        const welcomeText = document.getElementById('welcomeText');
        if (!welcomeText) return;

        const isAuthenticated = window.authManager?.isAuthenticated || false;

        if (isAuthenticated && window.authManager?.user?.email) {
            // 已登录：显示欢迎信息
            const email = window.authManager.user.email;
            const username = email.split('@')[0];
            welcomeText.textContent = `欢迎您${username}`;
        } else {
            // 未登录：显示请先登录
            welcomeText.textContent = '请先登录';
        }
    }

    updateFunctionSection() {
        const functionSection = document.getElementById('functionSection');
        if (!functionSection) return;

        // 清空现有内容
        functionSection.innerHTML = '';

        // 根据页面类型添加功能按钮
        switch (this.currentPage) {
            case 'index':
                this.addHelpButton(functionSection);
                break;
            case 'history':
                this.addSearchButton(functionSection);
                break;
            default:
                // 其他页面可以根据需要添加默认功能
                break;
        }
    }

    addHelpButton(container) {
        // 检查是否已存在帮助按钮
        if (container.querySelector('.help-toggle-btn')) return;

        const helpBtn = document.createElement('button');
        helpBtn.className = 'help-toggle-btn';
        helpBtn.setAttribute('aria-label', '帮助信息');
        helpBtn.innerHTML = '<img src="img/help.svg" alt="帮助" class="help-icon">';

        helpBtn.addEventListener('click', () => {
            if (window.helpSystem) {
                window.helpSystem.showModal();
            }
        });

        container.appendChild(helpBtn);
    }

    addSearchButton(container) {
        // 检查是否已存在搜索按钮
        if (container.querySelector('.search-toggle-btn_7ree')) return;

        const searchBtn = document.createElement('button');
        searchBtn.className = 'search-toggle-btn_7ree';
        searchBtn.setAttribute('aria-label', '搜索');
        searchBtn.innerHTML = '<img class="search-icon_7ree" src="img/search.svg" alt="搜索">';

        searchBtn.addEventListener('click', () => {
            if (window.enterSearchMode_7ree) {
                window.enterSearchMode_7ree();
            }
        });

        container.appendChild(searchBtn);
    }

    handleAuthStateChange(detail) {
        if (!this.isInitialized) return;

        console.log('认证状态变化:', detail.type, detail.isAuthenticated);

        // 更新所有区域
        this.updateAuthSection();
        this.updateWelcomeSection();

        // 如果是登出，延迟一帧更新功能区域，确保DOM已更新
        if (detail.type === 'logout') {
            setTimeout(() => {
                this.updateFunctionSection();
            }, 0);
        }
    }

    async handleLogout() {
        try {
            const result = await window.authManager.logout();
            if (result) {
                console.log('登出成功');
                // 页面跳转或其他操作可以在这里添加
                // window.location.href = 'auth.html';
            }
        } catch (error) {
            console.error('登出失败:', error);
        }
    }

    bindEvents() {
        // 页面可见性变化时重新检查状态
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.isInitialized) {
                this.updateAuthSection();
                this.updateWelcomeSection();
            }
        });
    }

    // 公共方法：强制更新显示
    forceUpdate() {
        if (this.isInitialized) {
            this.updateAuthSection();
            this.updateWelcomeSection();
            this.updateFunctionSection();
        }
    }
}

// 创建全局实例
window.userHeaderManager = new UserHeaderManager();

// 导出到全局，保持兼容性
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UserHeaderManager;
}