# TTS (文本转语音) 功能配置指南

## 功能概述

找秋裤AI语音寻物助手现在支持自动朗读功能，当API返回完整响应后，系统会自动朗读AI的回复内容。该功能使用微软Azure Speech Service提供高质量的中文语音合成。

## 配置步骤

### 1. 获取Azure Speech Service密钥

1. 访问 [Azure Portal](https://portal.azure.com/)
2. 创建新的"Speech Services"资源
3. 在资源的"Keys and Endpoint"页面获取：
   - **Endpoint**: 形如 `https://[region].tts.speech.microsoft.com/`
   - **Key**: 32位字符的订阅密钥

### 2. 配置Vercel环境变量

**重要**: 由于项目部署在Vercel上，需要在Vercel项目设置中配置环境变量，而不是本地文件。

#### 在Vercel中配置环境变量：
1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择你的项目
3. 进入 "Settings" → "Environment Variables"
4. 添加以下环境变量：

```
AZURE_SPEECH_KEY = your_azure_speech_subscription_key_here
```

**注意**: 不再需要配置 `AZURE_SPEECH_ENDPOINT`，系统会根据 `config/ttsConfit.js` 中的区域设置自动构建标准终结点。

#### 本地开发配置（可选）：
如果需要本地测试，可以在项目根目录创建 `.env.local` 文件：

```bash
# Azure Speech Service TTS 配置（仅用于本地开发）
AZURE_SPEECH_KEY=your_azure_speech_subscription_key_here
```

**注意**: 
- 生产环境使用Vercel环境变量，确保密钥安全
- 本地 `.env.local` 文件不会被提交到Git仓库
- 环境变量只在服务端使用，前端无法直接访问
- 终结点URL会根据配置文件中的区域自动构建为: `https://eastasia.tts.speech.microsoft.com/cognitiveservices/v1`

### 3. 修改TTS配置文件

编辑 `config/ttsConfit.js` 文件，根据需要调整以下设置：

```javascript
const ttsConfig = {
    // 功能开关
    enabled: true,
    
    // 自动朗读设置
    autoRead: {
        enabled: true,           // 是否自动朗读
        delay: 500,             // 朗读延迟(毫秒)
        maxLength: 500,         // 最大朗读长度
        readFullContent: false  // false=只朗读AI回复, true=朗读完整对话
    },
    
    // 语音设置
    azure: {
        voice: {
            name: 'zh-CN-XiaoxiaoNeural',  // 语音角色
            rate: '0%',                    // 语速
            pitch: '0%',                   // 音调
            volume: '0%'                   // 音量
        }
    }
};
```

## 可用的中文语音角色

| 角色名称 | 描述 | 性别 |
|---------|------|------|
| `zh-CN-XiaoxiaoNeural` | 晓晓 - 温暖亲切 | 女声 |
| `zh-CN-YunxiNeural` | 云希 - 年轻活泼 | 男声 |
| `zh-CN-YunyangNeural` | 云扬 - 专业稳重 | 男声 |
| `zh-CN-XiaochenNeural` | 晓辰 - 温和友善 | 男声 |
| `zh-CN-XiaohanNeural` | 晓涵 - 清新自然 | 女声 |

## 功能特性

### 自动朗读
- API返回完整响应后自动触发
- 可配置朗读延迟时间
- 支持文本长度限制
- 可选择朗读AI回复或完整对话

### 语音控制
- 支持语速、音调、音量调节
- 多种中文语音角色可选
- 高质量音频输出

### 错误处理
- 配置验证和错误提示
- 网络异常自动重试
- 优雅的降级处理

## 测试功能

访问 `public/tts-test.html` 页面可以：
- 检查配置状态
- 测试文本朗读
- 模拟API响应朗读
- 调试TTS功能

## 架构说明

### 安全架构
- 前端不直接调用Azure API，保护密钥安全
- 通过服务端API (`/api/tts`) 代理请求
- 环境变量只在服务端使用

### 数据流程
1. 前端发送文本到 `/api/tts`
2. 服务端构建SSML并调用Azure API
3. 返回音频数据给前端播放

## 使用流程

1. 用户按住麦克风说话
2. 语音识别转换为文本
3. API处理并返回响应
4. 系统显示结果在 `#resultsContainer > div > div > span.ai-reply`
5. **自动朗读AI回复内容**

## 注意事项

### 成本控制
- Azure Speech Service按字符收费
- 建议设置合理的文本长度限制
- 监控使用量避免超出预算

### 浏览器兼容性
- 需要现代浏览器支持Web Audio API
- 移动端可能需要用户交互才能播放音频
- 建议在HTTPS环境下使用

### 性能优化
- 音频数据会缓存在内存中
- 长文本会自动截断
- 支持播放中断和资源清理

## 故障排除

### 常见问题

1. **TTS不工作**
   - 检查Azure密钥和终结点配置
   - 确认网络连接正常
   - 查看浏览器控制台错误信息

2. **音频无法播放**
   - 检查浏览器音频权限
   - 确认设备音量设置
   - 尝试用户手动触发播放

3. **配置不生效**
   - 确认环境变量正确设置
   - 重启开发服务器
   - 清除浏览器缓存

### 调试方法

1. 打开浏览器开发者工具
2. 查看控制台日志
3. 访问TTS测试页面
4. 检查网络请求状态

## 部署配置

### Vercel部署（推荐）
1. **配置环境变量**：
   - 在Vercel项目设置的Environment Variables中添加：
     - `AZURE_SPEECH_ENDPOINT` - Azure Speech Service终结点
     - `AZURE_SPEECH_KEY` - Azure Speech Service订阅密钥
   
2. **部署后验证**：
   - 访问 `https://your-domain.com/tts-test.html` 测试TTS功能
   - 在浏览器控制台运行 `runAllTTSTests()` 进行快速测试

3. **环境变量生效**：
   - 配置环境变量后需要重新部署项目
   - 可以通过触发新的Git提交来自动部署
   - 或在Vercel Dashboard中手动触发重新部署

### 其他平台部署
如果部署到其他平台，确保：
- 环境变量在生产环境中正确设置
- Azure Speech Service在目标区域可用
- 服务端API能够访问环境变量

### 验证部署
部署完成后，可以通过以下方式验证TTS功能：

1. **API端点测试**：
   ```bash
   curl -X POST https://your-domain.com/api/tts \
     -H "Content-Type: application/json" \
     -d '{"text":"测试"}'
   ```

2. **前端测试**：
   - 访问TTS测试页面
   - 使用语音识别功能，观察是否自动朗读

3. **控制台测试**：
   ```javascript
   // 在浏览器控制台运行
   runAllTTSTests()
   ```