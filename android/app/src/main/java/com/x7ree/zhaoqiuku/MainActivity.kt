package com.x7ree.zhaoqiuku

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import android.util.Log
import android.view.View
import android.view.WindowManager
import android.webkit.*
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import com.x7ree.zhaoqiuku.config.WebViewConfig

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private lateinit var config: WebViewConfig
    private val PERMISSION_REQUEST_CODE = 1001
    private var pendingPermissionRequest: PermissionRequest? = null
    private lateinit var debugModeManager: DebugModeManager
    private var isFromDebugMode = false
    
    private fun setupFullScreen() {
        // 隐藏标题栏
        supportActionBar?.hide()
        
        // 设置全屏模式
        WindowCompat.setDecorFitsSystemWindows(window, false)
        
        val windowInsetsController = WindowCompat.getInsetsController(window, window.decorView)
        windowInsetsController.systemBarsBehavior = WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
        
        // 隐藏状态栏和导航栏
        windowInsetsController.hide(WindowInsetsCompat.Type.systemBars())
        
        // 保持屏幕常亮
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
    }
    
    private fun setupBackPressedHandler() {
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (::webView.isInitialized && webView.canGoBack()) {
                    webView.goBack()
                } else {
                    finish()
                }
            }
        })
    }
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // 初始化调试模式管理器
        debugModeManager = DebugModeManager.getInstance(this)

        // 处理调试模式intent
        handleDebugModeIntent()

        // 加载配置
        config = WebViewConfig.loadFromAssets(this)

        // 设置全屏显示
        setupFullScreen()

        setContentView(R.layout.activity_main)

        webView = findViewById(R.id.webview)

        // 设置返回键处理
        setupBackPressedHandler()

        // 先检查权限，再设置WebView
        if (checkAndRequestPermissions()) {
            setupWebView()
            loadWebPage()
            // 初始化调试模式悬浮球
            initializeDebugMode()
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
            WebView.setWebContentsDebuggingEnabled(config.enableDebug)
        }
        
        webView.settings.apply {
            // 基础设置 - 使用配置文件
            javaScriptEnabled = config.enableJavaScript
            domStorageEnabled = config.enableDomStorage
            allowFileAccess = true
            allowContentAccess = true
            
            // 媒体设置 - 关键
            mediaPlaybackRequiresUserGesture = config.mediaPlaybackRequiresUserGesture
            
            // 安全设置
            mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
            
            // 缓存设置 - 禁用缓存以获取最新内容
            cacheMode = WebSettings.LOAD_NO_CACHE
            
            // 用户代理 - 使用配置文件
            userAgentString = "$userAgentString ${config.userAgent}"
        }
        
        // 清除所有缓存
        webView.clearCache(true)
        webView.clearHistory()
        webView.clearFormData()
        
        // 清除存储
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            webView.clearMatches()
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
                    if (webView.webChromeClient == null) {
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
        val url = if (config.webViewUrl.isNotEmpty()) {
            config.webViewUrl
        } else {
            Log.w("MainActivity", "配置文件中未设置URL，使用默认URL")
            "https://zhaoqiuku.com/"
        }
        
        // 添加时间戳防止缓存
        val urlWithTimestamp = if (url.contains("?")) {
            "$url&_t=${System.currentTimeMillis()}"
        } else {
            "$url?_t=${System.currentTimeMillis()}"
        }
        
        Log.d("MainActivity", "加载网页: $urlWithTimestamp")
        webView.loadUrl(urlWithTimestamp)
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
    
    // 强制刷新方法
    private fun forceRefresh() {
        webView.clearCache(true)
        webView.clearHistory()
        webView.reload()
    }

    // 处理调试模式intent
    private fun handleDebugModeIntent() {
        val intent = intent
        val data = intent.data

        if (data != null && data.toString() == "zhaoqiuku://debug") {
            // 标记为从调试模式进入
            isFromDebugMode = true
            // 启用调试模式
            debugModeManager.enableDebugMode()
            Log.d("MainActivity", "通过长按菜单进入调试模式")

            // 显示确认提示
            AlertDialog.Builder(this)
                .setTitle("调试模式")
                .setMessage("调试模式已启用，右下角将显示调试悬浮球")
                .setPositiveButton("确定", null)
                .show()
        }
    }

    // 初始化调试模式
    private fun initializeDebugMode() {
        // 只有从调试模式进入时才显示悬浮球
        if (isFromDebugMode && debugModeManager.isDebugModeEnabled()) {
            // 检查悬浮窗权限
            if (checkOverlayPermission()) {
                showDebugFloatingBall()
            } else {
                requestOverlayPermission()
            }
        }
    }

    // 检查悬浮窗权限
    private fun checkOverlayPermission(): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            Settings.canDrawOverlays(this)
        } else {
            true
        }
    }

    // 请求悬浮窗权限
    private fun requestOverlayPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            AlertDialog.Builder(this)
                .setTitle("需要权限")
                .setMessage("调试模式需要悬浮窗权限才能显示调试按钮")
                .setPositiveButton("去设置") { _, _ ->
                    val intent = Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION)
                    intent.data = Uri.parse("package:$packageName")
                    startActivity(intent)
                }
                .setNegativeButton("取消") { _, _ ->
                    debugModeManager.disableDebugMode()
                }
                .setCancelable(false)
                .show()
        }
    }

    // 显示调试悬浮球
    private fun showDebugFloatingBall() {
        debugModeManager.showDebugFloatingBall(this) { menuItem ->
            when (menuItem) {
                DebugFloatingBall.MenuItem.REFRESH -> {
                    Log.d("MainActivity", "执行页面刷新")
                    forceRefresh()
                }
                DebugFloatingBall.MenuItem.CLEAR_CACHE -> {
                    Log.d("MainActivity", "执行清空缓存")
                    clearAppCache()
                }
                DebugFloatingBall.MenuItem.SETTINGS -> {
                    Log.d("MainActivity", "打开参数配置")
                    showSettingsDialog()
                }
            }
        }
    }

    // 清空应用缓存
    private fun clearAppCache() {
        try {
            webView.clearCache(true)
            webView.clearHistory()
            webView.clearFormData()

            // 清空应用缓存目录
            cacheDir?.deleteRecursively()

            AlertDialog.Builder(this)
                .setTitle("缓存清理")
                .setMessage("缓存已清空完成")
                .setPositiveButton("确定", null)
                .show()

            Log.d("MainActivity", "应用缓存已清空")
        } catch (e: Exception) {
            Log.e("MainActivity", "清空缓存失败", e)
            AlertDialog.Builder(this)
                .setTitle("缓存清理")
                .setMessage("清空缓存失败: ${e.message}")
                .setPositiveButton("确定", null)
                .show()
        }
    }

    // 显示设置对话框
    private fun showSettingsDialog() {
        val options = arrayOf(
            "启用调试模式",
            "禁用调试模式",
            "查看应用信息"
        )

        AlertDialog.Builder(this)
            .setTitle("参数配置")
            .setItems(options) { _, which ->
                when (which) {
                    0 -> {
                        debugModeManager.enableDebugMode()
                        // 只有从调试模式进入时才显示悬浮球
                        if (isFromDebugMode) {
                            initializeDebugMode()
                        }
                        Log.d("MainActivity", "调试模式已启用")
                    }
                    1 -> {
                        debugModeManager.disableDebugMode()
                        Log.d("MainActivity", "调试模式已禁用")
                    }
                    2 -> {
                        showAppInfoDialog()
                    }
                }
            }
            .setNegativeButton("取消", null)
            .show()
    }

    // 显示应用信息对话框
    private fun showAppInfoDialog() {
        val info = """
            应用名称: 找秋裤
            版本号: 2.0
            包名: $packageName
            调试模式: ${if (debugModeManager.isDebugModeEnabled()) "已启用" else "未启用"}
        """.trimIndent()

        AlertDialog.Builder(this)
            .setTitle("应用信息")
            .setMessage(info)
            .setPositiveButton("确定", null)
            .show()
    }

    override fun onResume() {
        super.onResume()
        // 每次恢复时清除缓存，确保获取最新内容
        webView.clearCache(true)

        // 检查是否从设置页面返回并获得了悬浮窗权限
        // 只有从调试模式进入时才显示悬浮球
        if (isFromDebugMode && debugModeManager.isDebugModeEnabled() && !debugModeManager.isDebugModeActive() && checkOverlayPermission()) {
            showDebugFloatingBall()
        } else if (!isFromDebugMode && debugModeManager.isDebugModeActive()) {
            // 如果是从正常模式进入但悬浮球正在显示，则隐藏它
            debugModeManager.hideDebugFloatingBall()
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        webView.destroy()
        // 隐藏调试悬浮球
        debugModeManager.hideDebugFloatingBall()
    }
}