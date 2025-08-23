package com.x7ree.zhaoqiuku.debug

import android.animation.AnimatorSet
import android.animation.ObjectAnimator
import android.view.View
import android.widget.ImageView
import androidx.appcompat.widget.AppCompatImageView
import kotlin.math.cos
import kotlin.math.sin

class DebugBallAnimator {
    companion object {
        private const val ANIMATION_DURATION = 300L
        private const val RADIUS = 250f

        fun expandMenu(
            refreshBall: AppCompatImageView,
            trashBall: AppCompatImageView,
            settingsBall: AppCompatImageView,
            isOnLeftSide: Boolean
        ): AnimatorSet {
            // 根据主球位置调整菜单球的角度分布
            val (refreshAngle, trashAngle, settingsAngle) = if (isOnLeftSide) {
                // 主球在左侧，菜单从右侧弹出 (0°-180°区域)
                Triple(
                    Math.toRadians(45.0),   // 右上方
                    Math.toRadians(0.0),    // 正右方
                    Math.toRadians(315.0)   // 右下方
                )
            } else {
                // 主球在右侧，菜单从左侧弹出 (180°-360°区域)
                Triple(
                    Math.toRadians(135.0),  // 左上方
                    Math.toRadians(180.0),  // 正左方
                    Math.toRadians(225.0)   // 左下方
                )
            }

            // 计算菜单球的位置
            val refreshX = RADIUS * cos(refreshAngle).toFloat()
            val refreshY = -RADIUS * sin(refreshAngle).toFloat() // 负号是因为Android坐标系Y轴向下

            val trashX = RADIUS * cos(trashAngle).toFloat()
            val trashY = -RADIUS * sin(trashAngle).toFloat()

            val settingsX = RADIUS * cos(settingsAngle).toFloat()
            val settingsY = -RADIUS * sin(settingsAngle).toFloat()

            // 刷新球动画
            val refreshAnimX = ObjectAnimator.ofFloat(refreshBall, "translationX", 0f, refreshX)
            val refreshAnimY = ObjectAnimator.ofFloat(refreshBall, "translationY", 0f, refreshY)
            val refreshAlpha = ObjectAnimator.ofFloat(refreshBall, "alpha", 0f, 1f)

            // 垃圾桶球动画
            val trashAnimX = ObjectAnimator.ofFloat(trashBall, "translationX", 0f, trashX)
            val trashAnimY = ObjectAnimator.ofFloat(trashBall, "translationY", 0f, trashY)
            val trashAlpha = ObjectAnimator.ofFloat(trashBall, "alpha", 0f, 1f)

            // 设置球动画
            val settingsAnimX = ObjectAnimator.ofFloat(settingsBall, "translationX", 0f, settingsX)
            val settingsAnimY = ObjectAnimator.ofFloat(settingsBall, "translationY", 0f, settingsY)
            val settingsAlpha = ObjectAnimator.ofFloat(settingsBall, "alpha", 0f, 1f)

            val animatorSet = AnimatorSet()
            animatorSet.playTogether(
                refreshAnimX, refreshAnimY, refreshAlpha,
                trashAnimX, trashAnimY, trashAlpha,
                settingsAnimX, settingsAnimY, settingsAlpha
            )
            animatorSet.duration = ANIMATION_DURATION

            // 存储当前菜单位置，供collapseMenu使用
            refreshBall.tag = Pair(refreshX, refreshY)
            trashBall.tag = Pair(trashX, trashY)
            settingsBall.tag = Pair(settingsX, settingsY)

            return animatorSet
        }

        fun collapseMenu(
            refreshBall: AppCompatImageView,
            trashBall: AppCompatImageView,
            settingsBall: AppCompatImageView
        ): AnimatorSet {
            // 获取存储的菜单位置
            val refreshPos = if (refreshBall.tag is Pair<*, *>) {
                @Suppress("UNCHECKED_CAST")
                refreshBall.tag as Pair<Float, Float>
            } else {
                Pair(0f, -250f)
            }
            val trashPos = if (trashBall.tag is Pair<*, *>) {
                @Suppress("UNCHECKED_CAST")
                trashBall.tag as Pair<Float, Float>
            } else {
                Pair(-216.5f, -125f)
            }
            val settingsPos = if (settingsBall.tag is Pair<*, *>) {
                @Suppress("UNCHECKED_CAST")
                settingsBall.tag as Pair<Float, Float>
            } else {
                Pair(-216.5f, 125f)
            }

            val refreshX = refreshPos.first
            val refreshY = refreshPos.second
            val trashX = trashPos.first
            val trashY = trashPos.second
            val settingsX = settingsPos.first
            val settingsY = settingsPos.second

            // 刷新球动画
            val refreshAnimX = ObjectAnimator.ofFloat(refreshBall, "translationX", refreshX, 0f)
            val refreshAnimY = ObjectAnimator.ofFloat(refreshBall, "translationY", refreshY, 0f)
            val refreshAlpha = ObjectAnimator.ofFloat(refreshBall, "alpha", 1f, 0f)

            // 垃圾桶球动画
            val trashAnimX = ObjectAnimator.ofFloat(trashBall, "translationX", trashX, 0f)
            val trashAnimY = ObjectAnimator.ofFloat(trashBall, "translationY", trashY, 0f)
            val trashAlpha = ObjectAnimator.ofFloat(trashBall, "alpha", 1f, 0f)

            // 设置球动画
            val settingsAnimX = ObjectAnimator.ofFloat(settingsBall, "translationX", settingsX, 0f)
            val settingsAnimY = ObjectAnimator.ofFloat(settingsBall, "translationY", settingsY, 0f)
            val settingsAlpha = ObjectAnimator.ofFloat(settingsBall, "alpha", 1f, 0f)

            val animatorSet = AnimatorSet()
            animatorSet.playTogether(
                refreshAnimX, refreshAnimY, refreshAlpha,
                trashAnimX, trashAnimY, trashAlpha,
                settingsAnimX, settingsAnimY, settingsAlpha
            )
            animatorSet.duration = ANIMATION_DURATION

            return animatorSet
        }
    }
}