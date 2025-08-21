/**
 * ========================================
 * 🗑️ 滑动删除 - 事件处理模块
 * ========================================
 * 处理触摸事件（开始、移动、结束）
 */

window.SwipeEventHandler_7ree = class SwipeEventHandler_7ree {
    constructor(swipeManager) {
        this.swipeManager = swipeManager;
        this.startX = 0;
        this.startY = 0;
        this.currentX = 0;
        this.currentY = 0;
        this.isDragging = false;
        this.isVerticalScroll = false;
        this.activeSwipe = null;
        this.initialTranslateX = 0;
    }

    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        // 使用事件委托监听历史记录容器
        document.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: true });
        document.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
        document.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: true });

        // console.log('SwipeEventHandler_7ree: 事件监听器已设置');
    }

    /**
     * 处理触摸开始事件
     */
    handleTouchStart(e) {
        // console.log('SwipeEventHandler_7ree: touchstart事件触发', e.target);
        const recordElement = e.target.closest('.history-record');
        if (!recordElement) {
            // console.log('SwipeEventHandler_7ree: 未找到.history-record元素');
            return;
        }

        // console.log('SwipeEventHandler_7ree: 找到历史记录元素', recordElement);

        // 如果有其他项目正在滑动，先关闭其他项，当前项保持不变
        const openedContainers = document.querySelectorAll('.swipe-container_7ree.show-actions_7ree');
        openedContainers.forEach(container => {
            if (container !== recordElement) {
                this.swipeManager.closeSwipe(container);
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
        this.swipeManager.ensureSwipeStructure(recordElement);

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

        // console.log('SwipeEventHandler_7ree: touchmove', { deltaX, deltaY, absDeltaX, absDeltaY });

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
            const translateX = Math.max(Math.min(newTranslateX, 0), -this.swipeManager.actionWidth);
            swipeContent.style.transform = `translateX(${translateX}px)`;

            // 检查是否达到删除阈值
            if (Math.abs(translateX) >= this.swipeManager.deleteThreshold) {
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
        if (Math.abs(currentTranslateX) >= this.swipeManager.deleteThreshold) {
            // 保持删除操作显示
            swipeContent.style.transform = `translateX(-${this.swipeManager.actionWidth}px)`;
            this.activeSwipe.classList.add('show-actions_7ree');
        } else {
            // 回弹到原位
            this.swipeManager.closeSwipe(this.activeSwipe);
        }

        this.isDragging = false;
        this.isVerticalScroll = false;
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
}