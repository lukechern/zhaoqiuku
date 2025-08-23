package com.x7ree.zhaoqiuku.debug

import android.view.View
import android.content.res.Resources
import androidx.appcompat.widget.AppCompatImageView
import com.x7ree.zhaoqiuku.DebugFloatingBall

class DebugBallMenuHandler(
    private val debugFloatingBall: DebugFloatingBall,
    private val resources: Resources
) {
    private var isMenuExpanded = false

    fun toggleMenu(): Boolean {
        android.util.Log.d("DebugFloatingBall", "toggleMenu: isMenuExpanded=$isMenuExpanded")
        isMenuExpanded = !isMenuExpanded
        return isMenuExpanded
    }

    fun getMenuState(): Boolean {
        return isMenuExpanded
    }

    fun setMenuState(state: Boolean) {
        isMenuExpanded = state
    }
}