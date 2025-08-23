package com.x7ree.zhaoqiuku

import android.content.Context
import android.os.Handler
import android.os.Looper
import android.util.AttributeSet
import android.view.MotionEvent
import android.view.View
import android.widget.FrameLayout
import androidx.appcompat.widget.AppCompatImageView
import com.x7ree.zhaoqiuku.debug.*

class DebugFloatingBall @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0
) : FrameLayout(context, attrs, defStyleAttr) {

    private lateinit var mainBall: AppCompatImageView
    private lateinit var refreshBall: AppCompatImageView
    private lateinit var trashBall: AppCompatImageView
    private lateinit var settingsBall: AppCompatImageView

    private var onMenuItemClickListener: ((DebugMenuItem) -> Unit)? = null
    private val autoHideHandler = Handler(Looper.getMainLooper())
    private val autoHideRunnable = Runnable { collapseMenu() }
    
    private lateinit var touchHandler: DebugBallTouchHandler
    private lateinit var menuHandler: DebugBallMenuHandler
    private lateinit var displayManager: DebugBallDisplayManager
    
    // 添加触摸坐标的变量定义
    private var initialTouchX: Float = 0f
    private var initialTouchY: Float = 0f

    init {
        initializeComponents(context)
    }

    private fun initializeComponents(context: Context) {
        val ballView = DebugBallView(context)
        
        // 初始化主球
        mainBall = ballView.createMainBall()
        mainBall.setOnTouchListener { _, event -> handleTouch(event) }

        // 初始化菜单球
        refreshBall = ballView.createMenuBall(R.drawable.ic_debug_refresh)
        trashBall = ballView.createMenuBall(R.drawable.ic_debug_trash)
        settingsBall = ballView.createMenuBall(R.drawable.ic_debug_settings)

        // 初始化处理器
        displayManager = DebugBallDisplayManager(context, this)
        menuHandler = DebugBallMenuHandler(this, resources)
        // 先创建touchHandler，但传入displayManager，在需要时通过它获取WindowManager和LayoutParams
        touchHandler = DebugBallTouchHandler(
            this, resources, displayManager, autoHideHandler, autoHideRunnable
        )

        setupMenuBalls()

        // 添加到布局
        addView(mainBall)
        addView(refreshBall)
        addView(trashBall)
        addView(settingsBall)

        // 初始化状态
        collapseMenu()
    }

    private fun setupMenuBalls() {
        refreshBall.visibility = View.GONE
        refreshBall.alpha = 0f
        refreshBall.setOnClickListener {
            onMenuItemClickListener?.invoke(DebugMenuItem.REFRESH)
            collapseMenu()
        }

        trashBall.visibility = View.GONE
        trashBall.alpha = 0f
        trashBall.setOnClickListener {
            onMenuItemClickListener?.invoke(DebugMenuItem.CLEAR_CACHE)
            collapseMenu()
        }

        settingsBall.visibility = View.GONE
        settingsBall.alpha = 0f
        settingsBall.setOnClickListener {
            onMenuItemClickListener?.invoke(DebugMenuItem.SETTINGS)
            collapseMenu()
        }
    }

    private fun handleTouch(event: MotionEvent): Boolean {
        // 保存初始触摸坐标，供后续使用
        if (event.action == MotionEvent.ACTION_DOWN) {
            initialTouchX = event.rawX
            initialTouchY = event.rawY
        }
        
        val result = touchHandler.handleTouch(event)
        
        // 处理特殊事件
        when (event.action) {
            MotionEvent.ACTION_UP -> {
                val deltaX = kotlin.math.abs(event.rawX - initialTouchX)
                val deltaY = kotlin.math.abs(event.rawY - initialTouchY)
                val totalDelta = deltaX + deltaY

                // 增大点击阈值，提高拖动操作的灵敏度
                if (totalDelta < 80) {
                    // 点击事件，切换菜单状态
                    if (menuHandler.getMenuState()) {
                        // 菜单已展开，需要收缩
                        collapseMenu()
                    } else {
                        // 菜单已收缩，需要展开
                        expandMenu()
                    }
                    // 如果菜单收缩，设置自动隐藏
                    if (!menuHandler.getMenuState()) {
                        scheduleAutoHide()
                    }
                } else {
                    // 拖动事件，移动到边缘
                    snapToEdge()
                    scheduleAutoHide()
                }
            }
        }
        return result
    }

    private fun snapToEdge() {
        val layoutParams = displayManager.getLayoutParams()
        val windowManager = displayManager.getWindowManager()
        
        layoutParams?.let { params -> 
            val screenWidth = resources.displayMetrics.widthPixels
            val currentX = params.x
            val windowWidth = params.width

            val newX = touchHandler.snapToEdge(currentX, windowWidth, screenWidth)

            android.util.Log.d("DebugFloatingBall", "吸附后窗口X=$newX")
            params.x = newX
            windowManager?.updateViewLayout(this, params)
        }
    }

    private fun expandMenu() {
        if (menuHandler.getMenuState()) return
        android.util.Log.d("DebugFloatingBall", "expandMenu: 开始展开菜单")
        menuHandler.setMenuState(true)

        // 显示菜单球
        refreshBall.visibility = View.VISIBLE
        trashBall.visibility = View.VISIBLE
        settingsBall.visibility = View.VISIBLE

        // 智能判断菜单弹出方向
        val screenWidth = resources.displayMetrics.widthPixels
        val layoutParams = displayManager.getLayoutParams()
        val currentX = layoutParams?.x ?: 0
        val windowWidth = layoutParams?.width ?: DebugBallView.BALL_SIZE

        // 使用实际球的位置进行计算
        val ballOffsetInWindow = (windowWidth - DebugBallView.BALL_SIZE) / 2
        val ballCurrentX = currentX + ballOffsetInWindow
        val ballCenterX = ballCurrentX + DebugBallView.BALL_SIZE / 2
        val isOnLeftSide = DebugBallPositionHelper.isOnLeftSide(ballCenterX, screenWidth)

        android.util.Log.d("DebugFloatingBall", "智能菜单方向: 球心X=$ballCenterX, 屏幕宽度=$screenWidth, 在左侧=$isOnLeftSide")

        // 创建动画
        val animatorSet = DebugBallAnimator.expandMenu(
            refreshBall, trashBall, settingsBall, isOnLeftSide
        )
        animatorSet.start()
    }

    private fun collapseMenu() {
        if (!menuHandler.getMenuState()) return
        menuHandler.setMenuState(false)

        // 创建动画
        val animatorSet = DebugBallAnimator.collapseMenu(
            refreshBall, trashBall, settingsBall
        )
        animatorSet.start()

        // 动画结束后隐藏菜单球
        postDelayed({
            refreshBall.visibility = View.GONE
            trashBall.visibility = View.GONE
            settingsBall.visibility = View.GONE
        }, 300L)
    }

    private fun scheduleAutoHide() {
        autoHideHandler.removeCallbacks(autoHideRunnable)
        autoHideHandler.postDelayed(autoHideRunnable, 15000L)
    }

    private fun cancelAutoHide() {
        autoHideHandler.removeCallbacks(autoHideRunnable)
    }

    fun show() {
        val result = displayManager.show(autoHideHandler, autoHideRunnable)
        if (result) {
            scheduleAutoHide()
        }
    }

    fun hide() {
        displayManager.hide(autoHideHandler, autoHideRunnable)
    }

    fun setOnMenuItemClickListener(listener: (DebugMenuItem) -> Unit) {
        onMenuItemClickListener = listener
    }

    override fun onDetachedFromWindow() {
        super.onDetachedFromWindow()
        cancelAutoHide()
    }
}