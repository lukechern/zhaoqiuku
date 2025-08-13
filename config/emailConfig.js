/*
 * ========================================
 * 📧 邮件配置文件
 * ========================================
 * 集中管理邮件相关配置，包括发件人、模板等
 */

// ==========================================
// 📮 发件人配置
// ==========================================
export const EMAIL_SENDER = {
    // 发件人邮箱地址（使用Resend的默认域名或自定义域名）
    FROM: 'reg@mail.zhaoqiuku.com',

    // 发件人名称
    NAME: '找秋裤-AI寻物助手',

    // 完整的发件人格式
    get FULL_FROM() {
        return `${this.NAME} <${this.FROM}>`;
    }
};

// ==========================================
// 📝 邮件模板配置
// ==========================================
export const EMAIL_TEMPLATES = {
    // 验证码邮件模板
    VERIFICATION_CODE: {
        // 邮件主题
        subject: '找秋裤-AI寻物助手 - 邮箱验证码',

        // HTML模板函数
        getHtml: (code, email) => `
        <!DOCTYPE html>
        <html lang="zh-CN">
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>邮箱验证码</title>
            <style>
                body { 
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    margin: 0;
                    padding: 0;
                    background-color: #f8f9fa;
                }
                .container { 
                    max-width: 600px; 
                    margin: 0 auto; 
                    background: #ffffff;
                    border-radius: 8px;
                    overflow: hidden;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                }
                .header { 
                    background: linear-gradient(135deg, #007AFF, #0056CC);
                    color: white;
                    text-align: center; 
                    padding: 2rem 1rem;
                }
                .header h1 {
                    margin: 0;
                    font-size: 1.8rem;
                    font-weight: 600;
                }
                .header p {
                    margin: 0.5rem 0 0 0;
                    opacity: 0.9;
                    font-size: 1rem;
                }
                .content {
                    padding: 2rem;
                }
                .greeting {
                    font-size: 1.1rem;
                    margin-bottom: 1.5rem;
                    color: #333;
                }
                .code-section {
                    text-align: center;
                    margin: 2rem 0;
                }
                .code-label {
                    font-size: 0.9rem;
                    color: #666;
                    margin-bottom: 1rem;
                }
                .code-box { 
                    background: linear-gradient(135deg, #f8f9ff, #e8f2ff);
                    border: 2px solid #007AFF; 
                    border-radius: 12px; 
                    padding: 1.5rem; 
                    margin: 1rem 0;
                    display: inline-block;
                    min-width: 200px;
                }
                .code { 
                    font-size: 2rem; 
                    font-weight: bold; 
                    color: #007AFF; 
                    letter-spacing: 8px;
                    font-family: 'Courier New', monospace;
                }
                .instructions {
                    background: #f8f9fa;
                    border-radius: 8px;
                    padding: 1.5rem;
                    margin: 2rem 0;
                }
                .instructions h3 {
                    margin: 0 0 1rem 0;
                    color: #333;
                    font-size: 1.1rem;
                }
                .instructions ul {
                    margin: 0;
                    padding-left: 1.2rem;
                }
                .instructions li {
                    margin: 0.5rem 0;
                    color: #555;
                }
                .footer { 
                    background: #f8f9fa;
                    color: #666; 
                    font-size: 0.85rem; 
                    padding: 1.5rem 2rem;
                    text-align: center;
                    border-top: 1px solid #e9ecef;
                }
                .footer p {
                    margin: 0.25rem 0;
                }
                .highlight {
                    color: #007AFF;
                    font-weight: 600;
                }
                @media (max-width: 600px) {
                    .container {
                        margin: 0;
                        border-radius: 0;
                    }
                    .content {
                        padding: 1.5rem;
                    }
                    .code {
                        font-size: 1.5rem;
                        letter-spacing: 4px;
                    }
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🎤 找秋裤-AI寻物助手</h1>
                    <p>邮箱验证码</p>
                </div>
                
                <div class="content">
                    <div class="greeting">
                        您好！
                    </div>
                    
                    <p>感谢您注册<span class="highlight">找秋裤-AI寻物助手</span>。为了确保账户安全，请使用以下验证码完成注册：</p>
                    
                    <div class="code-section">
                        <div class="code-label">您的验证码是：</div>
                        <div class="code-box">
                            <div class="code">${code}</div>
                        </div>
                    </div>
                    
                    <div class="instructions">
                        <h3>📋 使用说明：</h3>
                        <ul>
                            <li>请在注册页面输入上述6位验证码</li>
                            <li>验证码有效期为 <strong>10分钟</strong></li>
                            <li>验证码只能使用一次</li>
                            <li>如果验证码过期，请重新获取</li>
                        </ul>
                    </div>
                    
                    <div class="instructions">
                        <h3>🔒 安全提醒：</h3>
                        <ul>
                            <li>请勿将验证码告诉他人</li>
                            <li>如果您没有申请此验证码，请忽略此邮件</li>
                            <li>如有疑问，请联系客服</li>
                        </ul>
                    </div>
                </div>
                
                <div class="footer">
                    <p>此邮件由系统自动发送，请勿回复。</p>
                    <p>© 2025 找秋裤-AI寻物助手 - 让语音交互更简单</p>
                </div>
            </div>
        </body>
        </html>
        `,

        // 纯文本模板函数
        getText: (code, email) => `
找秋裤-AI寻物助手 - 邮箱验证码

您好！

感谢您注册找秋裤-AI寻物助手。您的验证码是：

${code}

使用说明：
- 请在注册页面输入上述6位验证码
- 验证码有效期为10分钟
- 验证码只能使用一次
- 如果验证码过期，请重新获取

安全提醒：
- 请勿将验证码告诉他人
- 如果您没有申请此验证码，请忽略此邮件
- 如有疑问，请联系客服

此邮件由系统自动发送，请勿回复。
© 2025 找秋裤-AI寻物助手 - 让语音交互更简单
        `
    },

    // 欢迎邮件模板（可选，用于注册成功后）
    WELCOME: {
        subject: '欢迎使用找秋裤-AI寻物助手！',

        getHtml: (email) => `
        <!DOCTYPE html>
        <html lang="zh-CN">
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>欢迎使用</title>
            <style>
                body { 
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    margin: 0;
                    padding: 0;
                    background-color: #f8f9fa;
                }
                .container { 
                    max-width: 600px; 
                    margin: 2rem auto; 
                    background: #ffffff;
                    border-radius: 8px;
                    overflow: hidden;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                }
                .header { 
                    background: linear-gradient(135deg, #34C759, #28A745);
                    color: white;
                    text-align: center; 
                    padding: 2rem 1rem;
                }
                .content {
                    padding: 2rem;
                }
                .footer { 
                    background: #f8f9fa;
                    color: #666; 
                    font-size: 0.85rem; 
                    padding: 1.5rem 2rem;
                    text-align: center;
                    border-top: 1px solid #e9ecef;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🎉 注册成功！</h1>
                    <p>欢迎加入找秋裤-AI寻物助手</p>
                </div>
                
                <div class="content">
                    <p>恭喜您成功注册找秋裤-AI寻物助手！</p>
                    <p>现在您可以开始使用我们的语音识别功能了。</p>
                    
                    <h3>🚀 快速开始：</h3>
                    <ul>
                        <li>访问应用主页面</li>
                        <li>点击麦克风按钮开始录音</li>
                        <li>说出您要存放或查找的物品</li>
                        <li>查看识别结果</li>
                    </ul>
                </div>
                
                <div class="footer">
                    <p>© 2025 找秋裤-AI寻物助手</p>
                </div>
            </div>
        </body>
        </html>
        `,

        getText: (email) => `
欢迎使用找秋裤-AI寻物助手！

恭喜您成功注册找秋裤-AI寻物助手！

现在您可以开始使用我们的语音识别功能了。

快速开始：
- 访问应用主页面
- 点击麦克风按钮开始录音
- 说出您要存放或查找的物品
- 查看识别结果

© 2025 找秋裤-AI寻物助手
        `
    }
};

// ==========================================
// ⚙️ 邮件发送配置
// ==========================================
export const EMAIL_CONFIG = {
    // Resend API 配置
    RESEND: {
        API_URL: 'https://api.resend.com/emails',
        TIMEOUT: 30000, // 30秒超时
    },

    // 验证码配置
    VERIFICATION: {
        CODE_LENGTH: 6,
        EXPIRES_IN: 10 * 60 * 1000, // 10分钟（毫秒）
        RESEND_COOLDOWN: 60 * 1000, // 60秒重发冷却时间（毫秒）
    },

    // 邮件发送限制
    RATE_LIMIT: {
        MAX_EMAILS_PER_HOUR: 10, // 每小时最多发送邮件数
        MAX_EMAILS_PER_DAY: 50,  // 每天最多发送邮件数
    }
};

// 导出默认配置
export default {
    EMAIL_SENDER,
    EMAIL_TEMPLATES,
    EMAIL_CONFIG
};