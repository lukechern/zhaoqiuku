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
        await loadModule('js/history/history-utils.js');      // 工具函数
        await loadModule('js/history/history-manager.js');    // 主类
        await loadModule('js/history/history-initializer.js'); // 初始化逻辑
        await loadModule('js/history/history-events.js');     // 事件处理
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
