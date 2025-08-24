// DualButtonHandler_7ree.js - 录音期间的左右操作按钮逻辑
export class DualButtonHandler_7ree {
    constructor(uiController) {
        this.uiController = uiController;
        this.elements = {
            container: null,
            cancelBtn: null,
            confirmBtn: null
        };
    }

    // 绑定按钮点击事件
    setupDualButtons_7ree() {
        this.elements.container = document.getElementById('dualRecordingButtons_7ree');
        this.elements.cancelBtn = document.getElementById('cancelRecordBtn_7ree');
        this.elements.confirmBtn = document.getElementById('confirmRecordBtn_7ree');

        if (!this.elements.container || !this.elements.cancelBtn || !this.elements.confirmBtn) {
            console.warn('DualButtonHandler_7ree: 双按钮元素未找到，稍后重试...');
            setTimeout(() => this.setupDualButtons_7ree(), 200);
            return;
        }

        // 取消：中止录音，不发送
        this.elements.cancelBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('取消按钮被点击');
            
            // 添加点击反馈动画
            if (window.ButtonAnimations) {
                window.ButtonAnimations.triggerCancelFeedback(this.elements.cancelBtn);
            } else {
                this.triggerClickFeedback(this.elements.cancelBtn, 'cancel');
            }
            
            if (!this.uiController.isRecording) return;
            this.hideDualButtons_7ree();
            this.uiController.handleCancel();
        });

        // 确认：结束录音并发送
        this.elements.confirmBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('确认按钮被点击');
            
            // 添加点击反馈动画
            if (window.ButtonAnimations) {
                window.ButtonAnimations.triggerConfirmFeedback(this.elements.confirmBtn);
            } else {
                this.triggerClickFeedback(this.elements.confirmBtn, 'confirm');
            }
            
            if (!this.uiController.isRecording) return;
            this.hideDualButtons_7ree();
            this.uiController.handlePressEnd();
        });
    }

    // 触发点击反馈动画
    triggerClickFeedback(button, type) {
        if (!button) return;
        
        // 移除之前的动画类（如果有）
        button.classList.remove('click-feedback');
        
        // 强制重新渲染，然后添加动画类
        requestAnimationFrame(() => {
            button.classList.add('click-feedback');
            
            // 0.3秒后移除动画类
            setTimeout(() => {
                button.classList.remove('click-feedback');
            }, 300);
        });
    }

    showDualButtons_7ree() {
        if (this.elements.container) {
            this.elements.container.classList.add('show');
            this.elements.container.setAttribute('aria-hidden', 'false');
        }
    }

    hideDualButtons_7ree() {
        if (this.elements.container) {
            this.elements.container.classList.remove('show');
            this.elements.container.setAttribute('aria-hidden', 'true');
        }
    }
}

// 将 DualButtonHandler_7ree 类添加到全局作用域
window.DualButtonHandler_7ree = DualButtonHandler_7ree;