/*
 * ========================================
 * ✅ 验证邮箱验证码 API
 * ========================================
 * 验证用户输入的6位验证码是否正确
 */

import { EMAIL_CONFIG } from '../config/emailConfig.js';

// 验证码存储（与发送验证码API共享，生产环境应使用数据库或Redis）
const verificationCodes = new Map();

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

        // 查找验证码
        const storedCodeData = verificationCodes.get(email);
        
        if (!storedCodeData) {
            return res.status(400).json({ error: '验证码不存在或已过期，请重新获取' });
        }

        // 检查验证码是否过期
        if (Date.now() > storedCodeData.expires) {
            verificationCodes.delete(email);
            return res.status(400).json({ error: '验证码已过期，请重新获取' });
        }

        // 验证验证码
        if (storedCodeData.code !== code) {
            return res.status(400).json({ error: '验证码错误，请重新输入' });
        }

        // 验证成功，删除验证码
        verificationCodes.delete(email);

        // TODO: 这里应该将用户信息保存到数据库
        // 例如：
        // await saveUserToDatabase({
        //     email: email,
        //     registeredAt: new Date(),
        //     status: 'active'
        // });

        console.log(`用户注册成功: ${email}`);

        return res.status(200).json({ 
            success: true, 
            message: '验证成功，注册完成',
            user: {
                email: email,
                registeredAt: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('验证验证码错误:', error);
        return res.status(500).json({ error: '服务器内部错误' });
    }
}