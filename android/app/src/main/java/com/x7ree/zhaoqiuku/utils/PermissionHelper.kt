package com.x7ree.zhaoqiuku.utils

import android.Manifest
import android.app.Activity
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.provider.Settings
import android.util.Log
import androidx.appcompat.app.AlertDialog
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat

class PermissionHelper(private val activity: Activity) {
    
    private val PERMISSION_REQUEST_CODE = 1001

    fun checkAndRequestPermissions(): Boolean {
        val permissions = arrayOf(
            Manifest.permission.RECORD_AUDIO,
            Manifest.permission.MODIFY_AUDIO_SETTINGS
        )
        
        val permissionsToRequest = permissions.filter {
            ContextCompat.checkSelfPermission(activity, it) != PackageManager.PERMISSION_GRANTED
        }
        
        return if (permissionsToRequest.isNotEmpty()) {
            Log.d("PermissionHelper", "请求权限: ${permissionsToRequest.joinToString()}")
            ActivityCompat.requestPermissions(
                activity,
                permissionsToRequest.toTypedArray(),
                PERMISSION_REQUEST_CODE
            )
            false
        } else {
            Log.d("PermissionHelper", "所有权限已获得")
            true
        }
    }
    
    fun showPermissionDeniedDialog() {
        AlertDialog.Builder(activity)
            .setTitle("权限需要")
            .setMessage("语音识别功能需要麦克风权限。请在设置中允许麦克风权限，然后重启应用。")
            .setPositiveButton("去设置") { _, _ ->
                val intent = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS)
                intent.data = Uri.fromParts("package", activity.packageName, null)
                activity.startActivity(intent)
            }
            .setNegativeButton("取消") { dialog, _ ->
                dialog.dismiss()
            }
            .setCancelable(false)
            .show()
    }
}