/*
 * ========================================
 * 🔧 批量修复用户状态 API
 * ========================================
 * 修复所有已验证但状态不是active的用户
 */

import { createSupabaseClient, DATABASE_TABLES } from '../config/databaseConfig.js';

const USERS_TABLE = DATABASE_TABLES.USERS;

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
        const supabase = await createSupabaseClient();

        // 查找所有已验证但状态不是active的用户
        const { data: usersToFix, error: findError } = await supabase
            .from(USERS_TABLE.TABLE_NAME)
            .select('*')
            .eq(USERS_TABLE.COLUMNS.IS_VERIFIED, true)
            .neq(USERS_TABLE.COLUMNS.STATUS, 'active');

        if (findError) {
            console.error('查找用户失败:', findError);
            return res.status(500).json({ 
                error: '查找用户失败',
                details: findError.message
            });
        }

        if (!usersToFix || usersToFix.length === 0) {
            return res.status(200).json({
                success: true,
                message: '没有需要修复的用户',
                fixedCount: 0,
                users: []
            });
        }

        console.log(`找到 ${usersToFix.length} 个需要修复的用户`);

        // 批量更新用户状态
        const { data: updatedUsers, error: updateError } = await supabase
            .from(USERS_TABLE.TABLE_NAME)
            .update({
                [USERS_TABLE.COLUMNS.STATUS]: 'active'
            })
            .eq(USERS_TABLE.COLUMNS.IS_VERIFIED, true)
            .neq(USERS_TABLE.COLUMNS.STATUS, 'active')
            .select();

        if (updateError) {
            console.error('批量更新用户状态失败:', updateError);
            return res.status(500).json({ 
                error: '批量更新用户状态失败',
                details: updateError.message
            });
        }

        const fixedUsers = updatedUsers.map(user => ({
            email: user[USERS_TABLE.COLUMNS.EMAIL],
            oldStatus: usersToFix.find(u => u.id === user.id)?.[USERS_TABLE.COLUMNS.STATUS] || 'unknown',
            newStatus: user[USERS_TABLE.COLUMNS.STATUS]
        }));

        console.log(`成功修复 ${fixedUsers.length} 个用户的状态`);

        return res.status(200).json({
            success: true,
            message: `成功修复 ${fixedUsers.length} 个用户的状态`,
            fixedCount: fixedUsers.length,
            users: fixedUsers
        });

    } catch (error) {
        console.error('批量修复用户状态错误:', error);
        return res.status(500).json({ 
            error: '服务器内部错误',
            details: error.message
        });
    }
}