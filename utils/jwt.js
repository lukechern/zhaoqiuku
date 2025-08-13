/*
 * ========================================
 * 🔐 JWT 工具函数
 * ========================================
 * 处理 JWT Token 的生成、验证和解析
 */

import { JWT_CONFIG, getTokenExpirationMs } from '../config/authConfig.js';

// 简单的 Base64 编码/解码（避免引入额外依赖）
const base64UrlEncode = (str) => {
    return Buffer.from(str)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
};

const base64UrlDecode = (str) => {
    str += new Array(5 - str.length % 4).join('=');
    return Buffer.from(str.replace(/\-/g, '+').replace(/_/g, '/'), 'base64').toString();
};

// HMAC SHA256 签名（使用 Node.js 内置 crypto）
const hmacSha256 = async (data, secret) => {
    const crypto = await import('crypto');
    return crypto.createHmac('sha256', secret).update(data).digest('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
};

/**
 * 生成 JWT Token
 * @param {Object} payload - Token 载荷
 * @param {string} tokenType - Token 类型 ('access' | 'refresh')
 * @param {string} secret - JWT 密钥
 * @returns {Promise<string>} JWT Token
 */
export async function generateToken(payload, tokenType = JWT_CONFIG.TOKEN_TYPES.ACCESS, secret = JWT_CONFIG.SECRET) {
    try {
        const now = Math.floor(Date.now() / 1000);
        const expirationMs = getTokenExpirationMs(tokenType);
        const exp = now + Math.floor(expirationMs / 1000);

        // JWT Header
        const header = {
            alg: JWT_CONFIG.ALGORITHM,
            typ: 'JWT'
        };

        // JWT Payload
        const jwtPayload = {
            ...payload,
            iss: JWT_CONFIG.ISSUER,
            aud: JWT_CONFIG.AUDIENCE,
            iat: now,
            exp: exp,
            type: tokenType
        };

        // 编码 Header 和 Payload
        const encodedHeader = base64UrlEncode(JSON.stringify(header));
        const encodedPayload = base64UrlEncode(JSON.stringify(jwtPayload));

        // 生成签名
        const signature = await hmacSha256(`${encodedHeader}.${encodedPayload}`, secret);

        // 组合 JWT
        const token = `${encodedHeader}.${encodedPayload}.${signature}`;

        console.log(`JWT Token 生成成功 (${tokenType}):`, {
            userId: payload.userId,
            email: payload.email,
            expiresAt: new Date(exp * 1000).toISOString()
        });

        return token;
    } catch (error) {
        console.error('生成 JWT Token 失败:', error);
        throw new Error('Token 生成失败');
    }
}

/**
 * 验证 JWT Token
 * @param {string} token - JWT Token
 * @param {string} secret - JWT 密钥
 * @returns {Promise<Object|null>} 解析后的载荷或 null
 */
export async function verifyToken(token, secret = JWT_CONFIG.SECRET) {
    try {
        if (!token || typeof token !== 'string') {
            return null;
        }

        const parts = token.split('.');
        if (parts.length !== 3) {
            console.log('JWT Token 格式错误');
            return null;
        }

        const [encodedHeader, encodedPayload, signature] = parts;

        // 验证签名
        const expectedSignature = await hmacSha256(`${encodedHeader}.${encodedPayload}`, secret);
        if (signature !== expectedSignature) {
            console.log('JWT Token 签名验证失败');
            return null;
        }

        // 解析载荷
        const payload = JSON.parse(base64UrlDecode(encodedPayload));

        // 检查过期时间
        const now = Math.floor(Date.now() / 1000);
        if (payload.exp && payload.exp < now) {
            console.log('JWT Token 已过期:', {
                exp: new Date(payload.exp * 1000).toISOString(),
                now: new Date(now * 1000).toISOString()
            });
            return null;
        }

        // 检查发行者和受众
        if (payload.iss !== JWT_CONFIG.ISSUER || payload.aud !== JWT_CONFIG.AUDIENCE) {
            console.log('JWT Token 发行者或受众不匹配');
            return null;
        }

        return payload;
    } catch (error) {
        console.error('验证 JWT Token 失败:', error);
        return null;
    }
}

/**
 * 解析 JWT Token（不验证签名）
 * @param {string} token - JWT Token
 * @returns {Object|null} 解析后的载荷或 null
 */
export function parseToken(token) {
    try {
        if (!token || typeof token !== 'string') {
            return null;
        }

        const parts = token.split('.');
        if (parts.length !== 3) {
            return null;
        }

        const payload = JSON.parse(base64UrlDecode(parts[1]));
        return payload;
    } catch (error) {
        console.error('解析 JWT Token 失败:', error);
        return null;
    }
}

/**
 * 检查 Token 是否即将过期
 * @param {string} token - JWT Token
 * @param {number} thresholdMs - 阈值（毫秒）
 * @returns {boolean} 是否即将过期
 */
export function isTokenExpiringSoon(token, thresholdMs = 24 * 60 * 60 * 1000) {
    try {
        const payload = parseToken(token);
        if (!payload || !payload.exp) {
            return true;
        }

        const now = Date.now();
        const expiration = payload.exp * 1000;
        const timeUntilExpiration = expiration - now;

        return timeUntilExpiration < thresholdMs;
    } catch (error) {
        console.error('检查 Token 过期时间失败:', error);
        return true;
    }
}

/**
 * 生成用户认证 Token 对
 * @param {Object} user - 用户信息
 * @returns {Promise<Object>} Token 对象
 */
export async function generateAuthTokens(user) {
    try {
        const payload = {
            userId: user.id,
            email: user.email,
            status: user.status,
            isVerified: user.is_verified,
            role: user.role || 'user'
        };

        const [accessToken, refreshToken] = await Promise.all([
            generateToken(payload, JWT_CONFIG.TOKEN_TYPES.ACCESS),
            generateToken(payload, JWT_CONFIG.TOKEN_TYPES.REFRESH)
        ]);

        return {
            accessToken,
            refreshToken,
            tokenType: 'Bearer',
            expiresIn: getTokenExpirationMs(JWT_CONFIG.TOKEN_TYPES.ACCESS),
            user: {
                id: user.id,
                email: user.email,
                status: user.status,
                isVerified: user.is_verified,
                registeredAt: user.registered_at
            }
        };
    } catch (error) {
        console.error('生成认证 Token 失败:', error);
        throw error;
    }
}

/**
 * 刷新访问令牌
 * @param {string} refreshToken - 刷新令牌
 * @returns {Promise<Object|null>} 新的 Token 对象或 null
 */
export async function refreshAccessToken(refreshToken) {
    try {
        const payload = await verifyToken(refreshToken);
        if (!payload || payload.type !== JWT_CONFIG.TOKEN_TYPES.REFRESH) {
            console.log('刷新令牌无效或类型错误');
            return null;
        }

        // 生成新的访问令牌
        const newPayload = {
            userId: payload.userId,
            email: payload.email,
            status: payload.status,
            isVerified: payload.isVerified,
            role: payload.role
        };

        const newAccessToken = await generateToken(newPayload, JWT_CONFIG.TOKEN_TYPES.ACCESS);

        return {
            accessToken: newAccessToken,
            tokenType: 'Bearer',
            expiresIn: getTokenExpirationMs(JWT_CONFIG.TOKEN_TYPES.ACCESS)
        };
    } catch (error) {
        console.error('刷新访问令牌失败:', error);
        return null;
    }
}

// 导出所有函数
export default {
    generateToken,
    verifyToken,
    parseToken,
    isTokenExpiringSoon,
    generateAuthTokens,
    refreshAccessToken
};