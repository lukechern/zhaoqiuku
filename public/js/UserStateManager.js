// UserStateManager.js - 用户状态管理模块

export class UserStateManager {
    constructor(app) {
        this.app = app;
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
            console.log('元素状态:', {
                authLinks: !!this.authLinks,
                userInfo: !!this.userInfo,
                userEmail: !!this.userEmail,
                logoutBtn: !!this.logoutBtn
            });

            // 重新获取登出按钮（确保获取到最新的元素）
            this.logoutBtn = document.getElementById('logoutBtn');

            // 绑定登出事件
            if (this.logoutBtn) {
                console.log('绑定登出按钮事件:', this.logoutBtn);
                
                // 移除可能存在的旧事件监听器
                this.logoutBtn.replaceWith(this.logoutBtn.cloneNode(true));
                this.logoutBtn = document.getElementById('logoutBtn');
                
                this.logoutBtn.addEventListener('click', (e) => {
                    console.log('登出按钮被点击');
                    e.preventDefault();
                    e.stopPropagation();
                    this.handleLogout();
                });
                
                // 测试按钮是否可点击
                console.log('登出按钮样式:', {
                    display: getComputedStyle(this.logoutBtn).display,
                    visibility: getComputedStyle(this.logoutBtn).visibility,
                    pointerEvents: getComputedStyle(this.logoutBtn).pointerEvents
                });
            } else {
                console.warn('登出按钮未找到');
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
        const maxAttempts = 100; // 最多等待5秒

        const checkAuthManager = () => {
            attempts++;
            
            if (window.authManager) {
                console.log('认证管理器已就绪，初始化用户状态显示');
                console.log('认证状态:', {
                    isAuthenticated: window.authManager.isAuthenticated,
                    user: window.authManager.user?.email,
                    hasTokens: !!window.authManager.tokens
                });
                this.updateUserDisplay();
                
                // 设置定期检查，确保状态同步
                this.startPeriodicStateCheck();
            } else if (attempts < maxAttempts) {
                console.log(`等待认证管理器初始化... (${attempts}/${maxAttempts})`);
                setTimeout(checkAuthManager, 50);
            } else {
                console.error('认证管理器初始化超时');
                // 即使没有认证管理器，也要显示默认状态
                this.updateUserDisplay();
            }
        };
        
        checkAuthManager();
    }

    // 启动定期状态检查
    startPeriodicStateCheck() {
        let consecutiveCorrectChecks = 0;
        const maxCorrectChecks = 3; // 连续3次检查正确后，减少检查频率
        
        const checkInterval = setInterval(() => {
            if (window.authManager && this.authLinks && this.userInfo) {
                const isAuthenticated = window.authManager.isAuthenticated;
                const authLinksVisible = this.authLinks.style.display !== 'none';
                const userInfoHidden = this.userInfo.classList.contains('hidden');
                
                // 检查状态是否不一致
                const stateInconsistent = (isAuthenticated && authLinksVisible) || 
                                        (!isAuthenticated && !userInfoHidden);
                
                if (stateInconsistent) {
                    console.log('检测到状态不一致，自动修复...');
                    this.updateUserDisplay();
                    consecutiveCorrectChecks = 0; // 重置计数
                } else {
                    consecutiveCorrectChecks++;
                    
                    // 如果连续多次检查都正确，说明状态稳定，可以减少检查频率
                    if (consecutiveCorrectChecks >= maxCorrectChecks) {
                        console.log('状态已稳定，减少检查频率');
                        clearInterval(checkInterval);
                        
                        // 改为每30秒检查一次
                        setInterval(() => {
                            if (window.authManager && this.authLinks && this.userInfo) {
                                const isAuth = window.authManager.isAuthenticated;
                                const linksVisible = this.authLinks.style.display !== 'none';
                                const infoHidden = this.userInfo.classList.contains('hidden');
                                
                                if ((isAuth && linksVisible) || (!isAuth && !infoHidden)) {
                                    console.log('长期检查发现状态不一致，修复...');
                                    this.updateUserDisplay();
                                }
                            }
                        }, 30000);
                    }
                }
            }
        }, 3000); // 改为每3秒检查一次
    }

    // 更新用户显示状态
    updateUserDisplay() {
        try {
            console.log('更新用户显示状态:', {
                hasAuthManager: !!window.authManager,
                isAuthenticated: window.authManager?.isAuthenticated,
                user: window.authManager?.user?.email,
                hasElements: !!(this.authLinks && this.userInfo && this.userEmail)
            });

            // 重新获取DOM元素，防止元素引用失效
            this.authLinks = document.getElementById('authLinks');
            this.userInfo = document.getElementById('userInfo');
            this.userEmail = document.getElementById('userEmail');

            if (!this.authLinks || !this.userInfo || !this.userEmail) {
                console.error('用户状态显示元素未找到，尝试重新获取...');
                // 延迟重试
                setTimeout(() => {
                    this.updateUserDisplay();
                }, 100);
                return;
            }

            if (window.authManager && window.authManager.isAuthenticated && window.authManager.user) {
                // 显示用户信息，隐藏登录链接
                this.authLinks.style.display = 'none';
                this.authLinks.classList.add('hidden'); // 双重保险
                this.userInfo.classList.remove('hidden');
                this.userInfo.style.display = 'flex'; // 确保显示
                this.userEmail.textContent = window.authManager.user.email;
                console.log('显示用户信息:', window.authManager.user.email);
                
                // 验证更新结果
                console.log('更新后状态验证:', {
                    authLinksDisplay: this.authLinks.style.display,
                    authLinksHidden: this.authLinks.classList.contains('hidden'),
                    userInfoDisplay: this.userInfo.style.display,
                    userInfoHidden: this.userInfo.classList.contains('hidden'),
                    userEmailText: this.userEmail.textContent
                });
            } else {
                // 显示登录链接，隐藏用户信息
                this.authLinks.style.display = 'flex';
                this.authLinks.classList.remove('hidden'); // 双重保险
                this.userInfo.classList.add('hidden');
                this.userInfo.style.display = 'none'; // 确保隐藏
                console.log('显示登录链接');
                
                // 验证更新结果
                console.log('更新后状态验证:', {
                    authLinksDisplay: this.authLinks.style.display,
                    authLinksHidden: this.authLinks.classList.contains('hidden'),
                    userInfoDisplay: this.userInfo.style.display,
                    userInfoHidden: this.userInfo.classList.contains('hidden')
                });
            }
        } catch (error) {
            console.error('更新用户显示状态失败:', error);
        }
    }

    // 处理认证状态变化
    handleAuthStateChange(detail) {
        console.log('认证状态变化:', detail);
        
        // 立即更新用户显示
        this.updateUserDisplay();
        
        // 延迟再次更新，确保DOM更新完成
        setTimeout(() => {
            this.updateUserDisplay();
        }, 50);
        
        // 清除UI中的登录要求状态
        if (this.app.uiController && this.app.uiController.clearLoginRequiredState) {
            this.app.uiController.clearLoginRequiredState();
        }
        
        // 可以在这里添加其他认证状态变化的处理逻辑
        if (detail.type === 'login') {
            console.log('用户已登录:', detail.user.email);
            // 显示欢迎消息
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
            console.log('用户已登出');
            // 清除结果显示
            if (this.app.uiController && this.app.uiController.clearResults) {
                this.app.uiController.clearResults();
            }
        } else if (detail.type === 'restore') {
            console.log('用户状态已恢复:', detail.user.email);
            // 对于状态恢复，多次尝试更新显示
            setTimeout(() => {
                this.updateUserDisplay();
            }, 100);
            setTimeout(() => {
                this.updateUserDisplay();
            }, 300);
        }
    }

    // 处理登出
    async handleLogout() {
        try {
            // 显示确认对话框
            const userEmail = window.authManager?.user?.email || '当前用户';
            const confirmMessage = `确定要退出登录吗？\n\n当前登录用户：${userEmail}`;
            
            if (!confirm(confirmMessage)) {
                console.log('用户取消登出');
                return;
            }

            console.log('开始登出流程...');
            
            // 显示加载状态（如果有UI控制器）
            if (this.app.uiController && this.app.uiController.showMessage) {
                this.app.uiController.showMessage('正在退出登录...', 'info');
            }

            // 执行登出
            const success = await window.authManager.logout();
            
            if (success) {
                console.log('登出成功');
                
                // 显示成功消息
                if (this.app.uiController && this.app.uiController.showMessage) {
                    this.app.uiController.showMessage('已成功退出登录', 'success');
                } else {
                    // 如果没有UI控制器，使用简单的alert
                    alert('已成功退出登录');
                }
                
                // 强制更新用户显示状态
                setTimeout(() => {
                    this.updateUserDisplay();
                }, 100);
                
            } else {
                console.error('登出失败');
                
                // 显示错误消息
                if (this.app.uiController && this.app.uiController.showError) {
                    this.app.uiController.showError('退出登录失败，请重试');
                } else {
                    alert('退出登录失败，请重试');
                }
            }
            
        } catch (error) {
            console.error('登出处理失败:', error);
            
            // 显示错误消息
            if (this.app.uiController && this.app.uiController.showError) {
                this.app.uiController.showError('退出登录时发生错误：' + error.message);
            } else {
                alert('退出登录时发生错误：' + error.message);
            }
        }
    }
}