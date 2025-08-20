/*
 * ========================================
 * 🔐 统一认证 API
 * ========================================
 * 合并注册和登录流程的统一认证接口
 */

import { EMAIL_SENDER, EMAIL_TEMPLATES, EMAIL_CONFIG } from '../config/emailConfig.js';
import { findUserByEmail, upsertUserVerificationCode, verifyUserCode, cleanupExpiredCodes } from '../utils/database.js';
import { generateAuthTokens } from '../utils/jwt.js';
import { setAuthCookies, generateClientAuthState } from '../utils/auth.js';
import { INVITATION_CONFIG_7ree, validateInvitation_7ree } from '../config/invitationConfig.js';

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

// 发送验证码
async function handleSendCode(email, res, invitation_7ree) {
    try {
        // 邀请码校验（启用时）
        if (INVITATION_CONFIG_7ree?.ENABLED) {
            if (!validateInvitation_7ree(invitation_7ree)) {
                return res.status(400).json({ error: '邀请码无效或已过期，请检查后重试' });
            }
        }
        // 检查用户是否存在
        const existingUser = await findUserByEmail(email);
        const userType = existingUser ? 'existing' : 'new';
        
        console.log(`用户类型: ${userType}, 邮箱: ${email}`);

        // 检查API密钥
        const resendApiKey = process.env.RESEND_API_KEY;
        if (!resendApiKey) {
            console.error('RESEND_API_KEY 环境变量未设置');
            return res.status(500).json({ error: '服务配置错误' });
        }

        // 生成验证码
        const verificationCode = generateVerificationCode();
        
        // 计算过期时间
        const expiresAt = new Date(Date.now() + EMAIL_CONFIG.VERIFICATION.EXPIRES_IN);
        
        // 保存到数据库
        try {
            await upsertUserVerificationCode(email, verificationCode, expiresAt);
            console.log('验证码已保存到数据库:', { email, code: verificationCode, expiresAt });
        } catch (dbError) {
            console.error('数据库操作失败:', dbError);
            return res.status(500).json({ error: '数据库操作失败，请稍后重试' });
        }

        // 清理过期的验证码（异步执行，不影响主流程）
        cleanupExpiredCodes().catch(error => {
            console.error('清理过期验证码失败:', error);
        });

        // 获取邮件模板
        const template = EMAIL_TEMPLATES.VERIFICATION_CODE;
        const emailHtml = template.getHtml(verificationCode, email);
        const emailText = template.getText(verificationCode, email);

        // 根据用户类型自定义邮件内容
        let customSubject = template.subject;
        if (userType === 'new') {
            customSubject = 'AI语音寻物助手 - 欢迎注册验证码';
        } else {
            customSubject = 'AI语音寻物助手 - 登录验证码';
        }

        // 发送邮件
        const response = await fetch(EMAIL_CONFIG.RESEND.API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${resendApiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: EMAIL_SENDER.FULL_FROM,
                to: [email],
                subject: customSubject,
                html: emailHtml,
                text: emailText,
                reply_to: EMAIL_SENDER.FULL_FROM
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
            userType: userType,
            emailId: result.id
        });

    } catch (error) {
        console.error('发送验证码错误:', error);
        return res.status(500).json({ error: '服务器内部错误' });
    }
}

// 验证验证码
async function handleVerifyCode(email, code, res) {
    try {
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

        // 判断用户类型（基于是否是首次验证）
        const userType = verifiedUser.is_verified && verifiedUser.registered_at ? 'existing' : 'new';

        // 生成 JWT Token
        let authTokens;
        try {
            authTokens = await generateAuthTokens(verifiedUser);
        } catch (tokenError) {
            console.error('生成认证令牌失败:', tokenError);
            return res.status(500).json({ error: '认证令牌生成失败，请稍后重试' });
        }

        // 设置认证 Cookie（适配 WebView）
        setAuthCookies(res, authTokens);

        // 生成前端认证状态
        const clientAuthState = generateClientAuthState(authTokens);

        console.log(`用户认证成功: ${email} (${userType})`);

        return res.status(200).json({ 
            success: true, 
            message: userType === 'new' ? '注册成功，欢迎使用' : '登录成功，欢迎回来',
            userType: userType,
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
        console.error('验证验证码错误:', error);
        return res.status(500).json({ error: '服务器内部错误' });
    }
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
        const { action, email, code, invitation_7ree } = req.body;

        // 验证输入
        if (!action) {
            return res.status(400).json({ error: '操作类型不能为空' });
        }

        if (!email) {
            return res.status(400).json({ error: '邮箱地址不能为空' });
        }

        if (!validateEmail(email)) {
            return res.status(400).json({ error: '邮箱地址格式不正确' });
        }

        // 根据操作类型处理请求
        if (action === 'send_code') {
            return await handleSendCode(email, res, invitation_7ree);
        } else if (action === 'verify_code') {
            if (!code) {
                return res.status(400).json({ error: '验证码不能为空' });
            }
            return await handleVerifyCode(email, code, res);
        } else {
            return res.status(400).json({ error: '不支持的操作类型' });
        }

    } catch (error) {
        console.error('统一认证API错误:', error);
        return res.status(500).json({ error: '服务器内部错误' });
    }
}