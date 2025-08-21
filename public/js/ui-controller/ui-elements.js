/**
 * UI 元素管理模块
 * 处理DOM元素的初始化和管理
 */

// 获取UI元素
function getUIElements() {
    return {
        microphoneButton: document.getElementById('microphoneButton'),
        soundWaves: document.getElementById('soundWaves'),
        listeningIndicator: null, // 已移除的元素，设为null
        cancelIndicator: document.getElementById('cancelIndicator'),
        timer: null, // 已移除的元素，设为null
        playbackBtn: document.getElementById('playbackBtn'),
        clearBtn: document.getElementById('clearBtn'),
        refreshBtn: document.getElementById('refreshBtn'),
        resultsContainer: document.getElementById('resultsContainer'),
        debugLevel: document.getElementById('debugLevel')
    };
}

// 重试元素初始化
function retryElementInitialization(elements, maxRetries = 10) {
    let retries = 0;

    const tryInitialize = () => {
        retries++;
        console.log(`尝试初始化UI元素，第${retries}次...`);

        // 重新获取所有元素
        const newElements = getUIElements();

        // 更新elements对象
        Object.keys(newElements).forEach(key => {
            if (newElements[key]) {
                elements[key] = newElements[key];
            }
        });

        // 检查关键元素是否已加载
        if (elements.microphoneButton) {
            console.log('UI元素初始化成功');
            return true;
        } else if (retries < maxRetries) {
            setTimeout(tryInitialize, 200);
            return false;
        } else {
            console.error('UI元素初始化失败，达到最大重试次数');
            return false;
        }
    };

    return new Promise((resolve) => {
        if (tryInitialize()) {
            resolve(true);
        } else {
            setTimeout(() => resolve(tryInitialize()), 200);
        }
    });
}

// 设置调试控制
function setupDebugControls() {
    // 前台调试控制已隐藏，调试级别只能通过以下方式设置：
    // 1. 修改 config/debugConfig.js 中的 CURRENT_DEBUG_LEVEL
    // 2. 在控制台使用 setDebugLevel("level") 命令

    // 监听调试级别变化事件（来自控制台设置）
    window.addEventListener('debugLevelChanged', () => {
        // 如果有结果显示，重新格式化显示
        if (window.uiController && window.uiController.lastResultData) {
            if (window.uiController.showResults) {
                window.uiController.showResults(window.uiController.lastResultData);
            }
        }
    });

    console.log('🔧 调试控制提示:');
    console.log('- 修改 config/debugConfig.js 中的 CURRENT_DEBUG_LEVEL 来永久设置调试级别');
    console.log('- 使用 setDebugLevel("normal"|"debug"|"full_debug") 来临时设置调试级别');
    console.log('- 使用 showDebugLevels() 查看所有可用的调试级别');
}

// 导出函数到全局作用域
window.getUIElements = getUIElements;
window.retryElementInitialization = retryElementInitialization;
window.setupDebugControls = setupDebugControls;