// 主应用程序
class VoiceRecognitionApp {
    constructor() {
        this.audioRecorder = new AudioRecorder();
        this.uiController = new UIController();
        this.apiClient = new APIClient();
        
        this.isInitialized = false;
        this.isProcessing = false;
        
        // 用户状态管理
        this.initializeUserState();
    }

    // 初始化用户状态
    initializeUserState() {
        // 延迟初始化，确保DOM元素已加载
        const initUserStateElements = () => {
            // 获取用户状态元素
            this.authLinks = document.getElementById('authLinks');
            this.userInfo = document.getElementById('userInfo');
            this.userEmail = document.getElementById('userEmail');
            this.logoutBtn = document.getElementById('logoutBtn');

            if (!this.authLinks || !this.userInfo || !this.userEmail) {
                console.log('用户状态元素未找到，延迟重试...');
                setTimeout(initUserStateElements, 100);
                return;
            }

            console.log('用户状态元素已找到，绑定事件...');
            console.log('元素状态:', {
                authLinks: !!this.authLinks,
                userInfo: !!this.userInfo,
                userEmail: !!this.userEmail,
                logoutBtn: !!this.logoutBtn
            });

            // 重新获取登出按钮（确保获取到最新的元素）
            this.logoutBtn = document.getElementById('logoutBtn');

            // 绑定登出事件
            if (this.logoutBtn) {
                console.log('绑定登出按钮事件:', this.logoutBtn);
                
                // 移除可能存在的旧事件监听器
                this.logoutBtn.replaceWith(this.logoutBtn.cloneNode(true));
                this.logoutBtn = document.getElementById('logoutBtn');
                
                this.logoutBtn.addEventListener('click', (e) => {
                    console.log('登出按钮被点击');
                    e.preventDefault();
                    e.stopPropagation();
                    this.handleLogout();
                });
                
                // 测试按钮是否可点击
                console.log('登出按钮样式:', {
                    display: getComputedStyle(this.logoutBtn).display,
                    visibility: getComputedStyle(this.logoutBtn).visibility,
                    pointerEvents: getComputedStyle(this.logoutBtn).pointerEvents
                });
            } else {
                console.warn('登出按钮未找到');
            }

            // 监听认证状态变化
            window.addEventListener('authStateChange', (e) => {
                this.handleAuthStateChange(e.detail);
            });

            // 等待认证管理器初始化完成
            this.waitForAuthManager();
        };

        // 如果DOM已加载完成，立即初始化；否则等待
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initUserStateElements);
        } else {
            initUserStateElements();
        }
    }

    // 初始化应用
    async initialize() {
        try {
            // 检查浏览器支持
            if (!this.checkBrowserSupport()) {
                this.uiController.showUnsupportedPrompt();
                return;
            }

            // 初始化UI
            this.uiController.initialize();
            this.setupEventHandlers();

            // 显示初始状态
            this.uiController.clearResults();
            this.uiController.disableControls();

            this.isInitialized = true;
            console.log('语音识别应用初始化完成');

        } catch (error) {
            console.error('应用初始化失败:', error);
            this.uiController.showError('应用初始化失败: ' + error.message);
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
        this.uiController.showMessage(`
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
        this.uiController.onRecordingStart = () => this.handleRecordingStart();
        this.uiController.onRecordingStop = () => this.handleRecordingStop();
        this.uiController.onRecordingCancel = () => this.handleRecordingCancel();
        
        // 控制按钮事件
        this.uiController.onPlayback = () => this.handlePlayback();
        this.uiController.onClear = () => this.handleClear();
        
        // 录音完成事件
        this.audioRecorder.onRecordingComplete = (audioBlob, mimeType) => {
            this.handleRecordingComplete(audioBlob, mimeType);
        };
    }

    // 处理录音开始
    async handleRecordingStart() {
        if (this.isProcessing) return;

        try {
            // 初始化音频录制器（如果需要）
            if (!this.audioRecorder.audioStream) {
                const isWebView = this.detectWebView();
                
                if (isWebView) {
                    this.uiController.showMessage('WebView环境：正在请求麦克风权限...', 'info');
                    // WebView环境下给更多时间
                    await new Promise(resolve => setTimeout(resolve, 500));
                } else {
                    this.uiController.showMessage('正在请求麦克风权限...', 'info');
                }
                
                await this.audioRecorder.initialize();
            }

            // 开始录音
            await this.audioRecorder.startRecording();
            
            // 更新UI
            this.uiController.showRecordingState();
            this.uiController.vibrate([50]); // 震动反馈
            
            console.log('开始录音');

        } catch (error) {
            console.error('开始录音失败:', error);
            this.uiController.hideRecordingState();
            
            const isWebView = this.detectWebView();
            
            if (error.message.includes('权限') || error.name === 'NotAllowedError') {
                if (isWebView) {
                    this.uiController.showMessage(`
                        WebView环境权限问题：
                        1. 请确保应用已获得麦克风权限
                        2. 尝试重启应用或清除缓存
                        3. 如问题持续，请在系统浏览器中打开
                    `, 'error');
                } else {
                    this.uiController.showPermissionPrompt();
                }
            } else {
                this.uiController.showError('开始录音失败: ' + error.message);
            }
        }
    }

    // 处理录音停止
    handleRecordingStop() {
        if (!this.audioRecorder.isRecording) return;

        try {
            this.audioRecorder.stopRecording();
            this.uiController.hideRecordingState();
            this.uiController.vibrate([100]); // 震动反馈
            
            console.log('停止录音');

        } catch (error) {
            console.error('停止录音失败:', error);
            this.uiController.showError('停止录音失败: ' + error.message);
        }
    }

    // 处理录音取消
    handleRecordingCancel() {
        if (!this.audioRecorder.isRecording) return;

        try {
            // 停止录音但不触发完成事件
            this.audioRecorder.cancelRecording();
            this.uiController.hideRecordingState();
            this.uiController.vibrate([50, 50]); // 取消震动反馈
            
            // 显示取消提示
            this.uiController.showMessage('录音已取消', 'info');
            
            console.log('录音已取消');

        } catch (error) {
            console.error('取消录音失败:', error);
            this.uiController.showError('取消录音失败: ' + error.message);
        }
    }

    // 处理录音完成
    async handleRecordingComplete(audioBlob, mimeType) {
        if (this.isProcessing) return;

        try {
            this.isProcessing = true;
            
            // 检查录音质量
            const sizeCheck = this.audioRecorder.checkAudioSize();
            if (!sizeCheck.valid) {
                throw new Error(`录音文件过大 (${sizeCheck.sizeMB}MB)，请录制更短的音频`);
            }

            // 启用控制按钮
            this.uiController.enableControls();
            
            // 显示处理状态
            this.uiController.showLoading('正在处理音频，请稍候...');
            
            // 发送到API
            const result = await this.apiClient.transcribeAudio(audioBlob, mimeType);
            
            // 格式化并显示结果
            const displayResult = this.apiClient.formatResultForDisplay(result);
            this.uiController.showResults(displayResult);
            
            console.log('音频处理完成:', result);

        } catch (error) {
            console.error('处理录音失败:', error);
            this.uiController.showError(error.message);
        } finally {
            this.isProcessing = false;
        }
    }

    // 处理播放
    handlePlayback() {
        try {
            this.audioRecorder.playRecording();
            this.uiController.vibrate([30]); // 轻微震动反馈
        } catch (error) {
            console.error('播放失败:', error);
            this.uiController.showError('播放失败: ' + error.message);
        }
    }

    // 处理清除
    handleClear() {
        try {
            // 清理录音数据
            this.audioRecorder.cleanup();
            
            // 重置UI
            this.uiController.clearResults();
            this.uiController.disableControls();
            this.uiController.resetTimer();
            
            // 重新初始化录音器
            this.audioRecorder = new AudioRecorder();
            this.audioRecorder.onRecordingComplete = (audioBlob, mimeType) => {
                this.handleRecordingComplete(audioBlob, mimeType);
            };
            
            this.uiController.vibrate([50]); // 震动反馈
            console.log('已清除录音数据');

        } catch (error) {
            console.error('清除失败:', error);
            this.uiController.showError('清除失败: ' + error.message);
        }
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

    // 等待认证管理器初始化
    waitForAuthManager() {
        let attempts = 0;
        const maxAttempts = 100; // 最多等待5秒

        const checkAuthManager = () => {
            attempts++;
            
            if (window.authManager) {
                console.log('认证管理器已就绪，初始化用户状态显示');
                console.log('认证状态:', {
                    isAuthenticated: window.authManager.isAuthenticated,
                    user: window.authManager.user?.email,
                    hasTokens: !!window.authManager.tokens
                });
                this.updateUserDisplay();
            } else if (attempts < maxAttempts) {
                console.log(`等待认证管理器初始化... (${attempts}/${maxAttempts})`);
                setTimeout(checkAuthManager, 50);
            } else {
                console.error('认证管理器初始化超时');
                // 即使没有认证管理器，也要显示默认状态
                this.updateUserDisplay();
            }
        };
        
        checkAuthManager();
    }

    // 更新用户显示状态
    updateUserDisplay() {
        try {
            console.log('更新用户显示状态:', {
                hasAuthManager: !!window.authManager,
                isAuthenticated: window.authManager?.isAuthenticated,
                user: window.authManager?.user?.email,
                hasElements: !!(this.authLinks && this.userInfo && this.userEmail)
            });

            if (!this.authLinks || !this.userInfo || !this.userEmail) {
                console.error('用户状态显示元素未找到');
                return;
            }

            if (window.authManager && window.authManager.isAuthenticated && window.authManager.user) {
                // 显示用户信息，隐藏登录链接
                this.authLinks.style.display = 'none';
                this.userInfo.classList.remove('hidden');
                this.userEmail.textContent = window.authManager.user.email;
                console.log('显示用户信息:', window.authManager.user.email);
            } else {
                // 显示登录链接，隐藏用户信息
                this.authLinks.style.display = 'flex';
                this.userInfo.classList.add('hidden');
                console.log('显示登录链接');
            }
        } catch (error) {
            console.error('更新用户显示状态失败:', error);
        }
    }

    // 处理认证状态变化
    handleAuthStateChange(detail) {
        console.log('认证状态变化:', detail);
        this.updateUserDisplay();
        
        // 清除UI中的登录要求状态
        if (this.uiController && this.uiController.clearLoginRequiredState) {
            this.uiController.clearLoginRequiredState();
        }
        
        // 可以在这里添加其他认证状态变化的处理逻辑
        if (detail.type === 'login') {
            console.log('用户已登录:', detail.user.email);
            // 显示欢迎消息
            if (this.uiController && this.uiController.showMessage) {
                this.uiController.showMessage(`欢迎回来，${detail.user.email}！`, 'success');
                // 3秒后清除欢迎消息
                setTimeout(() => {
                    if (this.uiController && this.uiController.clearResults) {
                        this.uiController.clearResults();
                    }
                }, 3000);
            }
        } else if (detail.type === 'logout') {
            console.log('用户已登出');
            // 清除结果显示
            if (this.uiController && this.uiController.clearResults) {
                this.uiController.clearResults();
            }
        } else if (detail.type === 'restore') {
            console.log('用户状态已恢复:', detail.user.email);
        }
    }

    // 处理登出
    async handleLogout() {
        try {
            // 显示确认对话框
            const userEmail = window.authManager?.user?.email || '当前用户';
            const confirmMessage = `确定要退出登录吗？\n\n当前登录用户：${userEmail}`;
            
            if (!confirm(confirmMessage)) {
                console.log('用户取消登出');
                return;
            }

            console.log('开始登出流程...');
            
            // 显示加载状态（如果有UI控制器）
            if (this.uiController && this.uiController.showMessage) {
                this.uiController.showMessage('正在退出登录...', 'info');
            }

            // 执行登出
            const success = await window.authManager.logout();
            
            if (success) {
                console.log('登出成功');
                
                // 显示成功消息
                if (this.uiController && this.uiController.showMessage) {
                    this.uiController.showMessage('已成功退出登录', 'success');
                } else {
                    // 如果没有UI控制器，使用简单的alert
                    alert('已成功退出登录');
                }
                
                // 强制更新用户显示状态
                setTimeout(() => {
                    this.updateUserDisplay();
                }, 100);
                
            } else {
                console.error('登出失败');
                
                // 显示错误消息
                if (this.uiController && this.uiController.showError) {
                    this.uiController.showError('退出登录失败，请重试');
                } else {
                    alert('退出登录失败，请重试');
                }
            }
            
        } catch (error) {
            console.error('登出处理失败:', error);
            
            // 显示错误消息
            if (this.uiController && this.uiController.showError) {
                this.uiController.showError('退出登录时发生错误：' + error.message);
            } else {
                alert('退出登录时发生错误：' + error.message);
            }
        }
    }
}

// 应用启动
document.addEventListener('DOMContentLoaded', async () => {
    const app = new VoiceRecognitionApp();
    
    try {
        await app.initialize();
        
        // 应用初始化完成后，再次检查用户状态
        setTimeout(() => {
            console.log('应用初始化完成，最终检查用户状态...');
            if (window.authManager) {
                app.updateUserDisplay();
            }
        }, 200);
        
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
});