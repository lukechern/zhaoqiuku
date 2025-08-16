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
        console.log('验证JWT Token:', token.substring(0, 20) + '...');
        console.log('JWT_SECRET存在:', !!JWT_SECRET);
        const decoded = jwt.verify(token, JWT_SECRET);
        console.log('JWT验证成功:', decoded);
        return decoded;
    } catch (error) {
        console.error('JWT验证失败:', error.message);
        return null;
    }
}

/**
 * 获取用户历史记录
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
        console.log('=== 历史记录API请求开始 ===');
        console.log('请求方法:', req.method);
        console.log('请求头:', req.headers);
        console.log('查询参数:', req.query);

        // 验证用户身份
        const authHeader = req.headers.authorization;
        console.log('认证头:', authHeader ? authHeader.substring(0, 20) + '...' : '无');

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.log('认证失败: 未提供有效的认证令牌');
            return res.status(401).json({
                success: false,
                error: '未提供有效的认证令牌'
            });
        }

        const token = authHeader.substring(7);
        const decoded = verifyToken(token);

        if (!decoded || !decoded.userId) {
            console.log('认证失败: 令牌无效或已过期');
            return res.status(401).json({
                success: false,
                error: '认证令牌无效或已过期'
            });
        }

        const userId = decoded.userId;
        console.log('用户ID:', userId);

        // 获取分页参数
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

        console.log('获取用户历史记录:', {
            userId,
            page,
            limit,
            offset
        });

        const supabase = await createSupabaseClient();

        // 获取总记录数
        const { count, error: countError } = await supabase
            .from(ITEMS_TABLE)
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId);

        if (countError) {
            console.error('获取记录总数失败:', countError);
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
            console.error('获取历史记录失败:', error);
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

        console.log('历史记录查询成功:', {
            total: count,
            currentPage: page,
            totalPages,
            hasMore,
            recordsReturned: formattedData.length
        });

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
        console.error('处理历史记录请求时出错:', error);
        return res.status(500).json({
            success: false,
            error: '服务器内部错误'
        });
    }
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