/*
 * ========================================
 * 📧 简单邮件发送测试 API
 * ========================================
 * 直接测试邮件发送功能，排除其他逻辑干扰
 */

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
        const { email, testType = 'default' } = req.body;

        if (!email) {
            return res.status(400).json({ error: '邮箱地址不能为空' });
        }

        // 检查API密钥
        const resendApiKey = process.env.RESEND_API_KEY;
        if (!resendApiKey) {
            console.error('RESEND_API_KEY 环境变量未设置');
            return res.status(500).json({ 
                error: 'RESEND_API_KEY 环境变量未设置',
                debug: {
                    hasApiKey: false,
                    envKeys: Object.keys(process.env).filter(key => key.includes('RESEND'))
                }
            });
        }

        console.log('开始发送测试邮件:', { email, testType, apiKeyLength: resendApiKey.length });

        // 生成测试验证码
        const testCode = Math.floor(100000 + Math.random() * 900000).toString();

        // 根据测试类型选择发件人
        let fromEmail, fromName;
        if (testType === 'custom') {
            fromEmail = 'reg@mail.zhaoqiuku.com';
            fromName = '找秋裤-AI寻物助手';
        } else {
            fromEmail = 'onboarding@resend.dev';
            fromName = '找秋裤-AI寻物助手';
        }

        const fullFrom = `${fromName} <${fromEmail}>`;

        // 简单的邮件内容
        const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>测试邮件</title>
        </head>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>📧 邮件发送测试</h2>
            <p>这是一封测试邮件，用于验证邮件发送功能。</p>
            <div style="background: #f0f8ff; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h3>测试验证码：${testCode}</h3>
            </div>
            <p><strong>测试信息：</strong></p>
            <ul>
                <li>发件人：${fullFrom}</li>
                <li>收件人：${email}</li>
                <li>测试类型：${testType}</li>
                <li>发送时间：${new Date().toLocaleString('zh-CN')}</li>
            </ul>
            <p>如果您收到这封邮件，说明邮件发送功能正常工作。</p>
        </body>
        </html>
        `;

        const emailText = `
邮件发送测试

这是一封测试邮件，用于验证邮件发送功能。

测试验证码：${testCode}

测试信息：
- 发件人：${fullFrom}
- 收件人：${email}
- 测试类型：${testType}
- 发送时间：${new Date().toLocaleString('zh-CN')}

如果您收到这封邮件，说明邮件发送功能正常工作。
        `;

        // 发送邮件
        console.log('准备发送邮件，请求数据:', {
            from: fullFrom,
            to: email,
            subject: '找秋裤-AI寻物助手 - 邮件发送测试'
        });

        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${resendApiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: fullFrom,
                to: [email],
                subject: '找秋裤-AI寻物助手 - 邮件发送测试',
                html: emailHtml,
                text: emailText,
                reply_to: fullFrom
            })
        });

        console.log('Resend API 响应状态:', response.status);

        if (!response.ok) {
            const errorData = await response.text();
            console.error('Resend API 错误响应:', errorData);
            
            let parsedError;
            try {
                parsedError = JSON.parse(errorData);
            } catch (e) {
                parsedError = { message: errorData };
            }

            return res.status(response.status).json({ 
                error: '邮件发送失败',
                resendError: parsedError,
                debug: {
                    status: response.status,
                    from: fullFrom,
                    to: email,
                    apiKeyPrefix: resendApiKey.substring(0, 8) + '...'
                }
            });
        }

        const result = await response.json();
        console.log('邮件发送成功:', result);

        return res.status(200).json({ 
            success: true, 
            message: '测试邮件发送成功',
            emailId: result.id,
            testCode: testCode,
            debug: {
                from: fullFrom,
                to: email,
                testType: testType,
                resendResponse: result
            }
        });

    } catch (error) {
        console.error('发送测试邮件错误:', error);
        return res.status(500).json({ 
            error: '服务器内部错误',
            message: error.message,
            debug: {
                hasApiKey: !!process.env.RESEND_API_KEY
            }
        });
    }
}