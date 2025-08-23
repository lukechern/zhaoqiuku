// main.js - 应用入口点和框架
console.log('main.js 脚本开始执行');

import { VoiceRecognitionApp } from './App.js';
import { AudioRecorder } from './audio-recorder.js';
import { UIController } from './ui-controller.js';  // 确保使用默认导出
import { APIClient } from './api-client.js';
import { TTSService } from './tts-service.js';

// 导入业务逻辑模块
import { startApp, setupFinalStateCheck } from './app-business.js';

// 导入调试工具模块
import { initializeDebugTools } from './debug-tools.js';

// 将类暴露到全局作用域，以便class-check.js可以检测到
window.AudioRecorder = AudioRecorder;
window.UIController = UIController;
window.APIClient = APIClient;
window.VoiceRecognitionApp = VoiceRecognitionApp;
window.TTSService = TTSService;

// 全局初始化状态标志
window.voiceAppInitialized = false;

// 初始化调试工具
initializeDebugTools();

// 如果DOM已加载完成，立即初始化；否则等待DOMContentLoaded事件
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startApp);
} else {
    console.log('DOM已加载完成，立即启动应用');
    startApp();
}

// 设置页面完全加载后的最终检查
setupFinalStateCheck();

