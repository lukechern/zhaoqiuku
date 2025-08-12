# 找球库 - 语音识别助手

一个基于WebView的语音识别应用，支持物品存放和查找的语音指令识别。

## 项目结构

```
zhaoqiuku/
├── android/                    # Android应用
│   ├── app/src/main/
│   │   ├── java/com/x7ree/zhaoqiuku/
│   │   │   ├── MainActivity.kt
│   │   │   └── config/WebViewConfig.kt
│   │   ├── assets/webViewConfig.json
│   │   └── AndroidManifest.xml
│   └── README.md
├── api/                        # Vercel API端点
│   ├── transcribe.js          # 语音转录API
│   └── health.js              # 健康检查API
├── config/                     # 配置文件
│   ├── apiConfig.js           # API配置（URL、提示词等）
│   └── debugConfig.js         # 调试级别配置
├── public/                     # 前端资源
│   ├── js/
│   │   ├── api-config.js      # 前端API配置
│   │   ├── debug-config.js    # 前端调试配置
│   │   ├── api-client.js      # API客户端
│   │   ├── ui-controller.js   # UI控制器
│   │   ├── audio-recorder.js  # 音频录制
│   │   └── main.js           # 主程序
│   ├── css/                   # 样式文件
│   └── index.html            # 主页面
└── README.md                  # 项目说明
```

## 快速配置

### 🔧 API配置
修改 `config/apiConfig.js` 顶部的配置：

```javascript
// API端点配置
export const API_ENDPOINTS = {
    GEMINI: {
        BASE_URL: 'https://generativelanguage.googleapis.com/v1beta',
        MODEL: 'gemini-2.5-flash',  // 修改模型版本
        ENDPOINT: 'generateContent'
    }
};
```

### 🐛 调试级别配置
修改 `config/debugConfig.js` 和 `public/js/debug-config.js` 顶部：

```javascript
// 可选值: 'normal', 'debug', 'full_debug'
const CURRENT_DEBUG_LEVEL = 'full_debug';
```

### 📱 Android WebView配置
修改 `android/app/src/main/assets/webViewConfig.json`：

```json
{
    "webViewUrl": "https://zhaoqiuku.com/",
    "userAgent": "ZhaoQiuKu/1.0",
    "enableDebug": true
}
```

## 调试级别说明

### 🟢 正常模式 (normal)
- 只显示语音识别的文本结果
- 界面简洁，适合日常使用

### 🟡 调试模式 (debug)
- 显示语音识别文本
- 显示API返回的JSON内容
- 显示关键词、置信度等信息

### 🔴 完整调试 (full_debug)
- 显示所有请求和响应信息
- 包含API请求详情、响应头等
- 完整的调试信息

## 部署说明

### Vercel部署
1. 设置环境变量 `GEMINI_API_KEY`
2. 部署到Vercel平台
3. 配置域名（可选）

### Android应用
1. 在Android Studio中打开 `android/` 目录
2. 修改WebView配置中的URL指向你的域名
3. 构建并安装APK

## 开发调试

### 浏览器控制台命令
```javascript
// 切换调试级别
setDebugLevel("normal")      // 正常模式
setDebugLevel("debug")       // 调试模式  
setDebugLevel("full_debug")  // 完整调试

// 查看配置信息
showDebugLevels()           // 显示所有调试级别
showApiConfig()             // 显示API配置信息
```

### Chrome DevTools调试WebView
1. 在电脑上打开 `chrome://inspect`
2. 连接Android设备
3. 选择WebView页面进行调试

## 技术栈

- **前端**: HTML5, CSS3, JavaScript (ES6+)
- **后端**: Node.js, Vercel Serverless Functions
- **AI服务**: Google Gemini API
- **移动端**: Android WebView, Kotlin
- **音频处理**: Web Audio API, MediaRecorder API

## 许可证

MIT License