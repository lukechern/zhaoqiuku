# 存储失败问题排查指南

## 问题描述
提示"记录存储失败"，需要检查数据库表结构是否与代码匹配。

## 可能的原因

### 1. 数据库表结构未更新
**症状**: 错误信息包含 "item_type" 或 "action_type"
**原因**: 数据库表仍使用旧的 `action_type` 字段，但代码尝试插入 `item_type` 字段

### 2. 字段不存在
**症状**: 错误信息包含 "column does not exist"
**原因**: 表结构与代码期望的字段不匹配

### 3. 数据类型不匹配
**症状**: 错误信息包含类型转换错误
**原因**: 字段类型定义与插入的数据类型不匹配

## 诊断步骤

### 1. 运行诊断脚本
```bash
node utils/diagnose-database.js
```

### 2. 检查错误日志
查看控制台输出中的详细错误信息：
- 错误代码 (error.code)
- 错误详情 (error.details)
- 错误提示 (error.hint)

### 3. 手动检查表结构
在 Supabase 控制台中执行：
```sql
-- 查看表结构
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'items' 
ORDER BY ordinal_position;
```

## 解决方案

### 方案1: 执行数据库迁移（推荐）
如果表中有 `action_type` 字段但没有 `item_type` 字段：

```sql
-- 完整迁移脚本
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
```

### 方案2: 重新创建表（如果表为空）
如果表中没有重要数据：

```sql
-- 删除旧表
DROP TABLE IF EXISTS items;

-- 重新创建表（使用新结构）
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

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_items_user_id ON items(user_id);
CREATE INDEX IF NOT EXISTS idx_items_item_name ON items(item_name);
CREATE INDEX IF NOT EXISTS idx_items_user_item ON items(user_id, item_name);
CREATE INDEX IF NOT EXISTS idx_items_operation_time ON items(operation_time);
CREATE INDEX IF NOT EXISTS idx_items_item_type ON items(item_type);
```

### 方案3: 临时兼容性修复
如果无法立即执行迁移，可以临时修改代码以兼容旧结构：

1. 在 `api/item-storage.js` 中临时使用 `action_type` 字段
2. 将 `item_type: type || null` 改为 `action_type: 'put'`

## 验证修复

### 1. 测试插入操作
```bash
node utils/diagnose-database.js
```

### 2. 测试完整流程
1. 录制音频
2. 提交存储请求
3. 检查是否成功存储
4. 测试查询功能

## 预防措施

1. **版本控制**: 为数据库结构变更创建迁移脚本
2. **测试环境**: 在测试环境中先验证迁移脚本
3. **备份**: 执行迁移前备份数据库
4. **监控**: 部署后监控错误日志

## 联系支持

如果问题仍然存在，请提供：
1. 完整的错误日志
2. 数据库表结构信息
3. 诊断脚本的输出结果