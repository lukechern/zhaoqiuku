/**
 * 历史页面主入口文件
 * 导入所有历史页面相关的模块
 */

// 导入历史页面模块
import './history/index.js';

// 为了兼容性，也导出主要功能到全局
import { HistoryManager, initHistoryManager_7ree } from './history/index.js';

// 导出到全局作用域
window.HistoryManager = HistoryManager;
window.initHistoryManager_7ree = initHistoryManager_7ree;

// 如果需要立即初始化历史管理器
if (typeof window !== 'undefined') {
    // 页面加载完成后会自动初始化
}
