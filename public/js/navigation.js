// 组件管理器
class ComponentManager {
    constructor() {
        this.currentPage = this.getCurrentPage();
        // 在auth页面不执行任何操作
        if (this.currentPage !== 'auth') {
            this.init();
        }
    }

    getCurrentPage() {
        const path = window.location.pathname;
        if (path.includes('history.html')) {
            return 'history';
        } else if (path.includes('auth.html')) {
            return 'auth';
        }
        return 'index';
    }

    shouldShowNavigation() {
        // auth页面不显示底部导航栏
        return this.currentPage !== 'auth';
    }

    shouldLoadHeaderTop() {
        // auth页面不加载header-top组件
        return this.currentPage !== 'auth';
    }

    async loadHeaderTop() {
        try {
            const response = await fetch('components/header-top.html');
            const headerHtml = await response.text();
            
            // 找到header并插入header-top
            const header = document.querySelector('.header');
            if (header) {
                header.insertAdjacentHTML('afterbegin', headerHtml);
                
                // 添加登出按钮事件监听器
                this.setupLogoutHandler();
            }
        } catch (error) {
            console.error('Failed to load header-top:', error);
        }
    }

    setupLogoutHandler() {
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                try {
                    if (window.authManager) {
                        console.log('执行登出操作...');
                        await window.authManager.logout();
                        console.log('登出成功');
                        
                        // 可选：重定向到首页或登录页
                        // window.location.href = 'index.html';
                    } else {
                        console.error('认证管理器未找到');
                    }
                } catch (error) {
                    console.error('登出失败:', error);
                }
            });
        }
    }

    async loadNavigation() {
        try {
            let navHtml;
            
            // 优先使用预加载的内容
            if (window.preloadedNavHtml) {
                navHtml = window.preloadedNavHtml;
            } else {
                const response = await fetch('components/bottom-nav.html');
                navHtml = await response.text();
            }
            
            // 找到容器并插入导航栏
            const container = document.querySelector('.container');
            if (container) {
                container.insertAdjacentHTML('beforeend', navHtml);
                this.setActiveState();
            }
        } catch (error) {
            console.error('Failed to load navigation:', error);
        }
    }

    setActiveState() {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            const page = item.getAttribute('data-page');
            if (page === this.currentPage) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }

    async loadComponents() {
        // 根据页面类型决定是否加载底部导航
        if (this.shouldShowNavigation()) {
            await this.loadNavigation();
        }
        // 根据页面类型决定是否加载header-top
        if (this.shouldLoadHeaderTop()) {
            await this.loadHeaderTop();
        } else if (this.currentPage === 'auth') {
            // 在auth页面添加标题
            this.addAuthPageTitle();
        }
    }

    // 立即加载底部导航，不等待DOM完全加载
    async loadNavigationImmediately() {
        if (!this.shouldShowNavigation()) {
            return;
        }

        // 等待container元素可用
        const waitForContainer = () => {
            return new Promise((resolve) => {
                const checkContainer = () => {
                    const container = document.querySelector('.container');
                    if (container) {
                        resolve(container);
                    } else {
                        setTimeout(checkContainer, 10);
                    }
                };
                checkContainer();
            });
        };

        await waitForContainer();
        await this.loadNavigation();
    }

    init() {
        // 立即开始加载底部导航（如果需要的话）
        this.loadNavigationImmediately();
        
        // 等待DOM完全加载后再加载其他组件
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                if (this.shouldLoadHeaderTop()) {
                    this.loadHeaderTop();
                } else if (this.currentPage === 'auth') {
                    // 在auth页面添加标题
                    this.addAuthPageTitle();
                }
            });
        } else {
            if (this.shouldLoadHeaderTop()) {
                this.loadHeaderTop();
            } else if (this.currentPage === 'auth') {
                // 在auth页面添加标题
                this.addAuthPageTitle();
            }
        }
    }

    addAuthPageTitle() {
        // 在auth页面添加标题
        const header = document.querySelector('.header');
        if (header) {
            // 确保只添加一次标题
            if (!header.querySelector('.auth-title')) {
                const titleDiv = document.createElement('div');
                titleDiv.className = 'header-top';
                titleDiv.innerHTML = '<div class="user-actions"><div class="auth-title">找秋裤 - AI语音寻物助手</div></div>';
                header.insertAdjacentElement('afterbegin', titleDiv);
            }
        }
    }
}

// 延迟初始化组件管理器，确保在DOM完全加载后执行
document.addEventListener('DOMContentLoaded', () => {
    new ComponentManager();
});

// 创建全局登出函数，以防其他地方还在使用
window.handleGlobalLogout = async function() {
    try {
        if (window.authManager) {
            console.log('执行全局登出操作...');
            await window.authManager.logout();
            console.log('全局登出成功');
        } else {
            console.error('认证管理器未找到');
        }
    } catch (error) {
        console.error('全局登出失败:', error);
    }
};

// 创建全局用户显示更新函数
window.forceUpdateUserDisplay = function() {
    try {
        if (window.stateSyncManager) {
            console.log('强制更新用户显示状态...');
            window.stateSyncManager.forcSync();
        } else {
            console.warn('状态同步管理器未找到');
        }
    } catch (error) {
        console.error('强制更新用户显示失败:', error);
    }
};