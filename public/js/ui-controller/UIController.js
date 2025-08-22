// UIController.js - UI控制模块主类（已模块化）

import { StreamRenderer_7ree } from '../stream-renderer_7ree.js';

// 导入UI模块
import './index.js';

export class UIController {
    constructor() {
        // 使用模块化的元素获取函数
        this.elements = window.getUIElements ? window.getUIElements() : this.getDefaultElements();

        this.isRecording = false;
        this.startTouchY = null;
        this.currentTouchY = null;
        this.cancelThreshold = 80; // 向上滑动80px取消
        this.isCanceling = false;
        this.lastResultData = null;

        // 播放状态追踪_7ree
        this.currentPlayingElement_7ree = null;  // 当前正在播放的气泡元素
        this.currentPlayingAudio_7ree = null;    // 当前播放的音频对象(用于用户气泡)

        // 流式渲染器_7ree
        this.streamRenderer_7ree = new StreamRenderer_7ree();

        // 双按钮处理器_7ree
        this.dualButtonHandler_7ree = null;
    }

    // 获取默认元素（备用方法）
    getDefaultElements() {
        return {
            microphoneButton: document.getElementById('microphoneButton'),
            soundWaves: document.getElementById('soundWaves'),
            listeningIndicator: null, // 已移除的元素，设为null
            cancelIndicator: document.getElementById('cancelIndicator'),
            timer: null, // 已移除的元素，设为null
            playbackBtn: document.getElementById('playbackBtn'),
            clearBtn: document.getElementById('clearBtn'),
            refreshBtn: document.getElementById('refreshBtn'),
            resultsContainer: document.getElementById('resultsContainer'),
            debugLevel: document.getElementById('debugLevel')
        };
    }

    // 初始化UI事件
    initialize() {
        // 使用模块化的元素初始化
        this.initializeElements();
        this.setupEvents();
    }

    // 初始化元素
    async initializeElements() {
        if (!this.elements.microphoneButton) {
            console.error('麦克风按钮元素未找到，延迟初始化...');
            if (window.retryElementInitialization) {
                await window.retryElementInitialization(this.elements, 10);
            }
        }

        // 初始化音量可视化组件
        this.initializeVolumeVisualizer();

        if (this.elements.microphoneButton) {
            this.setupEvents();
        }
    }

    // 设置事件
    setupEvents() {
        // 使用模块化的触摸事件设置
        if (window.setupTouchEvents) {
            window.setupTouchEvents(this);
        }

        // 新增：初始化左右双按钮处理器
        this.initializeDualButtonHandler();

        this.setupButtonEvents();

        // 使用模块化的调试控制设置
        if (window.setupDebugControls) {
            window.setupDebugControls();
        }

        // 监听调试级别变化事件
        window.addEventListener('debugLevelChanged', () => {
            if (this.lastResultData) {
                this.showResults(this.lastResultData);
            }
        });
    }

    // 初始化双按钮处理器
    initializeDualButtonHandler() {
        console.log('初始化双按钮处理器...');
        console.log('DualButtonHandler_7ree 是否已定义:', typeof DualButtonHandler_7ree);

        // 动态导入 DualButtonHandler_7ree 类
        if (typeof DualButtonHandler_7ree !== 'undefined') {
            console.log('创建 DualButtonHandler_7ree 实例');
            this.dualButtonHandler_7ree = new DualButtonHandler_7ree(this);
            this.dualButtonHandler_7ree.setupDualButtons_7ree();
            console.log('双按钮处理器初始化完成');
        } else {
            // 如果类还没有加载，等待一下再试
            console.log('DualButtonHandler_7ree 未找到，100ms后重试');
            setTimeout(() => this.initializeDualButtonHandler(), 100);
        }
    }

    // 初始化音量可视化组件
    initializeVolumeVisualizer() {
        console.log('初始化音量可视化组件...');

        // 在录音状态下，音量可视化元素会动态创建，所以需要在录音开始时设置
        if (window.app && window.app.audioRecorder) {
            console.log('音量可视化组件初始化完成，将在录音时动态设置容器');
        } else {
            console.log('等待AudioRecorder初始化...');
            // 如果AudioRecorder还没有初始化，等待一下再试
            setTimeout(() => this.initializeVolumeVisualizer(), 100);
        }
    }

    // 检查用户认证状态
    checkAuthenticationStatus() {
        if (window.checkAuthenticationStatus) {
            return window.checkAuthenticationStatus(this.elements);
        }
        return false;
    }

    // 清除登录要求状态
    clearLoginRequiredState() {
        if (window.clearLoginRequiredState) {
            window.clearLoginRequiredState(this.elements);
        }
    }

    // 显示需要登录的提示并跳转
    showLoginRequired() {
        if (window.showLoginRequired) {
            window.showLoginRequired(this.elements);
        }
    }

    // 处理按下开始
    handlePressStart() {
        console.log('handlePressStart 被调用');
        console.log('当前录音状态:', this.isRecording);

        // 如果已经在录音中，跳过
        if (this.isRecording) {
            console.log('已经在录音中，跳过重复启动');
            return;
        }

        // 检查用户是否已登录
        if (!this.checkAuthenticationStatus()) {
            console.log('认证检查失败，阻止录音');
            return; // 如果未登录，不继续录音流程
        }

        console.log('认证检查通过，开始录音流程');
        this.isRecording = true;
        if (this.onRecordingStart) {
            this.onRecordingStart();
        }
    }

    // 处理按下结束
    handlePressEnd() {
        console.log('handlePressEnd 被调用，结束录音');
        this.isRecording = false;
        if (this.onRecordingStop) {
            this.onRecordingStop();
        }
    }

    // 处理取消录音
    handleCancel() {
        console.log('handleCancel 被调用，取消录音');
        this.isRecording = false;
        if (this.onRecordingCancel) {
            this.onRecordingCancel();
        }
        if (window.hideRecordingState) {
            window.hideRecordingState(this.elements, this.isRecording);
        }
        if (window.hideCancelState) {
            window.hideCancelState(this.elements);
        }
        if (window.resetTimer) {
            window.resetTimer();
        }
    }

    // 显示录音状态
    showRecordingState() {
        console.log('显示录音状态');
        if (window.showRecordingState) {
            window.showRecordingState(this.elements);
        }

        // 新增：在显示录音状态后设置音量可视化容器
        setTimeout(() => {
            const volumeVisualizerElement = document.getElementById('volumeVisualizer');
            if (volumeVisualizerElement && window.app && window.app.audioRecorder) {
                console.log('在录音状态下找到音量可视化元素，设置容器');
                
                // 重新初始化音量可视化器，确保获取正确的音量条元素
                if (window.app.audioRecorder.volumeVisualizer) {
                    window.app.audioRecorder.volumeVisualizer.container = volumeVisualizerElement;
                    window.app.audioRecorder.volumeVisualizer.volumeBars = Array.from(volumeVisualizerElement.querySelectorAll('.volume-bar'));
                    console.log('重新设置音量可视化器容器和音量条元素');
                } else {
                    window.app.audioRecorder.setVolumeVisualizerContainer(volumeVisualizerElement);
                }
                
                // 在录音开始后立即启动音量可视化
                if (window.app.audioRecorder.audioStream) {
                    console.log('启动音量可视化...');
                    window.app.audioRecorder.startVolumeVisualizer();
                }
            } else {
                console.log('未找到音量可视化元素或AudioRecorder未初始化');
            }
        }, 100); // 稍微延迟以确保DOM元素已创建

        // 显示双按钮
        console.log('检查双按钮处理器:', {
            exists: !!this.dualButtonHandler_7ree,
            hasShowMethod: !!(this.dualButtonHandler_7ree && this.dualButtonHandler_7ree.showDualButtons_7ree)
        });

        if (this.dualButtonHandler_7ree && this.dualButtonHandler_7ree.showDualButtons_7ree) {
            console.log('调用双按钮显示方法');
            this.dualButtonHandler_7ree.showDualButtons_7ree();
        } else {
            console.warn('双按钮处理器未初始化或方法不存在');
        }

        // 新增：将方法暴露到全局，兼容 ui-recording-states.js 中的直接调用
        if (!window.showDualButtons_7ree) {
            window.showDualButtons_7ree = () => {
                if (this.dualButtonHandler_7ree && this.dualButtonHandler_7ree.showDualButtons_7ree) {
                    this.dualButtonHandler_7ree.showDualButtons_7ree();
                }
            };
        }
        if (!window.hideDualButtons_7ree) {
            window.hideDualButtons_7ree = () => {
                if (this.dualButtonHandler_7ree && this.dualButtonHandler_7ree.hideDualButtons_7ree) {
                    this.dualButtonHandler_7ree.hideDualButtons_7ree();
                }
            };
        }
    }

    // 隐藏录音状态
    hideRecordingState() {
        if (window.hideRecordingState) {
            window.hideRecordingState(this.elements, this.isRecording);
        }

        // 新增：停止音量可视化
        if (window.app && window.app.audioRecorder) {
            console.log('停止音量可视化');
            window.app.audioRecorder.stopVolumeVisualizer();
        }

        // 隐藏双按钮
        if (this.dualButtonHandler_7ree && this.dualButtonHandler_7ree.hideDualButtons_7ree) {
            this.dualButtonHandler_7ree.hideDualButtons_7ree();
        }
    }

    // 显示取消状态
    showCancelState() {
        if (window.showCancelState) {
            window.showCancelState(this.elements);
        }
    }

    // 隐藏取消状态
    hideCancelState() {
        if (window.hideCancelState) {
            window.hideCancelState(this.elements);
        }
    }

    // 显示结果 - 使用流式渲染器
    async showResults(data) {
        console.log('显示结果，准备重置录音状态');
        // 保存最后的结果数据，用于调试级别切换时重新显示
        this.lastResultData = data;

        if (window.showResults) {
            await window.showResults(data, this.elements);
        }

        // 结果显示完成后，重置录音状态
        setTimeout(() => {
            this.resetRecordingState();
        }, 100);
    }

    // 自动朗读API响应内容
    async autoReadResponse(data) {
        if (window.autoReadResponse) {
            await window.autoReadResponse(data);
        }
    }

    // 清除结果
    clearResults() {
        if (window.clearResults) {
            window.clearResults(this.elements);
        }
    }

    // HTML转义
    escapeHtml(text) {
        if (window.escapeHtml) {
            return window.escapeHtml(text);
        }
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // 添加震动反馈（如果支持）
    vibrate(pattern = [100]) {
        if (window.vibrate) {
            window.vibrate(pattern);
        } else if ('vibrate' in navigator) {
            navigator.vibrate(pattern);
        }
    }

    // 停止当前播放_7ree
    stopCurrentPlaying_7ree() {
        if (window.stopCurrentPlaying) {
            window.stopCurrentPlaying();
        }
    }

    // 显示处理状态（加载状态）
    showProcessingState() {
        if (window.showProcessingState) {
            window.showProcessingState(this.elements);
        }
    }

    // 隐藏处理状态（还原为空闲状态）
    hideProcessingState() {
        if (window.hideProcessingState) {
            window.hideProcessingState(this.elements, this.isRecording);
        }
    }

    // 重置录音状态（外部接口）
    resetRecordingState() {
        console.log('重置录音状态');
        this.isRecording = false;
        this.isCanceling = false;
        this.startTouchY = null;
        this.currentTouchY = null;

        // 隐藏所有录音相关状态
        if (window.hideRecordingState) {
            window.hideRecordingState(this.elements, this.isRecording);
        }
        if (window.hideCancelState) {
            window.hideCancelState(this.elements);
        }
        if (window.resetTimer) {
            window.resetTimer();
        }

        // 隐藏双按钮
        if (this.dualButtonHandler_7ree && this.dualButtonHandler_7ree.hideDualButtons_7ree) {
            this.dualButtonHandler_7ree.hideDualButtons_7ree();
        }
    }
}