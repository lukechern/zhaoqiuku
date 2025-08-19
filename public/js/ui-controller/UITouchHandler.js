// UITouchHandler.js - UI触摸和鼠标事件处理器

export class UITouchHandler {
    constructor(uiController) {
        this.uiController = uiController;
        // 新增：使用点击开始录音模式
        this.useClickToRecord_7ree = true;
    }

    // 设置触摸事件
    setupTouchEvents() {
        const button = this.uiController.elements.microphoneButton;

        if (!button) {
            console.error('麦克风按钮元素不存在，无法绑定事件');
            return;
        }

        console.log('正在为麦克风按钮绑定事件...', button);

        // 新增：点击开始录音模式
        if (this.useClickToRecord_7ree) {
            // 防抖：录音中再次点击麦克风不做任何动作
            button.addEventListener('click', (e) => {
                console.log('麦克风按钮被点击！');
                e.preventDefault();
                e.stopPropagation();
                if (this.uiController.isRecording) {
                    // 正在录音，点击麦克风不结束，需使用左右按钮明确操作
                    return;
                }
                this.uiController.handlePressStart();
            });

            // 基础保护：阻止长按、选择、拖拽、上下文菜单
            button.addEventListener('contextmenu', (e) => { e.preventDefault(); e.stopPropagation(); return false; });
            button.addEventListener('selectstart', (e) => { e.preventDefault(); e.stopPropagation(); return false; });
            button.addEventListener('dragstart', (e) => { e.preventDefault(); e.stopPropagation(); return false; });
            button.addEventListener('longpress', (e) => { e.preventDefault(); e.stopPropagation(); return false; });

            // WebView保护
            if (window.webViewCompat_7ree) {
                window.webViewCompat_7ree.setupElementProtection(button, {
                    preventContextMenu: true,
                    preventSelection: true,
                    preventDrag: true,
                    longPressDelay: 300
                });
                console.log('已为麦克风按钮设置WebView保护');
            }

            console.log('麦克风按钮事件绑定完成（点击开始录音模式）');
            return; // 直接返回，不绑定长按/滑动
        }

        // 触摸事件
        button.addEventListener('touchstart', (e) => {
            console.log('touchstart 事件被触发', e);
            e.preventDefault();
            e.stopPropagation();
            this.handleTouchStart(e);
        }, { passive: false });

        button.addEventListener('touchmove', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.handleTouchMove(e);
        }, { passive: false });

        button.addEventListener('touchend', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.handleTouchEnd(e);
        }, { passive: false });

        button.addEventListener('touchcancel', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.handleTouchEnd(e);
        }, { passive: false });

        // 鼠标事件（用于桌面测试）
        button.addEventListener('mousedown', (e) => {
            console.log('mousedown 事件被触发', e);
            e.preventDefault();
            this.handleMouseStart(e);
        });

        document.addEventListener('mousemove', (e) => {
            this.handleMouseMove(e);
        });

        document.addEventListener('mouseup', (e) => {
            this.handleMouseEnd(e);
        });

        // 防止上下文菜单和长按菜单
        button.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            e.stopPropagation();
            return false;
        });

        // 防止长按选择文本和系统菜单
        button.addEventListener('selectstart', (e) => {
            e.preventDefault();
            e.stopPropagation();
            return false;
        });

        // 防止拖拽
        button.addEventListener('dragstart', (e) => {
            e.preventDefault();
            e.stopPropagation();
            return false;
        });

        // 防止长按事件（Android WebView特有）
        button.addEventListener('longpress', (e) => {
            e.preventDefault();
            e.stopPropagation();
            return false;
        });

        // 使用定时器检测长按并阻止默认行为
        let longPressTimer = null;
        button.addEventListener('touchstart', (e) => {
            longPressTimer = setTimeout(() => {
                // 长按检测，阻止系统默认行为
                e.preventDefault();
                e.stopPropagation();
            }, 500); // 500ms后认为是长按
        }, { passive: false });

        button.addEventListener('touchend', () => {
            if (longPressTimer) {
                clearTimeout(longPressTimer);
                longPressTimer = null;
            }
        });

        button.addEventListener('touchcancel', () => {
            if (longPressTimer) {
                clearTimeout(longPressTimer);
                longPressTimer = null;
            }
        });

        // 添加简单的点击测试事件
        button.addEventListener('click', (e) => {
            console.log('麦克风按钮被点击了！');
        });

        // 设置WebView兼容性保护
        if (window.webViewCompat_7ree) {
            window.webViewCompat_7ree.setupElementProtection(button, {
                preventContextMenu: true,
                preventSelection: true,
                preventDrag: true,
                longPressDelay: 300 // 300ms后阻止长按菜单
            });
            console.log('已为麦克风按钮设置WebView保护');
        }

        console.log('麦克风按钮事件绑定完成');
    }

    // 处理触摸开始
    handleTouchStart(e) {
        console.log('handleTouchStart 被调用');
        const touch = e.touches[0];
        this.uiController.startTouchY = touch.clientY;
        this.uiController.currentTouchY = touch.clientY;
        this.uiController.isCanceling = false;
        this.uiController.handlePressStart();
    }

    // 处理触摸移动
    handleTouchMove(e) {
        if (!this.uiController.isRecording) return;

        const touch = e.touches[0];
        this.uiController.currentTouchY = touch.clientY;

        const deltaY = this.uiController.startTouchY - this.uiController.currentTouchY;

        if (deltaY > this.uiController.cancelThreshold) {
            // 向上滑动超过阈值，显示取消状态
            if (!this.uiController.isCanceling) {
                this.uiController.isCanceling = true;
                this.uiController.showCancelState();
            }
        } else {
            // 回到正常录音状态
            if (this.uiController.isCanceling) {
                this.uiController.isCanceling = false;
                this.uiController.hideCancelState();
            }
        }
    }

    // 处理触摸结束
    handleTouchEnd(e) {
        if (this.uiController.isCanceling) {
            this.uiController.handleCancel();
        } else {
            this.uiController.handlePressEnd();
        }

        this.uiController.startTouchY = null;
        this.uiController.currentTouchY = null;
        this.uiController.isCanceling = false;
    }

    // 处理鼠标开始（桌面测试）
    handleMouseStart(e) {
        console.log('handleMouseStart 被调用');
        this.uiController.startTouchY = e.clientY;
        this.uiController.currentTouchY = e.clientY;
        this.uiController.isCanceling = false;
        this.uiController.handlePressStart();
    }

    // 处理鼠标移动（桌面测试）
    handleMouseMove(e) {
        if (!this.uiController.isRecording) return;

        this.uiController.currentTouchY = e.clientY;
        const deltaY = this.uiController.startTouchY - this.uiController.currentTouchY;

        if (deltaY > this.uiController.cancelThreshold) {
            if (!this.uiController.isCanceling) {
                this.uiController.isCanceling = true;
                this.uiController.showCancelState();
            }
        } else {
            if (this.uiController.isCanceling) {
                this.uiController.isCanceling = false;
                this.uiController.hideCancelState();
            }
        }
    }

    // 处理鼠标结束（桌面测试）
    handleMouseEnd(e) {
        if (!this.uiController.isRecording) return;

        if (this.uiController.isCanceling) {
            this.uiController.handleCancel();
        } else {
            this.uiController.handlePressEnd();
        }

        this.uiController.startTouchY = null;
        this.uiController.currentTouchY = null;
        this.uiController.isCanceling = false;
    }
}