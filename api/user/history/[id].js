/*
 * ========================================
 * 🗑️ 删除历史记录 API
 * ========================================
 * 处理单个历史记录的删除操作
 */

import { createSupabaseClient } from '../../../config/databaseConfig.js';
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
 * 用户身份验证
 */
function authenticateUser_7ree(req) {
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
 * 删除历史记录处理器
 */
export default async function handler(req, res) {
    // 设置CORS头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'DELETE') {
        return res.status(405).json({
            success: false,
            error: '方法不允许'
        });
    }

    try {
        // 验证用户身份
        const authResult = authenticateUser_7ree(req);
        if (!authResult.success) {
            return res.status(401).json(authResult);
        }

        const userId = authResult.userId;
        const recordId = req.query.id;
        
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
            console.error('删除记录失败:', deleteError);
            return res.status(500).json({
                success: false,
                error: '删除记录失败'
            });
        }

        return res.status(200).json({
            success: true,
            message: '记录删除成功',
            deletedId: recordId
        });

    } catch (error) {
        console.error('删除记录时发生错误:', error);
        return res.status(500).json({
            success: false,
            error: 'AI开小差了，请稍后重试。'
        });
    }
}