/**
 * 更新的环境变量检查API
 * 检查TTS功能所需的环境变量（不再需要AZURE_SPEECH_ENDPOINT）
 */

export default async function handler(req, res) {
    // 只允许GET请求
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // 检查所有必需的环境变量（移除AZURE_SPEECH_ENDPOINT）
        const requiredEnvVars = {
            'GEMINI_API_KEY': process.env.GEMINI_API_KEY,
            'RESEND_API_KEY': process.env.RESEND_API_KEY,
            'SUPABASE_URL': process.env.SUPABASE_URL,
            'SUPABASE_ANON_KEY': process.env.SUPABASE_ANON_KEY,
            'JWT_SECRET': process.env.JWT_SECRET,
            'AZURE_SPEECH_KEY': process.env.AZURE_SPEECH_KEY
        };

        // 检查结果
        const results = {};
        const missing = [];
        const configured = [];

        for (const [key, value] of Object.entries(requiredEnvVars)) {
            if (!value || value.trim() === '') {
                results[key] = { status: 'missing', message: '未配置' };
                missing.push(key);
            } else if (value.includes('your-') || value.includes('your_') || 
                      value === 'configured-via-vercel-env') {
                results[key] = { status: 'placeholder', message: '使用占位符，需要替换为实际值' };
                missing.push(key);
            } else {
                // 隐藏敏感信息，只显示前几位和后几位
                const maskedValue = maskSensitiveValue(value);
                results[key] = { status: 'configured', message: `已配置 (${maskedValue})` };
                configured.push(key);
            }
        }

        // 生成报告
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                total: Object.keys(requiredEnvVars).length,
                configured: configured.length,
                missing: missing.length,
                status: missing.length === 0 ? 'ready' : 'incomplete'
            },
            details: results,
            recommendations: generateRecommendations(missing),
            ttsInfo: {
                message: 'TTS功能现在使用标准终结点格式',
                endpoint: 'https://eastasia.tts.speech.microsoft.com/cognitiveservices/v1',
                note: '不再需要AZURE_SPEECH_ENDPOINT环境变量，终结点根据区域自动构建'
            }
        };

        // 设置响应状态
        const statusCode = missing.length === 0 ? 200 : 400;
        
        res.status(statusCode).json(report);

    } catch (error) {
        console.error('环境变量检查错误:', error);
        res.status(500).json({ 
            error: '环境变量检查失败',
            details: error.message 
        });
    }
}

// 隐藏敏感信息
function maskSensitiveValue(value) {
    if (!value || value.length < 8) {
        return '***';
    }
    
    const start = value.substring(0, 4);
    const end = value.substring(value.length - 4);
    return `${start}...${end}`;
}

// 生成配置建议
function generateRecommendations(missing) {
    if (missing.length === 0) {
        return ['✅ 所有环境变量都已正确配置！'];
    }

    const recommendations = [
        '❌ 以下环境变量需要在Vercel项目设置中配置：'
    ];

    const envVarGuide = {
        'GEMINI_API_KEY': '获取地址: https://makersuite.google.com/app/apikey',
        'RESEND_API_KEY': '获取地址: https://resend.com/api-keys',
        'SUPABASE_URL': '获取地址: Supabase项目设置 → API → Project URL',
        'SUPABASE_ANON_KEY': '获取地址: Supabase项目设置 → API → anon public',
        'JWT_SECRET': '生成方法: openssl rand -base64 32',
        'AZURE_SPEECH_KEY': '获取地址: Azure Portal → Speech Services → Keys and Endpoint'
    };

    missing.forEach(key => {
        const guide = envVarGuide[key] || '请查看部署文档';
        recommendations.push(`  • ${key}: ${guide}`);
    });

    recommendations.push('');
    recommendations.push('📖 详细配置指南: /document/vercel-deployment-guide.md');
    recommendations.push('🔧 配置完成后请重新部署项目');
    recommendations.push('');
    recommendations.push('🔊 TTS功能说明:');
    recommendations.push('  • 不再需要AZURE_SPEECH_ENDPOINT环境变量');
    recommendations.push('  • 终结点会根据区域(eastasia)自动构建');
    recommendations.push('  • 只需要配置AZURE_SPEECH_KEY即可');

    return recommendations;
}