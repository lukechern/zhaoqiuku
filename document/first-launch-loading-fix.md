# 首次安装App载入界面卡住问题修复

## 问题描述
新安装的app首次打开时，webview会卡在载入界面无法打开网站。但是如果把卡住的app关闭，重新打开，以后就没问题了。

## 问题分析

### 根本原因
1. **权限请求时机问题**：首次安装时需要请求麦克风权限，但WebView初始化和权限请求是异步进行的
2. **WebView初始化竞态条件**：在权限未获得时就开始初始化WebView，导致后续权限授予后WebView状态不正确
3. **Loading Screen状态管理**：首次加载的状态管理存在竞态条件，可能导致loading screen永远不消失
4. **网络请求阻塞**：首次加载时Google字体等网络请求可能阻塞页面渲染

### 具体表现
- 首次安装后打开app，停留在loading screen
- 关闭app重新打开后正常工作（因为权限已获得）
- 权限对话框可能不显示或显示后WebView未正确初始化

## 解决方案

### 1. 改进权限请求流程

**修改前**：
```kotlin
// 权限检查和WebView设置同时进行
if (permissionHelper.checkAndRequestPermissions()) {
    webViewSetupHelper.setupWebView(webView)
    webViewSetupHelper.loadWebPage(webView)
    debugHelper.initializeDebugMode()
}
```

**修改后**：
```kotlin
// 权限检查和WebView设置分离
if (permissionHelper.checkAndRequestPermissions()) {
    // 权限已获得，立即设置WebView
    initializeWebViewWithPermissions()
} else {
    // 权限未获得，显示loading screen等待权限授予
    showLoadingScreen()
}
```

### 2. 新增专门的初始化方法

```kotlin
private fun initializeWebViewWithPermissions() {
    Log.d("MainActivity", "权限已获得，初始化WebView")
    
    // 确保在主线程中执行
    runOnUiThread {
        try {
            // 设置WebView
            webViewSetupHelper.setupWebView(webView)
            
            // 延迟加载网页，确保WebView完全初始化
            webView.post {
                webViewSetupHelper.loadWebPage(webView)
            }
            
            // 初始化调试模式悬浮球
            debugHelper.initializeDebugMode()
            
        } catch (e: Exception) {
            Log.e("MainActivity", "WebView初始化失败: ${e.message}")
            // 出错时隐藏loading screen
            hideLoadingScreen()
        }
    }
}
```

### 3. 改进权限结果处理

```kotlin
override fun onRequestPermissionsResult(
    requestCode: Int,
    permissions: Array<out String>,
    grantResults: IntArray
) {
    super.onRequestPermissionsResult(requestCode, permissions, grantResults)
    
    // 处理权限结果
    val allGranted = grantResults.isNotEmpty() && 
        grantResults.all { it == PackageManager.PERMISSION_GRANTED }
    
    if (allGranted) {
        // 权限获得后初始化WebView
        initializeWebViewWithPermissions()
    } else {
        // 权限被拒绝，显示说明对话框
        permissionHelper.showPermissionDeniedDialog()
        // 隐藏loading screen
        hideLoadingScreen()
    }
    
    // 同时调用WebViewSetupHelper的权限处理
    webViewSetupHelper.handlePermissionResult(requestCode, permissions, grantResults, webView)
}
```

### 4. 添加超时保护机制

```kotlin
fun loadWebPage(webView: WebView) {
    // ... URL处理逻辑 ...
    
    // 设置超时机制，防止loading screen永远不消失
    if (activity.isFirstLoad) {
        webView.postDelayed({
            if (activity.isFirstLoad) {
                Log.w("WebViewSetupHelper", "页面加载超时，强制隐藏loading screen")
                activity.hideLoadingScreen()
                activity.setFirstLoadComplete()
            }
        }, 10000) // 10秒超时
    }
    
    webView.loadUrl(finalUrl)
}
```

### 5. 改进页面加载完成处理

```kotlin
override fun onPageFinished(view: WebView?, url: String?) {
    super.onPageFinished(view, url)
    Log.d("WebViewSetupHelper", "页面加载完成: $url, isFirstLoad: ${activity.isFirstLoad}")
    
    // ... 字体处理逻辑 ...
    
    // 延迟隐藏loading screen，确保页面内容已渲染
    if (activity.isFirstLoad) {
        view?.postDelayed({
            activity.hideLoadingScreen()
            activity.setFirstLoadComplete()
        }, 500) // 延迟500ms确保页面完全加载
    }
}
```

## 修复效果

### 修复前的问题
1. 首次安装打开app卡在loading screen
2. 权限对话框可能不显示
3. 需要关闭重开才能正常使用

### 修复后的行为
1. 首次安装打开app显示权限请求对话框
2. 用户授予权限后立即初始化WebView并加载页面
3. 如果用户拒绝权限，显示说明对话框并隐藏loading screen
4. 添加10秒超时保护，防止永远卡在loading screen
5. 页面加载完成后延迟500ms隐藏loading screen，确保内容已渲染

## 测试建议

### 测试场景
1. **全新安装测试**：
   - 卸载app
   - 重新安装
   - 首次打开验证权限请求和页面加载

2. **权限拒绝测试**：
   - 首次打开时拒绝权限
   - 验证是否显示说明对话框
   - 验证loading screen是否正确隐藏

3. **权限授予测试**：
   - 首次打开时授予权限
   - 验证WebView是否正确初始化和加载

4. **网络异常测试**：
   - 在网络较差的环境下测试
   - 验证超时机制是否生效

### 验证要点
- [ ] 首次安装不再卡在loading screen
- [ ] 权限请求对话框正常显示
- [ ] 权限授予后页面正常加载
- [ ] 权限拒绝后有合适的提示
- [ ] 超时保护机制生效
- [ ] 后续打开app正常工作

## 相关文件

### 修改的文件
- `android/app/src/main/java/com/x7ree/zhaoqiuku/MainActivity.kt`
- `android/app/src/main/java/com/x7ree/zhaoqiuku/utils/WebViewSetupHelper.kt`

### 相关配置文件
- `android/app/src/main/AndroidManifest.xml` (权限配置)
- `android/app/src/main/assets/webViewConfig.json` (WebView配置)

### 相关文档
- `document/webview-setup.md` (WebView配置指南)
- `document/webview-troubleshooting.md` (故障排除指南)
- `android/debug_loading.md` (Loading Screen调试信息)

## 注意事项

1. **权限请求时机**：确保在WebView初始化前获得所有必要权限
2. **主线程操作**：所有UI相关操作都在主线程中执行
3. **异常处理**：添加try-catch保护，防止初始化失败导致app崩溃
4. **超时保护**：防止网络问题导致loading screen永远不消失
5. **状态管理**：正确管理`isFirstLoad`标志，避免重复显示loading screen

这次修复应该能够解决新安装app首次运行时卡在载入界面的问题。