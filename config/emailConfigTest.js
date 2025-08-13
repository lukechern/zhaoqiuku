/*
 * ========================================
 * 🧪 邮件配置测试工具
 * ========================================
 * 用于测试和验证邮件配置的工具函数
 */

import { EMAIL_SENDER, EMAIL_TEMPLATES, EMAIL_CONFIG } from './emailConfig.js';

// 测试邮件配置
export function testEmailConfig() {
    console.log('📧 邮件配置测试');
    console.log('================');
    
    // 测试发件人配置
    console.log('发件人配置:');
    console.log(`  FROM: ${EMAIL_SENDER.FROM}`);
    console.log(`  NAME: ${EMAIL_SENDER.NAME}`);
    console.log(`  FULL_FROM: ${EMAIL_SENDER.FULL_FROM}`);
    console.log('');
    
    // 测试验证码模板
    console.log('验证码邮件模板:');
    const testCode = '123456';
    const testEmail = 'test@example.com';
    
    const template = EMAIL_TEMPLATES.VERIFICATION_CODE;
    console.log(`  主题: ${template.subject}`);
    console.log(`  HTML长度: ${template.getHtml(testCode, testEmail).length} 字符`);
    console.log(`  文本长度: ${template.getText(testCode, testEmail).length} 字符`);
    console.log('');
    
    // 测试配置参数
    console.log('邮件配置参数:');
    console.log(`  API URL: ${EMAIL_CONFIG.RESEND.API_URL}`);
    console.log(`  超时时间: ${EMAIL_CONFIG.RESEND.TIMEOUT}ms`);
    console.log(`  验证码长度: ${EMAIL_CONFIG.VERIFICATION.CODE_LENGTH}位`);
    console.log(`  有效期: ${EMAIL_CONFIG.VERIFICATION.EXPIRES_IN / 1000 / 60}分钟`);
    console.log(`  重发冷却: ${EMAIL_CONFIG.VERIFICATION.RESEND_COOLDOWN / 1000}秒`);
    console.log('');
    
    console.log('✅ 邮件配置测试完成');
}

// 生成测试验证码
export function generateTestCode() {
    const length = EMAIL_CONFIG.VERIFICATION.CODE_LENGTH;
    const min = Math.pow(10, length - 1);
    const max = Math.pow(10, length) - 1;
    return Math.floor(min + Math.random() * (max - min + 1)).toString();
}

// 预览邮件模板
export function previewEmailTemplate(code = null, email = 'test@example.com') {
    const testCode = code || generateTestCode();
    const template = EMAIL_TEMPLATES.VERIFICATION_CODE;
    
    console.log('📧 邮件模板预览');
    console.log('================');
    console.log(`收件人: ${email}`);
    console.log(`验证码: ${testCode}`);
    console.log(`主题: ${template.subject}`);
    console.log('');
    console.log('HTML模板:');
    console.log(template.getHtml(testCode, email));
    console.log('');
    console.log('文本模板:');
    console.log(template.getText(testCode, email));
}

// 如果直接运行此文件，执行测试
if (import.meta.url === `file://${process.argv[1]}`) {
    testEmailConfig();
    console.log('');
    previewEmailTemplate();
}