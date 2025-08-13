/*
 * ========================================
 * 📧 发送邮箱验证码 API
 * ========================================
 * 使用 Resend API 发送6位验证码到用户邮箱
 */

import { EMAIL_SENDER, EMAIL_TEMPLATES, EMAIL_CONFIG } from '../config/emailConfig.js';

// 验证码存储（生产环境应使用数据库或Redis）
const verificationCodes = new Map();

// 生成验证码
function generateVerificationCode() {
    const length = EMAIL_CONFIG.VERIFICATION.CODE_LENGTH;
    const min = Math.pow(10, length - 1);
    const max = Math.pow(10, length) - 1;
    return Math.floor(min + Math.random() * (max - min + 1)).toString();
}

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

        // 检查API密钥
        const resendApiKey = process.env.RESEND_API_KEY;
        if (!resendApiKey) {
            console.error('RESEND_API_KEY 环境变量未设置');
            return res.status(500).json({ error: '服务配置错误' });
        }

        // 生成验证码
        const verificationCode = generateVerificationCode();
        
        // 存储验证码
        const codeData = {
            code: verificationCode,
            email: email,
            timestamp: Date.now(),
            expires: Date.now() + EMAIL_CONFIG.VERIFICATION.EXPIRES_IN
        };
        verificationCodes.set(email, codeData);

        // 清理过期的验证码
        for (const [key, value] of verificationCodes.entries()) {
            if (Date.now() > value.expires) {
                verificationCodes.delete(key);
            }
        }

        // 获取邮件模板
        const template = EMAIL_TEMPLATES.VERIFICATION_CODE;
        const emailHtml = template.getHtml(verificationCode, email);
        const emailText = template.getText(verificationCode, email);

        // 发送邮件
        const response = await fetch(EMAIL_CONFIG.RESEND.API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${resendApiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: EMAIL_SENDER.FROM,
                to: [email],
                subject: template.subject,
                html: emailHtml,
                text: emailText
            })
        });

        if (!response.ok) {
            const errorData = await response.text();
            console.error('Resend API 错误:', errorData);
            return res.status(500).json({ error: '发送邮件失败，请稍后重试' });
        }

        const result = await response.json();
        console.log('邮件发送成功:', result);

        return res.status(200).json({ 
            success: true, 
            message: '验证码已发送到您的邮箱',
            emailId: result.id
        });

    } catch (error) {
        console.error('发送验证码错误:', error);
        return res.status(500).json({ error: '服务器内部错误' });
    }
}