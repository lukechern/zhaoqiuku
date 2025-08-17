/**
 * 自定义确认对话框组件
 * 提供统一的暗色系确认对话框，替代原生confirm
 */
class ConfirmDialog_7ree {
    constructor() {
        this.overlay = null;
        this.dialog = null;
        this.currentResolve = null;
        this.init();
    }

    init() {
        // 创建对话框HTML结构
        this.createDialogHTML();
        // 绑定事件
        this.bindEvents();
    }

    createDialogHTML() {
        // 创建遮罩层
        this.overlay = document.createElement('div');
        this.overlay.className = 'confirm-dialog-overlay_7ree';
        
        // 创建对话框
        this.dialog = document.createElement('div');
        this.dialog.className = 'confirm-dialog_7ree';
        
        this.dialog.innerHTML = `
            <div class="confirm-dialog-title_7ree">确认操作</div>
            <div class="confirm-dialog-message_7ree"></div>
            <div class="confirm-dialog-buttons_7ree">
                <button class="confirm-dialog-btn_7ree cancel">取消</button>
                <button class="confirm-dialog-btn_7ree confirm">确定</button>
            </div>
        `;
        
        this.overlay.appendChild(this.dialog);
        document.body.appendChild(this.overlay);
    }

    bindEvents() {
        // 点击遮罩层关闭对话框
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) {
                this.close(false);
            }
        });

        // 绑定按钮事件
        const cancelBtn = this.dialog.querySelector('.cancel');
        const confirmBtn = this.dialog.querySelector('.confirm');
        
        cancelBtn.addEventListener('click', () => this.close(false));
        confirmBtn.addEventListener('click', () => this.close(true));

        // ESC键关闭对话框
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.overlay.classList.contains('show')) {
                this.close(false);
            }
        });
    }

    show(message, options = {}) {
        return new Promise((resolve) => {
            this.currentResolve = resolve;
            
            // 设置标题和消息
            const title = options.title || '确认操作';
            const cancelText = options.cancelText || '取消';
            const confirmText = options.confirmText || '确定';
            const isDanger = options.danger || false;
            
            this.dialog.querySelector('.confirm-dialog-title_7ree').textContent = title;
            this.dialog.querySelector('.confirm-dialog-message_7ree').textContent = message;
            
            // 设置按钮文本
            const cancelBtn = this.dialog.querySelector('.cancel');
            const confirmBtn = this.dialog.querySelector('.confirm');
            
            cancelBtn.textContent = cancelText;
            confirmBtn.textContent = confirmText;
            
            // 设置危险样式
            if (isDanger) {
                confirmBtn.classList.add('danger');
                confirmBtn.classList.remove('confirm');
            } else {
                confirmBtn.classList.add('confirm');
                confirmBtn.classList.remove('danger');
            }
            
            // 显示对话框
            this.overlay.classList.add('show');
            
            // 聚焦到确认按钮
            setTimeout(() => {
                confirmBtn.focus();
            }, 100);
        });
    }

    close(result) {
        this.overlay.classList.remove('show');
        
        if (this.currentResolve) {
            this.currentResolve(result);
            this.currentResolve = null;
        }
    }

    destroy() {
        if (this.overlay && this.overlay.parentNode) {
            this.overlay.parentNode.removeChild(this.overlay);
        }
    }
}

// 创建全局实例
let confirmDialog_7ree = null;

// 初始化函数
function initConfirmDialog_7ree() {
    if (!confirmDialog_7ree) {
        confirmDialog_7ree = new ConfirmDialog_7ree();
    }
}

// 全局确认函数，替代原生confirm
function customConfirm_7ree(message, options = {}) {
    if (!confirmDialog_7ree) {
        initConfirmDialog_7ree();
    }
    return confirmDialog_7ree.show(message, options);
}

// 页面加载完成后初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initConfirmDialog_7ree);
} else {
    initConfirmDialog_7ree();
}

// 导出到全局
window.customConfirm_7ree = customConfirm_7ree;
window.ConfirmDialog_7ree = ConfirmDialog_7ree;