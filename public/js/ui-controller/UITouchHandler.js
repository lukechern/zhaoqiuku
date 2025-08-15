// UITouchHandler.js - UI触摸和鼠标事件处理器

export class UITouchHandler {
    constructor(uiController) {
        this.uiController = uiController;
    }

    // 设置触摸事件
    setupTouchEvents() {
        const button = this.uiController.elements.microphoneButton;

        if (!button) {
            console.error('麦克风按钮元素不存在，无法绑定事件');
            return;
        }

        console.log('正在为麦克风按钮绑定事件...', button);

        // 触摸事件
        button.addEventListener('touchstart', (e) => {
            console.log('touchstart 事件被触发', e);
            e.preventDefault();
            this.handleTouchStart(e);
        }, { passive: false });

        button.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.handleTouchMove(e);
        }, { passive: false });

        button.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.handleTouchEnd(e);
        }, { passive: false });

        button.addEventListener('touchcancel', (e) => {
            e.preventDefault();
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

        // 防止上下文菜单
        button.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });

        // 添加简单的点击测试事件
        button.addEventListener('click', (e) => {
            console.log('麦克风按钮被点击了！');
        });

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