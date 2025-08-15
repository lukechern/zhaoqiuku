// TTS 快速测试脚本
// 在浏览器控制台中运行此脚本来测试TTS功能

console.log('🎵 开始TTS快速测试...');

// 测试TTS服务是否可用
async function testTTS() {
    try {
        // 检查TTS服务是否存在
        if (!window.ttsService) {
            console.error('❌ TTS服务未初始化');
            return false;
        }

        console.log('✅ TTS服务已初始化');

        // 检查配置
        if (!window.ttsService.isAvailable()) {
            console.warn('⚠️ TTS服务配置可能不完整，但仍会尝试测试');
        }

        // 测试简单文本朗读
        console.log('🗣️ 测试文本朗读...');
        await window.ttsService.speak('你好，这是TTS测试');
        console.log('✅ 文本朗读测试完成');

        // 测试API响应朗读
        console.log('🤖 测试API响应朗读...');
        const mockApiResponse = {
            transcript: "把钥匙放在桌子上",
            business_result: {
                success: true,
                message: "好的，我已经记录下您将钥匙放在桌子上了。"
            },
            action: "put",
            object: "钥匙",
            location: "桌子"
        };

        await window.ttsService.autoReadResponse(mockApiResponse);
        console.log('✅ API响应朗读测试完成');

        return true;

    } catch (error) {
        console.error('❌ TTS测试失败:', error);
        return false;
    }
}

// 测试TTS API端点
async function testTTSAPI() {
    try {
        console.log('🌐 测试TTS API端点...');
        
        const response = await fetch('/api/tts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text: 'API测试',
                voice: 'zh-CN-XiaoxiaoNeural',
                rate: '0%',
                pitch: '0%',
                volume: '0%'
            })
        });

        if (response.ok) {
            console.log('✅ TTS API端点正常');
            const audioData = await response.arrayBuffer();
            console.log(`📊 音频数据大小: ${audioData.byteLength} 字节`);
            return true;
        } else {
            const errorData = await response.json().catch(() => ({}));
            console.error('❌ TTS API错误:', response.status, errorData);
            return false;
        }

    } catch (error) {
        console.error('❌ TTS API测试失败:', error);
        return false;
    }
}

// 运行所有测试
async function runAllTests() {
    console.log('🚀 开始完整TTS测试套件...');
    
    const apiTest = await testTTSAPI();
    const serviceTest = await testTTS();
    
    console.log('\n📋 测试结果汇总:');
    console.log(`TTS API端点: ${apiTest ? '✅ 通过' : '❌ 失败'}`);
    console.log(`TTS服务功能: ${serviceTest ? '✅ 通过' : '❌ 失败'}`);
    
    if (apiTest && serviceTest) {
        console.log('🎉 所有TTS测试通过！');
    } else {
        console.log('⚠️ 部分测试失败，请检查配置');
    }
}

// 导出测试函数到全局
window.testTTS = testTTS;
window.testTTSAPI = testTTSAPI;
window.runAllTTSTests = runAllTests;

// 提供使用说明
console.log(`
🎵 TTS测试函数已加载，可以使用以下命令:

• testTTS() - 测试TTS服务功能
• testTTSAPI() - 测试TTS API端点
• runAllTTSTests() - 运行完整测试套件

示例: 在控制台输入 runAllTTSTests() 并回车
`);

// 如果页面已加载完成，自动运行测试
if (document.readyState === 'complete') {
    setTimeout(runAllTests, 1000);
} else {
    window.addEventListener('load', () => {
        setTimeout(runAllTests, 1000);
    });
}