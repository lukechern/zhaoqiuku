/**
 * ========================================
 * 🗑️ 滑动删除 - UI模块（合并版）_7ree
 * ========================================
 * 合并自：swipe-dom-manager.js、swipe-delete-handler.js、swipe-toast.js
 * 职责：DOM结构、删除处理、Toast 提示
 */

// --- 来自 swipe-dom-manager.js ---
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
                <img src="img/delete-icon_7ree.svg" class="delete-icon_7ree" alt="删除">
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
};

// --- 来自 swipe-delete-handler.js ---
window.SwipeDeleteHandler_7ree = class SwipeDeleteHandler_7ree {
    constructor(swipeManager) {
        this.swipeManager = swipeManager;
    }

    /**
     * 处理删除按钮点击
     */
    async handleDeleteClick(recordId, recordElement) {
        // 防止重复点击
        if (recordElement.classList.contains('deleting_7ree') || recordElement.dataset.deleting === 'true') {
            console.log('删除操作正在进行中，忽略重复点击');
            return;
        }

        try {
            // 标记正在处理删除
            recordElement.dataset.deleting = 'true';
            console.log('开始删除操作，recordId:', recordId);

            // 显示确认对话框
            const confirmed = await this.showDeleteConfirmation(recordElement);

            if (!confirmed) {
                // 如果用户取消，则彻底清除所有删除相关标记和状态
                console.log('用户取消删除操作');
                recordElement.dataset.deleting = 'false';
                recordElement.classList.remove('deleting_7ree');

                // 确保完全清除删除状态
                setTimeout(() => {
                    recordElement.removeAttribute('data-deleting');
                }, 50);

                this.swipeManager.closeSwipe(recordElement);
                return;
            }

            console.log('用户确认删除操作');
            // 添加删除动画
            recordElement.classList.add('deleting_7ree');

            // 调用删除API
            await this.deleteRecord(recordId);

            // 等待动画完成后移除元素
            setTimeout(() => {
                if (recordElement.parentNode) {
                    recordElement.parentNode.removeChild(recordElement);
                }

                // 显示成功提示
                this.swipeManager.showToast('记录已删除', 'success');

                // 检查是否需要显示空状态
                this.swipeManager.checkEmptyState();
            }, 300);

        } catch (error) {
            console.error('删除记录失败:', error);

            // 删除失败时完全清除删除状态
            recordElement.classList.remove('deleting_7ree');
            recordElement.dataset.deleting = 'false';
            recordElement.removeAttribute('data-deleting');

            // 删除失败时不关闭滑动区域，保持打开状态供用户重试

            // 显示错误提示
            this.swipeManager.showToast('删除失败，请重试', 'error');
        }
    }

    /**
     * 显示删除确认对话框
     */
    async showDeleteConfirmation(recordElement) {
        // 从记录元素中获取物品名称
        const itemNameElement = recordElement.querySelector('.item-name');
        const itemTypeElement = recordElement.querySelector('.item-type');
        const itemName = itemNameElement ? itemNameElement.textContent : '未知物品';
        const itemType = itemTypeElement ? itemTypeElement.textContent : '物品';

        // 构造确认消息，包含物品名称并支持换行
        const confirmMessage = `确定要删除这条记录吗？\n${itemType}：${itemName}`;

        const confirmed = await customConfirm_7ree(confirmMessage, {
            title: '删除记录',
            confirmText: '删除',
            cancelText: '取消',
            danger: true
        });
        return confirmed;
    }

    /**
     * 删除记录API调用
     */
    async deleteRecord(recordId) {
        const response = await fetch(`/api/user/history/${recordId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                ...window.authManager.getAuthHeaders()
            }
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || '删除记录失败');
        }

        if (!result.success) {
            throw new Error(result.error || '删除记录失败');
        }

        return result;
    }
};

// --- 来自 swipe-toast.js ---
window.SwipeToast_7ree = class SwipeToast_7ree {
    /**
     * 显示Toast提示
     */
    showToast(message, type = 'info') {
        if (typeof window.showToast === 'function') {
            window.showToast(message, type);
            return;
        }
        this.createToast(message, type);
    }

    /**
     * 创建Toast提示
     */
    createToast(message, type = 'info') {
        try {
            const toast = document.createElement('div');
            toast.className = `toast_7ree toast-${type}_7ree`;
            toast.textContent = message;
            Object.assign(toast.style, {
                position: 'fixed',
                top: '20px',
                right: '20px',
                left: 'auto',
                transform: 'none',
                backgroundColor: type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3',
                color: 'white',
                padding: '12px 16px',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                zIndex: '10000',
                opacity: '0',
                transition: 'opacity 0.3s ease-in-out'
            });
            document.body.appendChild(toast);
            requestAnimationFrame(() => { toast.style.opacity = '1'; });
            setTimeout(() => {
                toast.style.opacity = '0';
                setTimeout(() => { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 300);
            }, 3000);
        } catch (e) {
            console.error('showToast fallback error', e, message);
        }
    }
};

// 全局Toast函数（为了兼容性）
if (!window.showToast) {
    window.showToast = function showToast_7ree(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast_7ree toast-${type}_7ree`;
        toast.textContent = message;
        Object.assign(toast.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            left: 'auto',
            transform: 'none',
            backgroundColor: type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3',
            color: 'white',
            padding: '12px 16px',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '500',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            zIndex: '10000',
            opacity: '0',
            transition: 'opacity 0.3s ease-in-out'
        });
        document.body.appendChild(toast);
        requestAnimationFrame(() => { toast.style.opacity = '1'; });
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 300);
        }, 3000);
    };
}