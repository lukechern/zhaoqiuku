package com.x7ree.zhaoqiuku

import android.content.Context
import android.content.SharedPreferences
import android.util.Log

class DebugModeManager private constructor(context: Context) {

    companion object {
        private const val PREFS_NAME = "debug_mode_prefs"
        private const val KEY_DEBUG_MODE_ENABLED = "debug_mode_enabled"
        private const val TAG = "DebugModeManager"

        @Volatile
        private var instance: DebugModeManager? = null

        fun getInstance(context: Context): DebugModeManager {
            return instance ?: synchronized(this) {
                instance ?: DebugModeManager(context.applicationContext).also { instance = it }
            }
        }
    }

    private val prefs: SharedPreferences = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    private var debugFloatingBall: DebugFloatingBall? = null
    private var isDebugModeActive = false

    fun isDebugModeEnabled(): Boolean {
        return prefs.getBoolean(KEY_DEBUG_MODE_ENABLED, false)
    }

    fun enableDebugMode() {
        prefs.edit().putBoolean(KEY_DEBUG_MODE_ENABLED, true).apply()
        Log.d(TAG, "调试模式已启用")
    }

    fun disableDebugMode() {
        prefs.edit().putBoolean(KEY_DEBUG_MODE_ENABLED, false).apply()
        hideDebugFloatingBall()
        Log.d(TAG, "调试模式已禁用")
    }

    fun showDebugFloatingBall(context: Context, onMenuItemClick: (DebugFloatingBall.MenuItem) -> Unit) {
        if (!isDebugModeEnabled()) {
            Log.d(TAG, "调试模式未启用，无法显示悬浮球")
            return
        }

        if (debugFloatingBall == null) {
            debugFloatingBall = DebugFloatingBall(context)
            debugFloatingBall?.setOnMenuItemClickListener(onMenuItemClick)
        }

        if (!isDebugModeActive) {
            debugFloatingBall?.show()
            isDebugModeActive = true
            Log.d(TAG, "调试悬浮球已显示")
        }
    }

    fun hideDebugFloatingBall() {
        debugFloatingBall?.hide()
        debugFloatingBall = null
        isDebugModeActive = false
        Log.d(TAG, "调试悬浮球已隐藏")
    }

    fun isDebugModeActive(): Boolean {
        return isDebugModeActive
    }

    fun toggleDebugMode(): Boolean {
        return if (isDebugModeEnabled()) {
            disableDebugMode()
            false
        } else {
            enableDebugMode()
            true
        }
    }
}