// 检查必需的类是否存在
console.log('🔍 检查必需的类...');

setTimeout(() => {
    console.log('=== 类存在性检查 ===');
    console.log('AudioRecorder:', typeof AudioRecorder !== 'undefined' ? '✅ 存在' : '❌ 不存在');
    console.log('UIController:', typeof UIController !== 'undefined' ? '✅ 存在' : '❌ 不存在');
    console.log('APIClient:', typeof APIClient !== 'undefined' ? '✅ 存在' : '❌ 不存在');
    console.log('VoiceRecognitionApp:', typeof VoiceRecognitionApp !== 'undefined' ? '✅ 存在' : '❌ 不存在');
    
    console.log('\n=== 全局对象检查 ===');
    console.log('window.authManager:', typeof window.authManager !== 'undefined' ? '✅ 存在' : '❌ 不存在');
    console.log('window.debugConfig:', typeof window.debugConfig !== 'undefined' ? '✅ 存在' : '❌ 不存在');
    console.log('window.app:', typeof window.app !== 'undefined' ? '✅ 存在' : '❌ 不存在');
    
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
    
}, 2000); // 等待2秒确保所有脚本加载完成

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