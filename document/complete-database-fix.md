# 完整数据库修复方案

## 🔍 问题诊断

根据测试结果，当前数据库状态：
- ✅ 数据库连接正常
- ❌ 表结构异常，无法获取字段信息
- ❌ 存在旧的约束 `items_action_type_check`
- ❌ 插入操作失败

## 🔧 完整修复方案

### 方案1: 重建表结构（推荐，如果表中没有重要数据）

在 Supabase SQL Editor 中执行：

```sql
-- 完整重建表结构
BEGIN;

-- 1. 备份现有数据（如果有）
CREATE TABLE items_backup AS SELECT * FROM items;

-- 2. 删除旧表
DROP TABLE IF EXISTS items CASCADE;

-- 3. 重新创建表（使用新结构）
CREATE TABLE items (
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

-- 4. 创建索引
CREATE INDEX IF NOT EXISTS idx_items_user_id ON items(user_id);
CREATE INDEX IF NOT EXISTS idx_items_item_name ON items(item_name);
CREATE INDEX IF NOT EXISTS idx_items_user_item ON items(user_id, item_name);
CREATE INDEX IF NOT EXISTS idx_items_operation_time ON items(operation_time);
CREATE INDEX IF NOT EXISTS idx_items_item_type ON items(item_type);

-- 5. 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_items_updated_at 
    BEFORE UPDATE ON items 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 6. 如果有备份数据，可以选择性恢复（需要手动调整字段）
-- INSERT INTO items (user_id, item_name, location, operation_time, client_ip, transcript, item_type)
-- SELECT user_id, item_name, location, operation_time, client_ip, transcript, NULL
-- FROM items_backup;

-- 7. 删除备份表（确认数据正确后）
-- DROP TABLE items_backup;

COMMIT;
```

### 方案2: 渐进式修复（如果表中有重要数据）

```sql
-- 渐进式修复，保留现有数据
BEGIN;

-- 1. 删除所有约束
ALTER TABLE items DROP CONSTRAINT IF EXISTS items_action_type_check;
ALTER TABLE items DROP CONSTRAINT IF EXISTS items_pkey CASCADE;

-- 2. 删除所有索引
DROP INDEX IF EXISTS idx_items_action_type;
DROP INDEX IF EXISTS idx_items_user_id;
DROP INDEX IF EXISTS idx_items_item_name;
DROP INDEX IF EXISTS idx_items_user_item;
DROP INDEX IF EXISTS idx_items_operation_time;

-- 3. 添加新字段（如果不存在）
ALTER TABLE items ADD COLUMN IF NOT EXISTS item_type VARCHAR(50);

-- 4. 删除旧字段
ALTER TABLE items DROP COLUMN IF EXISTS action_type;

-- 5. 重新添加主键
ALTER TABLE items ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();
UPDATE items SET id = gen_random_uuid() WHERE id IS NULL;
ALTER TABLE items ADD PRIMARY KEY (id);

-- 6. 重新创建索引
CREATE INDEX IF NOT EXISTS idx_items_user_id ON items(user_id);
CREATE INDEX IF NOT EXISTS idx_items_item_name ON items(item_name);
CREATE INDEX IF NOT EXISTS idx_items_user_item ON items(user_id, item_name);
CREATE INDEX IF NOT EXISTS idx_items_operation_time ON items(operation_time);
CREATE INDEX IF NOT EXISTS idx_items_item_type ON items(item_type);

COMMIT;
```

### 方案3: 临时兼容方案（快速修复）

如果上述方案都有问题，可以临时添加 `action_type` 字段：

```sql
-- 临时兼容方案
BEGIN;

-- 1. 确保 action_type 字段存在
ALTER TABLE items ADD COLUMN IF NOT EXISTS action_type VARCHAR(10) DEFAULT 'put';

-- 2. 更新现有记录
UPDATE items SET action_type = 'put' WHERE action_type IS NULL;

-- 3. 添加约束
ALTER TABLE items ALTER COLUMN action_type SET NOT NULL;
ALTER TABLE items ADD CONSTRAINT items_action_type_check 
    CHECK (action_type IN ('put', 'get'));

-- 4. 确保 item_type 字段存在
ALTER TABLE items ADD COLUMN IF NOT EXISTS item_type VARCHAR(50);

COMMIT;
```

## 🚀 执行步骤

### 1. 选择方案
- **如果表为空或数据不重要** → 使用方案1（重建表）
- **如果有重要数据** → 使用方案2（渐进式修复）
- **如果需要快速修复** → 使用方案3（临时兼容）

### 2. 执行SQL
1. 登录 Supabase 控制台
2. 进入 SQL Editor
3. 复制对应方案的SQL代码
4. 执行并检查结果

### 3. 更新代码
根据选择的方案，可能需要调整代码：

**方案1和2（推荐）**：
- 移除 `action_type` 字段
- 只使用 `item_type` 字段
- 移除查询中的 `action_type` 过滤

**方案3（临时）**：
- 保持当前代码不变
- 同时使用 `action_type` 和 `item_type`

### 4. 测试验证
执行修复后，访问测试页面验证：
`https://your-domain.vercel.app/test-database.html`

## 📞 需要帮助？

如果执行过程中遇到问题，请提供：
1. 执行的SQL方案
2. 具体的错误信息
3. 测试页面的结果