// 检查必需的类是否存在
console.log('🔍 检查必需的类...');

// 添加一个函数来检查模块是否已加载
function checkModules() {
    console.log('=== 类存在性检查 ===');
    console.log('AudioRecorder:', typeof AudioRecorder !== 'undefined' ? '✅ 存在' : '❌ 不存在');
    console.log('UIController:', typeof UIController !== 'undefined' ? '✅ 存在' : '❌ 不存在');
    console.log('APIClient:', typeof APIClient !== 'undefined' ? '✅ 存在' : '❌ 不存在');
    console.log('VoiceRecognitionApp:', typeof VoiceRecognitionApp !== 'undefined' ? '✅ 存在' : '❌ 不存在');
    
    console.log('\n=== 全局对象检查 ===');
    console.log('window.authManager:', typeof window.authManager !== 'undefined' ? '✅ 存在' : '❌ 不存在');
    console.log('window.debugConfig:', typeof window.debugConfig !== 'undefined' ? '✅ 存在' : '❌ 不存在');
    console.log('window.app:', typeof window.app !== 'undefined' ? '✅ 存在' : '❌ 不存在');
    
    // 返回检查结果
    return {
        AudioRecorder: typeof AudioRecorder !== 'undefined',
        UIController: typeof UIController !== 'undefined',
        APIClient: typeof APIClient !== 'undefined',
        VoiceRecognitionApp: typeof VoiceRecognitionApp !== 'undefined',
        app: typeof window.app !== 'undefined'
    };
}

// 等待模块加载完成的函数
function waitForModules() {
    return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
            const results = checkModules();
            // 如果所有必需的类都存在，或者应用已经创建，则停止检查
            if ((results.AudioRecorder && results.UIController && results.APIClient && results.VoiceRecognitionApp) || 
                results.app) {
                clearInterval(checkInterval);
                resolve(true);
            }
        }, 500); // 每500ms检查一次
        
        // 设置最长等待时间，避免无限等待
        setTimeout(() => {
            clearInterval(checkInterval);
            resolve(false);
        }, 10000); // 最多等待10秒
    });
}

// 主检查函数
async function mainCheck() {
    console.log('⏳ 等待模块加载完成...');
    const modulesLoaded = await waitForModules();
    
    if (!modulesLoaded) {
        console.log('⚠️ 模块加载超时，继续执行检查...');
    } else {
        console.log('✅ 模块加载完成');
    }
    
    const results = checkModules();
    
    // 尝试手动创建应用
    if (typeof VoiceRecognitionApp !== 'undefined' && !window.app) {
        console.log('\n🔧 尝试手动创建应用...');
        try {
            const app = new VoiceRecognitionApp();
            window.app = app;
            console.log('✅ 应用创建成功');
            
            // 初始化应用
            app.initialize().then(() => {
                console.log('✅ 应用初始化成功');
                console.log('💡 现在可以尝试使用录音功能了');
            }).catch(error => {
                console.error('❌ 应用初始化失败:', error);
            });
            
        } catch (error) {
            console.error('❌ 应用创建失败:', error);
        }
    }
    
    // 如果类不存在，提供简化版本
    if (typeof AudioRecorder === 'undefined' || typeof UIController === 'undefined' || typeof APIClient === 'undefined') {
        console.log('\n⚠️ 某些类缺失，创建简化版本...');
        createSimplifiedApp();
    }
}

// 延迟执行主检查函数
setTimeout(mainCheck, 2000);

function createSimplifiedApp() {
    console.log('🔧 创建简化应用...');
    
    // 简化的应用对象
    window.app = {
        isInitialized: true,
        isProcessing: false,
        
        // 简化的UI控制器
        uiController: {
            handlePressStart: function() {
                console.log('🎤 开始录音（简化版）');
                startSimpleRecording();
            },
            
            handlePressEnd: function() {
                console.log('⏹️ 停止录音（简化版）');
                stopSimpleRecording();
            },
            
            showRecordingState: function() {
                const button = document.getElementById('microphoneButton');
                if (button) button.classList.add('recording');
                
                const waves = document.getElementById('soundWaves');
                if (waves) waves.classList.add('active', 'recording');
                
                const indicator = document.getElementById('listeningIndicator');
                if (indicator) indicator.classList.add('active');
            },
            
            hideRecordingState: function() {
                const button = document.getElementById('microphoneButton');
                if (button) button.classList.remove('recording');
                
                const waves = document.getElementById('soundWaves');
                if (waves) waves.classList.remove('active', 'recording');
                
                const indicator = document.getElementById('listeningIndicator');
                if (indicator) indicator.classList.remove('active');
            },
            
            showResults: function(message) {
                const container = document.getElementById('resultsContainer');
                if (container) {
                    container.innerHTML = `<div style="color: #48bb78; text-align: center; padding: 20px;">${message}</div>`;
                }
            },
            
            showError: function(error) {
                const container = document.getElementById('resultsContainer');
                if (container) {
                    container.innerHTML = `<div style="color: #f56565; text-align: center; padding: 20px;">错误: ${error}</div>`;
                }
            }
        }
    };
    
    let mediaRecorder = null;
    let audioStream = null;
    let chunks = [];
    
    // 简化的录音开始
    window.startSimpleRecording = async function() {
        try {
            console.log('🎤 请求麦克风权限...');
            audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            mediaRecorder = new MediaRecorder(audioStream);
            chunks = [];
            
            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunks.push(e.data);
            };
            
            mediaRecorder.onstop = () => {
                const blob = new Blob(chunks, { type: 'audio/webm' });
                console.log('✅ 录音完成，大小:', blob.size, 'bytes');
                
                window.app.uiController.showResults(`
                    <h3>🎤 录音成功！</h3>
                    <p>大小: ${(blob.size / 1024).toFixed(2)} KB</p>
                    <p>格式: ${blob.type}</p>
                    <small>简化版录音功能正常工作</small>
                `);
                
                // 清理资源
                if (audioStream) {
                    audioStream.getTracks().forEach(track => track.stop());
                }
            };
            
            mediaRecorder.start();
            window.app.uiController.showRecordingState();
            console.log('✅ 录音开始');
            
        } catch (error) {
            console.error('❌ 录音失败:', error);
            window.app.uiController.showError(error.message);
        }
    };
    
    // 简化的录音停止
    window.stopSimpleRecording = function() {
        if (mediaRecorder && mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
            window.app.uiController.hideRecordingState();
            console.log('⏹️ 录音停止');
        }
    };
    
    console.log('✅ 简化应用创建完成');
    console.log('💡 现在可以尝试使用录音功能了');
}

console.log('🔍 类检查脚本已加载，2秒后开始检查...');