// 提示词配置文件
export const PROMPTS = {
    // 音频转录提示词
    AUDIO_TRANSCRIPTION: `请将这个中文音频完整转写为文本，并提取关键词。请只返回一个JSON对象，格式如下：
{
  "transcript": "完整的转写文本",
  "keywords": ["关键词1", "关键词2", "关键词3", "关键词4"],
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

// 导出默认配置
export default PROMPTS;