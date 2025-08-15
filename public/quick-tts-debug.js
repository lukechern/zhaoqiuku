// 快速TTS调试脚本
// 在浏览器控制台中运行此脚本

console.log('🔍 开始TTS快速调试...');

async function quickTTSDebug() {
    console.log('1. 检查环境变量配置...');
    
    try {
        const envResponse = await fetch('/api/check-env');
        const envData = await envResponse.json();
        
        console.log('环境变量检查结果:', envData);
        
        const azureEndpoint = envData.details?.AZURE_SPEECH_ENDPOINT;
        const azureKey = envData.details?.AZURE_SPEECH_KEY;
        
        if (azureEndpoint?.status !== 'configured' || azureKey?.status !== 'configured') {
            console.error('❌ Azure配置不完整');
            return false;
        }
        
        console.log('✅ 环境变量配置正常');
        
    } catch (error) {
        console.error('❌ 环境变量检查失败:', error);
        return false;
    }
    
    console.log('2. 测试Azure连接...');
    
    try {
        const debugResponse = await fetch('/api/debug-tts');
        const debugData = await debugResponse.json();
        
        console.log('Azure连接调试结果:', debugData);
        
        if (debugData.azureTest?.success) {
            console.log('✅ Azure Speech Service连接成功！');
            console.log(`音频大小: ${debugData.azureTest.audioSize} 字节`);
            return true;
        } else {
            console.error('❌ Azure连接失败');
            console.error('错误详情:', debugData.azureTest);
            
            // 分析常见错误
            if (debugData.azureTest?.status === 401) {
                console.error('🔑 认证失败 - 请检查AZURE_SPEECH_KEY是否正确');
            } else if (debugData.azureTest?.status === 404) {
                console.error('🌐 终结点错误 - 请检查AZURE_SPEECH_ENDPOINT是否正确');
                console.error('当前使用的URL:', debugData.urlConstruction?.finalUrl);
            } else if (debugData.azureTest?.status === 400) {
                console.error('📝 请求格式错误 - SSML或请求头可能有问题');
            }
            
            return false;
        }
        
    } catch (error) {
        console.error('❌ Azure连接测试失败:', error);
        return false;
    }
}

async function testTTSAPI() {
    console.log('3. 测试TTS API...');
    
    try {
        const response = await fetch('/api/tts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text: '你好，这是TTS测试',
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
            
            console.log('🔊 尝试播放测试音频...');
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
async function runFullTest() {
    console.log('🚀 开始完整TTS调试测试...');
    
    const step1 = await quickTTSDebug();
    if (!step1) {
        console.log('❌ 基础连接测试失败，停止后续测试');
        return;
    }
    
    const step2 = await testTTSAPI();
    if (step2) {
        console.log('🎉 所有TTS测试通过！');
    } else {
        console.log('⚠️ TTS API测试失败');
    }
}

// 导出函数到全局
window.quickTTSDebug = quickTTSDebug;
window.testTTSAPI = testTTSAPI;
window.runFullTTSTest = runFullTest;

// 提供使用说明
console.log(`
🔧 TTS调试函数已加载，可以使用以下命令:

• quickTTSDebug() - 检查配置和Azure连接
• testTTSAPI() - 测试TTS API调用
• runFullTTSTest() - 运行完整测试套件

建议先运行: runFullTTSTest()
`);

// 自动运行测试
setTimeout(() => {
    console.log('自动开始TTS调试测试...');
    runFullTest();
}, 1000);