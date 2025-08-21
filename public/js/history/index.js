/**
 * 历史页面模块入口文件
 */

// 导入模块
import './history-events.js';
import { initHistoryManager_7ree } from './history-initializer.js';

// 导出主要功能供全局使用
export { default as HistoryManager } from './history-manager.js';
export { initHistoryManager_7ree } from './history-initializer.js';
export { escapeHtml, generateRecordId_7ree } from './history-utils.js';

// 如果需要自动初始化，可以取消注释以下行
// initHistoryManager_7ree();