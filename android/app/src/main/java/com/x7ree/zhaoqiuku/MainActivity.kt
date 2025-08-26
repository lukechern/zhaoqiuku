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
import android.view.animation.AnimationUtils
import android.webkit.*
import android.widget.ImageView
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import com.x7ree.zhaoqiuku.config.WebViewConfig
import com.x7ree.zhaoqiuku.utils.*

class MainActivity : AppCompatActivity() {

    lateinit var webView: WebView
    lateinit var config: WebViewConfig  // 将config改为public访问权限并延迟初始化
    private lateinit var debugModeManager: DebugModeManager
    private lateinit var webViewSetupHelper: WebViewSetupHelper
    private lateinit var permissionHelper: PermissionHelper
    private lateinit var debugHelper: DebugHelper
    private lateinit var shortcutHelper: ShortcutHelper
    var isFromDebugMode = false
    
    // Loading screen views
    private lateinit var loadingScreen: View
    private lateinit var appLogo: ImageView
    var isFirstLoad = true  // 标记是否为首次加载
    
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

        // 初始化工具类
        config = WebViewConfig.loadFromAssets(this)
        webViewSetupHelper = WebViewSetupHelper(this, config)
        permissionHelper = PermissionHelper(this)
        debugHelper = DebugHelper(this, debugModeManager)
        shortcutHelper = ShortcutHelper(this)

        // 处理调试模式intent
        debugHelper.handleDebugModeIntent()

        // 设置全屏显示
        setupFullScreen()

        setContentView(R.layout.activity_main)

        webView = findViewById(R.id.webview)
        loadingScreen = findViewById(R.id.loading_screen)
        appLogo = findViewById(R.id.app_logo)
        
        // 只在首次加载时显示loading screen和启动动画
        if (isFirstLoad) {
            showLoadingScreen()
        }

        // 设置返回键处理
        setupBackPressedHandler()

        // 先检查权限，再设置WebView
        if (permissionHelper.checkAndRequestPermissions()) {
            // 权限已获得，立即设置WebView
            initializeWebViewWithPermissions()
        } else {
            // 权限未获得，显示loading screen等待权限授予
            showLoadingScreen()
        }
        
        // 刷新快捷方式图标（强制更新）
        shortcutHelper.refreshShortcuts()
    }
    
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
    
    fun forceRefresh() {
        webViewSetupHelper.forceRefresh(webView)
    }
    
    fun startLogoAnimation() {
        if (::appLogo.isInitialized && appLogo.animation == null) {
            val pulseAnimation = AnimationUtils.loadAnimation(this, R.anim.pulse_animation)
            appLogo.startAnimation(pulseAnimation)
        }
    }
    
    private fun stopLogoAnimation() {
        if (::appLogo.isInitialized) {
            appLogo.clearAnimation()
        }
    }
    
    fun setFirstLoadComplete() {
        isFirstLoad = false
    }
    
    fun showLoadingScreen() {
        runOnUiThread {
            if (isFirstLoad && loadingScreen.visibility != View.VISIBLE) {
                loadingScreen.visibility = View.VISIBLE
                startLogoAnimation()
            }
        }
    }
    
    fun hideLoadingScreen() {
        runOnUiThread {
            if (loadingScreen.visibility == View.VISIBLE) {
                stopLogoAnimation()
                loadingScreen.visibility = View.GONE
            }
        }
    }
    
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

    override fun onResume() {
        super.onResume()
        // 仅在配置要求强制刷新的情况下清理缓存，避免每次恢复都导致首屏慢
        if (config.forceRefresh_7ree) {
            webView.clearCache(true)
            // 如果强制刷新，重置为首次加载状态
            isFirstLoad = true
        }

        // 检查是否从设置页面返回并获得了悬浮窗权限
        // 或者应用从后台返回前台时恢复悬浮球显示
        if (isFromDebugMode && debugModeManager.shouldShowFloatingBall() && checkOverlayPermission()) {
            debugHelper.initializeDebugMode()
        } else if (!isFromDebugMode && debugModeManager.isDebugModeActive()) {
            // 如果是从正常模式进入但悬浮球正在显示，则隐藏它
            debugModeManager.hideDebugFloatingBall()
        }
    }

    override fun onPause() {
        super.onPause()
        // 应用进入后台或最小化时临时隐藏悬浮球，确保悬浮球只在app内显示
        if (debugModeManager.isDebugModeActive()) {
            debugModeManager.temporarilyHideFloatingBall()
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        // 清理动画和loading screen
        stopLogoAnimation()
        webView.destroy()
        // 隐藏调试悬浮球
        debugModeManager.hideDebugFloatingBall()
    }
    
    // 检查悬浮窗权限
    private fun checkOverlayPermission(): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            Settings.canDrawOverlays(this)
        } else {
            true
        }
    }
}