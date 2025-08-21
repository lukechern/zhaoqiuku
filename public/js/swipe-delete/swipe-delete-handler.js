/**
 * ========================================
 * 🗑️ 滑动删除 - 删除处理模块
 * ========================================
 * 处理删除操作、确认对话框和API调用
 */

export class SwipeDeleteHandler_7ree {
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
}