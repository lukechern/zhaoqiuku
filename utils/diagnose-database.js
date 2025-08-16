/*
 * ========================================
 * 🔍 数据库诊断脚本
 * ========================================
 * 用于诊断数据库表结构和字段问题
 */

import { createSupabaseClient } from '../config/databaseConfig.js';

async function diagnoseDatabaseIssues() {
    console.log('🔍 开始数据库诊断...');
    console.log('========================');

    try {
        const supabase = await createSupabaseClient();

        // 1. 测试数据库连接
        console.log('\n📡 测试数据库连接...');
        const { data: connectionTest, error: connectionError } = await supabase
            .from('items')
            .select('count', { count: 'exact', head: true });

        if (connectionError) {
            console.error('❌ 数据库连接失败:', connectionError.message);
            return;
        }
        console.log('✅ 数据库连接正常');

        // 2. 检查表结构
        console.log('\n📋 检查items表结构...');
        
        // 尝试查询表的第一条记录来了解字段结构
        const { data: sampleData, error: sampleError } = await supabase
            .from('items')
            .select('*')
            .limit(1);

        if (sampleError) {
            console.error('❌ 查询表结构失败:', sampleError.message);
        } else {
            console.log('✅ 表结构查询成功');
            if (sampleData && sampleData.length > 0) {
                console.log('📊 表字段:', Object.keys(sampleData[0]));
            } else {
                console.log('📊 表为空，无法获取字段信息');
            }
        }

        // 3. 测试插入操作
        console.log('\n🧪 测试插入操作...');
        
        const testData = {
            user_id: '00000000-0000-0000-0000-000000000000', // 测试UUID
            item_name: 'test_item',
            location: 'test_location',
            operation_time: Math.floor(Date.now() / 1000),
            client_ip: '127.0.0.1',
            transcript: 'test transcript',
            item_type: 'test_type'
        };

        console.log('🔄 尝试插入测试数据:', testData);

        const { data: insertData, error: insertError } = await supabase
            .from('items')
            .insert(testData)
            .select()
            .single();

        if (insertError) {
            console.error('❌ 插入测试失败:', insertError.message);
            console.error('错误代码:', insertError.code);
            console.error('错误详情:', insertError.details);
            
            // 检查是否是字段不存在的问题
            if (insertError.message.includes('item_type')) {
                console.log('🔧 检测到item_type字段问题，可能需要数据库迁移');
            }
            if (insertError.message.includes('action_type')) {
                console.log('🔧 检测到action_type字段仍然存在，需要执行迁移');
            }
        } else {
            console.log('✅ 插入测试成功:', insertData);
            
            // 清理测试数据
            await supabase
                .from('items')
                .delete()
                .eq('id', insertData.id);
            console.log('🧹 测试数据已清理');
        }

        // 4. 检查是否存在旧字段
        console.log('\n🔍 检查旧字段action_type...');
        
        const { data: oldFieldTest, error: oldFieldError } = await supabase
            .from('items')
            .select('action_type')
            .limit(1);

        if (oldFieldError) {
            if (oldFieldError.message.includes('action_type')) {
                console.log('✅ 旧字段action_type不存在，迁移可能已完成');
            } else {
                console.error('❌ 检查旧字段时出错:', oldFieldError.message);
            }
        } else {
            console.log('⚠️ 旧字段action_type仍然存在，需要执行数据库迁移');
        }

    } catch (error) {
        console.error('❌ 诊断过程中出错:', error);
    }
}

// 如果直接运行此文件，执行诊断
if (import.meta.url === `file://${process.argv[1]}`) {
    diagnoseDatabaseIssues();
}

export { diagnoseDatabaseIssues };