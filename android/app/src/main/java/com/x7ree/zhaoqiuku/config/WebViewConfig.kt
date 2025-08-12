package com.x7ree.zhaoqiuku.config

import android.content.Context
import android.util.Log
import org.json.JSONObject
import java.io.IOException

data class WebViewConfig(
    val webViewUrl: String = "",
    val userAgent: String = "WebViewApp/1.0",
    val enableDebug: Boolean = false,
    val enableJavaScript: Boolean = true,
    val enableDomStorage: Boolean = true,
    val mediaPlaybackRequiresUserGesture: Boolean = true
) {
    companion object {
        private const val TAG = "WebViewConfig"
        private const val CONFIG_FILE = "webViewConfig.json"
        
        fun loadFromAssets(context: Context): WebViewConfig {
            return try {
                val jsonString = context.assets.open(CONFIG_FILE).bufferedReader().use { it.readText() }
                val jsonObject = JSONObject(jsonString)
                
                WebViewConfig(
                    webViewUrl = jsonObject.optString("webViewUrl", ""),
                    userAgent = jsonObject.optString("userAgent", "WebViewApp/1.0"),
                    enableDebug = jsonObject.optBoolean("enableDebug", false),
                    enableJavaScript = jsonObject.optBoolean("enableJavaScript", true),
                    enableDomStorage = jsonObject.optBoolean("enableDomStorage", true),
                    mediaPlaybackRequiresUserGesture = jsonObject.optBoolean("mediaPlaybackRequiresUserGesture", true)
                )
            } catch (e: IOException) {
                Log.e(TAG, "无法读取配置文件: ${e.message}")
                WebViewConfig() // 返回默认配置
            } catch (e: Exception) {
                Log.e(TAG, "解析配置文件失败: ${e.message}")
                WebViewConfig() // 返回默认配置
            }
        }
    }
}