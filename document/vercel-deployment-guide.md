# Vercel 部署指南 - 找秋裤AI语音寻物助手

## 概述

本指南详细说明如何将找秋裤AI语音寻物助手部署到Vercel平台，包括所有必需的环境变量配置。

## 前置要求

### 1. 准备服务账号和密钥

在开始部署前，需要准备以下服务的账号和API密钥：

#### Google Gemini API
- 访问: https://makersuite.google.com/app/apikey
- 创建API密钥用于语音识别和AI处理

#### Resend 邮件服务
- 访问: https://resend.com/
- 创建API密钥用于发送验证邮件

#### Supabase 数据库
- 访问: https://supabase.com/
- 创建项目并获取URL和匿名密钥

#### Azure Speech Service (TTS功能)
- 访问: https://portal.azure.com/
- 创建Speech Services资源
- 获取终结点和订阅密钥

## 部署步骤

### 1. 连接GitHub仓库到Vercel

1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 点击 "New Project"
3. 选择你的GitHub仓库
4. 点击 "Import"

### 2. 配置环境变量

在Vercel项目设置中配置以下环境变量：

#### 必需的环境变量

```
# Google Gemini API
GEMINI_API_KEY = your_gemini_api_key_here

# Resend 邮件服务
RESEND_API_KEY = your_resend_api_key_here

# Supabase 数据库
SUPABASE_URL = https://your-project-id.supabase.co
SUPABASE_ANON_KEY = your_supabase_anon_key_here

# JWT 认证
JWT_SECRET = your_super_secret_jwt_key_change_in_production_at_least_32_characters_long

# Azure Speech Service (TTS功能)
AZURE_SPEECH_KEY = your_azure_speech_subscription_key_here
```

#### 配置步骤详解

1. **进入项目设置**：
   - 在Vercel Dashboard中选择你的项目
   - 点击 "Settings" 标签

2. **添加环境变量**：
   - 点击 "Environment Variables"
   - 逐一添加上述环境变量
   - 每个变量都选择 "Production", "Preview", "Development" 环境

3. **保存配置**：
   - 确保所有变量都正确填入
   - 点击 "Save" 保存每个变量

### 3. 数据库初始化

部署完成后，需要初始化Supabase数据库：

1. **访问初始化API**：
   ```
   https://your-domain.vercel.app/api/init-database
   ```

2. **验证数据库**：
   - 在Supabase控制台检查表是否创建成功
   - 确认 `users` 和 `items` 表存在

### 4. 功能测试

#### 基础功能测试
1. **访问主页**：
   ```
   https://your-domain.vercel.app/
   ```

2. **测试用户认证**：
   ```
   https://your-domain.vercel.app/auth.html
   ```

3. **测试TTS功能**：
   ```
   https://your-domain.vercel.app/tts-test.html
   ```

#### API端点测试
```bash
# 健康检查
curl https://your-domain.vercel.app/api/health

# TTS功能测试
curl -X POST https://your-domain.vercel.app/api/tts \
  -H "Content-Type: application/json" \
  -d '{"text":"测试朗读功能"}'
```

## 环境变量详细说明

### GEMINI_API_KEY
- **用途**: Google Gemini AI API调用
- **获取**: https://makersuite.google.com/app/apikey
- **格式**: 以 `AI` 开头的字符串

### RESEND_API_KEY
- **用途**: 发送邮箱验证码
- **获取**: https://resend.com/api-keys
- **格式**: 以 `re_` 开头的字符串

### SUPABASE_URL
- **用途**: Supabase数据库连接
- **获取**: Supabase项目设置 → API → Project URL
- **格式**: `https://xxx.supabase.co`

### SUPABASE_ANON_KEY
- **用途**: Supabase匿名访问密钥
- **获取**: Supabase项目设置 → API → anon public
- **格式**: 长字符串，以 `eyJ` 开头

### JWT_SECRET
- **用途**: JWT Token签名密钥
- **生成**: `openssl rand -base64 32`
- **要求**: 至少32位随机字符串

### AZURE_SPEECH_KEY
- **用途**: Azure Speech Service订阅密钥
- **获取**: Azure Portal → Speech Services → Keys and Endpoint
- **格式**: 32位字符串

## 部署后验证

### 1. 检查部署状态
- 在Vercel Dashboard查看部署日志
- 确认没有构建错误
- 验证所有环境变量都已设置

### 2. 功能验证清单

- [ ] 主页可以正常访问
- [ ] 用户注册/登录功能正常
- [ ] 语音识别功能工作
- [ ] 物品存储和查找功能正常
- [ ] TTS朗读功能工作
- [ ] 邮件验证码能够发送

### 3. 常见问题排查

#### 环境变量未生效
- **症状**: API返回配置错误
- **解决**: 重新部署项目，确保环境变量生效

#### TTS功能不工作
- **症状**: 朗读功能无响应
- **检查**: Azure Speech Service配置和区域设置

#### 邮件发送失败
- **症状**: 验证码邮件未收到
- **检查**: Resend API密钥和域名配置

#### 数据库连接失败
- **症状**: 用户注册/登录失败
- **检查**: Supabase URL和密钥配置

## 性能优化建议

### 1. 缓存配置
- Vercel自动处理静态资源缓存
- API响应已配置适当的缓存头

### 2. 区域选择
- 选择离用户最近的Azure区域
- 考虑Vercel的边缘网络分布

### 3. 成本控制
- 监控Azure Speech Service使用量
- 设置合理的TTS文本长度限制
- 定期检查Supabase数据库使用情况

## 维护和监控

### 1. 日志监控
- 在Vercel Dashboard查看函数日志
- 监控API调用频率和错误率

### 2. 定期更新
- 定期更新依赖包
- 关注Azure和其他服务的API变更

### 3. 备份策略
- 定期备份Supabase数据库
- 保存环境变量配置的副本

## 总结

按照本指南完成部署后，你将拥有一个完全功能的AI语音寻物助手，包括：

- ✅ 语音识别和AI处理
- ✅ 用户认证系统
- ✅ 物品存储管理
- ✅ TTS朗读功能
- ✅ 邮件验证服务

如果遇到问题，请检查环境变量配置和相关服务的API密钥是否正确。