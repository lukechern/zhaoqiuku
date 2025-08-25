# Loading Screen Debug Info

## 修复的问题：
1. **布局问题**：loading screen默认可见改为默认隐藏
2. **动画管理**：添加动画状态检查，避免重复启动
3. **状态检查**：showLoadingScreen只在isFirstLoad=true时显示
4. **生命周期管理**：在onDestroy时清理动画

## 预期行为：
1. APP启动：显示loading screen + 动画
2. 首次页面加载完成：隐藏loading screen，设置isFirstLoad=false
3. 后续页面跳转（如点击帮助图标）：不显示loading screen
4. 强制刷新：重新显示loading screen

## 可能的卡顿原因：
- 之前loading screen可能在不应该显示的时候显示
- 动画没有正确清理
- 布局重绘时loading screen意外显示