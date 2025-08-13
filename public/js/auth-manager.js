/*
 * ========================================
 * 🔐 前端认证管理器
 * ========================================
 * 管理用户登录状态、Token 存储和自动刷新
 */

class AuthManager {
    constructor() {
        // 存储键名配置
        this.storageKeys = {
            ACCESS_TOKEN: 'zhaoqiuku_access_token',
            REFRESH_TOKEN: 'zhaoqiuku_refresh_token',
            USER_INFO: 'zhaoqiuku_user_info',
            LOGIN_TIME: 'zhaoqiuku_login_time',
            DEVICE_ID: 'zhaoqiuku_device_id'
        };

        // 配置选项
        this.options = {
            REFRESH_THRESHOLD: 24 * 60 * 60 * 1000, // 1天
            AUTO_REFRESH: true,
            CHECK_INTERVAL: 5 * 60 * 1000 // 5分钟检查一次
        };

        // 状态
        this.isAuthenticated = false;
        this.user = null;
        this.tokens = null;
        this.refreshTimer = null;

        // 初始化
        this.init();
    }

    /**
     * 初始化认证管理器
     */
    init() {
        try {
            // 从 localStorage 恢复认证状态
            this.restoreAuthState();
            
            // 启动自动刷新检查
            if (this.options.AUTO_REFRESH) {
                this.startAutoRefresh();
            }

            // 生成或获取设备ID
            this.ensureDeviceId();

            console.log('认证管理器初始化完成:', {
                isAuthenticated: this.isAuthenticated,
                user: this.user?.email,
                hasTokens: !!this.tokens
            });
        } catch (error) {
            console.error('认证管理器初始化失败:', error);
            this.clearAuthState();
        }
    }

    /**
     * 从 localStorage 恢复认证状态
     */
    restoreAuthState() {
        try {
            const accessToken = localStorage.getItem(this.storageKeys.ACCESS_TOKEN);
            const refreshToken = localStorage.getItem(this.storageKeys.REFRESH_TOKEN);
            const userInfo = localStorage.getItem(this.storageKeys.USER_INFO);
            const loginTime = localStorage.getItem(this.storageKeys.LOGIN_TIME);

            if (accessToken && refreshToken && userInfo) {
                this.tokens = {
                    accessToken,
                    refreshToken,
                    tokenType: 'Bearer'
                };

                this.user = JSON.parse(userInfo);
                this.isAuthenticated = true;

                console.log('从localStorage恢复认证状态:', this.user.email);
                
                // 立即触发认证状态恢复事件
                this.dispatchAuthEvent('restore', { user: this.user });
                
                // 延迟再次触发，确保所有监听器都能接收到
                setTimeout(() => {
                    this.dispatchAuthEvent('restore', { user: this.user });
                }, 100);

                // 检查 Token 是否需要刷新
                if (this.shouldRefreshToken(accessToken)) {
                    console.log('Token 即将过期，准备刷新');
                    this.refreshTokens();
                }
            }
        } catch (error) {
            console.error('恢复认证状态失败:', error);
            this.clearAuthState();
        }
    }

    /**
     * 保存认证状态到 localStorage
     * @param {Object} authData - 认证数据
     */
    saveAuthState(authData) {
        try {
            this.isAuthenticated = true;
            this.user = authData.user;
            this.tokens = authData.tokens;

            // 保存到 localStorage
            localStorage.setItem(this.storageKeys.ACCESS_TOKEN, authData.tokens.accessToken);
            localStorage.setItem(this.storageKeys.REFRESH_TOKEN, authData.tokens.refreshToken);
            localStorage.setItem(this.storageKeys.USER_INFO, JSON.stringify(authData.user));
            localStorage.setItem(this.storageKeys.LOGIN_TIME, Date.now().toString());

            console.log('认证状态已保存:', {
                user: this.user.email,
                loginTime: new Date().toISOString()
            });

            // 触发认证状态变化事件
            setTimeout(() => {
                this.dispatchAuthEvent('login', authData);
            }, 10);
        } catch (error) {
            console.error('保存认证状态失败:', error);
        }
    }

    /**
     * 清除认证状态
     */
    clearAuthState() {
        try {
            this.isAuthenticated = false;
            this.user = null;
            this.tokens = null;

            // 清除 localStorage
            Object.values(this.storageKeys).forEach(key => {
                localStorage.removeItem(key);
            });

            // 停止自动刷新
            this.stopAutoRefresh();

            console.log('认证状态已清除');

            // 触发认证状态变化事件
            setTimeout(() => {
                this.dispatchAuthEvent('logout');
            }, 10);
        } catch (error) {
            console.error('清除认证状态失败:', error);
        }
    }

    /**
     * 用户登录
     * @param {string} email - 邮箱地址
     * @returns {Promise<Object>} 登录结果
     */
    async login(email) {
        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email })
            });

            const result = await response.json();

            if (response.ok && result.success) {
                this.saveAuthState(result);
                return { success: true, user: result.user };
            } else {
                return { 
                    success: false, 
                    error: result.error,
                    code: result.code,
                    message: result.message
                };
            }
        } catch (error) {
            console.error('登录请求失败:', error);
            return { success: false, error: '网络错误，请重试' };
        }
    }

    /**
     * 用户登出
     * @returns {Promise<boolean>} 登出结果
     */
    async logout() {
        try {
            console.log('开始登出流程...');
            
            // 调用登出API
            const response = await fetch('/api/logout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.tokens?.accessToken}`
                }
            });

            if (response.ok) {
                console.log('登出API调用成功');
            } else {
                console.warn('登出API调用失败，但继续清除本地状态');
            }

            // 清除本地状态
            this.clearAuthState();
            console.log('登出流程完成');
            return true;
            
        } catch (error) {
            console.error('登出请求失败:', error);
            // 即使API调用失败，也清除本地状态
            this.clearAuthState();
            console.log('登出流程完成（API调用失败但本地状态已清除）');
            return true; // 改为返回true，因为本地状态已清除
        }
    }

    /**
     * 刷新访问令牌
     * @returns {Promise<boolean>} 刷新结果
     */
    async refreshTokens() {
        try {
            if (!this.tokens?.refreshToken) {
                console.log('没有刷新令牌，无法刷新');
                return false;
            }

            const response = await fetch('/api/refresh-token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    refreshToken: this.tokens.refreshToken 
                })
            });

            const result = await response.json();

            if (response.ok && result.success) {
                // 更新访问令牌
                this.tokens.accessToken = result.tokens.accessToken;
                localStorage.setItem(this.storageKeys.ACCESS_TOKEN, result.tokens.accessToken);
                
                console.log('访问令牌刷新成功');
                return true;
            } else {
                console.log('刷新令牌失败:', result.error);
                // 刷新失败，清除认证状态
                this.clearAuthState();
                return false;
            }
        } catch (error) {
            console.error('刷新令牌请求失败:', error);
            return false;
        }
    }

    /**
     * 检查 Token 是否需要刷新
     * @param {string} token - 访问令牌
     * @returns {boolean} 是否需要刷新
     */
    shouldRefreshToken(token) {
        try {
            if (!token) return true;

            // 解析 JWT Token（简单解析，不验证签名）
            const parts = token.split('.');
            if (parts.length !== 3) return true;

            const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
            
            if (!payload.exp) return true;

            const now = Date.now();
            const expiration = payload.exp * 1000;
            const timeUntilExpiration = expiration - now;

            return timeUntilExpiration < this.options.REFRESH_THRESHOLD;
        } catch (error) {
            console.error('检查 Token 过期时间失败:', error);
            return true;
        }
    }

    /**
     * 启动自动刷新检查
     */
    startAutoRefresh() {
        this.stopAutoRefresh(); // 先停止现有的定时器

        this.refreshTimer = setInterval(() => {
            if (this.isAuthenticated && this.tokens?.accessToken) {
                if (this.shouldRefreshToken(this.tokens.accessToken)) {
                    console.log('自动刷新 Token');
                    this.refreshTokens();
                }
            }
        }, this.options.CHECK_INTERVAL);
    }

    /**
     * 停止自动刷新检查
     */
    stopAutoRefresh() {
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
            this.refreshTimer = null;
        }
    }

    /**
     * 确保设备ID存在
     */
    ensureDeviceId() {
        let deviceId = localStorage.getItem(this.storageKeys.DEVICE_ID);
        if (!deviceId) {
            deviceId = this.generateDeviceId();
            localStorage.setItem(this.storageKeys.DEVICE_ID, deviceId);
        }
        return deviceId;
    }

    /**
     * 生成设备ID
     * @returns {string} 设备ID
     */
    generateDeviceId() {
        const timestamp = Date.now().toString(36);
        const randomStr = Math.random().toString(36).substring(2, 15);
        return `device_${timestamp}_${randomStr}`;
    }

    /**
     * 获取认证头
     * @returns {Object} 认证头对象
     */
    getAuthHeaders() {
        if (!this.isAuthenticated || !this.tokens?.accessToken) {
            return {};
        }

        return {
            'Authorization': `Bearer ${this.tokens.accessToken}`
        };
    }

    /**
     * 发送认证状态变化事件
     * @param {string} type - 事件类型
     * @param {Object} data - 事件数据
     */
    dispatchAuthEvent(type, data = null) {
        const event = new CustomEvent('authStateChange', {
            detail: {
                type,
                isAuthenticated: this.isAuthenticated,
                user: this.user,
                data
            }
        });
        window.dispatchEvent(event);
    }

    /**
     * 获取当前认证状态
     * @returns {Object} 认证状态
     */
    getAuthState() {
        return {
            isAuthenticated: this.isAuthenticated,
            user: this.user,
            tokens: this.tokens,
            loginTime: localStorage.getItem(this.storageKeys.LOGIN_TIME)
        };
    }
}

// 立即创建全局认证管理器实例
window.authManager = new AuthManager();
console.log('认证管理器已创建');

// 确保在页面完全加载后再次检查状态
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM加载完成，检查认证状态...');
    if (window.authManager && window.authManager.isAuthenticated) {
        console.log('检测到已登录状态，触发状态恢复事件');
        window.authManager.dispatchAuthEvent('restore', { user: window.authManager.user });
    }
});

// 导出认证管理器类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthManager;
}