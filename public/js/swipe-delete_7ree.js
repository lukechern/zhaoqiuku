/*
 * ========================================
 * 🗑️ 滑动删除功能管理器（已拆分）
 * ========================================
 * 为历史记录项添加左滑删除功能
 * 此文件已拆分为多个模块，位于 swipe-delete/ 目录下
 * 这里保留向后兼容性，重定向到新的实现
 */

// 保持向后兼容的类定义（如果需要的话）
window.SwipeDeleteManager_7ree = class SwipeDeleteManager_7ree {
    constructor() {
        console.warn('SwipeDeleteManager_7ree: 请使用新的入口文件 js/swipe-delete/index.js');
    }
}

// 全局实例（已迁移到新模块）
window.swipeDeleteManager_7ree = null;

// 初始化函数（已迁移到新模块）
function initSwipeDeleteManager_7ree() {
    console.warn('initSwipeDeleteManager_7ree: 请使用新的入口文件 js/swipe-delete/index.js');
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