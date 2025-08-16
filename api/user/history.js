/*
 * ========================================
 * 📋 用户历史记录 API
 * ========================================
 * 处理用户物品存储历史记录的查询
 */

import { createSupabaseClient } from '../../config/databaseConfig.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const ITEMS_TABLE = 'items';

/**
 * 验证JWT Token
 */
function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
}

/**
 * 获取用户历史记录
 */
export default async function handler(req, res) {
    // 设置CORS头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method === 'GET') {
        return await handleGetHistory(req, res);
    } else if (req.method === 'DELETE') {
        return await handleDeleteRecord_7ree(req, res);
    } else {
        return res.status(405).json({
            success: false,
            error: '方法不允许'
        });
    }

}

/**
 * 处理获取历史记录请求
 */
async function handleGetHistory(req, res) {
    try {
        // 验证用户身份
        const authResult = await authenticateUser_7ree(req);
        if (!authResult.success) {
            return res.status(401).json(authResult);
        }

        const userId = authResult.userId;

        // 获取分页参数
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

        const supabase = await createSupabaseClient();

        // 获取总记录数
        const { count, error: countError } = await supabase
            .from(ITEMS_TABLE)
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId);

        if (countError) {
            return res.status(500).json({
                success: false,
                error: '查询记录总数失败'
            });
        }

        // 获取分页数据
        const { data, error } = await supabase
            .from(ITEMS_TABLE)
            .select('*')
            .eq('user_id', userId)
            .order('operation_time', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) {
            return res.status(500).json({
                success: false,
                error: '查询历史记录失败'
            });
        }

        // 格式化数据
        const formattedData = data.map(item => ({
            id: item.id,
            itemName: item.item_name,
            itemType: item.item_type,
            location: item.location,
            operationTime: item.operation_time,
            transcript: item.transcript,
            createdAt: item.created_at,
            // 格式化时间显示
            formattedTime: new Date(item.operation_time * 1000).toLocaleString('zh-CN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            }),
            // 相对时间
            relativeTime: getRelativeTime(item.operation_time * 1000)
        }));

        const totalPages = Math.ceil(count / limit);
        const hasMore = page < totalPages;

        return res.status(200).json({
            success: true,
            data: {
                records: formattedData,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalRecords: count,
                    hasMore,
                    limit
                }
            }
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            error: '服务器内部错误'
        });
    }
}

/**
 * 处理删除记录请求
 */
async function handleDeleteRecord_7ree(req, res) {
    try {
        // 验证用户身份
        const authResult = await authenticateUser_7ree(req);
        if (!authResult.success) {
            return res.status(401).json(authResult);
        }

        const userId = authResult.userId;

        // 从URL路径中提取记录ID
        const recordId = req.query.id || extractRecordIdFromPath_7ree(req.url);
        
        if (!recordId) {
            return res.status(400).json({
                success: false,
                error: '缺少记录ID参数'
            });
        }

        const supabase = await createSupabaseClient();

        // 首先验证记录是否属于当前用户
        const { data: existingRecord, error: fetchError } = await supabase
            .from(ITEMS_TABLE)
            .select('id, user_id')
            .eq('id', recordId)
            .eq('user_id', userId)
            .single();

        if (fetchError || !existingRecord) {
            return res.status(404).json({
                success: false,
                error: '记录不存在或无权限删除'
            });
        }

        // 执行删除操作
        const { error: deleteError } = await supabase
            .from(ITEMS_TABLE)
            .delete()
            .eq('id', recordId)
            .eq('user_id', userId);

        if (deleteError) {
            return res.status(500).json({
                success: false,
                error: '删除记录失败'
            });
        }

        return res.status(200).json({
            success: true,
            message: '记录删除成功'
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            error: '服务器内部错误'
        });
    }
}

/**
 * 用户身份验证
 */
async function authenticateUser_7ree(req) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return {
            success: false,
            error: '未提供有效的认证令牌'
        };
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    if (!decoded || !decoded.userId) {
        return {
            success: false,
            error: '认证令牌无效或已过期'
        };
    }

    return {
        success: true,
        userId: decoded.userId
    };
}

/**
 * 从URL路径中提取记录ID
 */
function extractRecordIdFromPath_7ree(url) {
    // 处理类似 /api/user/history/123 的URL
    const pathParts = url.split('/');
    const historyIndex = pathParts.indexOf('history');
    if (historyIndex !== -1 && historyIndex < pathParts.length - 1) {
        return pathParts[historyIndex + 1].split('?')[0]; // 移除查询参数
    }
    return null;
}

/**
 * 获取相对时间描述
 */
function getRelativeTime(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;

    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;
    const week = 7 * day;
    const month = 30 * day;

    if (diff < minute) {
        return '刚刚';
    } else if (diff < hour) {
        return `${Math.floor(diff / minute)}分钟前`;
    } else if (diff < day) {
        return `${Math.floor(diff / hour)}小时前`;
    } else if (diff < week) {
        return `${Math.floor(diff / day)}天前`;
    } else if (diff < month) {
        return `${Math.floor(diff / week)}周前`;
    } else {
        return `${Math.floor(diff / month)}个月前`;
    }
}