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
            
            // 禁用网络字体加载，强制使用本地字体
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.LOLLIPOP) {
                // 设置默认字体大小，避免字体相关的网络请求
                defaultFontSize = 16
                defaultFixedFontSize = 13
                minimumFontSize = 8
            }
            
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
        
        // 启用硬件加速，提升字体渲染性能
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.HONEYCOMB) {
            webView.setLayerType(android.view.View.LAYER_TYPE_HARDWARE, null)
        }

        // WebViewClient
        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                return false
            }
            
            override fun shouldInterceptRequest(view: WebView?, request: WebResourceRequest?): WebResourceResponse? {
                val url = request?.url?.toString()
                
                // 拦截所有字体相关请求，避免阻塞
                if (url != null && (url.contains("fonts.googleapis.com") || 
                                   url.contains("fonts.gstatic.com") ||
                                   url.contains("gms/fonts") ||
                                   url.contains("google.com/fonts") ||
                                   url.contains("googlefonts") ||
                                   url.contains(".woff") ||
                                   url.contains(".woff2") ||
                                   url.contains(".ttf") ||
                                   url.contains(".otf") ||
                                   url.contains("font-face") ||
                                   url.contains("webfont"))) {
                    Log.d("WebViewSetupHelper", "拦截字体请求: $url")
                    // 返回空的CSS响应，避免网络请求阻塞
                    return WebResourceResponse("text/css", "utf-8", 
                        java.io.ByteArrayInputStream("/* font blocked */".toByteArray()))
                }
                
                return super.shouldInterceptRequest(view, request)
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
                
                // 注入CSS强制使用系统字体，避免Google字体加载
                val fontOverrideCSS = """
                    javascript:(function(){
                        var style = document.createElement('style');
                        style.innerHTML = '* { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important; }';
                        document.head.appendChild(style);
                        
                        // 移除所有Google字体相关的link标签
                        var links = document.querySelectorAll('link[href*="fonts.googleapis.com"], link[href*="fonts.gstatic.com"]');
                        links.forEach(function(link) { link.remove(); });
                        
                        // 移除所有@import字体规则
                        var styles = document.querySelectorAll('style');
                        styles.forEach(function(style) {
                            if (style.innerHTML && (style.innerHTML.includes('fonts.googleapis.com') || style.innerHTML.includes('fonts.gstatic.com'))) {
                                style.remove();
                            }
                        });
                    })();
                """.trimIndent()
                
                view?.evaluateJavascript(fontOverrideCSS, null)
                
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