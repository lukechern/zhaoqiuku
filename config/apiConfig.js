/*
 * ========================================
 * 🔧 API配置文件
 * ========================================
 * 集中管理API相关配置，包括URL和提示词
 */

// ==========================================
// 🌐 API端点配置 - 修改这里来切换API服务
// ==========================================
export const API_ENDPOINTS = {
    // Gemini API配置
    GEMINI: {
        BASE_URL: 'https://generativelanguage.googleapis.com/v1beta',
        MODEL: 'gemini-2.5-flash',
        ENDPOINT: 'generateContent'
    },

    // 完整的Gemini API URL
    get GEMINI_URL() {
        return `${this.GEMINI.BASE_URL}/models/${this.GEMINI.MODEL}:${this.GEMINI.ENDPOINT}`;
    }
};

// ==========================================
// 📝 提示词配置
// ==========================================
export const PROMPTS = {
    // 音频转录提示词
    AUDIO_TRANSCRIPTION: `请将这个中文音频完整转写为文本，然后判断其语义是否为如下两种的一种：
    1. 将某个物品存放到了某处
    2. 查找某个物品存放的位置

    如果是第1种语义，则定义 action 为 "put"，并提取 物品关键词 赋值给 object，提取 存放位置关键词 赋值给 location
    如果是第2种语义，则定义 action 为 "get"，并提取 物品关键词 赋值给 object
    如果是非以上两种语义的其他任何情况，都定义 action 为 "unknown"， object 和 location 都为空
    
    判断完成之后，请只返回一个JSON对象，格式如下：
{
  "transcript": "完整的转写文本",
  "action": "put" | "get" | "unknown",
  "object": "物品关键词",
  "location": "存放位置关键词",
  "confidence": 0.95
}

不要添加任何其他说明文字，只返回JSON对象。`,

    // Gemini API 生成配置
    GENERATION_CONFIG: {
        temperature: 0.1,
        topK: 1,
        topP: 0.8,
        maxOutputTokens: 1024,
    }
};

// ==========================================
// 🔧 API请求配置
// ==========================================
export const API_CONFIG = {
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
    ]
};

// 导出默认配置
export default {
    API_ENDPOINTS,
    PROMPTS,
    API_CONFIG
};