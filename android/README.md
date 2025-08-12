# 找秋裤 Android 应用

这是一个使用WebView访问 https://zhaoqiuku.com/ 的Android应用，支持录音权限。

## 功能特性

- 使用WebView加载网站（URL可配置）
- 自动处理录音权限请求
- 支持语音识别功能
- 完整的权限管理和错误处理
- 外部配置文件支持

## 配置文件

### WebView配置
应用使用 `app/src/main/assets/webViewConfig.json` 配置文件来管理WebView设置：

### 项目配置
项目配置文件位于 `config/` 目录：
- `config/apiConfig.js` - API配置（URL、提示词、请求设置）
- `config/debugConfig.js` - 调试模式配置

### API配置说明
`config/apiConfig.js` 包含：
- **API端点配置**: Gemini API的URL和模型设置
- **提示词配置**: 语音识别的提示词模板
- **请求配置**: 超时时间、重试次数、文件大小限制等

```json
{
  "webViewUrl": "https://zhaoqiuku.com/",
  "userAgent": "ZhaoQiuKu/1.0",
  "enableDebug": true,
  "enableJavaScript": true,
  "enableDomStorage": true,
  "mediaPlaybackRequiresUserGesture": false
}
```

### 配置项说明：

- `webViewUrl`: 要加载的网站URL
- `userAgent`: 自定义用户代理字符串
- `enableDebug`: 是否启用WebView调试
- `enableJavaScript`: 是否启用JavaScript
- `enableDomStorage`: 是否启用DOM存储
- `mediaPlaybackRequiresUserGesture`: 媒体播放是否需要用户手势

## 调试模式

应用支持3种调试级别，可在页面顶部切换：

### 1. 正常模式 (normal)
- 只显示语音识别的文本结果
- 适合日常使用

### 2. 调试模式 (debug)  
- 显示语音识别文本
- 显示API返回的JSON内容
- 适合开发调试

### 3. 完整调试 (full_debug)
- 显示所有请求和响应信息
- 包含完整的API交互详情
- 适合深度调试和问题排查

可以通过以下方式切换调试级别：
- 页面顶部的下拉选择框
- 浏览器控制台命令：`setDebugLevel("normal")`

## 构建和运行

### 前提条件

1. 安装Android Studio
2. 配置Android SDK
3. 连接Android设备或启动模拟器

### 构建步骤

1. 在Android Studio中打开项目
2. 等待Gradle同步完成
3. 点击"Run"按钮或使用快捷键 Ctrl+R

### 命令行构建

```bash
# 构建Debug版本
./gradlew assembleDebug

# 安装到设备
./gradlew installDebug

# 或者使用提供的脚本（Windows）
run.bat
```

## 权限说明

应用需要以下权限：

- `RECORD_AUDIO` - 录音权限，用于语音识别
- `MODIFY_AUDIO_SETTINGS` - 音频设置权限，解决录音问题
- `INTERNET` - 网络权限，访问网站
- `ACCESS_NETWORK_STATE` - 网络状态权限
- `WAKE_LOCK` - 保持屏幕唤醒

## 技术实现

- 基于WebView的混合应用
- 完整的权限请求处理流程
- 支持Chrome DevTools调试
- 优化的WebView配置

## 调试

1. 启用USB调试
2. 在Chrome中访问 `chrome://inspect`
3. 选择对应的WebView进行调试

## 故障排除

如果遇到录音问题，请参考：
- `document/webview-setup.md`
- `document/webview-troubleshooting.md`

## 版本要求

- Android 7.0 (API 24) 及以上
- WebView 60.0 及以上