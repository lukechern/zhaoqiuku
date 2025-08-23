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

// 全局初始化状态标志
window.voiceAppInitialized = false;

// 显示麦克风图标函数
function showMicrophoneIcon() {
    // 等待DOM元素加载完成
    const waitForMicrophoneElements = () => {
        const microphoneIcon = document.getElementById('microphoneIcon');
        const microphoneButton = document.getElementById('microphoneButton');
        
        if (microphoneIcon && microphoneButton) {
            // 显示麦克风图标
            microphoneIcon.classList.remove('hidden-initial');
            microphoneIcon.classList.add('show');
            
            // 启用麦克风按钮
            microphoneButton.classList.remove('initializing');
            microphoneButton.classList.add('ready');
            
            console.log('麦克风按钮和图标已启用');
        } else {
            // 如果元素还没加载，等待100ms后重试
            setTimeout(waitForMicrophoneElements, 100);
        }
    };
    
    waitForMicrophoneElements();
}

// 应用启动函数
async function startApp() {
    console.log('开始初始化应用');
    const app = new VoiceRecognitionApp();
    console.log('VoiceRecognitionApp 实例创建完成');
    
    // 将app实例保存到全局，方便调试
    window.app = app;
    console.log('window.app 设置完成');
    
    // 将流式渲染器暴露到全局，供回退渲染与事件处理使用
    if (app && app.uiController && app.uiController.streamRenderer_7ree) {
        window.streamRenderer_7ree = app.uiController.streamRenderer_7ree;
        console.log('window.streamRenderer_7ree 设置完成');
    }
    
    try {
        await app.appInitializer.initialize();
        console.log('app.appInitializer.initialize() 执行完成');
        
        // 初始化TTS服务
        if (!window.ttsService) {
            window.ttsService = new TTSService();
            console.log('TTS服务初始化完成');
        }
        
        // 初始化用户状态
        app.userStateManager.initializeUserState();
        console.log('app.userStateManager.initializeUserState() 执行完成');
        
        // 所有初始化完成后，显示麦克风图标
        showMicrophoneIcon();
        
        // 设置全局初始化完成标志
        window.voiceAppInitialized = true;
        console.log('语音识别应用初始化完成');
        
        // 应用初始化完成后，检查用户状态（减少冗余调用）
        setTimeout(() => {
            console.log('应用初始化完成，检查用户状态...');
            if (window.authManager && !app.userStateManager.isInitialized) {
                app.userStateManager.updateUserDisplay(true);
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

// 页面完全加载后的最终检查（优化：只在必要时执行）
window.addEventListener('load', () => {
    setTimeout(() => {
        console.log('页面完全加载，执行最终用户状态检查...');
        if (window.app && window.authManager && window.app.userStateManager.isInitialized) {
            // 如果已经初始化，只在状态可能不一致时才更新
            const authLinks = document.getElementById('authLinks');
            const userInfo = document.getElementById('userInfo');
            
            if (authLinks && userInfo) {
                const isAuthenticated = window.authManager.isAuthenticated;
                const authLinksVisible = authLinks.style.display !== 'none' && !authLinks.classList.contains('hidden');
                const userInfoVisible = !userInfo.classList.contains('hidden') && userInfo.style.display !== 'none';
                
                // 只在状态不一致时才更新
                const needsUpdate = (isAuthenticated && authLinksVisible) || (!isAuthenticated && userInfoVisible);
                if (needsUpdate) {
                    window.app.userStateManager.updateUserDisplay(true);
                }
            }
        }
    }, 200);
});

// 全局调试函数
window.testMicrophoneButton = function() {
    console.log('=== 麦克风按钮测试 ===');
    
    const button = document.getElementById('microphoneButton');
    const icon = document.getElementById('microphoneIcon');
    console.log('按钮元素:', button);
    console.log('图标元素:', icon);
    
    if (button) {
        console.log('按钮样式:', {
            display: getComputedStyle(button).display,
            visibility: getComputedStyle(button).visibility,
            pointerEvents: getComputedStyle(button).pointerEvents,
            opacity: getComputedStyle(button).opacity,
            classList: Array.from(button.classList)
        });
        
        console.log('按钮位置:', button.getBoundingClientRect());
    }
    
    if (icon) {
        console.log('图标样式:', {
            opacity: getComputedStyle(icon).opacity,
            pointerEvents: getComputedStyle(icon).pointerEvents,
            classList: Array.from(icon.classList)
        });
    }
    
    console.log('初始化状态:', {
        voiceAppInitialized: window.voiceAppInitialized,
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

// 检查应用初始化状态的便捷函数
window.checkAppInitStatus = function() {
    return {
        initialized: window.voiceAppInitialized,
        microphoneReady: document.getElementById('microphoneButton')?.classList.contains('ready'),
        iconVisible: document.getElementById('microphoneIcon')?.classList.contains('show'),
        authReady: !!window.authManager,
        appReady: !!window.app
    };
};

// window.forceStartRecording = function() {
//     console.log('强制开始录音测试...');
//     if (window.app && window.app.uiController) {
//         window.app.uiController.handlePressStart();
//     }
// };