/*
 * ========================================
 * 📧 发送邮箱验证码 API
 * ========================================
 * 使用 Resend API 发送6位验证码到用户邮箱
 */

// 验证码存储（生产环境应使用数据库或Redis）
const verificationCodes = new Map();

// 生成6位随机验证码
function generateVerificationCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// 验证邮箱格式
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// 邮件模板
function getEmailTemplate(code) {
    return {
        subject: '语音识别助手 - 邮箱验证码',
        html: `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { text-align: center; margin-bottom: 30px; }
                .code-box { 
                    background: #f8f9fa; 
                    border: 2px solid #007AFF; 
                    border-radius: 8px; 
                    padding: 20px; 
                    text-align: center; 
                    margin: 20px 0; 
                }
                .code { 
                    font-size: 32px; 
                    font-weight: bold; 
                    color: #007AFF; 
                    letter-spacing: 4px; 
                }
                .footer { color: #666; font-size: 14px; margin-top: 30px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>语音识别助手</h1>
                    <h2>邮箱验证码</h2>
                </div>
                
                <p>您好！</p>
                <p>感谢您注册语音识别助手。请使用以下验证码完成注册：</p>
                
                <div class="code-box">
                    <div class="code">${code}</div>
                </div>
                
                <p><strong>注意事项：</strong></p>
                <ul>
                    <li>验证码有效期为10分钟</li>
                    <li>请勿将验证码告诉他人</li>
                    <li>如果您没有申请此验证码，请忽略此邮件</li>
                </ul>
                
                <div class="footer">
                    <p>此邮件由系统自动发送，请勿回复。</p>
                    <p>© 2025 语音识别助手</p>
                </div>
            </div>
        </body>
        </html>
        `,
        text: `
        语音识别助手 - 邮箱验证码
        
        您好！
        
        感谢您注册语音识别助手。您的验证码是：${code}
        
        注意事项：
        - 验证码有效期为10分钟
        - 请勿将验证码告诉他人
        - 如果您没有申请此验证码，请忽略此邮件
        
        此邮件由系统自动发送，请勿回复。
        © 2025 语音识别助手
        `
    };
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
        
        // 存储验证码（10分钟有效期）
        const codeData = {
            code: verificationCode,
            email: email,
            timestamp: Date.now(),
            expires: Date.now() + 10 * 60 * 1000 // 10分钟
        };
        verificationCodes.set(email, codeData);

        // 清理过期的验证码
        for (const [key, value] of verificationCodes.entries()) {
            if (Date.now() > value.expires) {
                verificationCodes.delete(key);
            }
        }

        // 获取邮件模板
        const emailTemplate = getEmailTemplate(verificationCode);

        // 发送邮件
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${resendApiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: 'noreply@resend.dev', // 使用Resend的默认发送域名
                to: [email],
                subject: emailTemplate.subject,
                html: emailTemplate.html,
                text: emailTemplate.text
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