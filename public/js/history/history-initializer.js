/**
 * 初始化历史记录管理器
 */
function initHistoryManager_7ree() {
    if (window.historyManager) {
        console.log('HistoryManager已存在，跳过初始化');
        return;
    }

    // 检查必要的DOM元素是否存在
    const historyContainer = document.getElementById('history-records');
    if (!historyContainer) {
        console.warn('历史记录容器未找到，延迟初始化...');
        setTimeout(initHistoryManager_7ree, 200);
        return;
    }

    console.log('初始化HistoryManager...');
    window.historyManager = new window.HistoryManager();
}

// 提供全局初始化函数
window.initHistoryManager_7ree = initHistoryManager_7ree;