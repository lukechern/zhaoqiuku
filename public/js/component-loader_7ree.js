// 组件加载器模块
// 负责动态加载HTML组件和JavaScript文件

// 组件加载函数
function loadComponents_7ree() {
    return new Promise((resolve) => {
        // 加载header-top组件
        if (window.preloadedHeaderHtml) {
            document.getElementById('headerTopContainer_7ree').innerHTML = window.preloadedHeaderHtml;
        }

        // 加载main组件
        if (window.preloadedMainHtml) {
            document.getElementById('mainContentContainer_7ree').innerHTML = window.preloadedMainHtml;
        }

        // 加载bottom-nav组件
        if (window.preloadedNavHtml) {
            document.getElementById('bottomNavContainer_7ree').innerHTML = window.preloadedNavHtml;
        }

        // 确保DOM更新完成
        setTimeout(resolve, 100);
    });
}

// 历史页面组件加载函数
function loadHistoryComponents_7ree() {
    return new Promise((resolve) => {
        // 加载header-top组件
        if (window.preloadedHeaderHtml) {
            document.getElementById('headerTopContainer_7ree').innerHTML = window.preloadedHeaderHtml;
        }

        // 加载history-records组件
        if (window.preloadedHistoryHtml) {
            document.getElementById('historyContentContainer_7ree').innerHTML = window.preloadedHistoryHtml;
        }

        // 加载bottom-nav组件
        if (window.preloadedNavHtml) {
            document.getElementById('bottomNavContainer_7ree').innerHTML = window.preloadedNavHtml;
        }

        // 确保DOM更新完成
        setTimeout(resolve, 100);
    });
}

// 等待组件加载完成的函数
async function waitForComponents_7ree() {
    let attempts = 0;
    const maxAttempts = 50;
    
    while (attempts < maxAttempts) {
        if (window.preloadedHeaderHtml && window.preloadedMainHtml && window.preloadedNavHtml) {
            await loadComponents_7ree();
            return true;
        }
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
    }
    return false;
}

// 等待历史页面组件加载完成的函数
async function waitForHistoryComponents_7ree() {
    let attempts = 0;
    const maxAttempts = 50;
    
    while (attempts < maxAttempts) {
        if (window.preloadedHeaderHtml && window.preloadedHistoryHtml && window.preloadedNavHtml) {
            await loadHistoryComponents_7ree();
            return true;
        }
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
    }
    return false;
}

// 动态加载JavaScript文件的函数
async function loadScripts_7ree(scripts, isPageRefresh = false) {
    // 先等待组件加载完成
    const componentsLoaded = await waitForComponents_7ree();
    if (!componentsLoaded) {
        console.error('组件加载超时');
        return;
    }

    // 动态加载JavaScript文件，防止缓存
    const jsTimestamp = Date.now();

    // 需要作为模块加载的脚本
    const moduleScripts = new Set([
        'js/main.js'
    ]);

    // 强制清除缓存并加载脚本
    scripts.forEach((src, index) => {
        const script = document.createElement('script');
        script.src = src + '?v=' + jsTimestamp + '&t=' + Math.random();
        // 如果是模块脚本，设置type="module"
        if (moduleScripts.has(src)) {
            script.type = 'module';
        }
        script.async = false; // 确保按顺序加载
        script.onerror = function () {
            console.error('Failed to load script:', src);
        };
        script.onload = function () {
            console.log('Loaded script:', src);

            // 如果是最后一个脚本且是页面刷新，延迟恢复状态
            if (index === scripts.length - 1 && isPageRefresh) {
                setTimeout(() => {
                    console.log('页面刷新后恢复用户状态...');
                    if (window.forceUpdateUserDisplay) {
                        window.forceUpdateUserDisplay();
                    }
                }, 500);
            }
        };
        document.head.appendChild(script);
    });
}

// 历史页面脚本加载函数
async function loadHistoryScripts_7ree(scripts, isPageRefresh = false) {
    // 先等待历史页面组件加载完成
    const componentsLoaded = await waitForHistoryComponents_7ree();
    if (!componentsLoaded) {
        console.error('历史页面组件加载超时');
        return;
    }

    // 动态加载JavaScript文件，防止缓存
    const jsTimestamp = Date.now();

    // 强制清除缓存并加载脚本
    scripts.forEach((src, index) => {
        const script = document.createElement('script');
        script.src = src + '?v=' + jsTimestamp + '&t=' + Math.random();
        script.async = false; // 确保按顺序加载
        script.onerror = function () {
            console.error('Failed to load script:', src);
        };
        script.onload = function () {
            console.log('Loaded script:', src);

            // 如果是最后一个脚本且是页面刷新，延迟恢复状态
            if (index === scripts.length - 1 && isPageRefresh) {
                setTimeout(() => {
                    console.log('页面刷新后恢复用户状态...');
                    if (window.forceUpdateUserDisplay) {
                        window.forceUpdateUserDisplay();
                    }
                }, 500);
            }
        };
        document.head.appendChild(script);
    });
}

// 初始化组件加载器
function initComponentLoader_7ree(scripts) {
    // 检测是否为页面刷新
    const isPageRefresh = performance.navigation && performance.navigation.type === 1;
    
    // DOM加载完成后开始加载流程
    if (document.readyState === 'loading') {
        // DOM还在加载中，等待DOMContentLoaded事件
        document.addEventListener('DOMContentLoaded', function() {
            loadScripts_7ree(scripts, isPageRefresh);
        });
    } else {
        // DOM已经加载完成，直接开始加载流程
        loadScripts_7ree(scripts, isPageRefresh);
    }
}

// 初始化历史页面组件加载器
function initHistoryComponentLoader_7ree(scripts) {
    // 检测是否为页面刷新
    const isPageRefresh = performance.navigation && performance.navigation.type === 1;
    
    // DOM加载完成后开始加载流程
    if (document.readyState === 'loading') {
        // DOM还在加载中，等待DOMContentLoaded事件
        document.addEventListener('DOMContentLoaded', function() {
            loadHistoryScripts_7ree(scripts, isPageRefresh);
        });
    } else {
        // DOM已经加载完成，直接开始加载流程
        loadHistoryScripts_7ree(scripts, isPageRefresh);
    }
}

// 导出函数到全局作用域
window.loadComponents_7ree = loadComponents_7ree;
window.loadHistoryComponents_7ree = loadHistoryComponents_7ree;
window.waitForComponents_7ree = waitForComponents_7ree;
window.waitForHistoryComponents_7ree = waitForHistoryComponents_7ree;
window.loadScripts_7ree = loadScripts_7ree;
window.loadHistoryScripts_7ree = loadHistoryScripts_7ree;
window.initComponentLoader_7ree = initComponentLoader_7ree;
window.initHistoryComponentLoader_7ree = initHistoryComponentLoader_7ree;