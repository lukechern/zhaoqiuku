/**
 * Azure Speech Service TTS API
 * 处理文本转语音请求
 */

export default async function handler(req, res) {
    // 只允许POST请求
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { text, voice, rate, pitch, volume } = req.body;

        // 验证必需参数
        if (!text || typeof text !== 'string') {
            return res.status(400).json({ error: '缺少必需的text参数' });
        }

        // 检查环境变量 (只需要密钥，区域从配置文件读取)
        const subscriptionKey = process.env.AZURE_SPEECH_KEY;
        
        // 从配置文件读取区域设置
        const region = 'eastasia'; // 可以从配置文件或环境变量读取

        console.log('TTS API调试信息:', {
            hasKey: !!subscriptionKey,
            region: region,
            keyPreview: subscriptionKey ? subscriptionKey.substring(0, 8) + '...' : 'undefined'
        });

        if (!subscriptionKey) {
            console.error('Azure Speech Service 密钥缺失');
            return res.status(500).json({ error: 'TTS服务配置不完整：缺少AZURE_SPEECH_KEY' });
        }

        // 构建SSML
        const voiceName = voice || 'zh-CN-XiaoxiaoNeural';
        const speechRate = rate || '0%';
        const speechPitch = pitch || '0%';
        const speechVolume = volume || '0%';

        const ssml = `
            <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="zh-CN">
                <voice name="${voiceName}">
                    <prosody rate="${speechRate}" pitch="${speechPitch}" volume="${speechVolume}">
                        ${escapeXml(text)}
                    </prosody>
                </voice>
            </speak>
        `.trim();

        // 构建标准的Azure Speech Service TTS URL
        const azureUrl = `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`;

        console.log('调用Azure TTS API:', {
            url: azureUrl,
            voiceName: voiceName,
            textLength: text.length
        });

        const response = await fetch(azureUrl, {
            method: 'POST',
            headers: {
                'Ocp-Apim-Subscription-Key': subscriptionKey,
                'Content-Type': 'application/ssml+xml',
                'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3',
                'User-Agent': 'zhaoqiuku-tts-server'
            },
            body: ssml
        });

        console.log('Azure API响应状态:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Azure TTS API错误:', {
                status: response.status,
                statusText: response.statusText,
                error: errorText,
                url: azureUrl
            });
            return res.status(response.status).json({ 
                error: `Azure TTS API错误 (${response.status}): ${errorText}`,
                details: {
                    status: response.status,
                    statusText: response.statusText,
                    url: azureUrl
                }
            });
        }

        // 获取音频数据
        const audioBuffer = await response.arrayBuffer();
        const audioData = Buffer.from(audioBuffer);

        // 设置响应头
        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Content-Length', audioData.length);
        res.setHeader('Cache-Control', 'public, max-age=3600'); // 缓存1小时

        // 返回音频数据
        res.send(audioData);

    } catch (error) {
        console.error('TTS API处理错误:', error);
        res.status(500).json({ 
            error: 'TTS服务内部错误',
            details: error.message 
        });
    }
}

// XML转义函数
function escapeXml(text) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}