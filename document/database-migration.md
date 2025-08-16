# 数据库迁移指南

## 字段重命名：action_type → item_type

### 变更说明

- **旧字段**: `action_type` - 用于存储操作类型 ('put', 'get')
- **新字段**: `item_type` - 用于存储物品类型（从API返回的type字段）

### 迁移步骤

#### 1. 添加新字段

```sql
-- 添加新的 item_type 字段
ALTER TABLE items ADD COLUMN item_type VARCHAR(50);
```

#### 2. 删除旧字段和约束

```sql
-- 删除旧的索引
DROP INDEX IF EXISTS idx_items_action_type;

-- 删除旧字段
ALTER TABLE items DROP COLUMN action_type;
```

#### 3. 创建新索引

```sql
-- 为新字段创建索引
CREATE INDEX IF NOT EXISTS idx_items_item_type ON items(item_type);
```

#### 4. 完整迁移脚本

```sql
-- 数据库迁移脚本：action_type → item_type
-- 执行前请备份数据库

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

### 注意事项

1. **数据备份**: 执行迁移前请务必备份数据库
2. **停机时间**: 建议在低峰期执行迁移
3. **应用更新**: 迁移完成后需要部署新版本应用代码
4. **数据丢失**: 原有的 action_type 数据将被删除，新的 item_type 字段初始为空

### 验证迁移

迁移完成后，可以通过以下SQL验证表结构：

```sql
-- 查看表结构
\d items;

-- 查看索引
\di items*;

-- 检查新字段
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'items' AND column_name = 'item_type';
```