/*
 * ========================================
 * 🔍 用户状态调试 API
 * ========================================
 * 用于调试用户在数据库中的状态
 */

import { findUserByEmail } from '../utils/database.js';

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

        if (!email) {
            return res.status(400).json({ error: '邮箱地址不能为空' });
        }

        // 查找用户
        const user = await findUserByEmail(email);

        if (!user) {
            return res.status(404).json({ 
                error: '用户不存在',
                email: email
            });
        }

        // 返回用户状态信息
        return res.status(200).json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                status: user.status,
                isVerified: user.is_verified,
                registeredAt: user.registered_at,
                updatedAt: user.updated_at,
                hasVerificationCode: !!user.verification_code,
                codeExpiresAt: user.code_expires_at
            },
            debug: {
                rawStatus: user.status,
                statusType: typeof user.status,
                isActive: user.status === 'active',
                isPending: user.status === 'pending',
                statusComparison: {
                    'active': user.status === 'active',
                    'pending': user.status === 'pending',
                    'inactive': user.status === 'inactive'
                }
            }
        });

    } catch (error) {
        console.error('调试用户状态错误:', error);
        return res.status(500).json({ 
            error: '服务器内部错误',
            details: error.message
        });
    }
}