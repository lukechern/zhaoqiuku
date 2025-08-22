/*
 * ========================================
 * 👤 用户信息 API
 * ========================================
 * 获取当前用户的个人信息
 */

import { withAuth } from '../../utils/auth.js';

async function handler(req, res) {
    // 只允许GET请求
    if (req.method !== 'GET') {
        return res.status(405).json({ error: '只允许GET请求' });
    }

    try {
        // 用户信息已经通过 withAuth 中间件注入到 req.user
        const user = req.user;

        return res.status(200).json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                status: user.status,
                isVerified: user.isVerified,
                registeredAt: user.registeredAt,
                role: user.role
            }
        });

    } catch (error) {
        console.error('获取用户信息错误:', error);
        return res.status(500).json({ error: 'AI开小差了，请稍后重试。' });
    }
}

// 使用认证中间件包装处理函数
export default withAuth(handler);