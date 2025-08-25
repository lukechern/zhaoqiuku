# 帮助卡片自动弹出功能

## 功能描述

用户首次登录时，系统会自动弹出帮助卡片弹窗，用户点击"我知道了"按钮后，系统会记录到localStorage，有效期3个月内不会重复弹出。但不影响用户手动点击左上角帮助按钮查看帮助。

## 实现细节

### 1. 触发条件
- 用户首次登录（包括页面刷新后的状态恢复）
- localStorage中没有有效的帮助显示记录
- 或者上次显示时间超过3个月

### 2. 存储机制
- **存储键**: `zhaoqiuku_help_shown`
- **存储内容**: 
  ```json
  {
    "timestamp": 1703123456789,
    "version": "1.0"
  }
  ```
- **有效期**: 3个月（90天）

### 3. 用户交互
- 自动弹出延迟1秒，确保页面完全加载
- 用户点击"我知道了"按钮后记录显示状态
- 用户点击关闭按钮(×)也会记录显示状态
- 手动点击帮助按钮不会触发记录机制

## 开发者工具

在浏览器控制台中可以使用以下命令进行测试：

### 重置帮助显示状态
```javascript
resetHelpStatus()
```
执行后下次登录将重新自动弹出帮助。

### 手动触发首次帮助检查
```javascript
testFirstTimeHelp()
```
立即触发首次帮助检查逻辑。

## 测试步骤

1. **测试自动弹出**:
   - 在控制台执行 `resetHelpStatus()`
   - 刷新页面或重新登录
   - 应该在1秒后自动弹出帮助卡片

2. **测试记录机制**:
   - 点击"我知道了"按钮
   - 刷新页面或重新登录
   - 应该不再自动弹出

3. **测试有效期**:
   - 在控制台执行以下代码模拟过期：
   ```javascript
   const expiredData = {
     timestamp: Date.now() - (4 * 30 * 24 * 60 * 60 * 1000), // 4个月前
     version: "1.0"
   };
   localStorage.setItem('zhaoqiuku_help_shown', JSON.stringify(expiredData));
   ```
   - 刷新页面，应该重新自动弹出

4. **测试手动帮助**:
   - 点击左上角帮助按钮
   - 应该正常弹出帮助，不影响自动弹出机制

## 技术实现

### 核心文件
- `public/js/help/help-core_7ree.js` - 主要逻辑实现
- `public/js/help/help-init_7ree.js` - 初始化和事件绑定
- `public/js/auth-manager.js` - 认证状态管理

### 关键方法
- `checkAndShowFirstTimeHelp()` - 检查并自动弹出帮助
- `markHelpAsShown()` - 记录帮助已显示
- `resetHelpShowStatus()` - 重置显示状态（开发工具）

### 事件监听
- `authStateChange` - 监听登录状态变化
- 支持登录(`login`)和状态恢复(`restore`)事件

## 注意事项

1. 自动弹出有1秒延迟，确保页面完全加载
2. 每次会话只会自动弹出一次，避免重复干扰
3. localStorage存储失败不会影响正常功能
4. 兼容WebView环境的性能优化
5. 不影响现有的手动帮助功能