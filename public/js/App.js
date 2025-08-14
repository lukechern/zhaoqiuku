// App.js - 应用核心逻辑

import { AudioRecorder } from './audio-recorder.js';
import { UIController } from './ui-controller.js';
import { APIClient } from './api-client.js';

// 用户状态管理模块
import { UserStateManager } from './UserStateManager.js';

// 应用初始化模块
import { AppInitializer } from './AppInitializer.js';

// 事件处理模块
import { EventHandler } from './EventHandler.js';

// 主应用程序
export class VoiceRecognitionApp {
    constructor() {
        this.audioRecorder = new AudioRecorder();
        this.uiController = new UIController();
        this.apiClient = new APIClient();
        
        this.isInitialized = false;
        this.isProcessing = false;
        
        // 用户状态管理
        this.userStateManager = new UserStateManager(this);
        
        // 应用初始化
        this.appInitializer = new AppInitializer(this);
        
        // 事件处理
        this.eventHandler = new EventHandler(this);
        
        // 初始化用户状态
        this.userStateManager.initializeUserState();
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