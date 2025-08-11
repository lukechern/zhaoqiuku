# 语音识别 Demo

一个基于 Google Gemini API 的中文语音识别应用，支持实时录音、语音转文字和智能关键词提取。

## ✨ 功能特性

- 🎤 **触摸录音**: 按住麦克风按钮开始录音，松开结束
- 🌊 **动态音波**: 录音时显示美观的音波动画效果
- 🎯 **智能识别**: 基于 Google Gemini API 的高精度中文语音识别
- 🔍 **关键词提取**: 自动提取语音内容中的关键词
- 📱 **响应式设计**: 完美适配手机、平板和桌面设备
- ⚡ **实时反馈**: 录音时长显示和状态提示
- 🎵 **音频回放**: 支持录音内容回放功能
- 📲 **WebView支持**: 完美支持Android应用内WebView环境

## 🚀 快速开始

### 在线体验

访问部署后的应用：[https://your-domain.vercel.app](https://your-domain.vercel.app)

### 本地开发

1. **克隆项目**
   ```bash
   git clone <repository-url>
   cd voice-recognition-demo
   ```

2. **配置环境变量**
   
   创建 `.env.local` 文件：
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

3. **启动开发服务器**
   ```bash
   # 使用 Vercel CLI (推荐)
   npm i -g vercel
   vercel dev
   
   # 或使用任何静态服务器
   npx serve public
   ```

4. **访问应用**
   
   打开浏览器访问 `http://localhost:3000`

## 📁 项目结构

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
│   └── deployment.md      # 部署说明
└── README.md             # 项目说明
```

## 🛠️ 技术栈

### 前端
- **HTML5**: 语义化标记和现代Web API
- **CSS3**: 响应式布局、动画效果、现代UI设计
- **JavaScript (ES6+)**: 模块化开发、异步处理、Web API集成

### 后端
- **Vercel Serverless Functions**: 无服务器API端点
- **Node.js**: 服务器端JavaScript运行时

### 第三方服务
- **Google Gemini API**: 语音识别和自然语言处理
- **MediaRecorder API**: 浏览器原生音频录制
- **Web Audio API**: 音频处理和分析

## 🎯 使用方法

### 基本操作

1. **开始录音**
   - 按住麦克风按钮开始录音
   - 观察音波动画和"聆听中"提示
   - 录音时长会实时显示

2. **结束录音**
   - 松开麦克风按钮结束录音
   - 系统自动处理音频并发送到API
   - 等待识别结果显示

3. **查看结果**
   - 识别结果以JSON格式显示
   - 包含原文、关键词等信息
   - 支持复制和分析

4. **其他功能**
   - 点击"回放"按钮重听录音
   - 点击"清除"按钮重置应用

### 注意事项

- 📱 首次使用需要允许麦克风权限
- ⏱️ 单次录音最长20秒
- 🌐 需要稳定的网络连接
- 🔊 建议在安静环境中使用

## 🚀 部署指南

### Vercel 部署（推荐）

1. **准备 API Key**
   - 访问 [Google AI Studio](https://makersuite.google.com/app/apikey)
   - 创建 Gemini API Key

2. **部署到 Vercel**
   ```bash
   # 安装 Vercel CLI
   npm i -g vercel
   
   # 部署项目
   vercel
   
   # 配置环境变量
   vercel env add GEMINI_API_KEY
   ```

3. **配置域名**
   - 在 Vercel Dashboard 中配置自定义域名
   - 确保 HTTPS 证书正常

详细部署说明请参考：[deployment.md](document/deployment.md)

### 其他平台部署

- **Netlify**: 支持 Serverless Functions
- **Cloudflare Pages**: 支持 Workers
- **AWS**: 使用 Lambda + S3
- **自建服务器**: 使用 Node.js + Express

## 🔧 配置选项

### 环境变量

| 变量名 | 必需 | 描述 | 示例 |
|--------|------|------|------|
| `GEMINI_API_KEY` | ✅ | Google Gemini API 密钥 | `AIzaSyC...` |
| `NODE_ENV` | ❌ | 运行环境 | `production` |

### 应用配置

可以在 `js/main.js` 中修改以下配置：

```javascript
// 最大录音时长（毫秒）
const MAX_RECORDING_TIME = 20000;

// 音频质量设置
const AUDIO_CONFIG = {
    echoCancellation: true,
    noiseSuppression: true,
    sampleRate: 44100
};
```

## 🐛 故障排除

### 常见问题

**Q: 无法获取麦克风权限**
- A: 确保使用 HTTPS 协议访问，在浏览器设置中允许麦克风权限

**Q: Android WebView中无法使用**
- A: 需要在Android应用中正确配置WebView权限，详见 [WebView配置指南](document/webview-setup.md)

**Q: API 请求失败**
- A: 检查 `GEMINI_API_KEY` 环境变量是否正确配置

**Q: 录音没有声音**
- A: 检查设备麦克风是否正常，尝试刷新页面重新授权

**Q: 识别结果不准确**
- A: 确保在安静环境中清晰发音，支持标准普通话

### 调试方法

1. **浏览器控制台**
   ```javascript
   // 检查麦克风权限
   navigator.mediaDevices.getUserMedia({audio: true})
   
   // 检查 API 连接
   fetch('/api/health').then(r => r.json()).then(console.log)
   ```

2. **网络面板**
   - 查看 API 请求状态
   - 检查响应内容和错误信息

3. **Vercel 日志**
   - 在 Vercel Dashboard 查看函数日志
   - 分析服务器端错误

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

### 开发流程

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

### 代码规范

- 使用 ES6+ 语法
- 遵循模块化开发原则
- 添加适当的注释
- 保持代码简洁易读

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 🙏 致谢

- [Google Gemini API](https://ai.google.dev/) - 提供强大的AI语音识别大模型
- [Vercel](https://vercel.com/) - 优秀的部署平台
- [Cloud Sonnet 4.0](https://www.anthropic.com/claude/sonnet) - 强大的AI编码模型支持
- [亚马逊Kiro AI编辑器](https://kiro.dev/) - AI驱动的编辑工具
- [通义灵码](https://tongyi.aliyun.com/) - 阿里云推出的智能编码助手

## 📞 联系方式

如有问题或建议，请通过以下方式联系：

- 🐛 Issues: [GitHub Issues](https://github.com/lukechern/zhaoqiuku/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/lukechern/zhaoqiuku/discussions)

---

⭐ 如果这个项目对你有帮助，请给它一个星标！