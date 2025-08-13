/*
 * ========================================
 * 🔍 Resend 配置测试 API
 * ========================================
 * 测试 Resend API 配置和域名验证状态
 */

export default async function handler(req, res) {
    // 设置CORS头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // 处理预检请求
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // 只允许GET请求
    if (req.method !== 'GET') {
        return res.status(405).json({ error: '只允许GET请求' });
    }

    try {
        // 检查API密钥
        const resendApiKey = process.env.RESEND_API_KEY;
        if (!resendApiKey) {
            return res.status(500).json({ 
                error: 'RESEND_API_KEY 环境变量未设置',
                hasApiKey: false
            });
        }

        // 测试 API 连接 - 获取域名列表
        const domainsResponse = await fetch('https://api.resend.com/domains', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${resendApiKey}`,
                'Content-Type': 'application/json',
            }
        });

        let domainsData = null;
        if (domainsResponse.ok) {
            domainsData = await domainsResponse.json();
        } else {
            const errorText = await domainsResponse.text();
            console.error('获取域名列表失败:', errorText);
        }

        // 发送一封测试邮件到 Resend 的测试地址
        const testEmailResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${resendApiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: 'onboarding@resend.dev', // 使用 Resend 的默认测试域名
                to: ['delivered@resend.dev'], // Resend 的测试收件地址
                subject: 'Resend API 连接测试',
                html: '<p>这是一封测试邮件，用于验证 Resend API 配置是否正确。</p>',
                text: '这是一封测试邮件，用于验证 Resend API 配置是否正确。'
            })
        });

        let testEmailResult = null;
        let testEmailError = null;
        
        if (testEmailResponse.ok) {
            testEmailResult = await testEmailResponse.json();
        } else {
            testEmailError = await testEmailResponse.text();
        }

        // 返回测试结果
        return res.status(200).json({
            success: true,
            hasApiKey: true,
            apiKeyLength: resendApiKey.length,
            apiKeyPrefix: resendApiKey.substring(0, 8) + '...',
            domains: domainsData,
            testEmail: {
                success: testEmailResponse.ok,
                status: testEmailResponse.status,
                result: testEmailResult,
                error: testEmailError
            },
            recommendations: [
                '1. 确保在 Resend 控制台中添加并验证了自定义域名 mail.zhaoqiuku.com',
                '2. 检查域名的 DNS 记录是否正确配置',
                '3. 如果使用自定义域名，确保 SPF、DKIM 记录已正确设置',
                '4. 可以先使用 onboarding@resend.dev 作为发件人进行测试',
                '5. 检查 Resend 账户的发送额度和状态'
            ]
        });

    } catch (error) {
        console.error('Resend 配置测试错误:', error);
        return res.status(500).json({ 
            error: '测试失败',
            message: error.message,
            hasApiKey: !!process.env.RESEND_API_KEY
        });
    }
}