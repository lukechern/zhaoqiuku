// UIButtonHandler.js - UI按钮事件处理器

export class UIButtonHandler {
    constructor(uiController) {
        this.uiController = uiController;
    }

    // 设置按钮事件
    setupButtonEvents() {
        this.uiController.elements.playbackBtn.addEventListener('click', () => {
            if (this.uiController.onPlayback) {
                this.uiController.onPlayback();
            }
        });

        this.uiController.elements.clearBtn.addEventListener('click', () => {
            if (this.uiController.onClear) {
                this.uiController.onClear();
            }
        });

        this.uiController.elements.refreshBtn.addEventListener('click', async () => {
            await this.handleRefresh();
        });
    }

    // 处理刷新按钮点击
    async handleRefresh() {
        // 添加一个简单的确认提示
        const confirmed = await customConfirm_7ree('确定要刷新页面吗？未保存的数据将丢失。', {
            title: '刷新页面',
            confirmText: '刷新',
            cancelText: '取消',
            danger: false
        });
        if (confirmed) {
            // 强制刷新，绕过缓存
            window.location.reload(true);

            // 如果上面的方法不起作用，尝试其他方法
            setTimeout(() => {
                window.location.href = window.location.href + '?_refresh=' + Date.now();
            }, 100);
        }
    }
}