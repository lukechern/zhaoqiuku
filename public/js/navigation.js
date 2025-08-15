// 组件管理器
class ComponentManager {
    constructor() {
        this.currentPage = this.getCurrentPage();
        this.init();
    }

    getCurrentPage() {
        const path = window.location.pathname;
        if (path.includes('history.html')) {
            return 'history';
        }
        return 'index';
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
        // 优先加载底部导航，然后再加载header-top
        await this.loadNavigation();
        await this.loadHeaderTop();
    }

    // 立即加载底部导航，不等待DOM完全加载
    async loadNavigationImmediately() {
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
        // 立即开始加载底部导航
        this.loadNavigationImmediately();
        
        // 等待DOM完全加载后再加载其他组件
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.loadHeaderTop();
            });
        } else {
            this.loadHeaderTop();
        }
    }
}

// 立即初始化组件管理器
new ComponentManager();

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