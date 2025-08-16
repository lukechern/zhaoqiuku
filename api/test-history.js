/*
 * ========================================
 * 🧪 历史记录测试API
 * ========================================
 * 用于测试历史记录功能的简化API
 */

export default async function handler(req, res) {
    // 设置CORS头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({
            success: false,
            error: '方法不允许'
        });
    }

    try {
        console.log('=== 测试历史记录API ===');
        console.log('请求头:', req.headers);
        console.log('查询参数:', req.query);

        // 检查认证头
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.log('认证失败: 未提供认证令牌');
            return res.status(401).json({
                success: false,
                error: '未提供有效的认证令牌',
                debug: {
                    authHeader: authHeader || '无',
                    timestamp: new Date().toISOString()
                }
            });
        }

        // 模拟数据
        const mockRecords = [
            {
                id: 'test-1',
                itemName: '秋裤',
                itemType: '衣物',
                location: '衣柜',
                operationTime: Math.floor(Date.now() / 1000) - 3600,
                transcript: '我把秋裤放在衣柜里了',
                formattedTime: new Date(Date.now() - 3600000).toLocaleString('zh-CN'),
                relativeTime: '1小时前'
            },
            {
                id: 'test-2',
                itemName: '钥匙',
                itemType: '日常用品',
                location: '桌子上',
                operationTime: Math.floor(Date.now() / 1000) - 7200,
                transcript: '钥匙放在桌子上了',
                formattedTime: new Date(Date.now() - 7200000).toLocaleString('zh-CN'),
                relativeTime: '2小时前'
            }
        ];

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;

        console.log('返回测试数据:', {
            recordsCount: mockRecords.length,
            page,
            limit
        });

        return res.status(200).json({
            success: true,
            data: {
                records: mockRecords,
                pagination: {
                    currentPage: page,
                    totalPages: 1,
                    totalRecords: mockRecords.length,
                    hasMore: false,
                    limit
                }
            },
            debug: {
                timestamp: new Date().toISOString(),
                authHeader: authHeader.substring(0, 20) + '...',
                query: req.query
            }
        });

    } catch (error) {
        console.error('测试API错误:', error);
        return res.status(500).json({
            success: false,
            error: '服务器内部错误',
            debug: {
                message: error.message,
                timestamp: new Date().toISOString()
            }
        });
    }
}