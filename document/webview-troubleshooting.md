# WebView 录音问题故障排除指南

## 问题：NotReadableError - Could not start audio source

### 错误描述
在Android WebView中尝试录音时出现 `NotReadableError - Could not start audio source` 错误，表示虽然API存在但无法实际访问音频硬件。

### 完整解决方案

#### 1. AndroidManifest.xml 配置

确保添加所有必需的权限和硬件声明：

```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.yourapp.package">

    <!-- 必需权限 -->
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.WAKE_LOCK" />

    <!-- 硬件特性声明 - 关键 -->
    <uses-feature 
        android:name="android.hardware.microphone" 
        android:required="true" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:theme="@style/AppTheme"
        android:usesCleartextTraffic="true">
        
        <activity
            android:name=".MainActivity"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
```

#### 2. 完整的 MainActivity.kt 实现

```kotlin
package com.yourapp.package

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import android.util.Log
import android.webkit.*
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat

class MainActivity : AppCompatActivity() {
    
    private lateinit var webView: WebView
    private val PERMISSION_REQUEST_CODE = 1001
    private var pendingPermissionRequest: PermissionRequest? = null
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        
        webView = findViewById(R.id.webview)
        
        // 先检查权限，再设置WebView
        if (checkAndRequestPermissions()) {
            setupWebView()
            loadWebPage()
        }
    }
    
    private fun checkAndRequestPermissions(): Boolean {
        val permissions = arrayOf(
            Manifest.permission.RECORD_AUDIO,
            Manifest.permission.MODIFY_AUDIO_SETTINGS
        )
        
        val permissionsToRequest = permissions.filter {
            ContextCompat.checkSelfPermission(this, it) != PackageManager.PERMISSION_GRANTED
        }
        
        return if (permissionsToRequest.isNotEmpty()) {
            Log.d("MainActivity", "请求权限: ${permissionsToRequest.joinToString()}")
            ActivityCompat.requestPermissions(
                this,
                permissionsToRequest.toTypedArray(),
                PERMISSION_REQUEST_CODE
            )
            false
        } else {
            Log.d("MainActivity", "所有权限已获得")
            true
        }
    }
    
    private fun setupWebView() {
        Log.d("MainActivity", "设置WebView")
        
        // 启用WebView调试
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
            WebView.setWebContentsDebuggingEnabled(true)
        }
        
        webView.settings.apply {
            // 基础设置
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
            allowFileAccess = true
            allowContentAccess = true
            
            // 媒体设置 - 关键
            mediaPlaybackRequiresUserGesture = false
            
            // 安全设置
            mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
            allowUniversalAccessFromFileURLs = true
            allowFileAccessFromFileURLs = true
            
            // 性能设置
            setRenderPriority(WebSettings.RenderPriority.HIGH)
            cacheMode = WebSettings.LOAD_DEFAULT
            
            // 用户代理
            userAgentString = "$userAgentString MyApp/1.0"
        }
        
        // WebViewClient
        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                return false
            }
            
            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                Log.d("MainActivity", "页面加载完成: $url")
            }
            
            override fun onReceivedError(view: WebView?, request: WebResourceRequest?, error: WebResourceError?) {
                super.onReceivedError(view, request, error)
                Log.e("MainActivity", "WebView错误: ${error?.description}")
            }
        }
        
        // WebChromeClient - 最关键的部分
        webView.webChromeClient = object : WebChromeClient() {
            
            override fun onPermissionRequest(request: PermissionRequest?) {
                Log.d("MainActivity", "WebView权限请求: ${request?.resources?.joinToString()}")
                
                request?.let {
                    val requestedResources = it.resources
                    val audioPermission = PermissionRequest.RESOURCE_AUDIO_CAPTURE
                    
                    if (requestedResources.contains(audioPermission)) {
                        // 检查应用权限
                        val hasAudioPermission = ContextCompat.checkSelfPermission(
                            this@MainActivity,
                            Manifest.permission.RECORD_AUDIO
                        ) == PackageManager.PERMISSION_GRANTED
                        
                        val hasModifyAudioPermission = ContextCompat.checkSelfPermission(
                            this@MainActivity,
                            Manifest.permission.MODIFY_AUDIO_SETTINGS
                        ) == PackageManager.PERMISSION_GRANTED
                        
                        if (hasAudioPermission && hasModifyAudioPermission) {
                            // 在主线程中授予权限
                            runOnUiThread {
                                Log.d("MainActivity", "授予WebView音频权限")
                                it.grant(arrayOf(audioPermission))
                            }
                        } else {
                            Log.d("MainActivity", "应用权限不足，拒绝WebView权限")
                            pendingPermissionRequest = it
                            
                            // 重新请求应用权限
                            val missingPermissions = mutableListOf<String>()
                            if (!hasAudioPermission) missingPermissions.add(Manifest.permission.RECORD_AUDIO)
                            if (!hasModifyAudioPermission) missingPermissions.add(Manifest.permission.MODIFY_AUDIO_SETTINGS)
                            
                            ActivityCompat.requestPermissions(
                                this@MainActivity,
                                missingPermissions.toTypedArray(),
                                PERMISSION_REQUEST_CODE
                            )
                        }
                    } else {
                        Log.d("MainActivity", "拒绝非音频权限请求")
                        it.deny()
                    }
                }
            }
            
            override fun onConsoleMessage(consoleMessage: ConsoleMessage?): Boolean {
                consoleMessage?.let {
                    Log.d("WebView-Console", "${it.messageLevel()}: ${it.message()} (${it.sourceId()}:${it.lineNumber()})")
                }
                return super.onConsoleMessage(consoleMessage)
            }
            
            override fun onJsAlert(view: WebView?, url: String?, message: String?, result: JsResult?): Boolean {
                Log.d("MainActivity", "JS Alert: $message")
                return super.onJsAlert(view, url, message, result)
            }
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
                val allGranted = grantResults.isNotEmpty() && 
                    grantResults.all { it == PackageManager.PERMISSION_GRANTED }
                
                Log.d("MainActivity", "权限请求结果: ${if (allGranted) "全部授予" else "部分拒绝"}")
                
                if (allGranted) {
                    // 如果WebView还没设置，现在设置
                    if (!::webView.isInitialized || webView.webChromeClient == null) {
                        setupWebView()
                        loadWebPage()
                    }
                    
                    // 如果有待处理的WebView权限请求，现在处理
                    pendingPermissionRequest?.let { request ->
                        Log.d("MainActivity", "处理待处理的WebView权限请求")
                        runOnUiThread {
                            request.grant(arrayOf(PermissionRequest.RESOURCE_AUDIO_CAPTURE))
                        }
                        pendingPermissionRequest = null
                    }
                } else {
                    // 权限被拒绝
                    showPermissionDeniedDialog()
                    
                    // 拒绝待处理的WebView权限请求
                    pendingPermissionRequest?.let { request ->
                        request.deny()
                        pendingPermissionRequest = null
                    }
                }
            }
        }
    }
    
    private fun loadWebPage() {
        Log.d("MainActivity", "加载网页")
        // 替换为你的实际URL
        webView.loadUrl("https://your-domain.vercel.app")
        
        // 或者加载测试页面
        // webView.loadUrl("https://your-domain.vercel.app/test_audio.html")
    }
    
    private fun showPermissionDeniedDialog() {
        AlertDialog.Builder(this)
            .setTitle("权限需要")
            .setMessage("语音识别功能需要麦克风权限。请在设置中允许麦克风权限，然后重启应用。")
            .setPositiveButton("去设置") { _, _ ->
                val intent = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS)
                intent.data = Uri.fromParts("package", packageName, null)
                startActivity(intent)
            }
            .setNegativeButton("取消") { dialog, _ ->
                dialog.dismiss()
            }
            .setCancelable(false)
            .show()
    }
    
    override fun onBackPressed() {
        if (::webView.isInitialized && webView.canGoBack()) {
            webView.goBack()
        } else {
            super.onBackPressed()
        }
    }
    
    override fun onDestroy() {
        super.onDestroy()
        if (::webView.isInitialized) {
            webView.destroy()
        }
    }
}
```

#### 3. 布局文件 (activity_main.xml)

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

#### 4. 调试步骤

1. **检查日志**：
   ```bash
   adb logcat | grep -E "(MainActivity|WebView|Permission)"
   ```

2. **Chrome DevTools调试**：
   - 在电脑上打开 `chrome://inspect`
   - 连接设备并选择WebView页面
   - 查看Console中的错误信息

3. **权限验证**：
   ```bash
   adb shell dumpsys package com.yourapp.package | grep permission
   ```

#### 5. 常见问题检查清单

- [ ] AndroidManifest.xml中添加了所有必需权限
- [ ] 添加了硬件特性声明 `android.hardware.microphone`
- [ ] 应用已获得RECORD_AUDIO权限
- [ ] 应用已获得MODIFY_AUDIO_SETTINGS权限
- [ ] WebChromeClient正确实现了onPermissionRequest
- [ ] WebView设置中启用了JavaScript和媒体播放
- [ ] 使用HTTPS协议访问网页
- [ ] WebView版本足够新（Chrome 60+）

#### 6. 测试验证

使用提供的测试页面 `test_audio.html` 进行验证：

1. 部署测试页面到你的服务器
2. 在WebView中访问测试页面
3. 查看详细的系统信息和错误诊断
4. 按照提示逐步排查问题

#### 7. 如果问题仍然存在

1. **更新WebView**：确保设备上的WebView版本是最新的
2. **测试其他设备**：在不同的Android设备上测试
3. **检查设备限制**：某些设备制造商可能有额外的权限限制
4. **联系技术支持**：提供完整的日志信息

---

按照以上步骤配置后，WebView应该能够正常访问麦克风并进行录音。如果仍有问题，请提供详细的日志信息以便进一步诊断。