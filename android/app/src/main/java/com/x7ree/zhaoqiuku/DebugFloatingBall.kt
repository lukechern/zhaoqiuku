package com.x7ree.zhaoqiuku

import android.animation.AnimatorSet
import android.animation.ObjectAnimator
import android.content.Context
import android.graphics.Color
import android.graphics.PixelFormat
import android.os.Build
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
        private const val MENU_ITEM_SIZE = 154 // 缩小20%，从192改为154
        private const val MARGIN = 16
        private const val ANIMATION_DURATION = 300L
        private const val AUTO_HIDE_DELAY = 15000L // 增加到15秒
        private const val VERTICAL_POSITION_RATIO_7ree = 0.85f // 初始垂直位置占屏幕高度的比例，略偏下
        private const val RIGHT_EDGE_MARGIN_7ree = 0 // 初始贴右侧时的水平边距（px），0表示完全贴边
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
                gravity = Gravity.CENTER // 改为居中显示，给菜单球更均衡的空间
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
                gravity = Gravity.CENTER // 与主球保持一致，居中显示
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
                    val screenWidth = resources.displayMetrics.widthPixels
                    val screenHeight = resources.displayMetrics.heightPixels
                    val windowWidth = params.width
                    val windowHeight = params.height
                    val ballOffsetInWindow = (windowWidth - BALL_SIZE) / 2
                    
                    // 计算新位置
                    val newX = initialX + deltaX
                    val newY = initialY + deltaY
                    
                    // 设置边界限制，确保球可以贴紧边缘但不超出屏幕
                    val minX = -ballOffsetInWindow // 球贴左边缘
                    val maxX = screenWidth - BALL_SIZE - ballOffsetInWindow // 球贴右边缘
                    val minY = -ballOffsetInWindow // 球贴上边缘
                    val maxY = screenHeight - BALL_SIZE - ballOffsetInWindow - 200 // 留出导航栏空间
                    
                    params.x = max(minX, min(maxX, newX))
                    params.y = max(minY, min(maxY, newY))
                    
                    windowManager?.updateViewLayout(this, params)
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
            val actualBallSize = BALL_SIZE // 使用实际球的尺寸
            
            // 计算球在窗口中的偏移位置（由于窗口比球大，球在窗口中心）
            val ballOffsetInWindow = (windowWidth - actualBallSize) / 2
            val ballCurrentX = currentX + ballOffsetInWindow

            // 计算到左右边缘的距离
            val distanceToLeft = ballCurrentX
            val distanceToRight = screenWidth - ballCurrentX - actualBallSize

            android.util.Log.d("DebugFloatingBall", "边缘吸附: 球X=$ballCurrentX, 屏幕宽=$screenWidth, 左距=$distanceToLeft, 右距=$distanceToRight")

            // 吸附到最近的边缘，允许真正贴紧边缘（0px边距）
            params.x = if (distanceToLeft < distanceToRight) {
                // 贴左边缘：球的左边缘对齐屏幕左边缘
                -ballOffsetInWindow
            } else {
                // 贴右边缘：球的右边缘对齐屏幕右边缘
                screenWidth - actualBallSize - ballOffsetInWindow
            }

            android.util.Log.d("DebugFloatingBall", "吸附后窗口X=${params.x}, 球X=${params.x + ballOffsetInWindow}")
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

        // 智能判断菜单弹出方向
        val screenWidth = resources.displayMetrics.widthPixels
        val currentX = layoutParams?.x ?: 0
        val windowWidth = layoutParams?.width ?: BALL_SIZE
        
        // 使用实际球的位置进行计算
        val ballOffsetInWindow = (windowWidth - BALL_SIZE) / 2
        val ballCurrentX = currentX + ballOffsetInWindow
        val ballCenterX = ballCurrentX + BALL_SIZE / 2
        val isOnLeftSide = ballCenterX < screenWidth / 2
        
        android.util.Log.d("DebugFloatingBall", "智能菜单方向: 球心X=$ballCenterX, 屏幕宽度=$screenWidth, 在左侧=$isOnLeftSide")

        // 创建动画 - 设计圆形布局，围绕主球显示
        val animatorSet = AnimatorSet()
        val radius = 250f // 增加半径，确保菜单球不与主球重叠
        
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
        val refreshX = radius * Math.cos(refreshAngle).toFloat()
        val refreshY = -radius * Math.sin(refreshAngle).toFloat() // 负号是因为Android坐标系Y轴向下
        
        val trashX = radius * Math.cos(trashAngle).toFloat()
        val trashY = -radius * Math.sin(trashAngle).toFloat()
        
        val settingsX = radius * Math.cos(settingsAngle).toFloat()
        val settingsY = -radius * Math.sin(settingsAngle).toFloat()

        android.util.Log.d("DebugFloatingBall", "菜单位置: refresh=($refreshX,$refreshY), trash=($trashX,$trashY), settings=($settingsX,$settingsY)")

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

        // 存储当前菜单位置，供collapseMenu使用
        refreshBall.tag = Pair(refreshX, refreshY)
        trashBall.tag = Pair(trashX, trashY)
        settingsBall.tag = Pair(settingsX, settingsY)

        // 不立即设置自动隐藏，让菜单保持显示
        // scheduleAutoHide() // 注释掉这行
    }

    private fun collapseMenu() {
        if (!isMenuExpanded) return
        isMenuExpanded = false

        // 创建动画 - 使用存储的位置信息
        val animatorSet = AnimatorSet()
        
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

        android.util.Log.d("DebugFloatingBall", "收缩菜单位置: refresh=($refreshX,$refreshY), trash=($trashX,$trashY), settings=($settingsX,$settingsY)")

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

    // 计算初始位置：右侧贴边 + 垂直方向略偏下
    private fun computeInitialPosition_7ree(screenWidth: Int, screenHeight: Int, windowWidth: Int, windowHeight: Int): Pair<Int, Int> {
        val ballOffsetInWindow = (windowWidth - BALL_SIZE) / 2
        // 期望球的左上角位置
        val desiredBallLeft = screenWidth - BALL_SIZE - RIGHT_EDGE_MARGIN_7ree
        val desiredBallTop = (screenHeight * VERTICAL_POSITION_RATIO_7ree).toInt() - BALL_SIZE / 2
        val x = desiredBallLeft - ballOffsetInWindow
        val y = desiredBallTop - ballOffsetInWindow
        return Pair(x, y)
    }

    fun show() {
        if (windowManager != null) return

        windowManager = context.getSystemService(Context.WINDOW_SERVICE) as WindowManager

        layoutParams = WindowManager.LayoutParams().apply {
            // 使用较低的窗口层级，让对话框能显示在悬浮球上方
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
            // 增大窗口尺寸，确保菜单球有足够空间显示，避免边界裁剪
            width = BALL_SIZE + 600 // 增加空间以容纳更大的菜单布局
            height = BALL_SIZE + 600
            gravity = Gravity.TOP or Gravity.START

            // 初始位置：右侧贴边 + 略偏下
            val screenWidth = resources.displayMetrics.widthPixels
            val screenHeight = resources.displayMetrics.heightPixels
            val (startX_7ree, startY_7ree) = computeInitialPosition_7ree(screenWidth, screenHeight, width, height)
            x = startX_7ree
            y = startY_7ree
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