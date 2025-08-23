package com.x7ree.zhaoqiuku.debug

import android.content.res.Resources
import android.view.Gravity
import android.view.WindowManager
import com.x7ree.zhaoqiuku.R
import kotlin.math.max
import kotlin.math.min

class DebugBallPositionHelper {
    companion object {
        private const val BALL_SIZE = 240
        private const val VERTICAL_POSITION_RATIO_7ree = 0.85f
        private const val RIGHT_EDGE_MARGIN_7ree = 0

        fun computeInitialPosition(
            screenWidth: Int,
            screenHeight: Int,
            windowWidth: Int,
            windowHeight: Int
        ): Pair<Int, Int> {
            val ballOffsetInWindow = (windowWidth - BALL_SIZE) / 2
            // 期望球的左上角位置
            val desiredBallLeft = screenWidth - BALL_SIZE - RIGHT_EDGE_MARGIN_7ree
            val desiredBallTop = (screenHeight * VERTICAL_POSITION_RATIO_7ree).toInt() - BALL_SIZE / 2
            val x = desiredBallLeft - ballOffsetInWindow
            val y = desiredBallTop - ballOffsetInWindow
            return Pair(x, y)
        }

        fun createLayoutParams(): WindowManager.LayoutParams {
            return WindowManager.LayoutParams().apply {
                width = BALL_SIZE + 600
                height = BALL_SIZE + 600
                gravity = Gravity.TOP or Gravity.START
            }
        }

        fun calculateNewPosition(
            initialX: Int,
            initialY: Int,
            deltaX: Int,
            deltaY: Int,
            screenWidth: Int,
            screenHeight: Int,
            windowWidth: Int,
            windowHeight: Int
        ): Pair<Int, Int> {
            val ballOffsetInWindow = (windowWidth - BALL_SIZE) / 2

            // 计算新位置
            val newX = initialX + deltaX
            val newY = initialY + deltaY

            // 设置边界限制，确保球可以贴紧边缘但不超出屏幕
            val minX = -ballOffsetInWindow // 球贴左边缘
            val maxX = screenWidth - BALL_SIZE - ballOffsetInWindow // 球贴右边缘
            val minY = -ballOffsetInWindow // 球贴上边缘
            val maxY = screenHeight - BALL_SIZE - ballOffsetInWindow - 200 // 留出导航栏空间

            val finalX = max(minX, min(maxX, newX))
            val finalY = max(minY, min(maxY, newY))

            return Pair(finalX, finalY)
        }

        fun snapToEdge(
            currentX: Int,
            windowWidth: Int,
            screenWidth: Int
        ): Int {
            val actualBallSize = BALL_SIZE
            val ballOffsetInWindow = (windowWidth - actualBallSize) / 2
            val ballCurrentX = currentX + ballOffsetInWindow

            // 计算到左右边缘的距离
            val distanceToLeft = ballCurrentX
            val distanceToRight = screenWidth - ballCurrentX - actualBallSize

            // 吸附到最近的边缘，允许真正贴紧边缘（0px边距）
            return if (distanceToLeft < distanceToRight) {
                // 贴左边缘：球的左边缘对齐屏幕左边缘
                -ballOffsetInWindow
            } else {
                // 贴右边缘：球的右边缘对齐屏幕右边缘
                screenWidth - actualBallSize - ballOffsetInWindow
            }
        }

        fun isOnLeftSide(ballCenterX: Int, screenWidth: Int): Boolean {
            return ballCenterX < screenWidth / 2
        }
    }
}