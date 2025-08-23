package com.x7ree.zhaoqiuku.utils

import android.content.Intent
import android.content.pm.ShortcutInfo
import android.content.pm.ShortcutManager
import android.graphics.drawable.Icon
import android.net.Uri
import android.os.Build
import android.util.Log
import androidx.appcompat.app.AlertDialog
import com.x7ree.zhaoqiuku.MainActivity
import com.x7ree.zhaoqiuku.R

class ShortcutHelper(private val activity: MainActivity) {

    // 刷新快捷方式图标（强制更新）
    fun refreshShortcuts() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N_MR1) {
            try {
                val shortcutManager = activity.getSystemService(ShortcutManager::class.java)
                
                // 创建新的快捷方式，使用新的ID和图标
                val debugShortcut = ShortcutInfo.Builder(activity, "debug_mode_v2")
                    .setShortLabel(activity.getString(R.string.debug_mode_short))
                    .setLongLabel(activity.getString(R.string.debug_mode_long))
                    .setIcon(Icon.createWithResource(activity, R.drawable.ic_debug_shortcut_v2))
                    .setIntent(
                        Intent(Intent.ACTION_VIEW, Uri.parse("zhaoqiuku://debug"))
                            .setClass(activity, MainActivity::class.java)
                    )
                    .build()
                
                // 先移除旧的快捷方式（如果存在）
                try {
                    shortcutManager.removeDynamicShortcuts(listOf("debug_mode"))
                } catch (e: Exception) {
                    Log.d("ShortcutHelper", "移除旧快捷方式失败: ${e.message}")
                }
                
                // 设置新的快捷方式（使用setDynamicShortcuts强制更新）
                shortcutManager.setDynamicShortcuts(listOf(debugShortcut))
                
                Log.d("ShortcutHelper", "快捷方式图标已强制更新")
            } catch (e: Exception) {
                Log.e("ShortcutHelper", "更新快捷方式失败", e)
            }
        }
    }
}