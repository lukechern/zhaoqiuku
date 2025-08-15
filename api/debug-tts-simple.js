/**
 * 简化的TTS调试API
 * 使用标准的Azure Speech Service URL格式
 */

export default async function handler(req, res) {
    try {
        // 检查环境变量
        const subscriptionKey = process.env.AZURE_SPEECH_KEY;
        const region = 'eastasia'; // 从配置读取

        const debugInfo = {
            timestamp: new Date().toISOString(),
            environment: {
                hasKey: !!subscriptionKey,
                region: region,
                keyPreview: subscriptionKey ? subscriptionKey.substring(0, 8) + '...' : 'undefined'
            },
            urlConstruction: null,
            azureTest: null
        };

        if (!subscriptionKey) {
            debugInfo.error = 'Azure Speech Service 密钥缺失';
            return res.status(500).json(debugInfo);
        }

        // 构建标准URL
        const azureUrl = `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`;

        debugInfo.urlConstruction = {
            region: region,
            finalUrl: azureUrl,
            urlType: 'standard-tts-endpoint'
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
            console.log('测试Azure TTS API:', azureUrl);

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
                console.error('Azure API错误:', response.status, errorText);
            } else {
                const audioBuffer = await response.arrayBuffer();
                debugInfo.azureTest.audioSize = audioBuffer.byteLength;
                debugInfo.azureTest.success = true;
                console.log('Azure API调用成功，音频大小:', audioBuffer.byteLength);
            }

        } catch (fetchError) {
            debugInfo.azureTest = {
                error: 'Fetch失败',
                message: fetchError.message,
                stack: fetchError.stack
            };
            console.error('Fetch错误:', fetchError);
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