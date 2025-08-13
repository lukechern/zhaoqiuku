/*
 * ========================================
 * 🔐 认证配置文件
 * ========================================
 * 集中管理 JWT 认证相关配置
 */

// ==========================================
// 🔑 JWT 配置
// ==========================================
export const JWT_CONFIG = {
    // JWT 密钥（从环境变量获取）
    SECRET: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    
    // Token 过期时间
    EXPIRES_IN: {
        ACCESS_TOKEN: '7d',        // 访问令牌：7天
        REFRESH_TOKEN: '30d'       // 刷新令牌：30天
    },
    
    // Token 类型
    TOKEN_TYPES: {
        ACCESS: 'access',
        REFRESH: 'refresh'
    },
    
    // 算法
    ALGORITHM: 'HS256',
    
    // 发行者
    ISSUER: 'zhaoqiuku-voice-assistant',
    
    // 受众
    AUDIENCE: 'zhaoqiuku-users'
};

// ==========================================
// 🍪 Cookie 配置
// ==========================================
export const COOKIE_CONFIG = {
    // Cookie 名称
    NAMES: {
        ACCESS_TOKEN: 'auth_token',
        REFRESH_TOKEN: 'refresh_token',
        USER_INFO: 'user_info'
    },
    
    // Cookie 选项
    OPTIONS: {
        httpOnly: false,        // 允许 JavaScript 访问（适配 WebView）
        secure: false,          // 开发环境设为 false，生产环境应为 true
        sameSite: 'lax',        // CSRF 保护
        path: '/',              // 全站有效
        maxAge: 7 * 24 * 60 * 60 * 1000  // 7天（毫秒）
    }
};

// ==========================================
// 📱 LocalStorage 配置
// ==========================================
export const STORAGE_CONFIG = {
    // LocalStorage 键名
    KEYS: {
        ACCESS_TOKEN: 'zhaoqiuku_access_token',
        REFRESH_TOKEN: 'zhaoqiuku_refresh_token',
        USER_INFO: 'zhaoqiuku_user_info',
        LOGIN_TIME: 'zhaoqiuku_login_time',
        DEVICE_ID: 'zhaoqiuku_device_id'
    },
    
    // 存储选项
    OPTIONS: {
        // Token 自动刷新阈值（剩余时间少于此值时自动刷新）
        REFRESH_THRESHOLD: 24 * 60 * 60 * 1000,  // 1天
        
        // 设备ID生成
        GENERATE_DEVICE_ID: true
    }
};

// ==========================================
// 🔒 权限配置
// ==========================================
export const PERMISSION_CONFIG = {
    // 用户角色
    ROLES: {
        USER: 'user',
        ADMIN: 'admin',
        GUEST: 'guest'
    },
    
    // 权限级别
    PERMISSIONS: {
        READ: 'read',
        WRITE: 'write',
        DELETE: 'delete',
        ADMIN: 'admin'
    },
    
    // 默认权限
    DEFAULT_PERMISSIONS: ['read', 'write']
};

// ==========================================
// 🛡️ 安全配置
// ==========================================
export const SECURITY_CONFIG = {
    // 密码要求（未来扩展用）
    PASSWORD: {
        MIN_LENGTH: 8,
        REQUIRE_UPPERCASE: false,
        REQUIRE_LOWERCASE: false,
        REQUIRE_NUMBERS: false,
        REQUIRE_SYMBOLS: false
    },
    
    // 登录限制
    LOGIN_LIMITS: {
        MAX_ATTEMPTS: 5,           // 最大尝试次数
        LOCKOUT_DURATION: 15 * 60 * 1000,  // 锁定时间：15分钟
        RESET_AFTER: 24 * 60 * 60 * 1000   // 重置时间：24小时
    },
    
    // IP 白名单（可选）
    IP_WHITELIST: [],
    
    // User-Agent 检查
    CHECK_USER_AGENT: false
};

// ==========================================
// 🔧 工具函数
// ==========================================

// 生成设备ID
export function generateDeviceId() {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 15);
    return `device_${timestamp}_${randomStr}`;
}

// 验证环境配置
export function validateAuthConfig() {
    const warnings = [];
    
    if (JWT_CONFIG.SECRET === 'your-super-secret-jwt-key-change-in-production') {
        warnings.push('JWT_SECRET 使用默认值，生产环境请更换');
    }
    
    if (!COOKIE_CONFIG.OPTIONS.secure && process.env.NODE_ENV === 'production') {
        warnings.push('生产环境建议启用 Cookie secure 选项');
    }
    
    if (warnings.length > 0) {
        console.warn('认证配置警告:', warnings);
    }
    
    return warnings.length === 0;
}

// 获取 Token 过期时间（毫秒）
export function getTokenExpirationMs(tokenType = JWT_CONFIG.TOKEN_TYPES.ACCESS) {
    const expiresIn = tokenType === JWT_CONFIG.TOKEN_TYPES.REFRESH 
        ? JWT_CONFIG.EXPIRES_IN.REFRESH_TOKEN 
        : JWT_CONFIG.EXPIRES_IN.ACCESS_TOKEN;
    
    // 解析时间字符串（如 "7d", "24h", "60m"）
    const timeUnit = expiresIn.slice(-1);
    const timeValue = parseInt(expiresIn.slice(0, -1));
    
    switch (timeUnit) {
        case 'd': return timeValue * 24 * 60 * 60 * 1000;
        case 'h': return timeValue * 60 * 60 * 1000;
        case 'm': return timeValue * 60 * 1000;
        case 's': return timeValue * 1000;
        default: return 7 * 24 * 60 * 60 * 1000; // 默认7天
    }
}

// 导出默认配置
export default {
    JWT_CONFIG,
    COOKIE_CONFIG,
    STORAGE_CONFIG,
    PERMISSION_CONFIG,
    SECURITY_CONFIG,
    generateDeviceId,
    validateAuthConfig,
    getTokenExpirationMs
};