/*
 * ========================================
 * 🔧 数据库结构修复脚本
 * ========================================
 * 自动检测并修复数据库表结构问题
 */

import { createSupabaseClient } from '../config/databaseConfig.js';

async function fixDatabaseSchema() {
    console.log('🔧 开始数据库结构修复...');
    console.log('========================');

    try {
        const supabase = await createSupabaseClient();

        // 1. 检查当前表结构
        console.log('\n📋 检查当前表结构...');
        
        const { data: sampleData, error: sampleError } = await supabase
            .from('items')
            .select('*')
            .limit(1);

        if (sampleError) {
            console.error('❌ 无法访问items表:', sampleError.message);
            return;
        }

        let hasOldField = false;
        let hasNewField = false;

        if (sampleData && sampleData.length > 0) {
            const fields = Object.keys(sampleData[0]);
            hasOldField = fields.includes('action_type');
            hasNewField = fields.includes('item_type');
            
            console.log('📊 当前字段:', fields);
            console.log('🔍 action_type字段存在:', hasOldField);
            console.log('🔍 item_type字段存在:', hasNewField);
        } else {
            // 表为空，尝试通过插入测试来检测字段
            console.log('📊 表为空，通过测试插入检测字段...');
            
            // 测试新字段
            const testNewField = await supabase
                .from('items')
                .insert({
                    user_id: '00000000-0000-0000-0000-000000000000',
                    item_name: 'test',
                    location: 'test',
                    operation_time: Date.now(),
                    item_type: 'test'
                })
                .select()
                .single();

            if (!testNewField.error) {
                hasNewField = true;
                // 清理测试数据
                await supabase.from('items').delete().eq('id', testNewField.data.id);
            }

            // 测试旧字段
            const testOldField = await supabase
                .from('items')
                .insert({
                    user_id: '00000000-0000-0000-0000-000000000000',
                    item_name: 'test',
                    location: 'test',
                    operation_time: Date.now(),
                    action_type: 'put'
                })
                .select()
                .single();

            if (!testOldField.error) {
                hasOldField = true;
                // 清理测试数据
                await supabase.from('items').delete().eq('id', testOldField.data.id);
            }
        }

        // 2. 根据检测结果提供解决方案
        console.log('\n🔧 分析结果和建议:');
        
        if (hasOldField && !hasNewField) {
            console.log('⚠️ 检测到旧表结构，需要执行数据库迁移');
            console.log('📝 请执行以下SQL命令:');
            console.log(`
-- 数据库迁移脚本
BEGIN;

-- 1. 添加新字段
ALTER TABLE items ADD COLUMN item_type VARCHAR(50);

-- 2. 删除旧索引
DROP INDEX IF EXISTS idx_items_action_type;

-- 3. 删除旧字段
ALTER TABLE items DROP COLUMN action_type;

-- 4. 创建新索引
CREATE INDEX IF NOT EXISTS idx_items_item_type ON items(item_type);

COMMIT;
            `);
            
        } else if (!hasOldField && hasNewField) {
            console.log('✅ 表结构已更新，使用新的item_type字段');
            
        } else if (hasOldField && hasNewField) {
            console.log('⚠️ 同时存在新旧字段，建议清理旧字段');
            console.log('📝 请执行以下SQL命令:');
            console.log(`
-- 清理旧字段
BEGIN;

-- 删除旧索引
DROP INDEX IF EXISTS idx_items_action_type;

-- 删除旧字段
ALTER TABLE items DROP COLUMN action_type;

COMMIT;
            `);
            
        } else {
            console.log('❌ 表结构异常，两个字段都不存在');
            console.log('📝 请重新创建表或添加必要字段');
        }

        // 3. 提供手动修复指导
        console.log('\n📖 手动修复步骤:');
        console.log('1. 登录 Supabase 控制台');
        console.log('2. 进入 SQL Editor');
        console.log('3. 执行上述SQL命令');
        console.log('4. 重新测试应用功能');

    } catch (error) {
        console.error('❌ 修复过程中出错:', error);
    }
}

// 如果直接运行此文件，执行修复
if (import.meta.url === `file://${process.argv[1]}`) {
    fixDatabaseSchema();
}

export { fixDatabaseSchema };