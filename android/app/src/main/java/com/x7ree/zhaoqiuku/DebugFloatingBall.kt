package com.x7ree.zhaoqiuku

import android.animation.AnimatorSet
import android.animation.ObjectAnimator
import android.content.Context
import android.graphics.Color
import android.graphics.PixelFormat
import android.os.Handler
import android.os.Looper
import android.util.AttributeSet
import android.view.Gravity
import android.view.MotionEvent
import android.view.View
import android.view.ViewGroup
import android.view.WindowManager
import android.widget.FrameLayout
import android.widget.ImageView
import androidx.appcompat.widget.AppCompatImageView
import androidx.core.content.ContextCompat
import kotlin.math.abs
import kotlin.math.max
import kotlin.math.min

class DebugFloatingBall @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0
) : FrameLayout(context, attrs, defStyleAttr) {

    companion object {
        private const val BALL_SIZE = 240
        private const val ICON_SIZE = 120 // 图标尺寸为球的50%，留出边距
        private const val MENU_ITEM_SIZE = 192
        private const val MARGIN = 16
        private const val ANIMATION_DURATION = 300L
        private const val AUTO_HIDE_DELAY = 15000L // 增加到15秒
    }

    private var windowManager: WindowManager? = null
    private var layoutParams: WindowManager.LayoutParams? = null

    private var mainBall: AppCompatImageView
    private var refreshBall: AppCompatImageView
    private var trashBall: AppCompatImageView
    private var settingsBall: AppCompatImageView

    private var isMenuExpanded = false
    private var initialX: Int = 0
    private var initialY: Int = 0
    private var initialTouchX: Float = 0f
    private var initialTouchY: Float = 0f

    private var onMenuItemClickListener: ((MenuItem) -> Unit)? = null
    private val autoHideHandler = Handler(Looper.getMainLooper())
    private val autoHideRunnable = Runnable { collapseMenu() }

    enum class MenuItem {
        REFRESH, CLEAR_CACHE, SETTINGS
    }

    init {
        // 初始化主球
        mainBall = AppCompatImageView(context).apply {
            layoutParams = LayoutParams(BALL_SIZE, BALL_SIZE).apply {
                gravity = Gravity.CENTER_HORIZONTAL or Gravity.BOTTOM
                // 设置边距，将主球定位在容器的右下角
                setMargins(200, 200, 0, 0)
            }
            setImageResource(R.drawable.ic_debug_wrench)
            setBackgroundResource(R.drawable.debug_ball_background)
            // 添加内边距，确保图标不超出圆形边界
            val padding = (BALL_SIZE - ICON_SIZE) / 2
            setPadding(padding, padding, padding, padding)
            scaleType = ImageView.ScaleType.FIT_CENTER
            // 只使用TouchListener处理所有触摸事件，避免冲突
            setOnTouchListener { _, event -> handleTouch(event) }
        }

        // 初始化菜单球
        refreshBall = createMenuBall(R.drawable.ic_debug_refresh, MenuItem.REFRESH)
        trashBall = createMenuBall(R.drawable.ic_debug_trash, MenuItem.CLEAR_CACHE)
        settingsBall = createMenuBall(R.drawable.ic_debug_settings, MenuItem.SETTINGS)

        // 添加到布局
        addView(mainBall)
        addView(refreshBall)
        addView(trashBall)
        addView(settingsBall)

        // 初始化状态
        collapseMenu()
    }

    private fun createMenuBall(iconRes: Int, menuItem: MenuItem): AppCompatImageView {
        return AppCompatImageView(context).apply {
            // 设置菜单球的初始位置，位于主球中心
            layoutParams = LayoutParams(MENU_ITEM_SIZE, MENU_ITEM_SIZE).apply {
                gravity = Gravity.CENTER_HORIZONTAL or Gravity.BOTTOM
                setMargins(200 + (BALL_SIZE - MENU_ITEM_SIZE) / 2, 200 + (BALL_SIZE - MENU_ITEM_SIZE) / 2, 0, 0)
            }
            setImageResource(iconRes)
            setBackgroundResource(R.drawable.debug_menu_ball_background)
            // 为菜单球也添加内边距
            val menuIconSize = (MENU_ITEM_SIZE * 0.6).toInt() // 菜单图标为球的60%
            val menuPadding = (MENU_ITEM_SIZE - menuIconSize) / 2
            setPadding(menuPadding, menuPadding, menuPadding, menuPadding)
            scaleType = ImageView.ScaleType.FIT_CENTER
            visibility = View.GONE
            alpha = 0f
            setOnClickListener {
                onMenuItemClickListener?.invoke(menuItem)
                collapseMenu()
            }
        }
    }

    private fun handleTouch(event: MotionEvent): Boolean {
        when (event.action) {
            MotionEvent.ACTION_DOWN -> {
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

                layoutParams?.let { params ->
                    params.x = initialX + deltaX
                    params.y = initialY + deltaY
                    windowManager?.updateViewLayout(this, params)
                }
                return true
            }
            MotionEvent.ACTION_UP -> {
                val deltaX = abs(event.rawX - initialTouchX)
                val deltaY = abs(event.rawY - initialTouchY)
                val totalDelta = deltaX + deltaY

                android.util.Log.d("DebugFloatingBall", "ACTION_UP: deltaX=$deltaX, deltaY=$deltaY, total=$totalDelta")

                // 放宽点击阈值，提高点击识别率
                if (totalDelta < 30) {
                    android.util.Log.d("DebugFloatingBall", "识别为点击事件，切换菜单")
                    toggleMenu()
                    // 如果菜单展开，不设置自动隐藏
                    if (!isMenuExpanded) {
                        scheduleAutoHide()
                    }
                } else {
                    android.util.Log.d("DebugFloatingBall", "识别为拖拽事件，移动到边缘")
                    // 移动到边缘
                    snapToEdge()
                    scheduleAutoHide()
                }
                return true
            }
        }
        return false
    }

    private fun snapToEdge() {
        layoutParams?.let { params ->
            val screenWidth = resources.displayMetrics.widthPixels
            val currentX = params.x
            val windowWidth = params.width

            // 计算到左右边缘的距离
            val distanceToLeft = currentX
            val distanceToRight = screenWidth - currentX - windowWidth

            // 吸附到最近的边缘
            params.x = if (distanceToLeft < distanceToRight) {
                MARGIN
            } else {
                screenWidth - windowWidth - MARGIN
            }

            windowManager?.updateViewLayout(this, params)
        }
    }

    private fun toggleMenu() {
        android.util.Log.d("DebugFloatingBall", "toggleMenu: isMenuExpanded=$isMenuExpanded")
        if (isMenuExpanded) {
            collapseMenu()
        } else {
            expandMenu()
        }
    }

    private fun expandMenu() {
        if (isMenuExpanded) return
        android.util.Log.d("DebugFloatingBall", "expandMenu: 开始展开菜单")
        isMenuExpanded = true

        // 显示菜单球
        refreshBall.visibility = View.VISIBLE
        trashBall.visibility = View.VISIBLE
        settingsBall.visibility = View.VISIBLE

        // 创建动画 - 设计圆形布局，围绕主球显示
        val animatorSet = AnimatorSet()
        val radius = 150f // 围绕半径
        
        // 计算三个菜单球的位置（120度间隔）
        // 刷新球：左上方 (-120度)
        val refreshX = -radius * 0.866f // cos(120°)
        val refreshY = -radius * 0.5f   // sin(120°)
        
        // 垃圾桶球：左方 (180度)
        val trashX = -radius
        val trashY = 0f
        
        // 设置球：左下方 (-240度)
        val settingsX = -radius * 0.866f // cos(-120°)
        val settingsY = radius * 0.5f    // sin(-120°)

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

        animatorSet.playTogether(
            refreshAnimX, refreshAnimY, refreshAlpha,
            trashAnimX, trashAnimY, trashAlpha,
            settingsAnimX, settingsAnimY, settingsAlpha
        )
        animatorSet.duration = ANIMATION_DURATION
        animatorSet.start()

        // 不立即设置自动隐藏，让菜单保持显示
        // scheduleAutoHide() // 注释掉这行
    }

    private fun collapseMenu() {
        if (!isMenuExpanded) return
        isMenuExpanded = false

        // 创建动画 - 与展开动画保持一致
        val animatorSet = AnimatorSet()
        val radius = 150f
        
        // 计算三个菜单球的返回位置
        val refreshX = -radius * 0.866f
        val refreshY = -radius * 0.5f
        val trashX = -radius
        val trashY = 0f
        val settingsX = -radius * 0.866f
        val settingsY = radius * 0.5f

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

        animatorSet.playTogether(
            refreshAnimX, refreshAnimY, refreshAlpha,
            trashAnimX, trashAnimY, trashAlpha,
            settingsAnimX, settingsAnimY, settingsAlpha
        )
        animatorSet.duration = ANIMATION_DURATION
        animatorSet.start()

        // 动画结束后隐藏菜单球
        postDelayed({
            refreshBall.visibility = View.GONE
            trashBall.visibility = View.GONE
            settingsBall.visibility = View.GONE
        }, ANIMATION_DURATION)
    }

    private fun scheduleAutoHide() {
        autoHideHandler.removeCallbacks(autoHideRunnable)
        autoHideHandler.postDelayed(autoHideRunnable, AUTO_HIDE_DELAY)
    }

    private fun cancelAutoHide() {
        autoHideHandler.removeCallbacks(autoHideRunnable)
    }

    fun show() {
        if (windowManager != null) return

        windowManager = context.getSystemService(Context.WINDOW_SERVICE) as WindowManager

        layoutParams = WindowManager.LayoutParams().apply {
            type = WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
            format = PixelFormat.RGBA_8888
            flags = WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
                    WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL or
                    WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS
            // 增大窗口尺寸，确保菜单球有足够空间显示
            width = BALL_SIZE + 400 // 给菜单球预留空间
            height = BALL_SIZE + 400
            gravity = Gravity.TOP or Gravity.START

            // 初始位置在右下角，考虑新的窗口尺寸
            val screenWidth = resources.displayMetrics.widthPixels
            val screenHeight = resources.displayMetrics.heightPixels
            x = screenWidth - width - MARGIN
            y = screenHeight - height - MARGIN - 100 // 留出一些导航栏空间
        }

        windowManager?.addView(this, layoutParams)
        scheduleAutoHide()
    }

    fun hide() {
        cancelAutoHide()
        windowManager?.removeView(this)
        windowManager = null
        layoutParams = null
    }

    fun setOnMenuItemClickListener(listener: (MenuItem) -> Unit) {
        onMenuItemClickListener = listener
    }

    override fun onDetachedFromWindow() {
        super.onDetachedFromWindow()
        cancelAutoHide()
    }
}