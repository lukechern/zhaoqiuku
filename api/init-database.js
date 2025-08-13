/*
 * ========================================
 * 🗄️ 数据库初始化 API
 * ========================================
 * 用于初始化数据库表结构（仅用于开发和测试）
 */

import { createSupabaseClient, SQL_QUERIES } from '../config/databaseConfig.js';
import { getUserStats } from '../utils/database.js';

export default async function handler(req, res) {
    // 设置CORS头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // 处理预检请求
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        // 检查数据库连接
        const supabase = await createSupabaseClient();
        
        if (req.method === 'GET') {
            // 获取数据库状态和统计信息
            try {
                const stats = await getUserStats();
                
                return res.status(200).json({
                    success: true,
                    message: '数据库连接正常',
                    database: {
                        connected: true,
                        url: process.env.SUPABASE_URL ? '已配置' : '未配置',
                        apiKey: process.env.SUPABASE_ANON_KEY ? '已配置' : '未配置'
                    },
                    stats: stats,
                    tableStructure: {
                        tableName: 'users',
                        columns: [
                            'id (UUID, Primary Key)',
                            'email (VARCHAR, Unique)',
                            'verification_code (VARCHAR)',
                            'code_expires_at (TIMESTAMP)',
                            'is_verified (BOOLEAN)',
                            'registered_at (TIMESTAMP)',
                            'updated_at (TIMESTAMP)',
                            'status (VARCHAR)'
                        ]
                    }
                });
            } catch (error) {
                return res.status(500).json({
                    success: false,
                    message: '数据库连接失败',
                    error: error.message,
                    database: {
                        connected: false,
                        url: process.env.SUPABASE_URL ? '已配置' : '未配置',
                        apiKey: process.env.SUPABASE_ANON_KEY ? '已配置' : '未配置'
                    }
                });
            }
        }

        if (req.method === 'POST') {
            // 检查表是否存在
            const { data: tables, error: tableError } = await supabase
                .from('information_schema.tables')
                .select('table_name')
                .eq('table_schema', 'public')
                .eq('table_name', 'users');

            if (tableError) {
                console.error('检查表结构错误:', tableError);
                return res.status(500).json({
                    success: false,
                    message: '检查表结构失败',
                    error: tableError.message
                });
            }

            const tableExists = tables && tables.length > 0;

            return res.status(200).json({
                success: true,
                message: tableExists ? '用户表已存在' : '用户表不存在',
                tableExists: tableExists,
                sqlQuery: SQL_QUERIES.CREATE_USERS_TABLE,
                instructions: tableExists ? 
                    '表已存在，可以正常使用注册功能' : 
                    '请在 Supabase 控制台的 SQL Editor 中执行上述 SQL 语句创建表'
            });
        }

        return res.status(405).json({ error: '只支持 GET 和 POST 请求' });

    } catch (error) {
        console.error('数据库初始化错误:', error);
        return res.status(500).json({
            success: false,
            message: '数据库操作失败',
            error: error.message,
            troubleshooting: [
                '检查 SUPABASE_URL 环境变量是否正确设置',
                '检查 SUPABASE_ANON_KEY 环境变量是否正确设置',
                '确认 Supabase 项目状态正常',
                '检查网络连接'
            ]
        });
    }
}