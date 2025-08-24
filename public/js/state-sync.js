/*
 * ========================================
 * 🔄 状态同步管理器
 * ========================================
 * 确保页面刷新后用户状态正确显示
 */

class StateSyncManager {
    constructor() {
        this.syncAttempts = 0;
        this.maxSyncAttempts = 3; // 减少最大尝试次数
        this.syncInterval = null;
        this.isSynced = false;

        this.init();
    }

    init() {
        // 立即开始同步检查
        this.startSyncCheck();

        // 监听页面可见性变化
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.performSync();
            }
        });

        // 监听窗口焦点变化
        window.addEventListener('focus', () => {
            this.performSync();
        });
    }

    startSyncCheck() {
        // 清除现有的同步检查
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }

        // 立即执行一次检查
        this.performSync();

        // 如果已经同步成功，就不需要继续定时检查
        if (this.isSynced) {
            return;
        }

        // 每1秒检查一次，直到同步成功或达到最大尝试次数
        this.syncInterval = setInterval(() => {
            this.performSync();
        }, 1000);

        // 2秒后停止自动同步检查
        setTimeout(() => {
            if (this.syncInterval) {
                clearInterval(this.syncInterval);
                this.syncInterval = null;
            }
        }, 2000);
    }

    performSync() {
        this.syncAttempts++;

        // 检查必要的组件是否已加载
        if (!window.authManager) {
            return;
        }

        // 获取DOM元素（适配新的三栏布局）
        const authLinks = document.getElementById('authLinks');
        const userLogout = document.getElementById('userLogout');
        const welcomeText = document.getElementById('welcomeText');

        if (!authLinks || !userLogout || !welcomeText) {
            return;
        }

        // 检查状态是否一致
        const isAuthenticated = window.authManager.isAuthenticated;
        const authLinksVisible = authLinks.style.display !== 'none' && !authLinks.classList.contains('hidden');
        const userLogoutVisible = !userLogout.classList.contains('hidden') && userLogout.style.display !== 'none';

        // 检查是否需要同步
        const needsSync = (isAuthenticated && authLinksVisible) ||
            (!isAuthenticated && userLogoutVisible) ||
            (isAuthenticated && !userLogoutVisible) ||
            (!isAuthenticated && !authLinksVisible);

        if (needsSync) {
            this.syncUserDisplay(isAuthenticated, authLinks, userLogout, welcomeText);
            this.isSynced = true;
        } else {
            this.isSynced = true;
            // 状态已同步，停止检查
            if (this.syncInterval) {
                clearInterval(this.syncInterval);
                this.syncInterval = null;
            }
        }

        // 达到最大尝试次数后停止
        if (this.syncAttempts >= this.maxSyncAttempts) {
            if (this.syncInterval) {
                clearInterval(this.syncInterval);
                this.syncInterval = null;
            }
        }
    }

    syncUserDisplay(isAuthenticated, authLinks, userLogout, welcomeText) {
        try {
            if (isAuthenticated && window.authManager.user) {
                // 已登录状态：显示登出按钮和欢迎信息，隐藏登录链接
                authLinks.style.display = 'none';
                authLinks.classList.add('hidden');
                userLogout.classList.remove('hidden');
                userLogout.style.display = 'flex';
                
                // 获取用户名（邮箱@前面部分）
                const email = window.authManager.user.email || '';
                const username = email.split('@')[0] || '用户';
                welcomeText.textContent = `欢迎您，${username}`;

                console.log('已同步为登录状态:', email);
            } else {
                // 未登录状态：显示登录链接，隐藏登出按钮
                // 动态创建登录链接
                if (authLinks.children.length === 0) {
                    authLinks.innerHTML = '<a href="auth.html" class="auth-link">登录</a>';
                }
                authLinks.style.display = 'flex';
                authLinks.classList.remove('hidden');
                userLogout.classList.add('hidden');
                userLogout.style.display = 'none';
                
                // 显示提示信息（初始状态不显示任何内容）
                welcomeText.textContent = '';

                console.log('已同步为未登录状态');
            }

            // 触发自定义事件，通知其他组件状态已同步
            window.dispatchEvent(new CustomEvent('userDisplaySynced', {
                detail: { isAuthenticated }
            }));

        } catch (error) {
            console.error('同步用户显示状态失败:', error);
        }
    }

    // 手动触发同步（优化：增加智能检查）
    forcSync() {
        console.log('手动触发状态同步...');
        
        // 检查是否真的需要同步
        if (this.checkIfSyncNeeded()) {
            this.syncAttempts = 0;
            this.isSynced = false; // 重置同步状态
            this.performSync();
        } else {
            console.log('状态已一致，跳过同步操作');
        }
    }
    
    // 检查是否需要同步
    checkIfSyncNeeded() {
        if (!window.authManager) {
            return false;
        }
        
        const authLinks = document.getElementById('authLinks');
        const userLogout = document.getElementById('userLogout');
        const welcomeText = document.getElementById('welcomeText');

        if (!authLinks || !userLogout || !welcomeText) {
            return true; // DOM元素不存在，需要同步
        }

        // 检查状态是否一致
        const isAuthenticated = window.authManager.isAuthenticated;
        const authLinksVisible = authLinks.style.display !== 'none' && !authLinks.classList.contains('hidden');
        const userLogoutVisible = !userLogout.classList.contains('hidden') && userLogout.style.display !== 'none';

        // 检查是否需要同步
        return (isAuthenticated && authLinksVisible) ||
            (!isAuthenticated && userLogoutVisible) ||
            (isAuthenticated && !userLogoutVisible) ||
            (!isAuthenticated && !authLinksVisible);
    }
}

// 创建全局状态同步管理器实例
window.stateSyncManager = new StateSyncManager();

// 导出到全局作用域，方便调试
window.forceSyncUserState = () => {
    if (window.stateSyncManager) {
        window.stateSyncManager.forcSync();
    }
};

console.log('状态同步管理器已加载');