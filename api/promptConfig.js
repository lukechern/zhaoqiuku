// API 提示词配置文件
// 用于维护和管理所有API请求的提示词

/**
 * Gemini API 语音转录提示词配置
 */
export const TRANSCRIPTION_PROMPTS = {
    // 主要的语音转录提示词
    main: `请将这个中文音频完整转写为文本，并提取关键词。请只返回一个JSON对象，格式如下：
{
  "transcript": "完整的转写文本",
  "keywords": ["关键词1", "关键词2", "关键词3"],
  "confidence": 0.95
}

不要添加任何其他说明文字，只返回JSON对象。`,

    // 备用提示词（如果主要提示词效果不好）
    alternative: `把这段中文语音转成文字，然后提取3-5个关键词。用JSON格式返回：
{"transcript": "转写内容", "keywords": ["词1", "词2"], "confidence": 置信度}`,

    // 简化版提示词（用于较短的音频）
    simple: `转写这段中文音频为文本，返回JSON格式：{"transcript": "文本内容", "keywords": ["关键词"]}`,

    // 详细版提示词（用于需要更多信息的场景）
    detailed: `请分析这段中文音频并返回详细信息，JSON格式：
{
  "transcript": "完整转写文本",
  "keywords": ["关键词数组"],
  "confidence": 置信度分数,
  "language": "zh-CN",
  "duration_estimate": "预估时长",
  "sentiment": "情感倾向",
  "summary": "内容摘要"
}`
};

/**
 * Gemini API 生成配置
 */
export const GENERATION_CONFIG = {
    // 标准配置
    standard: {
        temperature: 0.1,
        topK: 1,
        topP: 0.8,
        maxOutputTokens: 1024,
    },

    // 创意配置（更多变化）
    creative: {
        temperature: 0.7,
        topK: 40,
        topP: 0.9,
        maxOutputTokens: 1024,
    },

    // 精确配置（更准确）
    precise: {
        temperature: 0.0,
        topK: 1,
        topP: 0.1,
        maxOutputTokens: 512,
    }
};

/**
 * 错误处理提示词
 */
export const ERROR_PROMPTS = {
    // 当音频质量不好时的提示
    lowQuality: `这段音频可能质量不佳，请尽力转写并标注不确定的部分：
{"transcript": "转写内容[不确定]", "keywords": ["关键词"], "confidence": 0.5, "notes": "音频质量问题"}`,

    // 当检测到非中文时的提示
    nonChinese: `检测到可能包含非中文内容，请转写所有能识别的内容：
{"transcript": "混合语言内容", "keywords": ["关键词"], "language_detected": "mixed"}`
};

/**
 * 根据音频特征选择合适的提示词
 * @param {Object} audioInfo - 音频信息
 * @param {number} audioInfo.size - 音频大小（字节）
 * @param {number} audioInfo.duration - 音频时长（秒）
 * @param {string} audioInfo.quality - 音频质量评估
 * @returns {string} 选择的提示词
 */
export function selectPrompt(audioInfo = {}) {
    const { size = 0, duration = 0, quality = 'normal' } = audioInfo;
    
    // 根据音频时长选择提示词
    if (duration < 5) {
        return TRANSCRIPTION_PROMPTS.simple;
    } else if (duration > 15