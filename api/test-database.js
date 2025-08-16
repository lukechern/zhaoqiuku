/*
 * ========================================
 * 🧪 在线数据库测试 API
 * ========================================
 * 通过 Vercel API 端点测试数据库功能
 * 访问: https://your-domain.vercel.app/api/test-database
 */

import { createSupabaseClient } from '../config/databaseConfig.js';

export default async function handler(req, res) {
    // 设置 CORS 头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    console.log('🧪 开始在线数据库测试...');
    
    const testResults = {
        timestamp: new Date().toISOString(),
        tests: [],
        summary: {
            total: 0,
            passed: 0,
            failed: 0
        }
    };

    try {
        // 测试1: 数据库连接
        console.log('📡 测试1: 数据库连接');
        testResults.tests.push(await testDatabaseConnection());

        // 测试2: 表结构检查
        console.log('📋 测试2: 表结构检查');
        testResults.tests.push(await testTableStructure());

        // 测试3: 数据插入测试
        console.log('📝 测试3: 数据插入测试');
        testResults.tests.push(await testDataInsertion());

        // 测试4: 数据查询测试
        console.log('🔍 测试4: 数据查询测试');
        testResults.tests.push(await testDataQuery());

        // 计算总结
        testResults.summary.total = testResults.tests.length;
        testResults.summary.passed = testResults.tests.filter(t => t.status === 'passed').length;
        testResults.summary.failed = testResults.tests.filter(t => t.status === 'failed').length;

        console.log('✅ 测试完成');
        
        // 返回结果
        res.status(200).json({
            success: true,
            message: '数据库测试完成',
            results: testResults
        });

    } catch (error) {
        console.error('❌ 测试过程中出错:', error);
        
        res.status(500).json({
            success: false,
            message: '测试过程中发生错误',
            error: error.message,
            results: testResults
        });
    }
}

// 测试数据库连接
async function testDatabaseConnection() {
    const test = {
        name: '数据库连接测试',
        status: 'failed',
        message: '',
        details: {}
    };

    try {
        const supabase = await createSupabaseClient();
        
        // 简单的连接测试
        const { data, error } = await supabase
            .from('items')
            .select('count', { count: 'exact', head: true });

        if (error) {
            test.message = `连接失败: ${error.message}`;
            test.details.error = error;
        } else {
            test.status = 'passed';
            test.message = '数据库连接正常';
            test.details.recordCount = data;
        }
    } catch (error) {
        test.message = `连接异常: ${error.message}`;
        test.details.error = error.message;
    }

    return test;
}

// 测试表结构
async function testTableStructure() {
    const test = {
        name: '表结构检查',
        status: 'failed',
        message: '',
        details: {}
    };

    try {
        const supabase = await createSupabaseClient();
        
        // 查询一条记录来获取字段信息
        const { data, error } = await supabase
            .from('items')
            .select('*')
            .limit(1);

        if (error) {
            test.message = `表结构查询失败: ${error.message}`;
            test.details.error = error;
        } else {
            const fields = data && data.length > 0 ? Object.keys(data[0]) : [];
            
            test.details.fields = fields;
            test.details.hasItemType = fields.includes('item_type');
            test.details.hasActionType = fields.includes('action_type');
            
            if (fields.includes('item_type') && !fields.includes('action_type')) {
                test.status = 'passed';
                test.message = '表结构正确，已完成迁移';
            } else if (fields.includes('action_type') && !fields.includes('item_type')) {
                test.message = '表结构为旧版本，需要执行迁移';
            } else if (fields.includes('action_type') && fields.includes('item_type')) {
                test.message = '表结构包含新旧字段，建议清理旧字段';
            } else {
                test.message = '表结构异常，缺少必要字段';
            }
        }
    } catch (error) {
        test.message = `表结构检查异常: ${error.message}`;
        test.details.error = error.message;
    }

    return test;
}

// 测试数据插入
async function testDataInsertion() {
    const test = {
        name: '数据插入测试',
        status: 'failed',
        message: '',
        details: {}
    };

    try {
        const supabase = await createSupabaseClient();
        
        const testData = {
            user_id: '00000000-0000-0000-0000-000000000000',
            item_name: 'test_item_' + Date.now(),
            location: 'test_location',
            operation_time: Math.floor(Date.now() / 1000),
            client_ip: '127.0.0.1',
            transcript: 'test transcript',
            item_type: 'test_type'
        };

        test.details.insertData = testData;

        const { data, error } = await supabase
            .from('items')
            .insert(testData)
            .select()
            .single();

        if (error) {
            test.message = `插入失败: ${error.message}`;
            test.details.error = {
                code: error.code,
                message: error.message,
                details: error.details,
                hint: error.hint
            };
            
            // 分析错误类型
            if (error.code === '42703') {
                test.details.errorType = '字段不存在错误';
            } else if (error.code === '23502') {
                test.details.errorType = 'NOT NULL约束错误';
            } else if (error.code === '23503') {
                test.details.errorType = '外键约束错误';
            } else {
                test.details.errorType = '其他错误';
            }
        } else {
            test.status = 'passed';
            test.message = '数据插入成功';
            test.details.insertedData = data;
            
            // 清理测试数据
            const { error: deleteError } = await supabase
                .from('items')
                .delete()
                .eq('id', data.id);
                
            if (deleteError) {
                test.details.cleanupWarning = `清理测试数据失败: ${deleteError.message}`;
            } else {
                test.details.cleanupSuccess = true;
            }
        }
    } catch (error) {
        test.message = `插入测试异常: ${error.message}`;
        test.details.error = error.message;
    }

    return test;
}

// 测试数据查询
async function testDataQuery() {
    const test = {
        name: '数据查询测试',
        status: 'failed',
        message: '',
        details: {}
    };

    try {
        const supabase = await createSupabaseClient();
        
        // 查询最近的记录
        const { data, error } = await supabase
            .from('items')
            .select('*')
            .order('operation_time', { ascending: false })
            .limit(5);

        if (error) {
            test.message = `查询失败: ${error.message}`;
            test.details.error = error;
        } else {
            test.status = 'passed';
            test.message = `查询成功，找到 ${data.length} 条记录`;
            test.details.recordCount = data.length;
            test.details.sampleRecords = data.map(record => ({
                id: record.id,
                item_name: record.item_name,
                item_type: record.item_type,
                location: record.location,
                operation_time: record.operation_time
            }));
        }
    } catch (error) {
        test.message = `查询测试异常: ${error.message}`;
        test.details.error = error.message;
    }

    return test;
}