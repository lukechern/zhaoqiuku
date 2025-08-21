/**
 * ========================================
 * 🗑️ 滑动删除功能管理器（拆分版）
 * ========================================
 * 为历史记录项添加左滑删除功能
 * 整合所有模块，提供统一的接口
 */

import { SwipeEventHandler_7ree } from './swipe-event-handler.js';
import { SwipeDOMManager_7ree } from './swipe-dom-manager.js';
import { SwipeDeleteHandler_7ree } from './swipe-delete-handler.js';
import { SwipeUtils_7ree } from './swipe-utils.js';
import { SwipeToast_7ree } from './swipe-toast.js';

export class SwipeDeleteManager_7ree {
    constructor() {
        this.deleteThreshold = 60; // 删除阈值
        this.actionWidth = 80; // 删除操作区域宽度

        // 初始化各个模块
        this.eventHandler = new SwipeEventHandler_7ree(this);
        this.domManager = new SwipeDOMManager_7ree(this);
        this.deleteHandler = new SwipeDeleteHandler_7ree(this);
        this.utils = new SwipeUtils_7ree(this);
        this.toast = new SwipeToast_7ree();

        this.init();
    }

    /**
     * 初始化滑动删除管理器
     */
    init() {
        this.eventHandler.setupEventListeners();
    }

    // DOM管理方法
    ensureSwipeStructure(recordElement) {
        return this.domManager.ensureSwipeStructure(recordElement);
    }

    extractRecordId(recordElement) {
        return this.domManager.extractRecordId(recordElement);
    }

    // 删除处理方法
    async handleDeleteClick(recordId, recordElement) {
        return this.deleteHandler.handleDeleteClick(recordId, recordElement);
    }

    async showDeleteConfirmation(recordElement) {
        return this.deleteHandler.showDeleteConfirmation(recordElement);
    }

    async deleteRecord(recordId) {
        return this.deleteHandler.deleteRecord(recordId);
    }

    // 工具方法
    closeSwipe(recordElement) {
        return this.utils.closeSwipe(recordElement);
    }

    closeAllSwipes() {
        return this.utils.closeAllSwipes();
    }

    checkEmptyState() {
        return this.utils.checkEmptyState();
    }

    // Toast方法
    showToast(message, type = 'info') {
        return this.toast.showToast(message, type);
    }
}

// 全局实例
window.swipeDeleteManager_7ree = null;

/**
 * 初始化滑动删除管理器
 */
function initSwipeDeleteManager_7ree() {
    if (!window.swipeDeleteManager_7ree) {
        window.swipeDeleteManager_7ree = new SwipeDeleteManager_7ree();
        // console.log('SwipeDeleteManager_7ree: 管理器已初始化');
    }
}

/**
 * 在DOMContentLoaded时初始化
 */
document.addEventListener('DOMContentLoaded', initSwipeDeleteManager_7ree);

/**
 * 如果DOM已经加载完成，立即初始化
 */
if (document.readyState === 'loading') {
    // DOM还在加载中，等待DOMContentLoaded事件
} else {
    // DOM已经加载完成，立即初始化
    initSwipeDeleteManager_7ree();
}

/**
 * 暴露初始化函数供其他模块调用
 */
window.initSwipeDeleteManager_7ree = initSwipeDeleteManager_7ree;

/**
 * 导出模块
 */
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SwipeDeleteManager_7ree;
}