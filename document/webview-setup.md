# Android WebView 配置指南

## 问题描述

在Android应用的WebView中使用语音识别功能时，可能遇到以下问题：
- 无法显示麦克风权限请求提示
- 权限请求被静默拒绝
- 录音功能无法正常工作

## 解决方案

### 1. Android应用权限配置

在 `AndroidManifest.xml` 中添加必要权限：

```xml
<!-- 麦克风权限 -->
<uses-permission android:name="android.permission.RECORD_AUDIO" />

<!-- 网络权限 -->
<uses-permission android:name="android.permission.INTERNET" />

<!-- 如果需要访问外部存储 -->
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
```

### 2. WebView 配置 (Kotlin)

```kotlin
import android.Manifest
import android.content.pm.PackageManager
import android.webkit.*
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat

class MainActivity : AppCompatActivity() {
    
    private lateinit var webView: WebView
    private val PERMISSION_REQUEST_CODE = 1001
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        
        webView = findViewById(R.id.webview)
        setupWebView()
        
        // 检查并请求权限
        checkPermissions()
    }
    
    private fun setupWebView() {
        webView.settings.apply {
            // 启用JavaScript
            javaScriptEnabled = true
            
            // 启用DOM存储
            domStorageEnabled = true
            
            // 启用数据库
            databaseEnabled = true
            
            // 允许文件访问
            allowFileAccess = true
            allowContentAccess = true
            
            // 启用媒体播放
            mediaPlaybackRequiresUserGesture = false
            
            // 混合内容模式
            mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
            
            // 用户代理（可选，用于服务端识别）
            userAgentString = "$userAgentString MyApp/1.0"
        }
        
        // 设置WebViewClient
        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                return false
            }
            
            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                // 页面加载完成后的处理
            }
        }
        
        // 设置WebChromeClient - 关键配置
        webView.webChromeClient = object : WebChromeClient() {
            
            // 处理权限请求 - 最重要的部分
            override fun onPermissionRequest(request: PermissionRequest?) {
                request?.let {
                    // 检查请求的权限
                    val requestedResources = it.resources
                    val audioPermission = PermissionRequest.RESOURCE_AUDIO_CAPTURE
                    
                    if (requestedResources.contains(audioPermission)) {
                        // 检查应用是否有麦克风权限
                        if (ContextCompat.checkSelfPermission(
                                this@MainActivity,
                                Manifest.permission.RECORD_AUDIO
                            ) == PackageManager.PERMISSION_GRANTED
                        ) {
                            // 授予WebView权限
                            it.grant(arrayOf(audioPermission))
                        } else {
                            // 请求应用权限
                            ActivityCompat.requestPermissions(
                                this@MainActivity,
                                arrayOf(Manifest.permission.RECORD_AUDIO),
                                PERMISSION_REQUEST_CODE
                            )
                            // 暂时拒绝WebView权限，等待用户授权后重新处理
                            it.deny()
                        }
                    }
                }
            }
            
            // 处理JavaScript对话框
            override fun onJsAlert(view: WebView?, url: String?, message: String?, result: JsResult?): Boolean {
                // 可以自定义处理JavaScript alert
                return super.onJsAlert(view, url, message, result)
            }
            
            // 处理文件选择
            override fun onShowFileChooser(
                webView: WebView?,
                filePathCallback: ValueCallback<Array<Uri>>?,
                fileChooserParams: FileChooserParams?
            ): Boolean {
                // 如果需要文件上传功能
                return super.onShowFileChooser(webView, filePathCallback, fileChooserParams)
            }
        }
    }
    
    private fun checkPermissions() {
        val permissions = arrayOf(
            Manifest.permission.RECORD_AUDIO,
            Manifest.permission.INTERNET
        )
        
        val permissionsToRequest = permissions.filter {
            ContextCompat.checkSelfPermission(this, it) != PackageManager.PERMISSION_GRANTED
        }
        
        if (permissionsToRequest.isNotEmpty()) {
            ActivityCompat.requestPermissions(
                this,
                permissionsToRequest.toTypedArray(),
                PERMISSION_REQUEST_CODE
            )
        } else {
            // 权限已获得，加载网页
            loadWebPage()
        }
    }
    
    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<out String>,
        grantResults: IntArray
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        
        when (requestCode) {
            PERMISSION_REQUEST_CODE -> {
                if (grantResults.isNotEmpty() && 
                    grantResults.all { it == PackageManager.PERMISSION_GRANTED }) {
                    // 所有权限已获得
                    loadWebPage()
                } else {
                    // 权限被拒绝，显示说明
                    showPermissionDeniedDialog()
                }
            }
        }
    }
    
    private fun loadWebPage() {
        // 加载你的网页
        webView.loadUrl("https://your-domain.vercel.app")
    }
    
    private fun showPermissionDeniedDialog() {
        AlertDialog.Builder(this)
            .setTitle("权限需要")
            .setMessage("语音识别功能需要麦克风权限，请在设置中允许。")
            .setPositiveButton("去设置") { _, _ ->
                // 跳转到应用设置页面
                val intent = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS)
                intent.data = Uri.fromParts("package", packageName, null)
                startActivity(intent)
            }
            .setNegativeButton("取消", null)
            .show()
    }
    
    override fun onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack()
        } else {
            super.onBackPressed()
        }
    }
}
```

### 3. 布局文件 (activity_main.xml)

```xml
<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:orientation="vertical">

    <WebView
        android:id="@+id/webview"
        android:layout_width="match_parent"
        android:layout_height="match_parent" />

</LinearLayout>
```

### 4. 高级配置选项

#### 4.1 自定义权限处理

```kotlin
// 更精细的权限控制
private fun handleWebViewPermission(request: PermissionRequest) {
    val resources = request.resources
    val grantedPermissions = mutableListOf<String>()
    
    for (resource in resources) {
        when (resource) {
            PermissionRequest.RESOURCE_AUDIO_CAPTURE -> {
                if (hasAudioPermission()) {
                    grantedPermissions.add(resource)
                }
            }
            PermissionRequest.RESOURCE_VIDEO_CAPTURE -> {
                if (hasCameraPermission()) {
                    grantedPermissions.add(resource)
                }
            }
        }
    }
    
    if (grantedPermissions.isNotEmpty()) {
        request.grant(grantedPermissions.toTypedArray())
    } else {
        request.deny()
    }
}
```

#### 4.2 调试和日志

```kotlin
// 添加调试日志
webView.webChromeClient = object : WebChromeClient() {
    override fun onPermissionRequest(request: PermissionRequest?) {
        Log.d("WebView", "权限请求: ${request?.resources?.joinToString()}")
        super.onPermissionRequest(request)
    }
    
    override fun onConsoleMessage(consoleMessage: ConsoleMessage?): Boolean {
        Log.d("WebView", "JS Console: ${consoleMessage?.message()}")
        return super.onConsoleMessage(consoleMessage)
    }
}
```

### 5. 常见问题解决

#### 5.1 权限请求不显示

**原因**: WebChromeClient未正确设置或onPermissionRequest未实现
**解决**: 确保按照上述代码正确实现WebChromeClient

#### 5.2 权限被静默拒绝

**原因**: 应用层面没有麦克风权限
**解决**: 先获取应用权限，再处理WebView权限请求

#### 5.3 录音格式不支持

**原因**: WebView的MediaRecorder支持格式有限
**解决**: 网页端已自动适配WebView环境，选择最兼容的格式

#### 5.4 HTTPS要求

**原因**: 现代浏览器要求HTTPS才能访问麦克风
**解决**: 确保网页使用HTTPS协议，或在开发时使用localhost

### 6. 测试建议

#### 6.1 权限测试

```kotlin
// 测试权限状态
private fun testPermissions() {
    val audioPermission = ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO)
    Log.d("Permission", "Audio permission: ${if (audioPermission == PackageManager.PERMISSION_GRANTED) "GRANTED" else "DENIED"}")
}
```

#### 6.2 WebView功能测试

```kotlin
// 测试WebView设置
private fun testWebViewSettings() {
    Log.d("WebView", "JavaScript enabled: ${webView.settings.javaScriptEnabled}")
    Log.d("WebView", "DOM storage enabled: ${webView.settings.domStorageEnabled}")
    Log.d("WebView", "Media playback requires gesture: ${webView.settings.mediaPlaybackRequiresUserGesture}")
}
```

### 7. 最佳实践

1. **权限请求时机**: 在用户首次尝试使用录音功能时请求权限
2. **用户体验**: 提供清晰的权限说明和引导
3. **错误处理**: 对权限拒绝情况提供友好的提示
4. **测试覆盖**: 在不同Android版本和设备上测试
5. **降级方案**: 为不支持的设备提供替代方案

### 8. 调试工具

#### 8.1 Chrome DevTools

在电脑上打开 `chrome://inspect`，可以调试WebView中的网页

#### 8.2 日志监控

```bash
# 查看WebView相关日志
adb logcat | grep -i webview
adb logcat | grep -i permission
```

### 9. 版本兼容性

- **Android 6.0+**: 需要运行时权限请求
- **Android 7.0+**: 更严格的网络安全配置
- **Android 8.0+**: WebView更新机制变化
- **Android 10+**: 作用域存储影响

确保在目标Android版本上充分测试功能。

---

按照以上配置，WebView应该能够正常处理麦克风权限请求并使用语音识别功能。如果仍有问题，请检查具体的错误日志。