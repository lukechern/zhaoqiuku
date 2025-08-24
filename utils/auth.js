/*
 * ========================================
 * 🔐 认证工具函数
 * ========================================
 * 处理用户认证、登录状态管理等
 */

import { verifyToken, parseToken, isTokenExpiringSoon } from './jwt.js';
import { findUserByEmail } from './database.js';
import { STORAGE_CONFIG, COOKIE_CONFIG } from '../config/authConfig.js';

/**
 * 从请求中提取 Token
 * @param {Object} req - 请求对象
 * @returns {string|null} Token 或 null
 */
export function extractTokenFromRequest(req) {
    // 1. 从 Authorization Header 提取
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.substring(7);
    }

    // 2. 从 Cookie 提取
    const cookies = parseCookies(req.headers.cookie || '');
    if (cookies[COOKIE_CONFIG.NAMES.ACCESS_TOKEN]) {
        return cookies[COOKIE_CONFIG.NAMES.ACCESS_TOKEN];
    }

    // 3. 从查询参数提取（不推荐，仅用于特殊情况）
    if (req.query && req.query.token) {
        return req.query.token;
    }

    return null;
}

/**
 * 解析 Cookie 字符串
 * @param {string} cookieString - Cookie 字符串
 * @returns {Object} Cookie 对象
 */
export function parseCookies(cookieString) {
    const cookies = {};
    if (!cookieString) return cookies;

    cookieString.split(';').forEach(cookie => {
        const [name, value] = cookie.trim().split('=');
        if (name && value) {
            cookies[name] = decodeURIComponent(value);
        }
    });

    return cookies;
}

/**
 * 设置认证 Cookie
 * @param {Object} res - 响应对象
 * @param {Object} tokens - Token 对象
 */
export function setAuthCookies(res, tokens) {
    const cookieOptions = {
        ...COOKIE_CONFIG.OPTIONS,
        secure: process.env.NODE_ENV === 'production'
    };

    // 设置访问令牌
    res.setHeader('Set-Cookie', [
        `${COOKIE_CONFIG.NAMES.ACCESS_TOKEN}=${tokens.accessToken}; ${formatCookieOptions(cookieOptions)}`,
        `${COOKIE_CONFIG.NAMES.REFRESH_TOKEN}=${tokens.refreshToken}; ${formatCookieOptions({
            ...cookieOptions,
            maxAge: 30 * 24 * 60 * 60 * 1000 // 刷新令牌30天
        })}`,
        `${COOKIE_CONFIG.NAMES.USER_INFO}=${encodeURIComponent(JSON.stringify(tokens.user))}; ${formatCookieOptions(cookieOptions)}`
    ]);
}

/**
 * 清除认证 Cookie
 * @param {Object} res - 响应对象
 */
export function clearAuthCookies(res) {
    const expiredCookieOptions = {
        ...COOKIE_CONFIG.OPTIONS,
        maxAge: 0,
        expires: new Date(0)
    };

    res.setHeader('Set-Cookie', [
        `${COOKIE_CONFIG.NAMES.ACCESS_TOKEN}=; ${formatCookieOptions(expiredCookieOptions)}`,
        `${COOKIE_CONFIG.NAMES.REFRESH_TOKEN}=; ${formatCookieOptions(expiredCookieOptions)}`,
        `${COOKIE_CONFIG.NAMES.USER_INFO}=; ${formatCookieOptions(expiredCookieOptions)}`
    ]);
}

/**
 * 格式化 Cookie 选项
 * @param {Object} options - Cookie 选项
 * @returns {string} 格式化的选项字符串
 */
function formatCookieOptions(options) {
    const parts = [];
    
    if (options.maxAge) parts.push(`Max-Age=${Math.floor(options.maxAge / 1000)}`);
    if (options.expires) parts.push(`Expires=${options.expires.toUTCString()}`);
    if (options.path) parts.push(`Path=${options.path}`);
    if (options.domain) parts.push(`Domain=${options.domain}`);
    if (options.secure) parts.push('Secure');
    if (options.httpOnly) parts.push('HttpOnly');
    if (options.sameSite) parts.push(`SameSite=${options.sameSite}`);
    
    return parts.join('; ');
}

/**
 * 验证用户认证状态
 * @param {Object} req - 请求对象
 * @returns {Promise<Object|null>} 用户信息或 null
 */
export async function authenticateUser(req) {
    try {
        const token = extractTokenFromRequest(req);
        if (!token) {
            return null;
        }

        const payload = await verifyToken(token);
        if (!payload) {
            return null;
        }

        // 可选：从数据库获取最新用户信息
        const user = await findUserByEmail(payload.email);
        if (!user || !user.is_verified || user.status !== 'active') {
            console.log('用户状态异常:', { email: payload.email, status: user?.status });
            return null;
        }

        return {
            id: user.id,
            email: user.email,
            status: user.status,
            isVerified: user.is_verified,
            registeredAt: user.registered_at,
            role: payload.role || 'user'
        };
    } catch (error) {
        console.error('用户认证失败:', error);
        return null;
    }
}

/**
 * 认证中间件（用于 API 路由）
 * @param {Function} handler - API 处理函数
 * @param {Object} options - 选项
 * @returns {Function} 包装后的处理函数
 */
export function withAuth(handler, options = {}) {
    return async (req, res) => {
        try {
            const user = await authenticateUser(req);
            
            if (!user) {
                return res.status(401).json({
                    error: '未授权访问',
                    code: 'UNAUTHORIZED',
                    message: '欢迎您'
                });
            }

            // 检查角色权限（如果指定）
            if (options.requiredRole && user.role !== options.requiredRole) {
                return res.status(403).json({
                    error: '权限不足',
                    code: 'FORBIDDEN',
                    message: '您没有访问此资源的权限'
                });
            }

            // 将用户信息添加到请求对象
            req.user = user;

            // 调用原始处理函数
            return await handler(req, res);
        } catch (error) {
            console.error('认证中间件错误:', error);
            return res.status(500).json({
                error: 'AI开小差了，请稍后重试。',
                code: 'INTERNAL_ERROR'
            });
        }
    };
}

/**
 * 可选认证中间件（用户可以是匿名或已认证）
 * @param {Function} handler - API 处理函数
 * @returns {Function} 包装后的处理函数
 */
export function withOptionalAuth(handler) {
    return async (req, res) => {
        try {
            const user = await authenticateUser(req);
            req.user = user; // 可能为 null
            return await handler(req, res);
        } catch (error) {
            console.error('可选认证中间件错误:', error);
            req.user = null;
            return await handler(req, res);
        }
    };
}

/**
 * 生成前端认证状态对象
 * @param {Object} tokens - Token 对象
 * @returns {Object} 前端认证状态
 */
export function generateClientAuthState(tokens) {
    return {
        isAuthenticated: true,
        user: tokens.user,
        tokens: {
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            tokenType: tokens.tokenType,
            expiresIn: tokens.expiresIn
        },
        loginTime: Date.now(),
        storage: {
            keys: STORAGE_CONFIG.KEYS,
            options: STORAGE_CONFIG.OPTIONS
        }
    };
}

/**
 * 检查 Token 是否需要刷新
 * @param {string} token - 访问令牌
 * @returns {boolean} 是否需要刷新
 */
export function shouldRefreshToken(token) {
    return isTokenExpiringSoon(token, STORAGE_CONFIG.OPTIONS.REFRESH_THRESHOLD);
}

// 导出所有函数
export default {
    extractTokenFromRequest,
    parseCookies,
    setAuthCookies,
    clearAuthCookies,
    authenticateUser,
    withAuth,
    withOptionalAuth,
    generateClientAuthState,
    shouldRefreshToken
};