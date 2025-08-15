// Azure Speech Service TTS 配置
const ttsConfig = {
    // Azure Speech Service 配置
    // 注意: 实际的终结点和密钥通过Vercel环境变量配置
    // 在Vercel项目设置中配置 AZURE_SPEECH_ENDPOINT 和 AZURE_SPEECH_KEY
    azure: {
        // Azure Speech Service 终结点 (由服务端环境变量提供)
        // 格式: https://[region].tts.speech.microsoft.com/
        endpoint: 'configured-via-vercel-env',

        // Azure Speech Service 密钥 (由服务端环境变量提供)
        subscriptionKey: 'configured-via-vercel-env',

        // 语音配置
        voice: {
            // 中文语音角色 (可选择不同的声音)
            name: 'zh-CN-XiaoxiaoNeural',  // 晓晓 - 温暖亲切的女声
            // 其他可选声音:
            // 'zh-CN-YunxiNeural'     // 云希 - 年轻男声
            // 'zh-CN-YunyangNeural'   // 云扬 - 专业男声
            // 'zh-CN-XiaochenNeural'  // 晓辰 - 温和男声
            // 'zh-CN-XiaohanNeural'   // 晓涵 - 清新女声

            // 语音参数
            rate: '0%',        // 语速: -50% 到 +200%
            pitch: '0%',       // 音调: -50% 到 +50%
            volume: '0%'       // 音量: -50% 到 +50%
        },

        // 音频格式
        audioFormat: 'audio-16khz-128kbitrate-mono-mp3'
    },

    // TTS 功能开关
    enabled: true,

    // 自动朗读设置
    autoRead: {
        // 是否在API返回后自动朗读
        enabled: true,

        // 朗读延迟 (毫秒)
        delay: 500,

        // 最大朗读文本长度 (超过此长度将截断)
        maxLength: 500,

        // 是否朗读完整内容还是只朗读AI回复部分
        readFullContent: false  // true: 朗读完整内容, false: 只朗读AI回复
    },

    // 错误处理
    errorHandling: {
        // 是否在TTS失败时显示错误信息
        showErrors: true,

        // TTS失败时的回退行为
        fallbackToAlert: false  // true: 使用浏览器alert, false: 静默失败
    }
};

// 导出配置
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ttsConfig;
} else if (typeof window !== 'undefined') {
    window.ttsConfig = ttsConfig;
}