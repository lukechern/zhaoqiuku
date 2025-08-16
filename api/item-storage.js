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
    const { action, object, location, transcript, type } = transcriptionResult;
    
    // 🔍 调试日志：分析结果分类
    console.log('=== 物品存储分析结果 ===');
    console.log('转录结果:', transcript);
    console.log('动作类型:', action);
    console.log('物品名称:', object);
    console.log('存放位置:', location);
    console.log('用户ID:', userId);
    console.log('客户端IP:', clientIP);
    console.log('========================');
    
    try {
        switch (action) {
            case 'put':
                console.log('🔄 执行存放操作 (PUT)');
                return await handlePutAction(object, location, userId, clientIP, transcript, type);
            case 'get':
                console.log('🔍 执行查找操作 (GET)');
                return await handleGetAction(object, userId);
            case 'unknown':
                console.log('❓ 未知操作类型 (UNKNOWN)');
                return handleUnknownAction();
            default:
                console.error('❌ 无效的操作类型:', action);
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
async function handlePutAction(object, location, userId, clientIP, transcript, type) {
    console.log('📝 PUT操作 - 数据验证');
    console.log('物品名称:', object);
    console.log('存放位置:', location);
    
    if (!object || !location) {
        console.log('❌ PUT操作失败 - 数据不完整');
        return {
            success: false,
            message: '物品名称或存放位置信息不完整，请重新描述'
        };
    }

    const supabase = await createSupabaseClient();
    const currentTimestamp = Math.floor(Date.now() / 1000);

    // 🔍 调试日志：SQL操作
    const insertData = {
        user_id: userId,
        item_name: object,
        location: location,
        operation_time: currentTimestamp,
        client_ip: clientIP,
        transcript: transcript,
        item_type: type || null
    };
    
    console.log('📊 执行SQL INSERT操作');
    console.log('表名:', ITEMS_TABLE);
    console.log('插入数据:', insertData);
    console.log('SQL等效语句:', `INSERT INTO ${ITEMS_TABLE} (user_id, item_name, location, operation_time, client_ip, transcript, item_type) VALUES ('${userId}', '${object}', '${location}', ${currentTimestamp}, '${clientIP}', '${transcript}', '${type || null}')`);

    // 插入记录到数据库
    const { data, error } = await supabase
        .from(ITEMS_TABLE)
        .insert(insertData)
        .select()
        .single();

    if (error) {
        console.error('❌ SQL INSERT失败:', error);
        console.error('错误详情:', error.message);
        return {
            success: false,
            message: '记录存储失败，请稍后重试'
        };
    }

    console.log('✅ SQL INSERT成功');
    console.log('返回数据:', data);

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
    console.log('🔍 GET操作 - 数据验证');
    console.log('查找物品:', object);
    console.log('用户ID:', userId);
    
    if (!object) {
        console.log('❌ GET操作失败 - 物品名称为空');
        return {
            success: false,
            message: '请明确要查找的物品名称'
        };
    }

    const supabase = await createSupabaseClient();

    // 🔍 调试日志：SQL查询操作
    console.log('📊 执行SQL SELECT操作');
    console.log('表名:', ITEMS_TABLE);
    console.log('查询条件:', {
        user_id: userId,
        item_name: object
    });
    console.log('SQL等效语句:', `SELECT * FROM ${ITEMS_TABLE} WHERE user_id = '${userId}' AND item_name = '${object}' ORDER BY operation_time DESC LIMIT 1`);

    // 查找最新的存放记录
    const { data, error } = await supabase
        .from(ITEMS_TABLE)
        .select('*')
        .eq('user_id', userId)
        .eq('item_name', object)
        .order('operation_time', { ascending: false })
        .limit(1)
        .single();

    if (error || !data) {
        console.log('❌ SQL SELECT失败或无数据');
        console.log('错误信息:', error?.message || '无匹配记录');
        return {
            success: false,
            message: `没有找到${object}的存放记录，请确认物品名称是否正确`
        };
    }

    console.log('✅ SQL SELECT成功');
    console.log('查询结果:', data);

    // 格式化记录时间
    const recordDate = new Date(data.operation_time * 1000);
    const formattedDate = `${recordDate.getFullYear()}年${recordDate.getMonth() + 1}月${recordDate.getDate()}日`;
    
    console.log('📅 时间格式化:', {
        原始时间戳: data.operation_time,
        格式化时间: formattedDate
    });

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
    console.log('❓ UNKNOWN操作 - 意图不明确');
    console.log('无需数据库操作，直接返回提示信息');
    
    return {
        success: false,
        message: '您的意图不明确，请重新提问，是要记录物品存放位置还是要查找物品。'
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