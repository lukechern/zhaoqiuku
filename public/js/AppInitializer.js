// AppInitializer.js - 应用初始化模块

export class AppInitializer {
    constructor(app) {
        this.app = app;
    }

    // 初始化应用
    async initialize() {
        try {
            // 检查浏览器支持
            if (!this.checkBrowserSupport()) {
                this.app.uiController.showUnsupportedPrompt();
                return;
            }

            // 初始化UI
            this.app.uiController.initialize();
            this.setupEventHandlers();

            // 显示初始状态
            this.app.uiController.clearResults();
            this.app.uiController.disableControls();
            
            // 根据调试级别控制按钮显示
            this.updateControlsVisibility();

            this.app.isInitialized = true;
            console.log('语音识别应用初始化完成');

        } catch (error) {
            console.error('应用初始化失败:', error);
            this.app.uiController.showError('应用初始化失败: ' + error.message);
        }
    }

    // 根据调试级别更新控制按钮可见性
    updateControlsVisibility() {
        // 获取控制按钮容器
        const controlsContainer = document.getElementById('controlsContainer');
        if (controlsContainer && window.debugConfig) {
            const currentLevel = window.debugConfig.config.currentLevel;
            const DEBUG_LEVELS = window.debugConfig.config.levels;
            
            // 只有在DEBUG或FULL_DEBUG模式下才显示控制按钮
            if (currentLevel === 'debug' || currentLevel === 'full_debug') {
                controlsContainer.style.display = 'flex';
            } else {
                controlsContainer.style.display = 'none';
            }
        }
    }

    // 检查浏览器支持
    checkBrowserSupport() {
        const requiredFeatures = [
            'navigator.mediaDevices',
            'navigator.mediaDevices.getUserMedia',
            'MediaRecorder',
            'fetch'
        ];

        // 检测WebView环境
        const isWebView = this.detectWebView();
        console.log('运行环境:', isWebView ? 'WebView' : '普通浏览器');

        for (const feature of requiredFeatures) {
            if (!this.hasFeature(feature)) {
                console.error(`浏览器不支持: ${feature}`);
                
                // 在WebView中提供更详细的错误信息
                if (isWebView) {
                    this.showWebViewInstructions();
                }
                return false;
            }
        }

        // WebView环境下的额外检查
        if (isWebView) {
            this.setupWebViewOptimizations();
        }

        return true;
    }

    // 检测WebView环境
    detectWebView() {
        const userAgent = navigator.userAgent;
        return /Android.*wv\)|.*WebView.*Android|WebView|wv/i.test(userAgent) || 
               (!window.chrome || !window.chrome.runtime);
    }

    // 显示WebView使用说明
    showWebViewInstructions() {
        this.app.uiController.showMessage(`
            检测到您在应用内浏览器中使用此功能。
            如果无法正常使用，请：
            1. 确保应用已获得麦克风权限
            2. 尝试在系统浏览器中打开
            3. 联系应用开发者更新WebView配置
        `, 'warning');
    }

    // WebView环境优化设置
    setupWebViewOptimizations() {
        // 禁用某些可能导致问题的功能
        document.addEventListener('touchstart', function(e) {
            // 防止WebView中的触摸延迟
        }, { passive: true });

        // 添加WebView特定的样式类
        document.body.classList.add('webview-environment');
        
        console.log('WebView优化设置已应用');
    }

    // 检查功能是否存在
    hasFeature(featurePath) {
        const parts = featurePath.split('.');
        let obj = window;
        
        for (const part of parts) {
            if (!(part in obj)) {
                return false;
            }
            obj = obj[part];
        }
        
        return true;
    }

    // 设置事件处理器
    setupEventHandlers() {
        // 录音事件
        this.app.uiController.onRecordingStart = () => this.app.eventHandler.handleRecordingStart();
        this.app.uiController.onRecordingStop = () => this.app.eventHandler.handleRecordingStop();
        this.app.uiController.onRecordingCancel = () => this.app.eventHandler.handleRecordingCancel();
        
        // 控制按钮事件
        this.app.uiController.onPlayback = () => this.app.eventHandler.handlePlayback();
        this.app.uiController.onClear = () => this.app.eventHandler.handleClear();
        
        // 录音完成事件
        this.app.audioRecorder.onRecordingComplete = (audioBlob, mimeType) => {
            this.app.eventHandler.handleRecordingComplete(audioBlob, mimeType);
        };
    }
}