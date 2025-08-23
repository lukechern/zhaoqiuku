/**
 * ========================================
 * 📱 应用业务逻辑模块
 * ========================================
 * 包含应用的核心业务功能和调试工具
 */

import { VoiceRecognitionApp } from './App.js';
import { TTSService } from './tts-service.js';

/**
 * 显示麦克风图标函数
 * 在应用初始化完成后，从加载图标切换到麦克风图标
 */
export function showMicrophoneIcon() {
    // 等待DOM元素加载完成
    const waitForMicrophoneElements = () => {
        const microphoneIcon = document.getElementById('microphoneIcon');
        const microphoneButton = document.getElementById('microphoneButton');
        const loadingIcon = document.getElementById('loadingIcon');
        
        if (microphoneIcon && microphoneButton && loadingIcon) {
            console.log('开始从加载图标切换到麦克风图标');
            
            // 首先隐藏加载图标
            loadingIcon.classList.add('hidden');
            
            // 等待加载图标淡出动画完成后显示麦克风图标
            setTimeout(() => {
                // 显示麦克风图标
                microphoneIcon.classList.remove('hidden-initial');
                microphoneIcon.classList.add('show');
                
                // 启用麦克风按钮
                microphoneButton.classList.remove('initializing');
                microphoneButton.classList.add('ready');
                
                console.log('麦克风按钮和图标已启用');
            }, 300); // 等待加载图标淡出动画完成
        } else {
            // 如果元素还没加载，等待100ms后重试
            setTimeout(waitForMicrophoneElements, 100);
        }
    };
    
    waitForMicrophoneElements();
}

/**
 * 应用启动函数
 * 初始化语音识别应用的核心组件和服务
 */
export async function startApp() {
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

/**
 * 设置页面完全加载后的最终用户状态检查
 */
export function setupFinalStateCheck() {
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
}