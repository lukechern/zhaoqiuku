/*
 * ========================================
 * 🔐 用户登录 API
 * ========================================
 * 处理用户登录请求，生成 JWT Token
 */

import { findUserByEmail } from '../utils/database.js';
import { generateAuthTokens } from '../utils/jwt.js';
import { setAuthCookies, generateClientAuthState } from '../utils/auth.js';

// 验证邮箱格式
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

export default async function handler(req, res) {
    // 设置CORS头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // 处理预检请求
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // 只允许POST请求
    if (req.method !== 'POST') {
        return res.status(405).json({ error: '只允许POST请求' });
    }

    try {
        const { email } = req.body;

        // 验证输入
        if (!email) {
            return res.status(400).json({ error: '邮箱地址不能为空' });
        }

        if (!validateEmail(email)) {
            return res.status(400).json({ error: '邮箱地址格式不正确' });
        }

        // 查找用户
        let user;
        try {
            user = await findUserByEmail(email);
        } catch (dbError) {
            console.error('数据库查询失败:', dbError);
            return res.status(500).json({ error: '数据库操作失败，请稍后重试' });
        }

        if (!user) {
            return res.status(404).json({ 
                error: '用户不存在',
                code: 'USER_NOT_FOUND',
                message: '该邮箱地址尚未注册，请先注册'
            });
        }

        // 检查用户状态
        if (!user.is_verified) {
            return res.status(400).json({ 
                error: '用户未验证',
                code: 'USER_NOT_VERIFIED',
                message: '请先完成邮箱验证'
            });
        }

        if (user.status !== 'active') {
            return res.status(400).json({ 
                error: '用户状态异常',
                code: 'USER_INACTIVE',
                message: '账户已被禁用，请联系客服'
            });
        }

        // 生成 JWT Token
        let authTokens;
        try {
            authTokens = await generateAuthTokens(user);
        } catch (tokenError) {
            console.error('生成认证令牌失败:', tokenError);
            return res.status(500).json({ error: '认证令牌生成失败，请稍后重试' });
        }

        // 设置认证 Cookie（适配 WebView）
        setAuthCookies(res, authTokens);

        // 生成前端认证状态
        const clientAuthState = generateClientAuthState(authTokens);

        console.log(`用户登录成功: ${email}`);

        return res.status(200).json({
            success: true,
            message: '登录成功',
            user: authTokens.user,
            auth: clientAuthState,
            tokens: {
                accessToken: authTokens.accessToken,
                refreshToken: authTokens.refreshToken,
                tokenType: authTokens.tokenType,
                expiresIn: authTokens.expiresIn
            }
        });

    } catch (error) {
        console.error('用户登录错误:', error);
        return res.status(500).json({ error: '服务器内部错误' });
    }
}