/*
 * ========================================
 * 🗄️ 数据库配置文件
 * ========================================
 * 集中管理 Supabase 数据库连接和表结构配置
 */

// ==========================================
// 🔗 Supabase 连接配置
// ==========================================
export const SUPABASE_CONFIG = {
    // 从环境变量获取连接信息
    URL: process.env.SUPABASE_URL,
    ANON_KEY: process.env.SUPABASE_ANON_KEY,
    
    // 连接选项
    OPTIONS: {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
};

// ==========================================
// 📋 数据表配置
// ==========================================
export const DATABASE_TABLES = {
    // 用户表
    USERS: {
        TABLE_NAME: 'users',
        COLUMNS: {
            ID: 'id',
            EMAIL: 'email',
            VERIFICATION_CODE: 'verification_code',
            CODE_EXPIRES_AT: 'code_expires_at',
            IS_VERIFIED: 'is_verified',
            REGISTERED_AT: 'registered_at',
            UPDATED_AT: 'updated_at',
            STATUS: 'status'
        }
    },
    
    // 物品存储表
    ITEMS: {
        TABLE_NAME: 'items',
        COLUMNS: {
            ID: 'id',
            USER_ID: 'user_id',
            ITEM_NAME: 'item_name',
            ITEM_TYPE: 'item_type',
            LOCATION: 'location',
            OPERATION_TIME: 'operation_time',
            CLIENT_IP: 'client_ip',
            TRANSCRIPT: 'transcript',
            CREATED_AT: 'created_at',
            UPDATED_AT: 'updated_at'
        }
    }
};

// ==========================================
// 📝 SQL 语句模板
// ==========================================
export const SQL_QUERIES = {
    // 创建用户表的 SQL（用于参考，实际在 Supabase 控制台执行）
    CREATE_USERS_TABLE: `
        CREATE TABLE IF NOT EXISTS users (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            email VARCHAR(255) UNIQUE NOT NULL,
            verification_code VARCHAR(10),
            code_expires_at TIMESTAMP WITH TIME ZONE,
            is_verified BOOLEAN DEFAULT FALSE,
            registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            status VARCHAR(20) DEFAULT 'pending'
        );

        -- 创建索引
        CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
        CREATE INDEX IF NOT EXISTS idx_users_verification_code ON users(verification_code);
        CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

        -- 创建更新时间触发器
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ language 'plpgsql';

        CREATE TRIGGER update_users_updated_at 
            BEFORE UPDATE ON users 
            FOR EACH ROW 
            EXECUTE FUNCTION update_updated_at_column();
    `,

    // 插入或更新用户
    UPSERT_USER: `
        INSERT INTO users (email, verification_code, code_expires_at, status)
        VALUES ($1, $2, $3, 'pending')
        ON CONFLICT (email) 
        DO UPDATE SET 
            verification_code = $2,
            code_expires_at = $3,
            status = 'pending',
            updated_at = NOW()
        RETURNING *;
    `,

    // 验证验证码
    VERIFY_CODE: `
        UPDATE users 
        SET is_verified = TRUE, 
            status = 'active',
            verification_code = NULL,
            code_expires_at = NULL,
            updated_at = NOW()
        WHERE email = $1 
            AND verification_code = $2 
            AND code_expires_at > NOW()
            AND is_verified = FALSE
        RETURNING *;
    `,

    // 查找用户
    FIND_USER_BY_EMAIL: `
        SELECT * FROM users WHERE email = $1;
    `,

    // 清理过期验证码
    CLEANUP_EXPIRED_CODES: `
        UPDATE users 
        SET verification_code = NULL,
            code_expires_at = NULL
        WHERE code_expires_at < NOW()
            AND verification_code IS NOT NULL;
    `,

    // 创建物品存储表的 SQL
    CREATE_ITEMS_TABLE: `
        CREATE TABLE IF NOT EXISTS items (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            item_name VARCHAR(255) NOT NULL,
            item_type VARCHAR(50),
            location VARCHAR(255) NOT NULL,
            operation_time BIGINT NOT NULL,
            client_ip INET,
            transcript TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- 创建索引
        CREATE INDEX IF NOT EXISTS idx_items_user_id ON items(user_id);
        CREATE INDEX IF NOT EXISTS idx_items_item_name ON items(item_name);
        CREATE INDEX IF NOT EXISTS idx_items_user_item ON items(user_id, item_name);
        CREATE INDEX IF NOT EXISTS idx_items_operation_time ON items(operation_time);
        CREATE INDEX IF NOT EXISTS idx_items_item_type ON items(item_type);

        -- 创建更新时间触发器
        CREATE TRIGGER update_items_updated_at 
            BEFORE UPDATE ON items 
            FOR EACH ROW 
            EXECUTE FUNCTION update_updated_at_column();
    `,

    // 插入物品记录
    INSERT_ITEM: `
        INSERT INTO items (user_id, item_name, location, operation_time, client_ip, transcript, item_type)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *;
    `,

    // 查找用户的物品记录
    FIND_USER_ITEM: `
        SELECT * FROM items 
        WHERE user_id = $1 AND item_name = $2
        ORDER BY operation_time DESC 
        LIMIT 1;
    `,

    // 获取用户所有物品记录
    GET_USER_ITEMS: `
        SELECT * FROM items 
        WHERE user_id = $1 
        ORDER BY operation_time DESC 
        LIMIT $2;
    `
};

// ==========================================
// 🔧 数据库工具函数
// ==========================================

// 验证数据库配置
export function validateDatabaseConfig() {
    const errors = [];
    
    if (!SUPABASE_CONFIG.URL) {
        errors.push('SUPABASE_URL 环境变量未设置');
    }
    
    if (!SUPABASE_CONFIG.ANON_KEY) {
        errors.push('SUPABASE_ANON_KEY 环境变量未设置');
    }
    
    if (errors.length > 0) {
        throw new Error(`数据库配置错误: ${errors.join(', ')}`);
    }
    
    return true;
}

// 创建 Supabase 客户端
export async function createSupabaseClient() {
    validateDatabaseConfig();
    
    // 动态导入 Supabase 客户端
    const { createClient } = await import('@supabase/supabase-js');
    
    return createClient(
        SUPABASE_CONFIG.URL,
        SUPABASE_CONFIG.ANON_KEY,
        SUPABASE_CONFIG.OPTIONS
    );
}

// 导出默认配置
export default {
    SUPABASE_CONFIG,
    DATABASE_TABLES,
    SQL_QUERIES,
    validateDatabaseConfig,
    createSupabaseClient
};