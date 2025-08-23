package com.x7ree.zhaoqiuku.debug

import android.content.Context
import android.widget.ImageView
import android.view.Gravity
import android.view.ViewGroup
import android.widget.FrameLayout
import androidx.appcompat.widget.AppCompatImageView
import com.x7ree.zhaoqiuku.R

class DebugBallView(private val context: Context) {
    companion object {
        const val BALL_SIZE = 240
        const val ICON_SIZE = 120
        const val MENU_ITEM_SIZE = 154
        const val MARGIN = 16
    }

    fun createMainBall(): AppCompatImageView {
        return AppCompatImageView(context).apply {
            layoutParams = FrameLayout.LayoutParams(BALL_SIZE, BALL_SIZE).apply {
                gravity = Gravity.CENTER
            }
            setImageResource(R.drawable.ic_debug_wrench)
            setBackgroundResource(R.drawable.debug_ball_background)
            val padding = (BALL_SIZE - ICON_SIZE) / 2
            setPadding(padding, padding, padding, padding)
            scaleType = ImageView.ScaleType.FIT_CENTER
        }
    }

    fun createMenuBall(iconRes: Int): AppCompatImageView {
        return AppCompatImageView(context).apply {
            layoutParams = FrameLayout.LayoutParams(MENU_ITEM_SIZE, MENU_ITEM_SIZE).apply {
                gravity = Gravity.CENTER
            }
            setImageResource(iconRes)
            setBackgroundResource(R.drawable.debug_menu_ball_background)
            val menuIconSize = (MENU_ITEM_SIZE * 0.6).toInt()
            val menuPadding = (MENU_ITEM_SIZE - menuIconSize) / 2
            setPadding(menuPadding, menuPadding, menuPadding, menuPadding)
            scaleType = ImageView.ScaleType.FIT_CENTER
        }
    }
}