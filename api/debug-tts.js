/**
 * TTS调试API
 * 用于测试Azure Speech Service连接和配置
 */

export default async function handler(req, res) {
    try {
        // 检查环境变量
        const endpoint = process.env.AZURE_SPEECH_ENDPOINT;
        const subscriptionKey = process.env.AZURE_SPEECH_KEY;

        const debugInfo = {
            timestamp: new Date().toISOString(),
            environment: {
                hasEndpoint: !!endpoint,
                hasKey: !!subscriptionKey,
                endpointValue: endpoint || 'undefined',
                keyPreview: subscriptionKey ? subscriptionKey.substring(0, 8) + '...' : 'undefined'
            },
            urlConstruction: null,
            azureTest: null
        };

        if (!endpoint || !subscriptionKey) {
            debugInfo.error = 'Azure Speech Service 配置缺失';
            return res.status(500).json(debugInfo);
        }

        // 构建URL
        const azureEndpoint = endpoint.replace(/\/$/, '');
        let azureUrl;
        if (azureEndpoint.includes('api.cognitive.microsoft.com')) {
            // 新格式: https://eastasia.api.cognitive.microsoft.com/
            azureUrl = `${azureEndpoint}/speechservices/synthesis/cognitiveservices/v1`;
        } else if (azureEndpoint.includes('tts.speech.microsoft.com')) {
            // 专用TTS格式: https://region.tts.speech.microsoft.com/
            azureUrl = `${azureEndpoint}/cognitiveservices/v1`;
        } else {
            // 通用Speech Services格式: https://region.cognitiveservices.azure.com/
            azureUrl = `${azureEndpoint}/speechservices/v1`;
        }

        let urlType;
        if (azureEndpoint.includes('api.cognitive.microsoft.com')) {
            urlType = 'cognitive-services-multi';
        } else if (azureEndpoint.includes('tts.speech.microsoft.com')) {
            urlType = 'speech-tts-dedicated';
        } else {
            urlType = 'speech-services-general';
        }

        debugInfo.urlConstruction = {
            originalEndpoint: endpoint,
            cleanedEndpoint: azureEndpoint,
            finalUrl: azureUrl,
            urlType: urlType
        };

        // 测试Azure连接（使用简单的SSML）
        const testSSML = `
            <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="zh-CN">
                <voice name="zh-CN-XiaoxiaoNeural">
                    <prosody rate="0%" pitch="0%" volume="0%">
                        测试
                    </prosody>
                </voice>
            </speak>
        `.trim();

        try {
            const response = await fetch(azureUrl, {
                method: 'POST',
                headers: {
                    'Ocp-Apim-Subscription-Key': subscriptionKey,
                    'Content-Type': 'application/ssml+xml',
                    'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3',
                    'User-Agent': 'zhaoqiuku-tts-debug'
                },
                body: testSSML
            });

            debugInfo.azureTest = {
                status: response.status,
                statusText: response.statusText,
                ok: response.ok,
                headers: Object.fromEntries(response.headers.entries())
            };

            if (!response.ok) {
                const errorText = await response.text();
                debugInfo.azureTest.errorBody = errorText;
            } else {
                const audioBuffer = await response.arrayBuffer();
                debugInfo.azureTest.audioSize = audioBuffer.byteLength;
                debugInfo.azureTest.success = true;
            }

        } catch (fetchError) {
            debugInfo.azureTest = {
                error: 'Fetch失败',
                message: fetchError.message,
                stack: fetchError.stack
            };
        }

        // 返回调试信息
        const statusCode = debugInfo.azureTest?.success ? 200 : 500;
        res.status(statusCode).json(debugInfo);

    } catch (error) {
        console.error('TTS调试API错误:', error);
        res.status(500).json({
            error: 'TTS调试失败',
            message: error.message,
            stack: error.stack
        });
    }
}