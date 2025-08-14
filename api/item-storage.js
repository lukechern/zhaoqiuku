/*
 * ========================================
 * 📦 物品存储管理 API
 * ========================================
 * 处理物品存放和查找的业务逻辑
 */

import { createSupabaseClient } from '../config/databaseConfig.js';

// ==========================================
// 📋 数据表配置
// ==========================================
const ITEMS_TABLE = 'items';

// ==========================================
// 🔧 业务逻辑处理函数
// ==========================================

/**
 * 处理物品存储相关操作
 * @param {Object} transcriptionResult - 转录结果
 * @param {string} userId - 用户ID
 * @param {string} clientIP - 客户端IP地址
 * @returns {Object} 处理结果
 */
export async function handleItemStorage(transcriptionResult, userId, clientIP) {
    const { action, object, location, transcript } = transcriptionResult;
    
    try {
        switch (action) {
            case 'put':
                return await handlePutAction(object, location, userId, clientIP, transcript);
            case 'get':
                return await handleGetAction(object, userId);
            case 'unknown':
                return handleUnknownAction();
            default:
                throw new Error(`未知的操作类型: ${action}`);
        }
    } catch (error) {
        console.error('处理物品存储操作时出错:', error);
        return {
            success: false,
            message: '处理请求时发生错误，请稍后重试',
            error: error.message
        };
    }
}

/**
 * 处理存放物品操作 (action: put)
 */
async function handlePutAction(object, location, userId, clientIP, transcript) {
    if (!object || !location) {
        return {
            success: false,
            message: '物品名称或存放位置信息不完整，请重新描述'
        };
    }

    const supabase = await createSupabaseClient();
    const currentTimestamp = Math.floor(Date.now() / 1000);

    // 插入记录到数据库
    const { data, error } = await supabase
        .from(ITEMS_TABLE)
        .insert({
            user_id: userId,
            item_name: object,
            location: location,
            operation_time: currentTimestamp,
            client_ip: clientIP,
            transcript: transcript,
            action_type: 'put'
        })
        .select()
        .single();

    if (error) {
        console.error('插入物品记录失败:', error);
        return {
            success: false,
            message: '记录存储失败，请稍后重试'
        };
    }

    return {
        success: true,
        message: `${object}的存放位置为${location}，已经记录好了，以后随时来问我。`,
        data: {
            item: object,
            location: location,
            recordId: data.id
        }
    };
}

/**
 * 处理查找物品操作 (action: get)
 */
async function handleGetAction(object, userId) {
    if (!object) {
        return {
            success: false,
            message: '请明确要查找的物品名称'
        };
    }

    const supabase = await createSupabaseClient();

    // 查找最新的存放记录
    const { data, error } = await supabase
        .from(ITEMS_TABLE)
        .select('*')
        .eq('user_id', userId)
        .eq('item_name', object)
        .eq('action_type', 'put')
        .order('operation_time', { ascending: false })
        .limit(1)
        .single();

    if (error || !data) {
        return {
            success: false,
            message: `没有找到${object}的存放记录，请确认物品名称是否正确`
        };
    }

    // 格式化记录时间
    const recordDate = new Date(data.operation_time * 1000);
    const formattedDate = `${recordDate.getFullYear()}年${recordDate.getMonth() + 1}月${recordDate.getDate()}日`;

    return {
        success: true,
        message: `${object}的存放位置为${data.location}，记录时间为${formattedDate}`,
        data: {
            item: object,
            location: data.location,
            recordTime: formattedDate,
            recordId: data.id
        }
    };
}

/**
 * 处理未知意图操作 (action: unknown)
 */
function handleUnknownAction() {
    return {
        success: false,
        message: '您的意图不明确，重新提问，是要记录物品存放位置还是要查找物品。'
    };
}

// ==========================================
// 🔍 辅助查询函数
// ==========================================

/**
 * 获取用户的所有物品记录
 */
export async function getUserItems(userId, limit = 50) {
    const supabase = await createSupabaseClient();

    const { data, error } = await supabase
        .from(ITEMS_TABLE)
        .select('*')
        .eq('user_id', userId)
        .order('operation_time', { ascending: false })
        .limit(limit);

    if (error) {
        throw new Error(`查询用户物品记录失败: ${error.message}`);
    }

    return data;
}

/**
 * 删除物品记录
 */
export async function deleteItemRecord(recordId, userId) {
    const supabase = await createSupabaseClient();

    const { error } = await supabase
        .from(ITEMS_TABLE)
        .delete()
        .eq('id', recordId)
        .eq('user_id', userId);

    if (error) {
        throw new Error(`删除记录失败: ${error.message}`);
    }

    return { success: true, message: '记录已删除' };
}

export default {
    handleItemStorage,
    getUserItems,
    deleteItemRecord
};