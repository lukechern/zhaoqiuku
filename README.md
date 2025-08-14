# 找秋裤 - AI语音寻物助手

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
│   ├── process-audio.js       # 音频处理完整流程API（推荐）
│   ├── item-storage.js        # 物品存储业务逻辑
│   ├── health.js              # 健康检查API
│   ├── unified-auth.js        # 统一认证API（推荐）
│   ├── send-verification-code.js  # 发送邮箱验证码API（旧版）
│   ├── verify-code.js         # 验证验证码API（旧版）
│   ├── login.js               # 用户登录API（旧版）
│   ├── logout.js              # 用户登出API
│   ├── refresh-token.js       # Token刷新API
│   ├── init-database.js       # 数据库初始化API
│   ├── debug-user.js          # 用户状态调试API
│   ├── fix-user-status.js     # 修复用户状态API
│   ├── fix-all-users.js       # 批量修复用户API
│   └── user/
│       └── profile.js         # 用户信息API
├── config/                     # 配置文件
│   ├── apiConfig.js           # API配置（URL、提示词等）
│   ├── debugConfig.js         # 调试级别配置
│   ├── emailConfig.js         # 邮件配置（发件人、模板等）
│   ├── databaseConfig.js      # 数据库配置（Supabase连接等）
│   ├── authConfig.js          # 认证配置（JWT、Cookie等）
│   └── emailConfigTest.js     # 邮件配置测试工具
├── utils/                      # 工具函数
│   ├── database.js            # 数据库操作工具
│   ├── jwt.js                 # JWT Token 工具
│   └── auth.js                # 认证工具函数
├── public/                     # 前端资源
│   ├── js/
│   │   ├── api-config.js      # 前端API配置
│   │   ├── debug-config.js    # 前端调试配置
│   │   ├── api-client.js      # API客户端
│   │   ├── ui-controller.js   # UI控制器
│   │   ├── audio-recorder.js  # 音频录制
│   │   ├── auth.js            # 统一认证页面逻辑（推荐）
│   │   ├── register.js        # 注册页面逻辑（旧版）
│   │   ├── login.js           # 登录页面逻辑（旧版）
│   │   ├── auth-manager.js    # 前端认证管理器
│   │   ├── auth-debug.js      # 认证调试工具
│   │   └── main.js           # 主程序
│   ├── css/
│   │   ├── main.css          # 主样式
│   │   ├── register.css      # 注册页面样式
│   │   └── ...               # 其他样式文件
│   ├── index.html            # 主页面
│   ├── auth.html             # 统一认证页面（推荐）
│   ├── register.html         # 注册页面（旧版）
│   ├── login.html            # 登录页面（旧版）
│   ├── test_unified_auth.html # 统一认证测试页面
│   └── test_register.html    # 调试工具页面
├── vercel.json               # Vercel配置
└── README.md                 # 项目说明
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
1. 设置环境变量：
   - `GEMINI_API_KEY` - Google Gemini API密钥
   - `RESEND_API_KEY` - Resend邮件服务API密钥
   - `SUPABASE_URL` - Supabase项目URL
   - `SUPABASE_ANON_KEY` - Supabase匿名访问密钥
   - `JWT_SECRET` - JWT签名密钥（至少32位随机字符串）
2. 部署到Vercel平台
3. 配置域名（可选）

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
    action_type VARCHAR(10) NOT NULL CHECK (action_type IN ('put', 'get')),
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
CREATE INDEX IF NOT EXISTS idx_items_action_type ON items(action_type);

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

### 🎤 语音识别
- 支持中文语音识别
- 物品存放和查找指令识别
- 实时音频录制和处理

### 📦 物品存储管理
- **存放物品**: 语音指令"把钥匙放在桌子上"，系统自动记录物品和位置
- **查找物品**: 语音指令"钥匙在哪里"，系统返回存放位置和记录时间
- **智能识别**: 自动区分存放(put)、查找(get)和未知(unknown)三种操作类型
- **用户隔离**: 每个用户只能查看和管理自己的物品记录
- **完整记录**: 记录操作时间、IP地址、原始语音转录等详细信息

### 👤 用户系统
- **统一认证流程**：合并注册和登录
- 邮箱验证码认证（6位数字）
- 智能用户类型识别（新用户/现有用户）
- JWT Token 认证和自动刷新
- LocalStorage 状态持久化
- Supabase 数据库存储
- 适配 Android WebView

### 🔧 调试功能
- 多级调试模式
- 实时API请求监控
- 完整的错误日志

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

- **前端**: HTML5, CSS3, JavaScript (ES6+)
- **后端**: Node.js, Vercel Serverless Functions
- **AI服务**: Google Gemini API
- **邮件服务**: Resend API
- **数据库**: Supabase (PostgreSQL)
- **移动端**: Android WebView, Kotlin
- **音频处理**: Web Audio API, MediaRecorder API

## 许可证

MIT License