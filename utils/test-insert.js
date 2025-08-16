/*
 * ========================================
 * 🧪 测试数据插入脚本
 * ========================================
 * 用于测试当前的数据库插入功能
 */

import { createSupabaseClient } from '../config/databaseConfig.js';

async function testInsert() {
    console.log('🧪 开始测试数据插入...');
    console.log('========================');

    try {
        const supabase = await createSupabaseClient();

        // 测试数据
        const testData = {
            user_id: '00000000-0000-0000-0000-000000000000', // 测试UUID
            item_name: 'test_item_' + Date.now(),
            location: 'test_location',
            operation_time: Math.floor(Date.now() / 1000),
            client_ip: '127.0.0.1',
            transcript: 'test transcript',
            item_type: 'test_type'
        };

        console.log('📝 测试数据:', testData);

        // 尝试插入
        const { data, error } = await supabase
            .from('items')
            .insert(testData)
            .select()
            .single();

        if (error) {
            console.error('❌ 插入失败:', error);
            console.error('错误代码:', error.code);
            console.error('错误消息:', error.message);
            console.error('错误详情:', error.details);
            console.error('错误提示:', error.hint);
            
            // 分析错误类型
            if (error.code === '42703') {
                console.log('🔍 这是字段不存在错误');
            } else if (error.code === '23502') {
                console.log('🔍 这是NOT NULL约束错误');
            } else if (error.code === '23503') {
                console.log('🔍 这是外键约束错误');
            } else {
                console.log('🔍 其他类型错误，代码:', error.code);
            }
        } else {
            console.log('✅ 插入成功:', data);
            
            // 清理测试数据
            const { error: deleteError } = await supabase
                .from('items')
                .delete()
                .eq('id', data.id);
                
            if (deleteError) {
                console.warn('⚠️ 清理测试数据失败:', deleteError.message);
            } else {
                console.log('🧹 测试数据已清理');
            }
        }

        // 测试表结构
        console.log('\n📋 检查表结构...');
        const { data: structureData, error: structureError } = await supabase
            .from('items')
            .select('*')
            .limit(1);

        if (structureError) {
            console.error('❌ 查询表结构失败:', structureError.message);
        } else {
            if (structureData && structureData.length > 0) {
                console.log('📊 表字段:', Object.keys(structureData[0]));
            } else {
                console.log('📊 表为空，无法获取字段信息');
            }
        }

    } catch (error) {
        console.error('❌ 测试过程中出错:', error);
    }
}

// 如果直接运行此文件，执行测试
if (import.meta.url === `file://${process.argv[1]}`) {
    testInsert();
}

export { testInsert };