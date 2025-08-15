// Vercel Serverless API - 健康检查服务
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
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // 检查环境变量
        const hasApiKey = !!process.env.GEMINI_API_KEY;
        const hasResendKey = !!process.env.RESEND_API_KEY;
        const hasSupabaseUrl = !!process.env.SUPABASE_URL;
        const hasSupabaseKey = !!process.env.SUPABASE_ANON_KEY;
        const hasJwtSecret = !!process.env.JWT_SECRET;
        const hasAzureTtsKey = !!process.env.AZURE_SPEECH_KEY;
        
        // 计算配置完整度
        const totalConfigs = 6;
        const configuredCount = [hasApiKey, hasResendKey, hasSupabaseUrl, hasSupabaseKey, hasJwtSecret, hasAzureTtsKey].filter(Boolean).length;
        const configurationComplete = configuredCount === totalConfigs;
        
        // 返回健康状态
        return res.status(200).json({
            status: configurationComplete ? 'healthy' : 'partial',
            timestamp: new Date().toISOString(),
            service: 'zhaoqiuku-api',
            version: '2.0.0',
            environment: process.env.NODE_ENV || 'development',
            configuration: {
                complete: configurationComplete,
                configured: configuredCount,
                total: totalConfigs,
                services: {
                    geminiApi: hasApiKey,
                    resendEmail: hasResendKey,
                    supabaseDb: hasSupabaseUrl && hasSupabaseKey,
                    jwtAuth: hasJwtSecret,
                    azureTts: hasAzureTtsKey
                }
            }
        });

    } catch (error) {
        console.error('健康检查失败:', error);
        return res.status(500).json({
            status: 'unhealthy',
            error: 'Internal server error',
            timestamp: new Date().toISOString()
        });
    }
}