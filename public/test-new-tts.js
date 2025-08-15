// 测试新的TTS配置
console.log('🔊 测试新的TTS配置...');

async function testNewTTSConfig() {
    console.log('1. 检查系统配置状态...');
    
    try {
        const healthResponse = await fetch('/api/health');
        const healthData = await healthResponse.json();
        
        console.log('系统健康检查结果:', healthData);
        
        if (healthData.configuration?.services?.azureTts) {
            console.log('✅ Azure TTS密钥已配置');
        } else {
            console.error('❌ Azure TTS密钥未配置');
            return false;
        }
        
        if (healthData.status === 'healthy') {
            console.log('✅ 系统配置完整');
        } else {
            console.warn('⚠️ 系统配置不完整，但TTS可以测试');
        }
        
    } catch (error) {
        console.error('❌ 系统健康检查失败:', error);
        return false;
    }
    
    console.log('2. 测试Azure Speech Service连接...');
    
    try {
        const debugResponse = await fetch('/api/debug-tts-simple');
        const debugData = await debugResponse.json();
        
        console.log('Azure连接测试结果:', debugData);
        
        if (debugData.azureTest?.success) {
            console.log('✅ Azure Speech Service连接成功！');
            console.log(`使用的URL: ${debugData.urlConstruction.finalUrl}`);
            console.log(`音频大小: ${debugData.azureTest.audioSize} 字节`);
            return true;
        } else {
            console.error('❌ Azure连接失败');
            console.error('错误详情:', debugData.azureTest);
            return false;
        }
        
    } catch (error) {
        console.error('❌ Azure连接测试失败:', error);
        return false;
    }
}

async function testTTSAPICall() {
    console.log('3. 测试TTS API调用...');
    
    try {
        const response = await fetch('/api/tts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text: '你好，这是使用新配置的TTS测试',
                voice: 'zh-CN-XiaoxiaoNeural'
            })
        });
        
        if (response.ok) {
            const audioData = await response.arrayBuffer();
            console.log('✅ TTS API调用成功！');
            console.log(`音频大小: ${audioData.byteLength} 字节`);
            
            // 尝试播放音频
            const blob = new Blob([audioData], { type: 'audio/mpeg' });
            const audioUrl = URL.createObjectURL(blob);
            const audio = new Audio(audioUrl);
            
            console.log('🔊 播放测试音频...');
            await audio.play();
            
            return true;
        } else {
            const errorData = await response.json();
            console.error('❌ TTS API调用失败:', errorData);
            return false;
        }
        
    } catch (error) {
        console.error('❌ TTS API测试失败:', error);
        return false;
    }
}

// 运行完整测试
async function runNewTTSTest() {
    console.log('🚀 开始测试新的TTS配置...');
    
    const step1 = await testNewTTSConfig();
    if (!step1) {
        console.log('❌ 基础配置测试失败');
        return;
    }
    
    const step2 = await testTTSAPICall();
    if (step2) {
        console.log('🎉 新的TTS配置测试全部通过！');
        console.log('');
        console.log('📋 配置总结:');
        console.log('• 使用标准Azure Speech Service终结点');
        console.log('• URL: https://eastasia.tts.speech.microsoft.com/cognitiveservices/v1');
        console.log('• 只需要配置 AZURE_SPEECH_KEY 环境变量');
        console.log('• 不再需要 AZURE_SPEECH_ENDPOINT 环境变量');
    } else {
        console.log('⚠️ TTS API测试失败');
    }
}

// 导出函数到全局
window.testNewTTSConfig = testNewTTSConfig;
window.testTTSAPICall = testTTSAPICall;
window.runNewTTSTest = runNewTTSTest;

// 提供使用说明
console.log(`
🔧 新TTS配置测试函数已加载:

• testNewTTSConfig() - 测试环境变量和Azure连接
• testTTSAPICall() - 测试TTS API调用
• runNewTTSTest() - 运行完整测试

建议运行: runNewTTSTest()
`);

// 自动运行测试
setTimeout(() => {
    console.log('自动开始新TTS配置测试...');
    runNewTTSTest();
}, 1000);