// UserStateManager.js - 用户状态管理模块

export class UserStateManager {
    constructor(app) {
        this.app = app;
        this.stateCheckCount = 0; // 添加状态检查计数器
        this.maxInitialChecks = 5; // 限制初始化时的检查次数
        this.lastUpdateTime = 0; // 记录上次更新时间
        this.updateCooldown = 500; // 更新冷却时间（毫秒）
        this.isInitialized = false; // 初始化状态标志
    }

    // 初始化用户状态
    initializeUserState() {
        // 延迟初始化，确保DOM元素已加载
        const initUserStateElements = () => {
            // 获取用户状态元素
            this.authLinks = document.getElementById('authLinks');
            this.userInfo = document.getElementById('userInfo');
            this.userEmail = document.getElementById('userEmail');

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
                // console.log('找到登出按钮，绑定点击事件');
                // 移除可能存在的旧事件监听器
                this.logoutBtn.replaceWith(this.logoutBtn.cloneNode(true));
                this.logoutBtn = document.getElementById('logoutBtn');

                this.logoutBtn.addEventListener('click', async (e) => {
                    // console.log('登出按钮被点击(UserStateManager)');
                    e.preventDefault();
                    e.stopPropagation();
                    await this.handleLogout();
                });
            } else {
                // console.log('未找到登出按钮元素');
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
                // console.log('认证管理器已就绪，初始化用户状态显示');
                this.updateUserDisplay(true); // 初始化时强制更新
                this.isInitialized = true;

                // 设置定期检查，确保状态同步
                this.startPeriodicStateCheck();
            } else if (attempts < maxAttempts) {
                setTimeout(checkAuthManager, 50);
            } else {
                // 即使没有认证管理器，也要显示默认状态
                this.updateUserDisplay(true); // 初始化时强制更新
                this.isInitialized = true;
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
                    this.updateUserDisplay(); // 不强制更新，使用冷却机制
                }
            }

            // 只执行有限次数的检查
            if (checkCount >= maxChecks) {
                clearInterval(checkInterval);
            }
        }, 1000);
    }

    // 更新用户显示状态
    updateUserDisplay(forceUpdate = false) {
        const now = Date.now();
        
        // 防重复更新：如果不是强制更新且在冷却时间内，则跳过
        if (!forceUpdate && (now - this.lastUpdateTime) < this.updateCooldown) {
            return;
        }
        
        this.lastUpdateTime = now;
        
        // 限制日志输出，只在前几次调用时输出详细日志
        this.stateCheckCount++;
        const isDebug = this.stateCheckCount <= this.maxInitialChecks;

        if (isDebug) {
            console.log('更新用户显示状态:', {
                hasAuthManager: !!window.authManager,
                isAuthenticated: window.authManager?.isAuthenticated,
                user: window.authManager?.user?.email,
                forceUpdate,
                cooldownRemaining: this.updateCooldown - (now - this.lastUpdateTime)
            });
        }

        // 重新获取DOM元素，防止元素引用失效
        this.authLinks = document.getElementById('authLinks');
        this.userInfo = document.getElementById('userInfo');
        this.userEmail = document.getElementById('userEmail');

        // 确保登出按钮事件始终绑定
        this.setupLogoutHandler();

        if (!this.authLinks || !this.userInfo || !this.userEmail) {
            // 延迟重试（但不强制更新，使用冷却机制）
            setTimeout(() => {
                this.updateUserDisplay();
            }, 100);
            return;
        }

        if (window.authManager && window.authManager.isAuthenticated && window.authManager.user) {
            // 显示用户信息，隐藏登录链接
            // 不要清空认证链接容器，以避免移除已绑定的事件监听器
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
            // 动态创建登录/注册链接，但要确保不移除已绑定的事件监听器
            if (this.authLinks.children.length === 0) {
                this.authLinks.innerHTML = '<a href="auth.html" class="auth-link">登录/注册</a>';
            }
            this.authLinks.style.display = 'flex';
            this.authLinks.classList.remove('hidden');
            this.userInfo.classList.add('hidden');
            this.userInfo.style.display = 'none';

            if (isDebug) {
                console.log('显示登录链接');
            }
        }
    }

    // 确保登出按钮事件监听器正确绑定
    setupLogoutHandler() {
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            // 移除所有已有的事件监听器
            const newLogoutBtn = logoutBtn.cloneNode(true);
            logoutBtn.parentNode.replaceChild(newLogoutBtn, logoutBtn);
            
            // 添加新的事件监听器
            newLogoutBtn.addEventListener('click', async (e) => {
                // console.log('登出按钮被点击(setupLogoutHandler)');
                e.preventDefault();
                e.stopPropagation();
                await this.handleLogout();
            });
        }
    }

    // 处理认证状态变化
    handleAuthStateChange(detail) {
        // 立即更新用户显示（使用防重复机制）
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

// 默认导出
export default UserStateManager;