package com.x7ree.zhaoqiuku.debug

import android.content.Context
import android.graphics.PixelFormat
import android.os.Build
import android.view.WindowManager
import com.x7ree.zhaoqiuku.DebugFloatingBall

class DebugBallDisplayManager(
    private val context: Context,
    private val debugFloatingBall: DebugFloatingBall
) {
    private var windowManager: WindowManager? = null
    private var layoutParams: WindowManager.LayoutParams? = null

    fun show(autoHideHandler: android.os.Handler, autoHideRunnable: Runnable): Boolean {
        if (windowManager != null) return false

        windowManager = context.getSystemService(Context.WINDOW_SERVICE) as WindowManager

        layoutParams = DebugBallPositionHelper.createLayoutParams().apply {
            type = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
            } else {
                @Suppress("DEPRECATION")
                WindowManager.LayoutParams.TYPE_PHONE
            }
            format = PixelFormat.RGBA_8888
            flags = WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
                    WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL or
                    WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS

            // 初始位置：右侧贴边 + 略偏下
            val screenWidth = context.resources.displayMetrics.widthPixels
            val screenHeight = context.resources.displayMetrics.heightPixels
            val (startX_7ree, startY_7ree) = DebugBallPositionHelper.computeInitialPosition(
                screenWidth, screenHeight, width, height
            )
            x = startX_7ree
            y = startY_7ree
        }

        windowManager?.addView(debugFloatingBall, layoutParams)
        scheduleAutoHide(autoHideHandler, autoHideRunnable)
        return true
    }

    fun hide(autoHideHandler: android.os.Handler, autoHideRunnable: Runnable) {
        cancelAutoHide(autoHideHandler, autoHideRunnable)
        windowManager?.removeView(debugFloatingBall)
        windowManager = null
        layoutParams = null
    }

    fun getWindowManager(): WindowManager? {
        return windowManager
    }

    fun getLayoutParams(): WindowManager.LayoutParams? {
        return layoutParams
    }

    private fun scheduleAutoHide(autoHideHandler: android.os.Handler, autoHideRunnable: Runnable) {
        autoHideHandler.removeCallbacks(autoHideRunnable)
        autoHideHandler.postDelayed(autoHideRunnable, 15000L)
    }

    private fun cancelAutoHide(autoHideHandler: android.os.Handler, autoHideRunnable: Runnable) {
        autoHideHandler.removeCallbacks(autoHideRunnable)
    }
}