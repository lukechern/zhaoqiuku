/*
 * ========================================
 * 🗄️ 数据库操作工具
 * ========================================
 * 封装 Supabase 数据库操作的工具函数
 */

import { createSupabaseClient, DATABASE_TABLES } from '../config/databaseConfig.js';

// 获取用户表配置
const USERS_TABLE = DATABASE_TABLES.USERS;

/**
 * 创建或更新用户验证码
 * @param {string} email - 用户邮箱
 * @param {string} verificationCode - 验证码
 * @param {Date} expiresAt - 过期时间
 * @returns {Promise<Object>} 用户数据
 */
export async function upsertUserVerificationCode(email, verificationCode, expiresAt) {
    try {
        const supabase = await createSupabaseClient();

        const { data, error } = await supabase
            .from(USERS_TABLE.TABLE_NAME)
            .upsert({
                [USERS_TABLE.COLUMNS.EMAIL]: email,
                [USERS_TABLE.COLUMNS.VERIFICATION_CODE]: verificationCode,
                [USERS_TABLE.COLUMNS.CODE_EXPIRES_AT]: expiresAt.toISOString(),
                [USERS_TABLE.COLUMNS.STATUS]: 'pending'
            }, {
                onConflict: USERS_TABLE.COLUMNS.EMAIL
            })
            .select()
            .single();

        if (error) {
            console.error('数据库插入错误:', error);
            throw new Error(`数据库操作失败: ${error.message}`);
        }

        console.log('用户验证码已保存:', { email, code: verificationCode });
        return data;
    } catch (error) {
        console.error('upsertUserVerificationCode 错误:', error);
        throw error;
    }
}

/**
 * 验证用户验证码
 * @param {string} email - 用户邮箱
 * @param {string} code - 验证码
 * @returns {Promise<Object|null>} 验证成功返回用户数据，失败返回null
 */
export async function verifyUserCode(email, code) {
    try {
        const supabase = await createSupabaseClient();

        // 首先查找用户和验证码
        const { data: user, error: findError } = await supabase
            .from(USERS_TABLE.TABLE_NAME)
            .select('*')
            .eq(USERS_TABLE.COLUMNS.EMAIL, email)
            .single();

        if (findError || !user) {
            console.log('用户不存在:', email);
            return null;
        }

        // 检查验证码是否匹配
        if (user[USERS_TABLE.COLUMNS.VERIFICATION_CODE] !== code) {
            console.log('验证码不匹配:', { email, inputCode: code, storedCode: user[USERS_TABLE.COLUMNS.VERIFICATION_CODE] });
            return null;
        }

        // 检查验证码是否过期
        const expiresAt = new Date(user[USERS_TABLE.COLUMNS.CODE_EXPIRES_AT]);
        if (expiresAt < new Date()) {
            console.log('验证码已过期:', { email, expiresAt });
            return null;
        }

        // 检查是否已经验证过
        if (user[USERS_TABLE.COLUMNS.IS_VERIFIED]) {
            console.log('用户已经验证过:', email);
            return user;
        }

        // 更新用户状态为已验证
        const { data: updatedUser, error: updateError } = await supabase
            .from(USERS_TABLE.TABLE_NAME)
            .update({
                [USERS_TABLE.COLUMNS.IS_VERIFIED]: true,
                [USERS_TABLE.COLUMNS.STATUS]: 'active',
                [USERS_TABLE.COLUMNS.VERIFICATION_CODE]: null,
                [USERS_TABLE.COLUMNS.CODE_EXPIRES_AT]: null
            })
            .eq(USERS_TABLE.COLUMNS.EMAIL, email)
            .select()
            .single();

        if (updateError) {
            console.error('更新用户状态错误:', updateError);
            throw new Error(`更新用户状态失败: ${updateError.message}`);
        }

        console.log('用户验证成功:', email);
        return updatedUser;
    } catch (error) {
        console.error('verifyUserCode 错误:', error);
        throw error;
    }
}

/**
 * 根据邮箱查找用户
 * @param {string} email - 用户邮箱
 * @returns {Promise<Object|null>} 用户数据或null
 */
export async function findUserByEmail(email) {
    try {
        const supabase = await createSupabaseClient();

        const { data, error } = await supabase
            .from(USERS_TABLE.TABLE_NAME)
            .select('*')
            .eq(USERS_TABLE.COLUMNS.EMAIL, email)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 是"未找到记录"的错误码
            console.error('查找用户错误:', error);
            throw new Error(`查找用户失败: ${error.message}`);
        }

        return data || null;
    } catch (error) {
        console.error('findUserByEmail 错误:', error);
        throw error;
    }
}

/**
 * 清理过期的验证码
 * @returns {Promise<number>} 清理的记录数
 */
export async function cleanupExpiredCodes() {
    try {
        const supabase = await createSupabaseClient();

        const { data, error } = await supabase
            .from(USERS_TABLE.TABLE_NAME)
            .update({
                [USERS_TABLE.COLUMNS.VERIFICATION_CODE]: null,
                [USERS_TABLE.COLUMNS.CODE_EXPIRES_AT]: null
            })
            .lt(USERS_TABLE.COLUMNS.CODE_EXPIRES_AT, new Date().toISOString())
            .not(USERS_TABLE.COLUMNS.VERIFICATION_CODE, 'is', null)
            .select();

        if (error) {
            console.error('清理过期验证码错误:', error);
            throw new Error(`清理过期验证码失败: ${error.message}`);
        }

        const cleanedCount = data ? data.length : 0;
        console.log(`已清理 ${cleanedCount} 个过期验证码`);
        return cleanedCount;
    } catch (error) {
        console.error('cleanupExpiredCodes 错误:', error);
        throw error;
    }
}

/**
 * 获取用户统计信息
 * @returns {Promise<Object>} 统计信息
 */
export async function getUserStats() {
    try {
        const supabase = await createSupabaseClient();

        // 总用户数
        const { count: totalUsers, error: totalError } = await supabase
            .from(USERS_TABLE.TABLE_NAME)
            .select('*', { count: 'exact', head: true });

        if (totalError) throw totalError;

        // 已验证用户数
        const { count: verifiedUsers, error: verifiedError } = await supabase
            .from(USERS_TABLE.TABLE_NAME)
            .select('*', { count: 'exact', head: true })
            .eq(USERS_TABLE.COLUMNS.IS_VERIFIED, true);

        if (verifiedError) throw verifiedError;

        // 待验证用户数
        const { count: pendingUsers, error: pendingError } = await supabase
            .from(USERS_TABLE.TABLE_NAME)
            .select('*', { count: 'exact', head: true })
            .eq(USERS_TABLE.COLUMNS.IS_VERIFIED, false);

        if (pendingError) throw pendingError;

        return {
            totalUsers: totalUsers || 0,
            verifiedUsers: verifiedUsers || 0,
            pendingUsers: pendingUsers || 0
        };
    } catch (error) {
        console.error('getUserStats 错误:', error);
        throw error;
    }
}

// 导出所有函数
export default {
    upsertUserVerificationCode,
    verifyUserCode,
    findUserByEmail,
    cleanupExpiredCodes,
    getUserStats
};