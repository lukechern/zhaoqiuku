/*
 * ========================================
 * 🗑️ 滑动删除功能管理器
 * ========================================
 * 为历史记录项添加左滑删除功能
 */

class SwipeDeleteManager_7ree {
    constructor() {
        this.activeSwipe = null;
        this.startX = 0;
        this.startY = 0;
        this.currentX = 0;
        this.currentY = 0;
        this.isDragging = false;
        this.isVerticalScroll = false;
        this.deleteThreshold = 60; // 删除阈值
        this.actionWidth = 80; // 删除操作区域宽度
        
        this.init();
    }

    /**
     * 初始化滑动删除管理器
     */
    init() {
        this.setupEventListeners();
    }

    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        // 使用事件委托监听历史记录容器
        document.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: true });
        document.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
        document.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: true });
        
        // 添加调试信息
        // console.log('SwipeDeleteManager_7ree: 事件监听器已设置');
    }

    /**
     * 处理触摸开始事件
     */
    handleTouchStart(e) {
        // console.log('SwipeDeleteManager_7ree: touchstart事件触发', e.target);
        const recordElement = e.target.closest('.history-record');
        if (!recordElement) {
            // console.log('SwipeDeleteManager_7ree: 未找到.history-record元素');
            return;
        }
        
        // console.log('SwipeDeleteManager_7ree: 找到历史记录元素', recordElement);

        // 如果有其他项目正在滑动，先关闭“其他”项，当前项保持不变
        const openedContainers = document.querySelectorAll('.swipe-container_7ree.show-actions_7ree');
        openedContainers.forEach(container => {
            if (container !== recordElement) {
                this.closeSwipe(container);
            }
        });

        this.startX = e.touches[0].clientX;
        this.startY = e.touches[0].clientY;
        this.currentX = this.startX;
        this.currentY = this.startY;
        this.isDragging = false;
        this.isVerticalScroll = false;
        this.activeSwipe = recordElement;

        // 确保记录元素有滑动容器结构
        this.ensureSwipeStructure(recordElement);
        
        // 记录初始状态
        const swipeContent = this.activeSwipe.querySelector('.swipe-content_7ree');
        const computedStyle = window.getComputedStyle(swipeContent);
        const transform = computedStyle.getPropertyValue('transform');
        
        if (transform && transform !== 'none') {
            const matrix = new DOMMatrix(transform);
            this.initialTranslateX = matrix.m41;
        } else {
            this.initialTranslateX = 0;
        }
        
        // 移除过渡效果，以便拖拽
        swipeContent.style.transition = 'none';
    }

    /**
     * 处理触摸移动事件
     */
    handleTouchMove(e) {
        if (!this.activeSwipe) return;

        this.currentX = e.touches[0].clientX;
        this.currentY = e.touches[0].clientY;

        const deltaX = this.currentX - this.startX;
        const deltaY = this.currentY - this.startY;
        const absDeltaX = Math.abs(deltaX);
        const absDeltaY = Math.abs(deltaY);

        // console.log('SwipeDeleteManager_7ree: touchmove', { deltaX, deltaY, absDeltaX, absDeltaY });

        // 判断是否为垂直滚动
        if (!this.isDragging && absDeltaY > absDeltaX && absDeltaY > 10) {
            this.isVerticalScroll = true;
            this.activeSwipe = null;
            return;
        }

        // 判断是否开始水平拖拽
        if (!this.isDragging && !this.isVerticalScroll && absDeltaX > 10) {
            this.isDragging = true;
            this.activeSwipe.classList.add('swiping_7ree');
            e.preventDefault();
        }

        // 处理水平拖拽
        if (this.isDragging) {
            e.preventDefault();
            const swipeContent = this.activeSwipe.querySelector('.swipe-content_7ree');
            
            // 基于初始位置计算新的translateX
            const newTranslateX = this.initialTranslateX + deltaX;
            
            // 限制滑动范围
            const translateX = Math.max(Math.min(newTranslateX, 0), -this.actionWidth);
            swipeContent.style.transform = `translateX(${translateX}px)`;
            
            // 检查是否达到删除阈值
            if (Math.abs(translateX) >= this.deleteThreshold) {
                this.activeSwipe.classList.add('threshold-reached_7ree');
            } else {
                this.activeSwipe.classList.remove('threshold-reached_7ree');
            }
        }
    }

    /**
     * 处理触摸结束事件
     */
    handleTouchEnd(e) {
        if (!this.activeSwipe || !this.isDragging) {
            // 如果没有发生拖拽，也需要恢复过渡效果，避免点击后 transition 一直为 none
            if (this.activeSwipe) {
                const sc = this.activeSwipe.querySelector('.swipe-content_7ree');
                if (sc) sc.style.transition = '';
            }
            this.resetSwipeState();
            return;
        }

        const swipeContent = this.activeSwipe.querySelector('.swipe-content_7ree');
        const currentTransform = new DOMMatrix(window.getComputedStyle(swipeContent).getPropertyValue('transform'));
        const currentTranslateX = currentTransform.m41;

        // 恢复过渡效果
        swipeContent.style.transition = 'transform 0.3s ease';

        // 判断是否达到删除阈值
        if (Math.abs(currentTranslateX) >= this.deleteThreshold) {
            // 保持删除操作显示
            swipeContent.style.transform = `translateX(-${this.actionWidth}px)`;
            this.activeSwipe.classList.add('show-actions_7ree');
        } else {
            // 回弹到原位
            this.closeSwipe(this.activeSwipe);
        }

        this.isDragging = false;
        this.isVerticalScroll = false;
    }

    /**
     * 确保记录元素有滑动容器结构
     */
    ensureSwipeStructure(recordElement) {
        // console.log('SwipeDeleteManager_7ree: ensureSwipeStructure被调用', recordElement);
        
        if (recordElement.classList.contains('swipe-container_7ree')) {
            // console.log('SwipeDeleteManager_7ree: 元素已有滑动结构');
            return; // 已经有滑动结构
        }

        // 获取记录ID（从数据属性或其他方式）
        const recordId = this.extractRecordId(recordElement);
        // console.log('SwipeDeleteManager_7ree: 记录ID', recordId);
        
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
                <svg class="delete-icon_7ree" viewBox="0 0 1024 1024">
                    <path d="M921.6 512 880.64 512 972.8 972.8C972.8 1001.088 949.888 1024 921.6 1024L102.4 1024C74.112 1024 51.2 1001.088 51.2 972.8L143.36 512 102.4 512C74.112 512 51.2 489.088 51.2 460.8L51.2 409.6C51.2 381.312 74.112 358.4 102.4 358.4L409.6 358.4 409.6 102.4C409.6 45.8496 455.4496 0 512 0 568.5504 0 614.4 45.8496 614.4 102.4L614.4 358.4 921.6 358.4C949.888 358.4 972.8 381.312 972.8 409.6L972.8 460.8C972.8 489.088 949.888 512 921.6 512ZM102.4 972.8 257.6384 972.8C254.1056 967.5008 252.4416 960.9472 253.6192 954.1888L284.7488 726.5024C287.2064 712.6016 300.4672 703.2832 314.3936 705.7408 328.32 708.1984 337.6128 721.4848 335.1808 735.4112L304.0512 963.072C303.4112 966.6816 302.0032 969.9328 300.1088 972.8L921.6 972.8 819.2 512 204.8 512 102.4 972.8ZM563.2 102.4C563.2 74.112 540.288 51.2 512 51.2 483.712 51.2 460.8 74.112 460.8 102.4L460.8 358.4 563.2 358.4 563.2 102.4ZM921.6 409.6 102.4 409.6 102.4 460.8 921.6 460.8 921.6 409.6Z" fill="currentColor"></path>
                </svg>
                <span class="delete-text_7ree">删除</span>
            </button>
        `;

        // 添加删除按钮点击事件
        const deleteButton = swipeActions.querySelector('.delete-action_7ree');
        deleteButton.addEventListener('click', (e) => {
            e.stopPropagation();
            this.handleDeleteClick(recordId, recordElement);
        });

        recordElement.appendChild(swipeContent);
        recordElement.appendChild(swipeActions);
        
        // console.log('SwipeDeleteManager_7ree: 滑动结构创建完成', recordElement);
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

    /**
     * 处理删除按钮点击
     */
    async handleDeleteClick(recordId, recordElement) {
        try {
            // 显示确认对话框
            const confirmed = await this.showDeleteConfirmation();
            if (!confirmed) {
                // 如果用户取消，则关闭滑动区域回弹
                this.closeSwipe(recordElement);
                return;
            }

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
                this.showToast('记录已删除', 'success');
                
                // 检查是否需要显示空状态
                this.checkEmptyState();
            }, 300);

        } catch (error) {
            console.error('删除记录失败:', error);
            recordElement.classList.remove('deleting_7ree');
            // 删除失败时不关闭滑动区域，保持打开状态供用户重试
            
            // 显示错误提示
            this.showToast('删除失败，请重试', 'error');
        }
    }

    /**
     * 显示删除确认对话框
     */
    async showDeleteConfirmation() {
        const confirmed = await customConfirm_7ree('确定要删除这条记录吗？', {
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
        this.activeSwipe = null;  // 确保完全重置状态
    }

    /**
     * 重置滑动状态
     */
    resetSwipeState() {
        this.activeSwipe = null;
        this.isDragging = false;
        this.isVerticalScroll = false;
        this.startX = 0;
        this.startY = 0;
        this.currentX = 0;
        this.currentY = 0;
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

    /**
     * 显示Toast提示
     */
    showToast(message, type = 'info') {
        // 创建toast元素
        const toast = document.createElement('div');
        toast.className = `toast_7ree toast-${type}_7ree`;
        toast.textContent = message;
        
        // 添加样式
        Object.assign(toast.style, {
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '500',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            zIndex: '10000',
            opacity: '0',
            transition: 'opacity 0.3s ease-in-out'
        });
        
        // 添加到页面
        document.body.appendChild(toast);
        
        // 显示动画
        setTimeout(() => {
            toast.style.opacity = '1';
        }, 10);
        
        // 自动隐藏
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }

    /**
     * 为新添加的记录元素设置滑动功能
     */
    setupSwipeForElement(recordElement) {
        // console.log('SwipeDeleteManager_7ree: setupSwipeForElement被调用', recordElement);
        if (!recordElement) {
            // console.error('SwipeDeleteManager_7ree: recordElement为空');
            return;
        }
        this.ensureSwipeStructure(recordElement);
    }
}

// 全局实例
window.swipeDeleteManager_7ree = null;

// 初始化滑动删除管理器
function initSwipeDeleteManager_7ree() {
    if (!window.swipeDeleteManager_7ree) {
        window.swipeDeleteManager_7ree = new SwipeDeleteManager_7ree();
        // console.log('SwipeDeleteManager_7ree: 管理器已初始化');
    }
}

// 在DOMContentLoaded时初始化
document.addEventListener('DOMContentLoaded', initSwipeDeleteManager_7ree);

// 如果DOM已经加载完成，立即初始化
if (document.readyState === 'loading') {
    // DOM还在加载中，等待DOMContentLoaded事件
} else {
    // DOM已经加载完成，立即初始化
    initSwipeDeleteManager_7ree();
}

// 暴露初始化函数供其他模块调用
window.initSwipeDeleteManager_7ree = initSwipeDeleteManager_7ree;

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SwipeDeleteManager_7ree;
}