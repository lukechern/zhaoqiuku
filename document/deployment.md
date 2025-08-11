# 部署说明文档

## 项目概述

这是一个基于纯前端技术（HTML/CSS/JavaScript）和 Vercel Serverless API 的语音识别应用，支持中文语音转文字，并通过 Google Gemini API 进行智能分析。

## 技术栈

- **前端**: HTML5, CSS3, JavaScript (ES6+)
- **后端**: Vercel Serverless Functions (Node.js)
- **API**: Google Gemini API
- **部署平台**: Vercel

## 项目结构

```
├── public/                 # 前端静态文件
│   ├── index.html         # 主页面
│   ├── css/               # 样式文件
│   │   ├── main.css       # 主样式
│   │   ├── microphone.css # 麦克风组件样式
│   │   └── animations.css # 动画效果
│   └── js/                # JavaScript文件
│       ├── main.js        # 主应用逻辑
│       ├── audio-recorder.js # 音频录制模块
│       ├── ui-controller.js  # UI控制模块
│       └── api-client.js     # API客户端
├── api/                   # Vercel Serverless API
│   ├── transcribe.js      # 音频转录API
│   └── health.js          # 健康检查API
├── document/              # 文档文件
│   ├── Requirements.md    # 需求文档
│   └── deployment.md      # 部署说明（本文件）
└── README.md             # 项目说明
```

## 部署步骤

### 1. 准备工作

#### 1.1 获取 Google Gemini API Key

1. 访问 [Google AI Studio](https://makersuite.google.com/app/apikey)
2. 登录 Google 账号
3. 创建新的 API Key
4. 保存 API Key（后续配置需要）

#### 1.2 准备代码仓库

1. 将项目代码推送到 GitHub 仓库
2. 确保所有文件都已提交

### 2. Vercel 部署

#### 2.1 连接 GitHub 仓库

1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 点击 "New Project"
3. 选择 GitHub 仓库
4. 导入项目

#### 2.2 配置环境变量

在 Vercel 项目设置中添加环境变量：

- **变量名**: `GEMINI_API_KEY`
- **值**: 你的 Google Gemini API Key

#### 2.3 部署设置

Vercel 会自动检测项目类型，无需额外配置。默认设置：

- **Framework Preset**: Other
- **Root Directory**: `./`
- **Build Command**: 无需构建命令
- **Output Directory**: `public`

#### 2.4 完成部署

1. 点击 "Deploy" 开始部署
2. 等待部署完成
3. 获取部署后的 URL

### 3. 验证部署

#### 3.1 访问应用

1. 打开部署后的 URL
2. 允许麦克风权限
3. 测试录音功能

#### 3.2 检查 API 状态

访问 `https://your-domain.vercel.app/api/health` 检查 API 状态

预期响应：
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "api_configured": true,
  "version": "1.0.0"
}
```

## 功能特性

### 核心功能

1. **语音录制**
   - 支持触摸和鼠标操作
   - 最长录音时间：20秒
   - 实时录音时长显示
   - 音波动画效果

2. **语音识别**
   - 基于 Google Gemini API
   - 支持中文语音识别
   - 智能关键词提取
   - JSON 格式结果展示

3. **用户界面**
   - 响应式设计，适配移动端
   - 现代化 UI 设计
   - 流畅的动画效果
   - 直观的操作反馈

### 技术特性

1. **音频处理**
   - 支持多种音频格式（WebM, MP4, OGG, WAV）
   - 自动格式检测和优化
   - 音频大小限制（20MB）
   - 高质量音频录制

2. **API 集成**
   - RESTful API 设计
   - 错误处理和重试机制
   - 请求大小验证
   - CORS 支持

3. **性能优化**
   - 模块化代码结构
   - 异步处理
   - 资源清理机制
   - 移动端优化

## 环境变量配置

### 必需的环境变量

| 变量名 | 描述 | 示例值 |
|--------|------|--------|
| `GEMINI_API_KEY` | Google Gemini API 密钥 | `AIzaSyC...` |

### 可选的环境变量

| 变量名 | 描述 | 默认值 |
|--------|------|--------|
| `NODE_ENV` | 运行环境 | `production` |

## 故障排除

### 常见问题

#### 1. 麦克风权限被拒绝

**问题**: 用户拒绝了麦克风权限
**解决方案**: 
- 引导用户在浏览器设置中允许麦克风权限
- 确保使用 HTTPS 协议访问

#### 1.1 Android WebView 权限问题

**问题**: 在Android应用的WebView中无法获取麦克风权限
**症状**: 
- 权限请求提示不显示
- 权限被静默拒绝
- 录音功能无法启动

**解决方案**: 
1. **应用权限配置**: 在AndroidManifest.xml中添加麦克风权限
2. **WebView配置**: 正确实现WebChromeClient的onPermissionRequest方法
3. **权限处理流程**: 先获取应用权限，再授予WebView权限

详细配置请参考: [WebView配置指南](webview-setup.md)

#### 2. API 请求失败

**问题**: Gemini API 返回错误
**可能原因**:
- API Key 未配置或无效
- API 配额不足
- 网络连接问题

**解决方案**:
- 检查环境变量配置
- 验证 API Key 有效性
- 检查 API 使用配额

#### 3. 音频格式不支持

**问题**: 录制的音频格式不被支持
**解决方案**:
- 应用会自动选择最佳支持格式
- 确保使用现代浏览器

#### 4. 录音文件过大

**问题**: 录音文件超过 20MB 限制
**解决方案**:
- 限制录音时长（已设置20秒限制）
- 优化音频质量设置

### 调试方法

#### 1. 查看浏览器控制台

打开浏览器开发者工具，查看 Console 标签页的错误信息。

#### 2. 检查网络请求

在 Network 标签页中查看 API 请求的状态和响应。

#### 3. 查看 Vercel 日志

在 Vercel Dashboard 的 Functions 标签页中查看服务器端日志。

#### 4. WebView 调试

**Chrome DevTools调试**:
1. 在电脑上打开 `chrome://inspect`
2. 连接Android设备并启用USB调试
3. 在WebView页面中查看控制台输出

**Android日志调试**:
```bash
# 查看WebView相关日志
adb logcat | grep -i webview
adb logcat | grep -i permission
adb logcat | grep -i audio
```

**应用内调试**:
```kotlin
// 在Android代码中添加日志
Log.d("WebView", "权限请求: ${request?.resources?.joinToString()}")
```

## 性能优化建议

### 1. 前端优化

- 启用浏览器缓存
- 压缩静态资源
- 使用 CDN 加速

### 2. API 优化

- 实现请求缓存
- 添加请求限流
- 优化音频压缩

### 3. 用户体验优化

- 添加离线支持
- 实现渐进式加载
- 优化移动端体验

## 安全考虑

### 1. API 密钥安全

- API 密钥仅在服务器端使用
- 不在前端代码中暴露敏感信息
- 定期轮换 API 密钥

### 2. 数据隐私

- 音频数据不在服务器端存储
- 使用 HTTPS 加密传输
- 遵循数据保护法规

### 3. 访问控制

- 实现请求频率限制
- 添加 CORS 配置
- 监控异常访问

## 更新和维护

### 1. 代码更新

1. 修改代码后推送到 GitHub
2. Vercel 会自动重新部署
3. 验证更新是否生效

### 2. 依赖更新

定期检查和更新：
- Google Gemini API 版本
- 浏览器兼容性
- 安全补丁

### 3. 监控和日志

- 监控 API 使用情况
- 查看错误日志
- 分析用户行为

## 联系支持

如果在部署过程中遇到问题，可以：

1. 查看 [Vercel 文档](https://vercel.com/docs)
2. 查看 [Google Gemini API 文档](https://ai.google.dev/docs)
3. 检查项目的 GitHub Issues

---

**部署完成后，你将拥有一个功能完整的语音识别应用，支持中文语音转文字和智能关键词提取！**