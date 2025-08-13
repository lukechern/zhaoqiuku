/*
 * ========================================
 * 🚪 用户登出 API
 * ========================================
 * 处理用户登出请求，清除认证状态
 */

import { clearAuthCookies } from '../utils/auth.js';

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
        // 清除认证 Cookie
        clearAuthCookies(res);

        console.log('用户登出成功');

        return res.status(200).json({
            success: true,
            message: '登出成功',
            auth: {
                isAuthenticated: false,
                user: null,
                tokens: null,
                loginTime: null
            }
        });

    } catch (error) {
        console.error('用户登出错误:', error);
        return res.status(500).json({ error: '服务器内部错误' });
    }
}