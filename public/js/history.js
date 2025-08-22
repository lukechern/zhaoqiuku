/**
 * 历史页面主入口文件
 * 动态加载所有历史页面相关的模块
 */

// 动态加载模块文件的函数
function loadModule(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

// 加载所有历史页面模块
async function loadHistoryModules() {
    try {
        // 按依赖顺序加载模块
        await loadModule('js/history/history-core_7ree.js');  // 合并后的核心模块（工具+管理器）
        await loadModule('js/history/history-ui_7ree.js');    // 合并后的UI模块（初始化+事件）
        await loadModule('js/history/index.js');              // 入口文件

        console.log('历史页面模块加载完成');
    } catch (error) {
        console.error('加载历史页面模块失败:', error);
    }
}

// 页面加载完成后加载模块
if (typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadHistoryModules);
    } else {
        loadHistoryModules();
    }
}
