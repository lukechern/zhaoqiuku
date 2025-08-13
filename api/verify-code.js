/*
 * ========================================
 * ✅ 验证邮箱验证码 API
 * ========================================
 * 验证用户输入的6位验证码是否正确
 */

import { EMAIL_CONFIG } from '../config/emailConfig.js';
import { verifyUserCode, findUserByEmail } from '../utils/database.js';

// 验证邮箱格式
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// 验证验证码格式
function validateCode(code) {
    const length = EMAIL_CONFIG.VERIFICATION.CODE_LENGTH;
    const regex = new RegExp(`^\\d{${length}}$`);
    return regex.test(code);
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
        const { email, code } = req.body;

        // 验证输入
        if (!email || !code) {
            return res.status(400).json({ error: '邮箱地址和验证码不能为空' });
        }

        if (!validateEmail(email)) {
            return res.status(400).json({ error: '邮箱地址格式不正确' });
        }

        if (!validateCode(code)) {
            return res.status(400).json({ error: `验证码必须是${EMAIL_CONFIG.VERIFICATION.CODE_LENGTH}位数字` });
        }

        // 从数据库验证验证码
        let verifiedUser;
        try {
            verifiedUser = await verifyUserCode(email, code);
        } catch (dbError) {
            console.error('数据库验证失败:', dbError);
            return res.status(500).json({ error: '数据库操作失败，请稍后重试' });
        }

        if (!verifiedUser) {
            return res.status(400).json({ error: '验证码错误、已过期或不存在，请重新获取' });
        }

        console.log(`用户注册成功: ${email}`);

        return res.status(200).json({ 
            success: true, 
            message: '验证成功，注册完成',
            user: {
                id: verifiedUser.id,
                email: verifiedUser.email,
                registeredAt: verifiedUser.registered_at,
                isVerified: verifiedUser.is_verified,
                status: verifiedUser.status
            }
        });

    } catch (error) {
        console.error('验证验证码错误:', error);
        return res.status(500).json({ error: '服务器内部错误' });
    }
}