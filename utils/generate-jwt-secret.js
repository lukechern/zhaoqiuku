/*
 * ========================================
 * 🔑 JWT 密钥生成工具
 * ========================================
 * 生成安全的 JWT 签名密钥
 */

import crypto from 'crypto';

/**
 * 生成 JWT 密钥
 * @param {number} length - 密钥长度（字节）
 * @returns {string} Base64 编码的密钥
 */
function generateJWTSecret(length = 32) {
    const secret = crypto.randomBytes(length).toString('base64');
    return secret;
}

/**
 * 生成多种格式的密钥
 * @param {number} length - 密钥长度（字节）
 * @returns {Object} 不同格式的密钥
 */
function generateSecrets(length = 32) {
    const bytes = crypto.randomBytes(length);
    
    return {
        base64: bytes.toString('base64'),
        hex: bytes.toString('hex'),
        base64url: bytes.toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=/g, ''),
        length: length,
        bits: length * 8
    };
}

// 如果直接运行此文件，生成并显示密钥
if (import.meta.url === `file://${process.argv[1]}`) {
    console.log('🔑 JWT 密钥生成工具');
    console.log('==================');
    
    const secrets = generateSecrets(32);
    
    console.log(`密钥长度: ${secrets.length} 字节 (${secrets.bits} 位)`);
    console.log('');
    console.log('推荐使用 Base64 格式:');
    console.log(`JWT_SECRET=${secrets.base64}`);
    console.log('');
    console.log('其他格式:');
    console.log(`Hex: ${secrets.hex}`);
    console.log(`Base64URL: ${secrets.base64url}`);
    console.log('');
    console.log('使用方法:');
    console.log('1. 复制上述 JWT_SECRET 到 .env.local 文件');
    console.log('2. 在 Vercel 环境变量中设置 JWT_SECRET');
    console.log('3. 确保密钥保密，不要提交到代码仓库');
}

export { generateJWTSecret, generateSecrets };