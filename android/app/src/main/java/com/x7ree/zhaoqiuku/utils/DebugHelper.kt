package com.x7ree.zhaoqiuku.utils

import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import android.util.Log
import androidx.appcompat.app.AlertDialog
import com.x7ree.zhaoqiuku.DebugFloatingBall
import com.x7ree.zhaoqiuku.DebugModeManager
import com.x7ree.zhaoqiuku.MainActivity
import com.x7ree.zhaoqiuku.R

class DebugHelper(private val activity: MainActivity, private val debugModeManager: DebugModeManager) {

    fun handleDebugModeIntent() {
        val intent = activity.intent
        val data = intent.data

        if (data != null && data.toString() == "zhaoqiuku://debug") {
            // 标记为从调试模式进入
            activity.isFromDebugMode = true
            // 启用调试模式
            debugModeManager.enableDebugMode()
            Log.d("DebugHelper", "通过长按菜单进入调试模式")

            // 显示确认提示
            AlertDialog.Builder(activity)
                .setTitle("调试模式")
                .setMessage("调试模式已启用，右下角将显示调试悬浮球")
                .setPositiveButton("确定", null)
                .show()
        }
    }

    fun initializeDebugMode() {
        // 只有从调试模式进入时才显示悬浮球
        if (activity.isFromDebugMode && debugModeManager.isDebugModeEnabled()) {
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
            Settings.canDrawOverlays(activity)
        } else {
            true
        }
    }

    // 请求悬浮窗权限
    private fun requestOverlayPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            AlertDialog.Builder(activity)
                .setTitle("需要权限")
                .setMessage("调试模式需要悬浮窗权限才能显示调试按钮")
                .setPositiveButton("去设置") { _, _ ->
                    val intent = Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION)
                    intent.data = Uri.parse("package:${activity.packageName}")
                    activity.startActivity(intent)
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
        debugModeManager.showDebugFloatingBall(activity) { menuItem ->
            when (menuItem) {
                DebugFloatingBall.MenuItem.REFRESH -> {
                    Log.d("DebugHelper", "执行页面刷新")
                    activity.forceRefresh()
                }
                DebugFloatingBall.MenuItem.CLEAR_CACHE -> {
                    Log.d("DebugHelper", "执行清空缓存")
                    clearAppCache()
                }
                DebugFloatingBall.MenuItem.SETTINGS -> {
                    Log.d("DebugHelper", "打开参数配置")
                    showSettingsDialog()
                }
            }
        }
    }

    // 清空应用缓存
    private fun clearAppCache() {
        try {
            activity.webView.clearCache(true)
            activity.webView.clearHistory()
            activity.webView.clearFormData()

            // 清空应用缓存目录
            activity.cacheDir?.deleteRecursively()

            AlertDialog.Builder(activity)
                .setTitle("缓存清理")
                .setMessage("缓存已清空完成")
                .setPositiveButton("确定", null)
                .show()

            Log.d("DebugHelper", "应用缓存已清空")
        } catch (e: Exception) {
            Log.e("DebugHelper", "清空缓存失败", e)
            AlertDialog.Builder(activity)
                .setTitle("缓存清理")
                .setMessage("清空缓存失败: ${e.message}")
                .setPositiveButton("确定", null)
                .show()
        }
    }

    // 显示设置对话框
    private fun showSettingsDialog() {
        val options = arrayOf(
            "关闭调试模式",
            "查看应用信息"
        )

        AlertDialog.Builder(activity)
            .setTitle("参数配置")
            .setItems(options) { _, which ->
                when (which) {
                    0 -> {
                        debugModeManager.disableDebugMode()
                        Log.d("DebugHelper", "调试模式已禁用")
                    }
                    1 -> {
                        showAppInfoDialog()
                    }
                }
            }
            .setNegativeButton("取消", null)
            .show()
    }

    // 显示应用信息对话框
    private fun showAppInfoDialog() {
        val packageInfo = activity.packageManager.getPackageInfo(activity.packageName, 0)
        val versionName = packageInfo.versionName
        
        val info = """
            应用名称: 找秋裤
            版本号: ${versionName}
            包名: ${activity.packageName}
            调试模式: ${if (debugModeManager.isDebugModeEnabled()) "已启用" else "未启用"}
        """.trimIndent()

        AlertDialog.Builder(activity)
            .setTitle("应用信息")
            .setMessage(info)
            .setPositiveButton("确定", null)
            .show()
    }
}