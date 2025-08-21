/**
 * ========================================
 * 🗑️ 滑动删除 - 工具模块
 * ========================================
 * 提供各种工具方法和状态管理
 */

export class SwipeUtils_7ree {
    constructor(swipeManager) {
        this.swipeManager = swipeManager;
    }

    /**
     * 关闭指定的滑动
     */
    closeSwipe(recordElement) {
        if (!recordElement) return;

        const swipeContent = recordElement.querySelector('.swipe-content_7ree');
        if (swipeContent) {
            // 确保有过渡效果
            swipeContent.style.transition = 'transform 0.3s ease';
            // 清除transform样式
            swipeContent.style.transform = '';

            // 监听过渡结束事件
            const transitionEndHandler = () => {
                swipeContent.style.transition = '';
                swipeContent.removeEventListener('transitionend', transitionEndHandler);
            };
            swipeContent.addEventListener('transitionend', transitionEndHandler);
        }

        recordElement.classList.remove('show-actions_7ree', 'swiping_7ree', 'threshold-reached_7ree');
    }

    /**
     * 关闭所有滑动
     */
    closeAllSwipes() {
        const swipeContainers = document.querySelectorAll('.swipe-container_7ree.show-actions_7ree');
        swipeContainers.forEach(container => {
            this.closeSwipe(container);
        });
        this.swipeManager.eventHandler.activeSwipe = null;  // 确保完全重置状态
    }

    /**
     * 检查空状态
     */
    checkEmptyState() {
        const historyContainer = document.getElementById('history-records');
        if (historyContainer && historyContainer.children.length === 0) {
            // 触发历史管理器的空状态显示
            if (window.historyManager && window.historyManager.showEmptyState) {
                window.historyManager.showEmptyState();
            }
        }
    }
}