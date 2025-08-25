package com.x7ree.zhaoqiuku.utils

import android.Manifest
import android.content.pm.PackageManager
import android.util.Log
import android.webkit.*
import androidx.core.content.ContextCompat
import com.x7ree.zhaoqiuku.MainActivity
import com.x7ree.zhaoqiuku.config.WebViewConfig

class WebViewSetupHelper(private val activity: MainActivity, private val config: WebViewConfig) {

    private val PERMISSION_REQUEST_CODE = 1001
    private var pendingPermissionRequest: PermissionRequest? = null

    fun setupWebView(webView: WebView) {
        Log.d("WebViewSetupHelper", "设置WebView")
        
        // 启用WebView调试
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.KITKAT) {
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
            
            // 缓存设置 - 根据配置控制
            cacheMode = if (config.disableCache_7ree) WebSettings.LOAD_NO_CACHE else WebSettings.LOAD_DEFAULT
            
            // 用户代理 - 使用配置文件
            userAgentString = "$userAgentString ${config.userAgent}"
        }
        
        // 清除缓存仅在需要禁用缓存或强制刷新时执行
        if (config.disableCache_7ree || config.forceRefresh_7ree) {
            webView.clearCache(true)
            webView.clearHistory()
            webView.clearFormData()
        }
        
        // 清除存储
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.LOLLIPOP) {
            webView.clearMatches()
        }        

        // WebViewClient
        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                return false
            }
            
            override fun onPageStarted(view: WebView?, url: String?, favicon: android.graphics.Bitmap?) {
                super.onPageStarted(view, url, favicon)
                Log.d("WebViewSetupHelper", "页面开始加载: $url, isFirstLoad: ${activity.isFirstLoad}")
                // 只在首次加载时显示loading screen
                if (activity.isFirstLoad) {
                    activity.showLoadingScreen()
                }
            }
            
            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                Log.d("WebViewSetupHelper", "页面加载完成: $url, isFirstLoad: ${activity.isFirstLoad}")
                // 只在首次加载时隐藏loading screen，并标记首次加载完成
                if (activity.isFirstLoad) {
                    activity.hideLoadingScreen()
                    activity.setFirstLoadComplete()
                }
            }
            
            override fun onReceivedError(view: WebView?, request: WebResourceRequest?, error: WebResourceError?) {
                super.onReceivedError(view, request, error)
                Log.e("WebViewSetupHelper", "WebView错误: ${error?.description}")
                // 出错时也隐藏loading screen（如果是首次加载）
                if (activity.isFirstLoad) {
                    activity.hideLoadingScreen()
                    activity.setFirstLoadComplete()
                }
            }
        }
        
        // WebChromeClient - 最关键的部分
        webView.webChromeClient = object : WebChromeClient() {
            
            override fun onPermissionRequest(request: PermissionRequest?) {
                Log.d("WebViewSetupHelper", "WebView权限请求: ${request?.resources?.joinToString()}")
                
                request?.let {
                    val requestedResources = it.resources
                    val audioPermission = PermissionRequest.RESOURCE_AUDIO_CAPTURE
                    
                    if (requestedResources.contains(audioPermission)) {
                        // 检查应用权限
                        val hasAudioPermission = ContextCompat.checkSelfPermission(
                            activity,
                            Manifest.permission.RECORD_AUDIO
                        ) == PackageManager.PERMISSION_GRANTED
                        
                        val hasModifyAudioPermission = ContextCompat.checkSelfPermission(
                            activity,
                            Manifest.permission.MODIFY_AUDIO_SETTINGS
                        ) == PackageManager.PERMISSION_GRANTED
                        
                        if (hasAudioPermission && hasModifyAudioPermission) {
                            // 在主线程中授予权限
                            activity.runOnUiThread {
                                Log.d("WebViewSetupHelper", "授予WebView音频权限")
                                it.grant(arrayOf(audioPermission))
                            }
                        } else {
                            Log.d("WebViewSetupHelper", "应用权限不足，拒绝WebView权限")
                            pendingPermissionRequest = it
                            
                            // 重新请求应用权限
                            val missingPermissions = mutableListOf<String>()
                            if (!hasAudioPermission) missingPermissions.add(Manifest.permission.RECORD_AUDIO)
                            if (!hasModifyAudioPermission) missingPermissions.add(Manifest.permission.MODIFY_AUDIO_SETTINGS)
                            
                            androidx.core.app.ActivityCompat.requestPermissions(
                                activity,
                                missingPermissions.toTypedArray(),
                                PERMISSION_REQUEST_CODE
                            )
                        }
                    } else {
                        Log.d("WebViewSetupHelper", "拒绝非音频权限请求")
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
                Log.d("WebViewSetupHelper", "JS Alert: $message")
                return super.onJsAlert(view, url, message, result)
            }
        }
    }
    
    fun handlePermissionResult(
        requestCode: Int,
        permissions: Array<out String>,
        grantResults: IntArray,
        webView: WebView
    ) {
        when (requestCode) {
            PERMISSION_REQUEST_CODE -> {
                val allGranted = grantResults.isNotEmpty() && 
                    grantResults.all { it == PackageManager.PERMISSION_GRANTED }
                
                Log.d("WebViewSetupHelper", "权限请求结果: ${if (allGranted) "全部授予" else "部分拒绝"}")
                
                if (allGranted) {
                    // 如果WebView还没设置，现在设置
                    if (webView.webChromeClient == null) {
                        setupWebView(webView)
                    }
                    
                    // 如果有待处理的WebView权限请求，现在处理
                    pendingPermissionRequest?.let { request ->
                        Log.d("WebViewSetupHelper", "处理待处理的WebView权限请求")
                        activity.runOnUiThread {
                            request.grant(arrayOf(PermissionRequest.RESOURCE_AUDIO_CAPTURE))
                        }
                        pendingPermissionRequest = null
                    }
                } else {
                    // 权限被拒绝，拒绝待处理的WebView权限请求
                    pendingPermissionRequest?.let { request ->
                        request.deny()
                        pendingPermissionRequest = null
                    }
                }
            }
        }
    }
    
    fun loadWebPage(webView: WebView) {
        val url = if (config.webViewUrl.isNotEmpty()) {
            config.webViewUrl
        } else {
            Log.w("WebViewSetupHelper", "配置文件中未设置URL，使用默认URL")
            "https://zhaoqiuku.com/"
        }
        
        // 根据配置决定是否添加时间戳防止缓存
        val finalUrl = if (config.forceRefresh_7ree) {
            if (url.contains("?")) {
                "$url&_t=${System.currentTimeMillis()}"
            } else {
                "$url?_t=${System.currentTimeMillis()}"
            }
        } else {
            url
        }
        
        Log.d("WebViewSetupHelper", "加载网页: $finalUrl")
        webView.loadUrl(finalUrl)
    }
    
    fun forceRefresh(webView: WebView) {
        // 强制刷新时重置为首次加载状态，显示loading screen
        activity.isFirstLoad = true
        activity.showLoadingScreen()
        webView.clearCache(true)
        webView.clearHistory()
        webView.reload()
    }
}