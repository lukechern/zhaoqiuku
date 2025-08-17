// UserStateManager.js - 用户状态管理模块

export class UserStateManager {
    constructor(app) {
        this.app = app;
        this.stateCheckCount = 0; // 添加状态检查计数器
        this.maxInitialChecks = 5; // 限制初始化时的检查次数
    }

    // 初始化用户状态
    initializeUserState() {
        // 延迟初始化，确保DOM元素已加载
        const initUserStateElements = () => {
            // 获取用户状态元素
            this.authLinks = document.getElementById('authLinks');
            this.userInfo = document.getElementById('userInfo');
            this.userEmail = document.getElementById('userEmail');
            this.logoutBtn = document.getElementById('logoutBtn');

            if (!this.authLinks || !this.userInfo || !this.userEmail) {
                console.log('用户状态元素未找到，延迟重试...');
                setTimeout(initUserStateElements, 100);
                return;
            }

            console.log('用户状态元素已找到，绑定事件...');

            // 重新获取登出按钮（确保获取到最新的元素）
            this.logoutBtn = document.getElementById('logoutBtn');

            // 绑定登出事件
            if (this.logoutBtn) {
                // 移除可能存在的旧事件监听器
                this.logoutBtn.replaceWith(this.logoutBtn.cloneNode(true));
                this.logoutBtn = document.getElementById('logoutBtn');

                this.logoutBtn.addEventListener('click', async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    await this.handleLogout();
                });
            }

            // 监听认证状态变化
            window.addEventListener('authStateChange', (e) => {
                this.handleAuthStateChange(e.detail);
            });

            // 等待认证管理器初始化完成
            this.waitForAuthManager();
        };

        // 如果DOM已加载完成，立即初始化；否则等待
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initUserStateElements);
        } else {
            initUserStateElements();
        }
    }

    // 等待认证管理器初始化
    waitForAuthManager() {
        let attempts = 0;
        const maxAttempts = 50; // 减少等待次数

        const checkAuthManager = () => {
            attempts++;

            if (window.authManager) {
                console.log('认证管理器已就绪，初始化用户状态显示');
                this.updateUserDisplay();

                // 设置定期检查，确保状态同步
                this.startPeriodicStateCheck();
            } else if (attempts < maxAttempts) {
                setTimeout(checkAuthManager, 50);
            } else {
                // 即使没有认证管理器，也要显示默认状态
                this.updateUserDisplay();
            }
        };

        checkAuthManager();
    }

    // 启动定期状态检查
    startPeriodicStateCheck() {
        let checkCount = 0;
        const maxChecks = 3;

        const checkInterval = setInterval(() => {
            checkCount++;

            if (window.authManager && this.authLinks && this.userInfo) {
                const isAuthenticated = window.authManager.isAuthenticated;
                const authLinksVisible = this.authLinks.style.display !== 'none';
                const userInfoHidden = this.userInfo.classList.contains('hidden');

                // 检查状态是否不一致
                const stateInconsistent = (isAuthenticated && authLinksVisible) ||
                    (!isAuthenticated && !userInfoHidden);

                if (stateInconsistent) {
                    this.updateUserDisplay();
                }
            }

            // 只执行有限次数的检查
            if (checkCount >= maxChecks) {
                clearInterval(checkInterval);
            }
        }, 1000);
    }

    // 更新用户显示状态
    updateUserDisplay() {
        // 限制日志输出，只在前几次调用时输出详细日志
        this.stateCheckCount++;
        const isDebug = this.stateCheckCount <= this.maxInitialChecks;

        if (isDebug) {
            console.log('更新用户显示状态:', {
                hasAuthManager: !!window.authManager,
                isAuthenticated: window.authManager?.isAuthenticated,
                user: window.authManager?.user?.email
            });
        }

        // 重新获取DOM元素，防止元素引用失效
        this.authLinks = document.getElementById('authLinks');
        this.userInfo = document.getElementById('userInfo');
        this.userEmail = document.getElementById('userEmail');

        if (!this.authLinks || !this.userInfo || !this.userEmail) {
            // 延迟重试
            setTimeout(() => {
                this.updateUserDisplay();
            }, 100);
            return;
        }

        if (window.authManager && window.authManager.isAuthenticated && window.authManager.user) {
            // 显示用户信息，隐藏登录链接
            this.authLinks.innerHTML = ''; // 清空认证链接容器
            this.authLinks.style.display = 'none';
            this.authLinks.classList.add('hidden');
            this.userInfo.classList.remove('hidden');
            this.userInfo.style.display = 'flex';
            this.userEmail.textContent = window.authManager.user.email;

            if (isDebug) {
                console.log('显示用户信息:', window.authManager.user.email);
            }
        } else {
            // 显示登录链接，隐藏用户信息
            // 动态创建登录/注册链接
            this.authLinks.innerHTML = '<a href="auth.html" class="auth-link">登录/注册</a>';
            this.authLinks.style.display = 'flex';
            this.authLinks.classList.remove('hidden');
            this.userInfo.classList.add('hidden');
            this.userInfo.style.display = 'none';

            if (isDebug) {
                console.log('显示登录链接');
            }
        }
    }

    // 处理认证状态变化
    handleAuthStateChange(detail) {
        // 立即更新用户显示
        this.updateUserDisplay();

        // 清除UI中的登录要求状态
        if (this.app.uiController && this.app.uiController.clearLoginRequiredState) {
            this.app.uiController.clearLoginRequiredState();
        }

        // 根据认证状态变化类型处理特定逻辑
        if (detail.type === 'login') {
            if (this.app.uiController && this.app.uiController.showMessage) {
                this.app.uiController.showMessage(`欢迎回来，${detail.user.email}！`, 'success');
                // 3秒后清除欢迎消息
                setTimeout(() => {
                    if (this.app.uiController && this.app.uiController.clearResults) {
                        this.app.uiController.clearResults();
                    }
                }, 3000);
            }
        } else if (detail.type === 'logout') {
            // 清除结果显示
            if (this.app.uiController && this.app.uiController.clearResults) {
                this.app.uiController.clearResults();
            }
        }
    }

    // 处理登出
    async handleLogout() {
        try {
            // 显示确认对话框
            const userEmail = window.authManager?.user?.email || '当前用户';
            const confirmMessage = `确定要退出登录吗？\n\n当前登录用户：${userEmail}`;

            const confirmed = await customConfirm_7ree(confirmMessage, {
                title: '退出登录',
                confirmText: '退出',
                cancelText: '取消',
                danger: true
            });
            if (!confirmed) {
                return;
            }

            // 显示加载状态（如果有UI控制器）
            if (this.app.uiController && this.app.uiController.showMessage) {
                this.app.uiController.showMessage('正在退出登录...', 'info');
            }

            // 执行登出
            const success = await window.authManager.logout();

            if (success) {
                // 显示成功消息
                if (this.app.uiController && this.app.uiController.showMessage) {
                    this.app.uiController.showMessage('已成功退出登录', 'success');
                } else {
                    alert('已成功退出登录');
                }

                // 强制更新用户显示状态
                setTimeout(() => {
                    this.updateUserDisplay();
                }, 100);

            } else {
                // 显示错误消息
                if (this.app.uiController && this.app.uiController.showError) {
                    this.app.uiController.showError('退出登录失败，请重试');
                } else {
                    alert('退出登录失败，请重试');
                }
            }

        } catch (error) {
            // 显示错误消息
            if (this.app.uiController && this.app.uiController.showError) {
                this.app.uiController.showError('退出登录时发生错误：' + error.message);
            } else {
                alert('退出登录时发生错误：' + error.message);
            }
        }
    }
}