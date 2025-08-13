/*
 * ========================================
 * 🔧 修复用户状态 API
 * ========================================
 * 用于修复已验证但状态不正确的用户
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
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: '邮箱地址不能为空' });
        }

        const supabase = await createSupabaseClient();

        // 查找用户
        const { data: user, error: findError } = await supabase
            .from(USERS_TABLE.TABLE_NAME)
            .select('*')
            .eq(USERS_TABLE.COLUMNS.EMAIL, email)
            .single();

        if (findError || !user) {
            return res.status(404).json({ 
                error: '用户不存在',
                email: email
            });
        }

        // 检查用户是否已验证但状态不是active
        if (!user[USERS_TABLE.COLUMNS.IS_VERIFIED]) {
            return res.status(400).json({ 
                error: '用户尚未验证，无法修复状态',
                currentStatus: user[USERS_TABLE.COLUMNS.STATUS],
                isVerified: user[USERS_TABLE.COLUMNS.IS_VERIFIED]
            });
        }

        if (user[USERS_TABLE.COLUMNS.STATUS] === 'active') {
            return res.status(200).json({ 
                success: true,
                message: '用户状态已经是active，无需修复',
                user: {
                    email: user[USERS_TABLE.COLUMNS.EMAIL],
                    status: user[USERS_TABLE.COLUMNS.STATUS],
                    isVerified: user[USERS_TABLE.COLUMNS.IS_VERIFIED]
                }
            });
        }

        // 修复用户状态
        const { data: updatedUser, error: updateError } = await supabase
            .from(USERS_TABLE.TABLE_NAME)
            .update({
                [USERS_TABLE.COLUMNS.STATUS]: 'active'
            })
            .eq(USERS_TABLE.COLUMNS.EMAIL, email)
            .select()
            .single();

        if (updateError) {
            console.error('修复用户状态失败:', updateError);
            return res.status(500).json({ 
                error: '修复用户状态失败',
                details: updateError.message
            });
        }

        console.log(`用户状态修复成功: ${email} -> active`);

        return res.status(200).json({
            success: true,
            message: '用户状态修复成功',
            user: {
                email: updatedUser[USERS_TABLE.COLUMNS.EMAIL],
                status: updatedUser[USERS_TABLE.COLUMNS.STATUS],
                isVerified: updatedUser[USERS_TABLE.COLUMNS.IS_VERIFIED],
                updatedAt: updatedUser[USERS_TABLE.COLUMNS.UPDATED_AT]
            },
            changes: {
                oldStatus: user[USERS_TABLE.COLUMNS.STATUS],
                newStatus: updatedUser[USERS_TABLE.COLUMNS.STATUS]
            }
        });

    } catch (error) {
        console.error('修复用户状态错误:', error);
        return res.status(500).json({ 
            error: '服务器内部错误',
            details: error.message
        });
    }
}