/*
 * ========================================
 * 🔧 前端API配置文件
 * ========================================
 * 前端API请求相关配置
 */

// ==========================================
// 🌐 API端点配置
// ==========================================
const API_ENDPOINTS = {
    // 本地API端点
    BASE_URL: '/api',
    
    // 具体端点
    TRANSCRIBE: '/process-audio',  // 使用新的完整流程API
    TRANSCRIBE_LEGACY: '/transcribe',  // 保留旧的转录API
    HEALTH: '/health',
    
    // 完整URL
    get TRANSCRIBE_URL() {
        return `${this.BASE_URL}${this.TRANSCRIBE}`;
    },
    
    get HEALTH_URL() {
        return `${this.BASE_URL}${this.HEALTH}`;
    },
    
    get TRANSCRIBE_LEGACY_URL() {
        return `${this.BASE_URL}${this.TRANSCRIBE_LEGACY}`;
    }
};

// ==========================================
// 🔧 API请求配置
// ==========================================
const API_CONFIG = {
    // 请求超时时间（毫秒）
    TIMEOUT: 30000,
    
    // 最大重试次数
    MAX_RETRIES: 3,
    
    // 音频文件大小限制（字节）
    MAX_AUDIO_SIZE: 20 * 1024 * 1024, // 20MB
    
    // 支持的音频格式
    SUPPORTED_MIME_TYPES: [
        'audio/webm',
        'audio/webm;codecs=opus',
        'audio/mp4',
        'audio/ogg;codecs=opus',
        'audio/wav'
    ],
    
    // 请求头配置
    DEFAULT_HEADERS: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
    }
};

// 前端API配置管理类
class FrontendApiConfig {
    constructor() {
        this.endpoints = API_ENDPOINTS;
        this.config = API_CONFIG;
    }
    
    // 获取转录API URL
    getTranscribeUrl() {
        return this.endpoints.TRANSCRIBE_URL;
    }
    
    // 获取传统转录API URL（无需认证）
    getTranscribeLegacyUrl() {
        return this.endpoints.TRANSCRIBE_LEGACY_URL;
    }
    
    // 获取健康检查URL
    getHealthUrl() {
        return this.endpoints.HEALTH_URL;
    }
    
    // 获取最大音频大小
    getMaxAudioSize() {
        return this.config.MAX_AUDIO_SIZE;
    }
    
    // 检查音频格式是否支持
    isMimeTypeSupported(mimeType) {
        return this.config.SUPPORTED_MIME_TYPES.includes(mimeType);
    }
    
    // 获取默认请求头
    getDefaultHeaders() {
        return { ...this.config.DEFAULT_HEADERS };
    }
    
    // 获取带时间戳的URL（防缓存）
    getUrlWithTimestamp(url) {
        const separator = url.includes('?') ? '&' : '?';
        return `${url}${separator}_t=${Date.now()}`;
    }
}

// 全局API配置实例
window.apiConfig = new FrontendApiConfig();

// 在控制台提供调试方法
window.showApiConfig = () => {
    console.log('API配置信息:');
    console.log('- 转录URL:', window.apiConfig.getTranscribeUrl());
    console.log('- 健康检查URL:', window.apiConfig.getHealthUrl());
    console.log('- 最大音频大小:', (window.apiConfig.getMaxAudioSize() / 1024 / 1024).toFixed(2) + 'MB');
    console.log('- 支持的格式:', window.apiConfig.config.SUPPORTED_MIME_TYPES);
};

// 测试API连接
window.testApiConnection = async () => {
    console.log('正在测试API连接...');
    try {
        const response = await fetch(window.apiConfig.getHealthUrl());
        const data = await response.json();
        console.log('✅ API连接正常:', data);
        return data;
    } catch (error) {
        console.error('❌ API连接失败:', error);
        return null;
    }
};

// 显示所有可用的控制台命令
window.showConsoleCommands = () => {
    console.log('🔧 可用的控制台命令:');
    console.log('');
    console.log('📊 调试相关:');
    console.log('- setDebugLevel("normal")     - 设置为正常模式');
    console.log('- setDebugLevel("debug")      - 设置为调试模式');  
    console.log('- setDebugLevel("full_debug") - 设置为完整调试');
    console.log('- showDebugLevels()           - 显示所有调试级别');
    console.log('');
    console.log('🌐 API相关:');
    console.log('- showApiConfig()             - 显示API配置信息');
    console.log('- testApiConnection()         - 测试API连接');
    console.log('');
    console.log('ℹ️  其他:');
    console.log('- showConsoleCommands()       - 显示此帮助信息');
};

// 初始化时显示可用命令
console.log('🎯 AI语音寻物助手已加载');
console.log('输入 showConsoleCommands() 查看可用命令');