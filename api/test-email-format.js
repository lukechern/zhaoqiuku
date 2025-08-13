/*
 * ========================================
 * 📧 邮件格式测试 API
 * ========================================
 * 测试邮件发送格式，特别是发件人显示名称
 */

import { EMAIL_SENDER, EMAIL_TEMPLATES, EMAIL_CONFIG } from '../config/emailConfig.js';

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

        // 检查API密钥
        const resendApiKey = process.env.RESEND_API_KEY;
        if (!resendApiKey) {
            console.error('RESEND_API_KEY 环境变量未设置');
            return res.status(500).json({ error: '服务配置错误' });
        }

        // 生成测试验证码
        const testCode = '123456';
        
        // 获取邮件模板
        const template = EMAIL_TEMPLATES.VERIFICATION_CODE;
        const emailHtml = template.getHtml(testCode, email);
        const emailText = template.getText(testCode, email);

        // 测试不同的发件人格式
        const testFormats = [
            {
                name: 'FULL_FROM (推荐)',
                from: EMAIL_SENDER.FULL_FROM,
                description: '包含姓名和邮箱的完整格式'
            },
            {
                name: 'FROM_ONLY',
                from: EMAIL_SENDER.FROM,
                description: '仅邮箱地址'
            },
            {
                name: 'QUOTED_NAME',
                from: `"${EMAIL_SENDER.NAME}" <${EMAIL_SENDER.FROM}>`,
                description: '带引号的姓名格式'
            }
        ];

        // 使用推荐的完整格式
        const emailData = {
            from: EMAIL_SENDER.FULL_FROM,
            to: [email],
            subject: `[测试] ${template.subject}`,
            html: emailHtml,
            text: emailText,
            // 添加额外的发件人信息
            reply_to: EMAIL_SENDER.FULL_FROM
        };

        console.log('邮件发送配置:', {
            from: emailData.from,
            fromName: EMAIL_SENDER.NAME,
            fromEmail: EMAIL_SENDER.FROM,
            fullFrom: EMAIL_SENDER.FULL_FROM
        });

        // 发送测试邮件
        const response = await fetch(EMAIL_CONFIG.RESEND.API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${resendApiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(emailData)
        });

        if (!response.ok) {
            const errorData = await response.text();
            console.error('Resend API 错误:', errorData);
            return res.status(500).json({ 
                error: '发送邮件失败',
                details: errorData
            });
        }

        const result = await response.json();
        console.log('测试邮件发送成功:', result);

        return res.status(200).json({ 
            success: true, 
            message: '测试邮件发送成功',
            emailConfig: {
                fromName: EMAIL_SENDER.NAME,
                fromEmail: EMAIL_SENDER.FROM,
                fullFrom: EMAIL_SENDER.FULL_FROM,
                subject: emailData.subject,
                testFormats: testFormats
            },
            resendResponse: {
                id: result.id,
                from: result.from,
                to: result.to
            },
            troubleshooting: {
                gmailTips: [
                    'Gmail可能需要几分钟来识别发件人姓名',
                    '如果仍然只显示邮箱，请检查垃圾邮件文件夹',
                    '确保域名 mail.zhaoqiuku.com 已在Resend中验证',
                    '某些邮件客户端可能不显示发件人姓名'
                ],
                resendTips: [
                    '在Resend控制台中验证发送域名',
                    '设置SPF、DKIM和DMARC记录',
                    '使用已验证的域名发送邮件'
                ]
            }
        });

    } catch (error) {
        console.error('测试邮件发送错误:', error);
        return res.status(500).json({ 
            error: '服务器内部错误',
            details: error.message
        });
    }
}