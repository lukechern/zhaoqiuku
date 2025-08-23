package com.x7ree.zhaoqiuku.debug

import android.view.MotionEvent
import android.view.WindowManager
import android.content.res.Resources
import com.x7ree.zhaoqiuku.DebugFloatingBall
import kotlin.math.abs

class DebugBallTouchHandler(
    private val debugFloatingBall: DebugFloatingBall,
    private val resources: Resources,
    private val displayManager: DebugBallDisplayManager,
    private val autoHideHandler: android.os.Handler,
    private val autoHideRunnable: Runnable
) {
    private var initialX: Int = 0
    private var initialY: Int = 0
    private var initialTouchX: Float = 0f
    private var initialTouchY: Float = 0f

    fun handleTouch(event: MotionEvent): Boolean {
        when (event.action) {
            MotionEvent.ACTION_DOWN -> {
                val layoutParams = displayManager.getLayoutParams()
                initialX = layoutParams?.x ?: 0
                initialY = layoutParams?.y ?: 0
                initialTouchX = event.rawX
                initialTouchY = event.rawY
                cancelAutoHide()
                android.util.Log.d("DebugFloatingBall", "ACTION_DOWN: 触摸开始")
                return true
            }
            MotionEvent.ACTION_MOVE -> {
                val deltaX = (event.rawX - initialTouchX).toInt()
                val deltaY = (event.rawY - initialTouchY).toInt()

                val windowManager = displayManager.getWindowManager()
                val layoutParams = displayManager.getLayoutParams()
                
                layoutParams?.let { params ->
                    val screenWidth = resources.displayMetrics.widthPixels
                    val screenHeight = resources.displayMetrics.heightPixels
                    val windowWidth = params.width
                    val windowHeight = params.height

                    val (newX, newY) = DebugBallPositionHelper.calculateNewPosition(
                        initialX, initialY, deltaX, deltaY,
                        screenWidth, screenHeight, windowWidth, windowHeight
                    )

                    params.x = newX
                    params.y = newY
                    windowManager?.updateViewLayout(debugFloatingBall, params)
                }
                return true
            }
            MotionEvent.ACTION_UP -> {
                val deltaX = abs(event.rawX - initialTouchX)
                val deltaY = abs(event.rawY - initialTouchY)
                val totalDelta = deltaX + deltaY

                android.util.Log.d("DebugFloatingBall", "ACTION_UP: deltaX=$deltaX, deltaY=$deltaY, total=$totalDelta")

                // 增大点击阈值，提高拖动操作的灵敏度
                if (totalDelta < 80) {
                    android.util.Log.d("DebugFloatingBall", "识别为点击事件，切换菜单")
                    // toggleMenu将通过回调处理
                } else {
                    android.util.Log.d("DebugFloatingBall", "识别为拖拽事件，移动到边缘")
                    // 移动到边缘
                    // snapToEdge将通过回调处理
                }
                return true
            }
        }
        return false
    }

    fun snapToEdge(currentX: Int, windowWidth: Int, screenWidth: Int): Int {
        return DebugBallPositionHelper.snapToEdge(currentX, windowWidth, screenWidth)
    }

    fun cancelAutoHide() {
        autoHideHandler.removeCallbacks(autoHideRunnable)
    }
}