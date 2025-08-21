/**
 * ========================================
 * 🗑️ 滑动删除 - DOM管理模块
 * ========================================
 * 管理滑动容器的DOM结构和记录ID提取
 */

window.SwipeDOMManager_7ree = class SwipeDOMManager_7ree {
    constructor(swipeManager) {
        this.swipeManager = swipeManager;
    }

    /**
     * 确保记录元素有滑动容器结构
     */
    ensureSwipeStructure(recordElement) {
        // console.log('SwipeDOMManager_7ree: ensureSwipeStructure被调用', recordElement);

        if (recordElement.classList.contains('swipe-container_7ree')) {
            // console.log('SwipeDOMManager_7ree: 元素已有滑动结构');
            return; // 已经有滑动结构
        }

        // 获取记录ID（从数据属性或其他方式）
        const recordId = this.extractRecordId(recordElement);
        // console.log('SwipeDOMManager_7ree: 记录ID', recordId);

        // 包装现有内容
        const originalContent = recordElement.innerHTML;
        recordElement.innerHTML = '';
        recordElement.classList.add('swipe-container_7ree');

        // 创建滑动内容区域
        const swipeContent = document.createElement('div');
        swipeContent.className = 'swipe-content_7ree';
        swipeContent.innerHTML = originalContent;

        // 创建删除操作区域
        const swipeActions = document.createElement('div');
        swipeActions.className = 'swipe-actions_7ree';
        swipeActions.innerHTML = `
            <button class="delete-action_7ree" data-record-id="${recordId}">
                <img src="img/delete-icon_7ree.svg" class="delete-icon_7ree" alt="删除" style="margin-bottom: 5px;">
                <span class="delete-text_7ree">删除</span>
            </button>
        `;

        // 添加删除按钮点击事件
        const deleteButton = swipeActions.querySelector('.delete-action_7ree');
        deleteButton.addEventListener('click', async (e) => {
            e.stopPropagation();
            await this.swipeManager.handleDeleteClick(recordId, recordElement);
        });

        recordElement.appendChild(swipeContent);
        recordElement.appendChild(swipeActions);

        // console.log('SwipeDOMManager_7ree: 滑动结构创建完成', recordElement);
    }

    /**
     * 提取记录ID
     */
    extractRecordId(recordElement) {
        // 尝试从数据属性获取ID
        if (recordElement.dataset.recordId) {
            return recordElement.dataset.recordId;
        }

        // 尝试从记录内容中提取ID（可能需要根据实际数据结构调整）
        const timeElement = recordElement.querySelector('.absolute-time');
        if (timeElement) {
            // 使用时间戳作为临时ID（实际项目中应该有真实的记录ID）
            return btoa(timeElement.textContent).replace(/[^a-zA-Z0-9]/g, '').substring(0, 10);
        }

        // 生成临时ID
        return 'record_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
}