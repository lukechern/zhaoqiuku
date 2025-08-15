// main.js - 应用入口点
console.log('main.js 脚本开始执行');

import { VoiceRecognitionApp } from './App.js';
import { AudioRecorder } from './audio-recorder.js';
import { UIController } from './ui-controller.js';  // 确保使用默认导出
import { APIClient } from './api-client.js';
import { TTSService } from './tts-service.js';

// 将类暴露到全局作用域，以便class-check.js可以检测到
window.AudioRecorder = AudioRecorder;
window.UIController = UIController;
window.APIClient = APIClient;
window.VoiceRecognitionApp = VoiceRecognitionApp;
window.TTSService = TTSService;

// 应用启动函数
async function startApp() {
    console.log('开始初始化应用');
    const app = new VoiceRecognitionApp();
    console.log('VoiceRecognitionApp 实例创建完成');
    
    // 将app实例保存到全局，方便调试
    window.app = app;
    console.log('window.app 设置完成');
    
    try {
        await app.appInitializer.initialize();
        console.log('app.appInitializer.initialize() 执行完成');
        
        // 初始化TTS服务
        if (window.ttsConfig && !window.ttsService) {
            window.ttsService = new TTSService();
            console.log('TTS服务初始化完成');
        }
        
        // 初始化用户状态
        app.userStateManager.initializeUserState();
        console.log('app.userStateManager.initializeUserState() 执行完成');
        
        // 应用初始化完成后，检查用户状态
        setTimeout(() => {
            console.log('应用初始化完成，检查用户状态...');
            if (window.authManager) {
                app.userStateManager.updateUserDisplay();
            }
        }, 100);
        
    } catch (error) {
        console.error('应用启动失败:', error);
    }
    
    // 页面卸载时清理资源
    window.addEventListener('beforeunload', () => {
        app.destroy();
    });
    
    // 全局错误处理
    window.addEventListener('error', (event) => {
        console.error('全局错误:', event.error);
    });
    
    window.addEventListener('unhandledrejection', (event) => {
        console.error('未处理的Promise拒绝:', event.reason);
    });
}

// 如果DOM已加载完成，立即初始化；否则等待DOMContentLoaded事件
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startApp);
} else {
    console.log('DOM已加载完成，立即启动应用');
    startApp();
}

// 页面完全加载后的最终检查
window.addEventListener('load', () => {
    setTimeout(() => {
        console.log('页面完全加载，执行最终用户状态检查...');
        if (window.app && window.authManager) {
            window.app.userStateManager.updateUserDisplay();
        }
    }, 200);
});

// 全局调试函数
window.testMicrophoneButton = function() {
    console.log('=== 麦克风按钮测试 ===');
    
    const button = document.getElementById('microphoneButton');
    console.log('按钮元素:', button);
    
    if (button) {
        console.log('按钮样式:', {
            display: getComputedStyle(button).display,
            visibility: getComputedStyle(button).visibility,
            pointerEvents: getComputedStyle(button).pointerEvents,
            zIndex: getComputedStyle(button).zIndex
        });
        
        console.log('按钮位置:', button.getBoundingClientRect());
        console.log('按钮类名:', button.className);
        
        // 尝试手动触发事件
        console.log('尝试触发 mousedown 事件...');
        button.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
        
        setTimeout(() => {
            console.log('尝试触发 mouseup 事件...');
            button.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
        }, 100);
    }
    
    console.log('认证状态:', {
        hasAuthManager: !!window.authManager,
        isAuthenticated: window.authManager?.isAuthenticated,
        user: window.authManager?.user
    });
    
    console.log('应用状态:', {
        hasApp: !!window.app,
        hasUIController: !!window.app?.uiController,
        hasAudioRecorder: !!window.app?.audioRecorder
    });
};

// window.forceStartRecording = function() {
//     console.log('强制开始录音测试...');
//     if (window.app && window.app.uiController) {
//         window.app.uiController.handlePressStart();
//     }
// };