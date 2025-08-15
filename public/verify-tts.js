// TTS功能验证脚本
console.log('🔊 开始TTS功能验证...');

async function verifyTTS() {
    console.log('1. 检查TTS配置...');
    
    if (window.ttsConfig) {
        console.log('✅ TTS配置已加载:', window.ttsConfig);
    } else {
        console.error('❌ TTS配置未找到');
        return false;
    }
    
    console.log('2. 检查TTS服务...');
    
    // 等待TTS服务初始化
    let attempts = 0;
    while (!window.ttsService && attempts < 10) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
    }
    
    if (window.ttsService) {
        console.log('✅ TTS服务已初始化');
        console.log('TTS服务状态:', window.ttsService.getPlayingStatus());
    } else {
        console.error('❌ TTS服务未初始化');
        return false;
    }
    
    console.log('3. 测试TTS API连接...');
    
    try {
        const response = await fetch('/api/debug-tts-simple');
        const debugData = await response.json();
        
        if (debugData.azureTest?.success) {
            console.log('✅ Azure TTS API连接成功');
            console.log(`音频大小: ${debugData.azureTest.audioSize} 字节`);
        } else {
            console.error('❌ Azure TTS API连接失败:', debugData.azureTest);
            return false;
        }
    } catch (error) {
        console.error('❌ TTS API测试失败:', error);
        return false;
    }
    
    console.log('4. 测试TTS朗读功能...');
    
    try {
        await window.ttsService.speak('TTS功能验证测试');
        console.log('✅ TTS朗读功能正常');
        return true;
    } catch (error) {
        console.error('❌ TTS朗读功能失败:', error);
        return false;
    }
}

// 导出验证函数
window.verifyTTS = verifyTTS;

// 自动运行验证
setTimeout(async () => {
    const result = await verifyTTS();
    if (result) {
        console.log('🎉 TTS功能验证通过！');
    } else {
        console.log('⚠️ TTS功能验证失败，请检查配置');
    }
}, 1000);