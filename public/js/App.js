// App.js - 应用核心逻辑

import { AudioRecorder } from './audio-recorder.js';
import { UIController } from './ui-controller.js';
import { APIClient } from './api-client.js';

// 用户状态管理模块
import UserStateManager from './UserStateManager.js';

// 应用初始化模块
import { AppInitializer } from './AppInitializer.js';

// 事件处理模块
import { EventHandler } from './EventHandler.js';

// 主应用程序
export class VoiceRecognitionApp {
    constructor() {
        console.log('VoiceRecognitionApp 构造函数开始');
        this.audioRecorder = new AudioRecorder();
        console.log('AudioRecorder 实例化完成');
        this.uiController = new UIController();
        console.log('UIController 实例化完成');
        this.apiClient = new APIClient();
        console.log('APIClient 实例化完成');
        
        this.isInitialized = false;
        this.isProcessing = false;
        
        // 用户状态管理
        this.userStateManager = new UserStateManager(this);
        console.log('UserStateManager 实例化完成');
        
        // 应用初始化
        this.appInitializer = new AppInitializer(this);
        console.log('AppInitializer 实例化完成');
        
        // 事件处理
        this.eventHandler = new EventHandler(this);
        console.log('EventHandler 实例化完成');
        
        console.log('VoiceRecognitionApp 构造函数结束');
    }

    // 应用销毁
    destroy() {
        try {
            this.audioRecorder.cleanup();
            console.log('应用已销毁');
        } catch (error) {
            console.error('销毁应用失败:', error);
        }
    }
}