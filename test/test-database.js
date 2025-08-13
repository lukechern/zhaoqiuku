/*
 * ========================================
 * 🧪 数据库功能测试脚本
 * ========================================
 * 用于测试数据库连接和基本操作
 */

import { 
    upsertUserVerificationCode, 
    verifyUserCode, 
    findUserByEmail, 
    cleanupExpiredCodes,
    getUserStats 
} from '../utils/database.js';

// 测试数据
const TEST_EMAIL = 'test@example.com';
const TEST_CODE = '123456';

async function runTests() {
    console.log('🧪 开始数据库功能测试');
    console.log('========================');

    try {
        // 测试1: 获取统计信息
        console.log('\n📊 测试1: 获取用户统计信息');
        const stats = await getUserStats();
        console.log('统计信息:', stats);

        // 测试2: 插入验证码
        console.log('\n📝 测试2: 插入用户验证码');
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10分钟后过期
        const user = await upsertUserVerificationCode(TEST_EMAIL, TEST_CODE, expiresAt);
        console.log('插入结果:', {
            id: user.id,
            email: user.email,
            code: user.verification_code,
            expires: user.code_expires_at,
            status: user.status
        });

        // 测试3: 查找用户
        console.log('\n🔍 测试3: 查找用户');
        const foundUser = await findUserByEmail(TEST_EMAIL);
        console.log('查找结果:', foundUser ? {
            id: foundUser.id,
            email: foundUser.email,
            isVerified: foundUser.is_verified,
            status: foundUser.status
        } : '用户不存在');

        // 测试4: 验证验证码
        console.log('\n✅ 测试4: 验证验证码');
        const verifiedUser = await verifyUserCode(TEST_EMAIL, TEST_CODE);
        console.log('验证结果:', verifiedUser ? {
            id: verifiedUser.id,
            email: verifiedUser.email,
            isVerified: verifiedUser.is_verified,
            status: verifiedUser.status
        } : '验证失败');

        // 测试5: 清理过期验证码
        console.log('\n🧹 测试5: 清理过期验证码');
        const cleanedCount = await cleanupExpiredCodes();
        console.log('清理结果:', `清理了 ${cleanedCount} 个过期验证码`);

        // 测试6: 最终统计信息
        console.log('\n📊 测试6: 最终统计信息');
        const finalStats = await getUserStats();
        console.log('最终统计:', finalStats);

        console.log('\n✅ 所有测试完成！');

    } catch (error) {
        console.error('\n❌ 测试失败:', error);
        process.exit(1);
    }
}

// 如果直接运行此文件，执行测试
if (import.meta.url === `file://${process.argv[1]}`) {
    runTests();
}