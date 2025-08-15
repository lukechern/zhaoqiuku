/**
 * Azure路径测试API
 * 尝试不同的Azure Speech Service API路径
 */

export default async function handler(req, res) {
    try {
        // 检查环境变量
        const endpoint = process.env.AZURE_SPEECH_ENDPOINT;
        const subscriptionKey = process.env.AZURE_SPEECH_KEY;

        if (!endpoint || !subscriptionKey) {
            return res.status(500).json({ error: 'Azure配置缺失' });
        }

        const azureEndpoint = endpoint.replace(/\/$/, '');
        
        // 定义可能的路径
        const possiblePaths = [
            '/cognitiveservices/v1',
            '/speechservices/v1', 
            '/speechservices/synthesis/cognitiveservices/v1',
            '/speech/synthesize/cognitiveservices/v1',
            '/text/speech/v3.0/synthesize',
            '/text/speech/v3.1/synthesize'
        ];

        const testResults = [];
        
        // 简单的测试SSML
        const testSSML = `
            <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="zh-CN">
                <voice name="zh-CN-XiaoxiaoNeural">测试</voice>
            </speak>
        `.trim();

        // 测试每个路径
        for (const path of possiblePaths) {
            const testUrl = `${azureEndpoint}${path}`;
            
            try {
                console.log(`测试路径: ${testUrl}`);
                
                const response = await fetch(testUrl, {
                    method: 'POST',
                    headers: {
                        'Ocp-Apim-Subscription-Key': subscriptionKey,
                        'Content-Type': 'application/ssml+xml',
                        'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3',
                        'User-Agent': 'zhaoqiuku-path-test'
                    },
                    body: testSSML
                });

                const result = {
                    path: path,
                    url: testUrl,
                    status: response.status,
                    statusText: response.statusText,
                    ok: response.ok,
                    headers: Object.fromEntries(response.headers.entries())
                };

                if (response.ok) {
                    const audioBuffer = await response.arrayBuffer();
                    result.success = true;
                    result.audioSize = audioBuffer.byteLength;
                    result.message = '✅ 成功！这是正确的路径';
                } else {
                    const errorText = await response.text();
                    result.success = false;
                    result.errorBody = errorText;
                    
                    // 分析错误类型
                    if (response.status === 404) {
                        result.message = '❌ 路径不存在';
                    } else if (response.status === 401) {
                        result.message = '🔑 认证失败（但路径可能正确）';
                    } else if (response.status === 400) {
                        result.message = '📝 请求格式错误（但路径可能正确）';
                    } else {
                        result.message = `❓ 其他错误 (${response.status})`;
                    }
                }

                testResults.push(result);

                // 如果找到成功的路径，可以提前结束
                if (response.ok) {
                    console.log(`找到正确路径: ${testUrl}`);
                    break;
                }

            } catch (error) {
                testResults.push({
                    path: path,
                    url: testUrl,
                    success: false,
                    error: error.message,
                    message: '💥 请求失败'
                });
            }
        }

        // 找出最佳路径
        const successfulPath = testResults.find(r => r.success);
        const summary = {
            endpoint: azureEndpoint,
            totalPathsTested: possiblePaths.length,
            successfulPath: successfulPath?.path || null,
            recommendedUrl: successfulPath?.url || null,
            allResults: testResults
        };

        if (successfulPath) {
            summary.message = `✅ 找到正确的API路径: ${successfulPath.path}`;
            summary.nextSteps = [
                '1. 使用找到的正确路径更新代码',
                '2. 重新测试TTS功能',
                '3. 验证音频播放是否正常'
            ];
        } else {
            summary.message = '❌ 未找到可用的API路径';
            summary.nextSteps = [
                '1. 检查Azure Speech Service资源是否正确创建',
                '2. 验证订阅密钥是否有效',
                '3. 确认终结点区域是否正确',
                '4. 检查Azure服务状态'
            ];
        }

        res.json(summary);

    } catch (error) {
        console.error('路径测试API错误:', error);
        res.status(500).json({
            error: '路径测试失败',
            message: error.message,
            stack: error.stack
        });
    }
}