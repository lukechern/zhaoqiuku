/*
 * ========================================
 * 🔄 状态同步管理器
 * ========================================
 * 确保页面刷新后用户状态正确显示
 */

class StateSyncManager {
    constructor() {
        this.syncAttempts = 0;
        this.maxSyncAttempts = 5; // 减少最大尝试次数
        this.syncInterval = null;
        this.isSynced = false; // 添加同步状态标记

        this.init();
    }

    init() {
        console.log('状态同步管理器初始化...');

        // 立即开始同步检查
        this.startSyncCheck();

        // 监听页面可见性变化
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                console.log('页面重新可见，检查状态同步...');
                this.performSync();
            }
        });

        // 监听窗口焦点变化
        window.addEventListener('focus', () => {
            console.log('窗口获得焦点，检查状态同步...');
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
            console.log('首次检查已同步，无需继续检查');
            return;
        }

        // 每500ms检查一次，直到同步成功或达到最大尝试次数
        this.syncInterval = setInterval(() => {
            this.performSync();
        }, 500);

        // 3秒后停止自动同步检查（减少到3秒）
        setTimeout(() => {
            if (this.syncInterval) {
                clearInterval(this.syncInterval);
                this.syncInterval = null;
                console.log('自动状态同步检查已停止');
            }
        }, 3000);
    }

    performSync() {
        this.syncAttempts++;

        console.log(`执行状态同步检查 (${this.syncAttempts}/${this.maxSyncAttempts})...`);

        // 检查必要的组件是否已加载
        if (!window.authManager) {
            console.log('认证管理器未加载，等待...');
            return;
        }

        // 获取DOM元素
        const authLinks = document.getElementById('authLinks');
        const userInfo = document.getElementById('userInfo');
        const userEmail = document.getElementById('userEmail');

        if (!authLinks || !userInfo || !userEmail) {
            console.log('DOM元素未就绪，等待...');
            return;
        }

        // 检查状态是否一致
        const isAuthenticated = window.authManager.isAuthenticated;
        const authLinksVisible = authLinks.style.display !== 'none' && !authLinks.classList.contains('hidden');
        const userInfoVisible = !userInfo.classList.contains('hidden') && userInfo.style.display !== 'none';

        console.log('状态检查:', {
            isAuthenticated,
            authLinksVisible,
            userInfoVisible,
            userEmail: window.authManager.user?.email
        });

        // 检查是否需要同步
        const needsSync = (isAuthenticated && authLinksVisible) ||
            (!isAuthenticated && userInfoVisible) ||
            (isAuthenticated && !userInfoVisible) ||
            (!isAuthenticated && !authLinksVisible);

        if (needsSync) {
            console.log('检测到状态不一致，执行同步...');
            this.syncUserDisplay(isAuthenticated, authLinks, userInfo, userEmail);
            this.isSynced = true; // 标记为已同步
        } else {
            console.log('状态已同步');
            this.isSynced = true; // 标记为已同步
            // 状态已同步，停止检查
            if (this.syncInterval) {
                clearInterval(this.syncInterval);
                this.syncInterval = null;
            }
        }

        // 达到最大尝试次数后停止
        if (this.syncAttempts >= this.maxSyncAttempts) {
            console.log('达到最大同步尝试次数，停止检查');
            if (this.syncInterval) {
                clearInterval(this.syncInterval);
                this.syncInterval = null;
            }
        }
    }

    syncUserDisplay(isAuthenticated, authLinks, userInfo, userEmail) {
        try {
            if (isAuthenticated && window.authManager.user) {
                // 显示用户信息，隐藏登录链接
                authLinks.style.display = 'none';
                authLinks.classList.add('hidden');
                userInfo.classList.remove('hidden');
                userInfo.style.display = 'flex';
                userEmail.textContent = window.authManager.user.email;

                console.log('已同步为登录状态:', window.authManager.user.email);
            } else {
                // 显示登录链接，隐藏用户信息
                authLinks.style.display = 'flex';
                authLinks.classList.remove('hidden');
                userInfo.classList.add('hidden');
                userInfo.style.display = 'none';

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

    // 手动触发同步
    forcSync() {
        console.log('手动触发状态同步...');
        this.syncAttempts = 0;
        this.isSynced = false; // 重置同步状态
        this.performSync();
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