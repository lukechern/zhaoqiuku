<p align="center">
  <img src="android/app/src/main/ic_launcher-playstore.png" alt="找秋裤 Logo" width="120" height="120" style="border-radius: 20px;"/>
</p>

# 找秋裤 - AI语音寻物助手

<p align="center">
  <img src="https://img.shields.io/badge/version-2.0.0-blue.svg" alt="Version 2.0.0"/>
  <img src="https://img.shields.io/badge/license-MIT-green.svg" alt="MIT License"/>
  <img src="https://img.shields.io/badge/platform-Android%20%7C%20Web-orange.svg" alt="Platform"/>
  <img src="https://img.shields.io/badge/Node.js-18+-green.svg" alt="Node.js"/>
  <img src="https://img.shields.io/badge/JavaScript-ES2023-yellow.svg" alt="JavaScript ES2023"/>
  <img src="https://img.shields.io/badge/Kotlin-1.8+-purple.svg" alt="Kotlin"/>
  <img src="https://img.shields.io/badge/AI-Google%20Gemini-blue.svg" alt="Google Gemini"/>
  <img src="https://img.shields.io/badge/Speech-Azure%20TTS-purple.svg" alt="Azure TTS"/>
  <img src="https://img.shields.io/badge/Database-Supabase-yellow.svg" alt="Supabase"/>
  <img src="https://img.shields.io/badge/Email-Resend-red.svg" alt="Resend"/>
  <img src="https://img.shields.io/badge/Deployment-Vercel-black.svg" alt="Vercel"/>
  <img src="https://img.shields.io/badge/DNS-Cloudflare-orange.svg" alt="Cloudflare DNS"/>
</p>

一个基于WebView的语音识别应用，支持物品存放和查找的语音指令识别。

## 项目结构

```
zhaoqiuku-v2/
├── .env.example              # 环境变量示例文件
├── .env.local                # 本地环境变量（开发用）
├── .gitignore                # Git忽略文件配置
├── package.json              # Node.js项目配置
├── LICENSE                   # MIT许可证文件
├── android/                  # Android原生应用
│   ├── app/
│   │   ├── build.gradle.kts  # 应用级构建配置
│   │   ├── proguard-rules.pro # 代码混淆规则
│   │   └── src/main/
│   │       ├── AndroidManifest.xml      # 应用清单
│   │       ├── ic_launcher-playstore.png # 应用图标
│   │       ├── java/com/x7ree/zhaoqiuku/
│   │       │   ├── MainActivity.kt      # 主Activity
│   │       │   └── config/WebViewConfig.kt # WebView配置
│   │       ├── assets/webViewConfig.json # WebView配置
│   │       └── res/                     # Android资源文件
│   │           ├── drawable/            # 图标资源
│   │           ├── layout/              # 布局文件
│   │           ├── mipmap-*/            # 应用图标不同密度
│   │           ├── values/              # 字符串、颜色等
│   │           ├── values-night/        # 夜间模式配置
│   │           ├── xml/                 # XML配置
│   │           └── ...
│   ├── gradle/                # Gradle包装器
│   ├── build.gradle.kts       # 项目级构建配置
│   ├── gradle.properties      # Gradle属性
│   ├── gradlew                # Gradle包装器脚本（Linux/Mac）
│   ├── gradlew.bat            # Gradle包装器脚本（Windows）
│   ├── settings.gradle.kts    # 项目设置
│   ├── README.md              # Android项目说明
│   └── run.bat                # Windows运行脚本
├── api/                      # Vercel Serverless API端点
│   ├── health.js             # 健康检查API
│   ├── invitation-config.js  # 邀请码配置API
│   ├── item-storage.js       # 物品存储业务逻辑API
│   ├── logout.js             # 用户登出API
│   ├── process-audio.js      # 音频处理完整流程API（推荐）
│   ├── refresh-token.js      # Token刷新API
│   ├── transcribe.js         # 语音转录API
│   ├── tts.js                # 文本转语音API（Azure TTS）
│   ├── unified-auth.js       # 统一认证API（推荐）
│   └── user/                 # 用户相关API
│       ├── history.js        # 用户历史记录API
│       ├── profile.js        # 用户信息API
│       └── history/[id].js   # 特定历史记录API
├── config/                   # 配置文件目录
│   ├── apiConfig.js          # API配置（Gemini、提示词等）
│   ├── authConfig.js         # 认证配置（JWT、Cookie等）
│   ├── databaseConfig.js     # 数据库配置（Supabase）
│   ├── debugConfig.js        # 调试级别配置
│   ├── emailConfig.js        # 邮件配置（Resend）
│   ├── invitationConfig.js   # 邀请码配置
│   └── ttsConfig.js          # TTS配置（Azure语音设置）
├── public/                   # 前端静态资源
│   ├── index.html            # 主页面
│   ├── auth.html             # 认证页面
│   ├── history.html          # 历史记录页面
│   ├── favicon.ico           # 网站图标
│   ├── components/           # HTML组件
│   │   ├── bottom-nav.html   # 底部导航组件
│   │   ├── header-top.html   # 顶部头部组件
│   │   ├── history-records_7ree.html # 历史记录组件
│   │   └── main.html         # 主内容组件
│   ├── css/                  # 样式文件
│   │   ├── animations.css    # 动画样式
│   │   ├── auth.css          # 认证页面样式
│   │   ├── buttons.css       # 按钮样式
│   │   ├── confirm-dialog_7ree.css # 确认对话框样式
│   │   ├── dual-recording-buttons_7ree.css # 双重录音按钮样式
│   │   ├── frame-layout.css  # 框架布局样式
│   │   ├── header.css        # 头部样式
│   │   ├── history-search_7ree.css # 历史搜索样式
│   │   ├── history.css       # 历史页面样式
│   │   ├── layout.css        # 通用布局样式
│   │   ├── microphone.css    # 麦克风样式
│   │   ├── navigation.css    # 导航样式
│   │   ├── register.css      # 注册样式
│   │   ├── responsive.css    # 响应式样式
│   │   ├── results.css       # 结果显示样式
│   │   ├── stream-renderer_7ree.css # 流渲染样式
│   │   ├── swipe-delete_7ree.css # 滑动删除样式
│   │   └── variables.css     # CSS变量
│   ├── img/                  # 图片资源
│   │   ├── cancel.svg        # 取消图标
│   │   ├── check.svg         # 确认图标
│   │   ├── delete-icon_7ree.svg # 删除图标
│   │   ├── delete.svg        # 删除图标
│   │   ├── history.svg       # 历史图标
│   │   ├── loading-spinner.svg # 加载动画
│   │   ├── logout.svg        # 登出图标
│   │   ├── microphone.svg    # 麦克风图标
│   │   ├── play.svg          # 播放图标
│   │   ├── progress-complete_7ree.svg # 进度完成图标
│   │   ├── progress-incomplete_7ree.svg # 进度未完成图标
│   │   ├── refresh.svg       # 刷新图标
│   │   ├── search.svg        # 搜索图标
│   │   ├── sound.svg         # 声音图标
│   │   └── success.svg       # 成功图标
│   ├── js/                   # JavaScript文件
│   │   ├── main.js           # 主程序入口
│   │   ├── App.js            # 应用核心逻辑
│   │   ├── AppInitializer.js # 应用初始化器
│   │   ├── EventHandler.js   # 事件处理器
│   │   ├── api-client.js     # API客户端
│   │   ├── api-config.js     # API配置
│   │   ├── audio-recorder.js # 音频录制器
│   │   ├── auth-manager.js   # 认证管理器
│   │   ├── auth.js           # 认证逻辑
│   │   ├── auth-debug.js     # 认证调试工具
│   │   ├── component-loader_7ree.js # 组件加载器
│   │   ├── confirm-dialog_7ree.js # 确认对话框
│   │   ├── debug-config.js   # 调试配置
│   │   ├── debug-tools.js    # 调试工具
│   │   ├── history-search_7ree.js # 历史搜索功能
│   │   ├── history.js        # 历史记录管理
│   │   ├── navigation.js     # 导航管理
│   │   ├── state-sync.js     # 状态同步
│   │   ├── stream-renderer_7ree.js # 流渲染器
│   │   ├── swipe-delete_7ree.js # 滑动删除功能
│   │   ├── auth-modules_7ree/ # 认证模块
│   │   │   ├── invitation-manager_7ree.js # 邀请码管理
│   │   │   ├── progress-manager_7ree.js # 进度管理
│   │   │   └── ui-controller_7ree.js # UI控制器
│   │   ├── history/          # 历史记录模块
│   │   │   ├── index.js      # 历史模块入口
│   │   │   ├── README.md     # 历史模块说明
│   │   │   ├── history-core_7ree.js # 历史核心逻辑
│   │   │   └── history-ui_7ree.js # 历史UI逻辑
│   │   └── swipe-delete/     # 滑动删除模块
│   │       └── index.js      # 滑动删除入口
│   └── mp3/                  # 音频文件目录
├── document/                 # 项目文档
│   ├── Requirements.md       # 需求文档
│   ├── CSS-清理分析报告_7ree.md # CSS清理报告
│   ├── database-migration.md # 数据库迁移文档
│   ├── deployment.md         # 部署文档
│   ├── field-rename-summary.md # 字段重命名总结
│   ├── history-feature.md    # 历史功能文档
│   ├── legacy-longpress-cleanup_7ree.md # 遗留代码清理
│   ├── OPTIMIZATION_SUMMARY.md # 优化总结
│   ├── tts-implementation-summary.md # TTS实现总结
│   ├── tts-setup.md          # TTS配置指南
│   ├── vercel-deployment-guide.md # Vercel部署指南
│   ├── volume-visualizer-fix.md # 音量可视化修复
│   └── webview-setup.md      # WebView设置指南
├── utils/                    # 工具函数
│   └── ...                   # 数据库、JWT、认证等工具
└── README.md                 # 项目说明文档
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

### 📧 邮件配置
修改 `config/emailConfig.js` 中的邮件设置：

```javascript
// 发件人配置
export const EMAIL_SENDER = {
    FROM: 'noreply@yourdomain.com',  // 修改为你的域名
    NAME: 'AI语音寻物助手',
};

// 邮件模板可以自定义HTML和文本内容
export const EMAIL_TEMPLATES = {
    VERIFICATION_CODE: {
        subject: 'AI语音寻物助手 - 邮箱验证码',
        getHtml: (code, email) => `...`,  // 自定义HTML模板
        getText: (code, email) => `...`   // 自定义文本模板
    }
};
```

### 🐛 调试级别配置
修改 `config/debugConfig.js` 和 `public/js/debug-config.js` 顶部：

```javascript
// 可选值: 'normal', 'debug', 'full_debug'
const CURRENT_DEBUG_LEVEL = 'full_debug';
```

### � TTS配置i
修改 `config/ttsConfig.js` 中的TTS设置：

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
            rate: '0%',                    // 语速 (-50% 到 +200%)
            pitch: '0%',                   // 音调 (-50% 到 +50%)
            volume: '0%'                   // 音量 (-50% 到 +50%)
        }
    }
};
```

**可用的中文语音角色**:
- `zh-CN-XiaoxiaoNeural` - 晓晓（温暖亲切女声，默认）
- `zh-CN-YunxiNeural` - 云希（年轻活泼男声）
- `zh-CN-YunyangNeural` - 云扬（专业稳重男声）
- `zh-CN-XiaochenNeural` - 晓辰（温和友善男声）
- `zh-CN-XiaohanNeural` - 晓涵（清新自然女声）

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

### 🚀 Vercel部署（推荐）

**详细部署指南**: 请参考 [Vercel部署指南](document/vercel-deployment-guide.md)

#### 快速部署步骤：
1. **连接GitHub仓库到Vercel**
2. **配置环境变量**：
   - `GEMINI_API_KEY` - Google Gemini API密钥
   - `RESEND_API_KEY` - Resend邮件服务API密钥
   - `SUPABASE_URL` - Supabase项目URL
   - `SUPABASE_ANON_KEY` - Supabase匿名访问密钥
   - `JWT_SECRET` - JWT签名密钥（至少32位随机字符串）
   - `AZURE_SPEECH_KEY` - Azure Speech Service订阅密钥
3. **初始化数据库**: 访问 `/api/init-database`
4. **测试功能**: 访问 `/tts-test.html` 测试TTS功能

**重要**: 所有环境变量必须在Vercel项目设置中配置，不是本地文件。

### 数据库配置
项目使用 [Supabase](https://supabase.com/) 作为数据库：

#### 1. 创建 Supabase 项目
1. 注册 Supabase 账号
2. 创建新项目
3. 获取项目 URL 和 API Key

#### 2. 创建数据表
在 Supabase 控制台的 SQL Editor 中执行以下 SQL：

```sql
-- 创建用户表
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    verification_code VARCHAR(10),
    code_expires_at TIMESTAMP WITH TIME ZONE,
    is_verified BOOLEAN DEFAULT FALSE,
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'pending'
);

-- 创建物品存储表
CREATE TABLE IF NOT EXISTS items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    item_name VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    operation_time BIGINT NOT NULL,
    client_ip INET,
    transcript TEXT,
    item_type VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 创建用户表索引和触发器
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_verification_code ON users(verification_code);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 创建物品表索引和触发器
CREATE INDEX IF NOT EXISTS idx_items_user_id ON items(user_id);
CREATE INDEX IF NOT EXISTS idx_items_item_name ON items(item_name);
CREATE INDEX IF NOT EXISTS idx_items_user_item ON items(user_id, item_name);
CREATE INDEX IF NOT EXISTS idx_items_operation_time ON items(operation_time);
CREATE INDEX IF NOT EXISTS idx_items_item_type ON items(item_type);

CREATE TRIGGER update_items_updated_at 
    BEFORE UPDATE ON items 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
```

#### 3. 配置环境变量
在 Vercel 中设置：
- `SUPABASE_URL` - 项目设置中的 Project URL
- `SUPABASE_ANON_KEY` - 项目设置中的 anon public key

### 邮件服务配置
项目使用 [Resend](https://resend.com/) 作为邮件服务提供商：
1. 注册 Resend 账号
2. 获取 API Key
3. 在 Vercel 环境变量中设置 `RESEND_API_KEY`

### TTS服务配置
项目使用 [Azure Speech Service](https://azure.microsoft.com/services/cognitive-services/speech-services/) 提供文本转语音功能：

#### 1. 创建 Azure Speech Service 资源
1. 访问 [Azure Portal](https://portal.azure.com/)
2. 创建新的 "Speech Services" 资源
3. 选择合适的区域（建议选择离用户较近的区域）
4. 选择定价层（F0免费层或S0标准层）

#### 2. 获取配置信息
在 Azure Speech Service 资源的 "Keys and Endpoint" 页面获取：
- **Endpoint**: 形如 `https://[region].tts.speech.microsoft.com/`
- **Key**: 32位字符的订阅密钥（Key1 或 Key2）

#### 3. 配置环境变量
开发环境和生产环境都需要配置以下环境变量：

##### 本地开发配置
1. 创建 `.env.local` 文件（如果不存在）
2. 添加以下变量：
   ```bash
   AZURE_SPEECH_ENDPOINT=你的终结点
   AZURE_SPEECH_KEY=你的订阅密钥
   ```
3. 重启开发服务器以使环境变量生效

##### 生产环境配置（Vercel）
1. 登录Vercel控制台
2. 进入项目设置 → Environment Variables
3. 添加以下变量：
   - `AZURE_SPEECH_ENDPOINT` - Azure Speech Service 终结点
   - `AZURE_SPEECH_KEY` - Azure Speech Service 订阅密钥
4. 重新部署项目

#### 4. 测试 TTS 功能
- 访问 `/tts-test.html` 页面进行功能测试
- 在浏览器控制台运行 `runAllTTSTests()` 进行快速测试

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

## 功能特性

### 🎤 语音识别与处理
- **智能语音识别**: 支持中文语音指令识别和处理
- **实时音频录制**: Web Audio API + MediaRecorder API
- **音量可视化**: 实时音频波形显示和音量指示器
- **双重录音按钮**: 支持长按和点击两种录音模式
- **智能指令识别**: 自动区分存放(put)、查找(get)和未知(unknown)操作

### 🔊 文本转语音 (TTS)
- **自动朗读**: API响应后自动朗读AI回复内容
- **Azure Speech Service**: 微软Azure高质量中文语音合成
- **多种语音角色**: 晓晓、云希、云扬、晓辰、晓涵等中文语音
- **语音参数调节**: 语速(-50%到+200%)、音调(-50%到+50%)、音量(-50%到+50%)
- **安全架构**: 服务端API代理保护Azure密钥安全

### 📦 智能物品存储管理
- **语音指令存放**: "把钥匙放在桌子上"自动记录物品和位置
- **智能物品查找**: "钥匙在哪里"返回存放位置和记录时间
- **用户数据隔离**: 每个用户只能访问自己的物品记录
- **完整记录信息**: 包含操作时间、IP地址、原始语音转录、物品类型
- **物品类型识别**: 自动识别和分类不同类型物品

### 👤 用户系统与认证
- **统一认证流程**: 合并注册和登录的简化流程
- **邮箱验证码认证**: 6位数字验证码，支持新用户注册和现有用户登录
- **智能用户识别**: 自动识别新用户和现有用户类型
- **JWT Token认证**: 安全的Token认证和自动刷新机制
- **状态持久化**: LocalStorage状态管理和跨会话保持
- **邀请码系统**: 可选的邀请码验证机制
- **Android WebView适配**: 优化移动端WebView体验

### 📱 历史记录管理
- **完整历史记录**: 记录所有语音交互和物品操作历史
- **历史搜索功能**: 支持按时间、物品名、操作类型搜索
- **历史记录详情**: 查看每次操作的详细信息和原始语音转录
- **历史记录分页**: 支持大量历史记录的高效分页加载
- **历史数据导出**: 支持历史记录的查看和管理

### 🎨 现代化UI/UX
- **组件化架构**: 模块化的HTML组件系统
- **滑动删除**: 直观的滑动操作删除记录
- **响应式设计**: 适配不同屏幕尺寸和设备
- **优雅动画**: CSS3动画和过渡效果
- **确认对话框**: 重要的操作确认提示
- **加载状态**: 友好的加载动画和状态提示

### 🔧 调试与开发工具
- **多级调试模式**: normal、debug、full_debug三种级别
- **实时API监控**: 完整的请求和响应信息展示
- **Chrome DevTools调试**: 支持WebView远程调试
- **错误日志系统**: 详细的错误捕获和日志记录
- **开发控制台**: 丰富的调试命令和工具函数

## 🔊 TTS (文本转语音) 功能

### 功能特性
- **自动朗读**: API返回完整响应后自动朗读AI回复内容
- **高质量语音**: 使用Azure Speech Service提供的中文语音合成
- **多种语音角色**: 支持晓晓、云希、云扬等多种中文语音
- **参数可调**: 支持语速、音调、音量等参数调节
- **安全架构**: 通过服务端API代理，保护Azure密钥安全

### 配置要求
1. **Azure Speech Service**: 需要在Azure Portal创建Speech Services资源
2. **Vercel环境变量**: 必须在Vercel项目设置中配置密钥
3. **浏览器支持**: 需要现代浏览器支持Web Audio API

### 测试方法
- **实际使用测试**: 使用语音识别功能，观察API响应后是否自动朗读
- **Azure连接调试**: 访问 `/api/debug-tts` 测试Azure连接
- **控制台快速测试**: 运行 `runFullTTSTest()` 进行完整调试
- **实际使用测试**: 使用语音识别功能，观察是否自动朗读

### 详细配置
请参考 [TTS配置指南](document/tts-setup.md) 了解详细的配置步骤和故障排除方法。

## API 使用说明

### 🎯 推荐使用的API端点

**完整音频处理流程** (推荐):
```
POST /api/process-audio
```
- 集成音频转录和物品存储业务逻辑
- 需要用户认证 (Bearer Token)
- 自动处理三种操作类型 (put/get/unknown)
- 返回转录结果和业务处理结果

**传统音频转录** (仅转录):
```
POST /api/transcribe
```
- 仅进行音频转录，不处理业务逻辑
- 无需用户认证
- 返回原始转录结果

**文本转语音** (TTS):
```
POST /api/tts
```
- 将文本转换为语音音频
- 支持多种中文语音角色
- 可配置语速、音调、音量
- 返回MP3格式音频数据

### 📋 业务逻辑处理

系统根据语音转录结果的 `action` 字段执行不同操作：

1. **action: "put"** - 存放物品
   - 记录用户ID、物品名、存放位置、操作时间、IP地址
   - 返回确认信息："XX的存放位置为XX，已经记录好了，以后随时来问我。"

2. **action: "get"** - 查找物品
   - 查询用户的物品存放记录
   - 返回位置和记录时间："XX的存放位置为XX，记录时间为XX年XX月XX日"

3. **action: "unknown"** - 未知意图
   - 提示用户重新描述："您的意图不明确，重新提问，是要记录物品存放位置还是要查找物品。"

## 技术栈

- **前端框架**: HTML5, CSS3, JavaScript (ES6+), 模块化架构
- **组件化**: 自定义组件系统 (header-top, bottom-nav, history-records等)
- **UI交互**: 滑动删除、双重录音按钮、确认对话框、历史搜索
- **状态管理**: LocalStorage持久化, 实时状态同步
- **后端平台**: Node.js, Vercel Serverless Functions
- **AI服务**: Google Gemini API (gemini-2.5-flash)
- **语音服务**: Azure Speech Service (文本转语音)
- **邮件服务**: Resend API (验证码发送)
- **数据库**: Supabase (PostgreSQL), 自动迁移和索引优化
- **移动端**: Android WebView, Kotlin, Gradle构建系统
- **音频处理**: Web Audio API, MediaRecorder API, 实时音量可视化
- **安全认证**: JWT Token, 邮箱验证码, 邀请码系统
- **部署平台**: Vercel (自动部署, 环境变量管理)
- **开发工具**: Git, VSCode, Chrome DevTools调试

## 免责声明

**⚠️ 重要声明**

本项目为个人学习和研究目的开发，完全**为爱发电**，没有任何商业利益。

- **不提供任何服务**: 本项目仅作为开源代码分享，不提供任何形式的云服务、托管服务或技术支持
- **不承担任何责任**: 使用本项目的风险由使用者自行承担，开发者不对使用过程中产生的任何问题负责
- **非商业用途**: 本项目仅供学习、研究和个人使用，不得用于任何商业用途
- **技术风险提示**: 项目涉及AI服务、语音识别等技术，使用时请注意相关法律法规和伦理要求

**请在使用前仔细阅读并理解以上声明。**

## 致谢

**🙏 衷心感谢**

- **为全人类科技进步而努力的人们**: 感谢所有为科技发展做出贡献的科学家、工程师和研究人员
- **AI技术的创造者们**: 特别感谢Google Gemini、Azure AI等AI技术的开发者，为语音识别和自然语言处理技术的发展奠定了基础
- **AI开发工具的先驱者们**: 感谢所有AI编程工具的开发者，让代码编写变得更加智能和高效
  - **大语言模型**: Claude 4, Qwen Code 3, Gemini 2.5 Pro, GPT-5等先进的AI模型
  - **AI IDE工具**: KIRO, TRAE, Qoder, RooCode, Cline等创新的AI编程助手

### 🔗 服务供应商致谢

本项目依赖以下优秀的服务供应商提供的服务，在此表示诚挚的感谢：

- **Google Cloud Platform**: 提供Gemini AI模型支持，使智能语音识别成为可能
- **Microsoft Azure**: 提供Speech Services (TTS)服务，带来高质量的中文语音合成体验
- **Supabase**: 提供PostgreSQL数据库服务和实时数据同步，让数据管理变得简单可靠
- **Resend**: 提供邮件服务API，支持安全的用户邮箱验证功能
- **Vercel**: 提供Serverless平台和自动部署服务，让项目快速上线和持续集成
- **Cloudflare**: 提供域名解析和CDN服务，确保网站访问的稳定性和速度
- **Android Open Source Project**: 提供Android开发框架和WebView组件，支持跨平台应用开发

### 🌟 社区与支持

- **开源社区**: 感谢所有开源项目的贡献者，让技术创新变得更加开放和可及
- **开发者工具提供商**: 感谢VSCode、Git、Node.js等开发工具的开发者
- **用户和反馈者**: 感谢使用和测试本项目的朋友们，你们的反馈是项目改进的动力

**愿科技之光照亮人类前行的道路，愿AI技术真正服务于人类的福祉。**

## 许可证

MIT License