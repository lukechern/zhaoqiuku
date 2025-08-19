/*
 * ========================================
 * 🔄 Token 刷新 API
 * ========================================
 * 使用刷新令牌获取新的访问令牌
 */

import { refreshAccessToken } from '../utils/jwt.js';
import { parseCookies } from '../utils/auth.js';
import { COOKIE_CONFIG } from '../config/authConfig.js';

export default async function handler(req, res) {
    // 设置CORS头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // 处理预检请求
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // 只允许POST请求
    if (req.method !== 'POST') {
        return res.status(405).json({ error: '只允许POST请求' });
    }

    try {
        let refreshToken = null;

        // 1. 从请求体获取刷新令牌
        if (req.body && req.body.refreshToken) {
            refreshToken = req.body.refreshToken;
        }

        // 2. 从 Cookie 获取刷新令牌
        if (!refreshToken) {
            const cookies = parseCookies(req.headers.cookie || '');
            refreshToken = cookies[COOKIE_CONFIG.NAMES.REFRESH_TOKEN];
        }

        // 3. 从 Authorization Header 获取
        if (!refreshToken) {
            const authHeader = req.headers.authorization;
            if (authHeader && authHeader.startsWith('Bearer ')) {
                refreshToken = authHeader.substring(7);
            }
        }

        if (!refreshToken) {
            return res.status(400).json({ 
                error: '刷新令牌不能为空',
                code: 'REFRESH_TOKEN_REQUIRED'
            });
        }

        // 刷新访问令牌
        const newTokens = await refreshAccessToken(refreshToken);
        
        if (!newTokens) {
            return res.status(401).json({ 
                error: '刷新令牌无效或已过期',
                code: 'INVALID_REFRESH_TOKEN',
                message: '请重新登录'
            });
        }

        // 更新访问令牌 Cookie
        const cookieOptions = {
            ...COOKIE_CONFIG.OPTIONS,
            secure: process.env.NODE_ENV === 'production'
        };

        res.setHeader('Set-Cookie', 
            `${COOKIE_CONFIG.NAMES.ACCESS_TOKEN}=${newTokens.accessToken}; ` +
            `Max-Age=${Math.floor(newTokens.expiresIn / 1000)}; ` +
            `Path=${cookieOptions.path}; ` +
            `SameSite=${cookieOptions.sameSite}` +
            (cookieOptions.secure ? '; Secure' : '') +
            (cookieOptions.httpOnly ? '; HttpOnly' : '')
        );

        // console.log('访问令牌刷新成功');

        return res.status(200).json({
            success: true,
            message: '令牌刷新成功',
            tokens: {
                accessToken: newTokens.accessToken,
                tokenType: newTokens.tokenType,
                expiresIn: newTokens.expiresIn
            }
        });

    } catch (error) {
        console.error('刷新令牌错误:', error);
        return res.status(500).json({ error: '服务器内部错误' });
    }
}