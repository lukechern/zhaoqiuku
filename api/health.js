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
        
        // 返回健康状态
        return res.status(200).json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            service: 'zhaoqiuku-api',
            version: '1.0.0',
            environment: process.env.NODE_ENV || 'development',
            apiKeyConfigured: hasApiKey
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