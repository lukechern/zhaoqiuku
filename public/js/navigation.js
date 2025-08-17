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
            
            // 找到header-top占位元素并替换为header-top组件
            const placeholder = document.querySelector('.header-top-placeholder');
            if (placeholder) {
                placeholder.insertAdjacentHTML('afterend', headerHtml);
                placeholder.remove();
                
                // 添加登出按钮事件监听器
                this.setupLogoutHandler();
            } else {
                // 降级处理：如果找不到占位元素，则插入到header开头
                const header = document.querySelector('.header');
                if (header) {
                    header.insertAdjacentHTML('afterbegin', headerHtml);
                    
                    // 添加登出按钮事件监听器
                    this.setupLogoutHandler();
                }
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
                
                // 显示确认对话框
                const confirmed = await customConfirm_7ree('确定要退出登录吗？', {
                    title: '退出登录',
                    confirmText: '退出',
                    cancelText: '取消',
                    danger: true
                });
                if (!confirmed) {
                    return; // 用户取消登出
                }
                
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
                        setTimeout(checkContainer, 100); // 增加等待时间
                    }
                };
                checkContainer();
            });
        };

        // 等待最多5秒
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Timeout waiting for container')), 5000);
        });

        try {
            const container = await Promise.race([waitForContainer(), timeoutPromise]);
            await this.loadNavigation();
        } catch (error) {
            console.error('Failed to load navigation immediately:', error);
        }
    }

    init() {
        // 立即开始加载底部导航（如果需要的话）
        this.loadNavigationImmediately();
        
        // 等待DOM完全加载后再加载其他组件
        const loadComponents = () => {
            if (this.shouldLoadHeaderTop()) {
                this.loadHeaderTop();
            } else if (this.currentPage === 'auth') {
                // 在auth页面添加标题
                this.addAuthPageTitle();
            }
        };

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', loadComponents);
        } else {
            // DOM已经加载完成，直接加载组件
            setTimeout(loadComponents, 0);
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

// 等待页面和脚本完全加载后再初始化组件管理器
const initComponentManager = () => {
    new ComponentManager();
};

// 使用多种方式确保组件管理器被初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initComponentManager);
} else {
    // DOM已经加载完成
    setTimeout(initComponentManager, 0);
}

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