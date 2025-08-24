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
        // console.log('开始加载历史页面组件...');
        // 加载header-top组件
        if (window.preloadedHeaderHtml) {
            // console.log('加载header-top组件');
            document.getElementById('headerTopContainer_7ree').innerHTML = window.preloadedHeaderHtml;
            // console.log('header-top组件加载完成，触发登出按钮事件监听器绑定');
        } else {
            console.log('header-top组件未预加载');
        }

        // 加载history-records组件
        if (window.preloadedHistoryHtml) {
            // console.log('加载history-records组件');
            document.getElementById('historyContentContainer_7ree').innerHTML = window.preloadedHistoryHtml;
        } else {
            console.log('history-records组件未预加载');
        }

        // 加载bottom-nav组件
        if (window.preloadedNavHtml) {
            // console.log('加载bottom-nav组件');
            document.getElementById('bottomNavContainer_7ree').innerHTML = window.preloadedNavHtml;
        } else {
            console.log('bottom-nav组件未预加载');
        }

        // 确保DOM更新完成
        // console.log('历史页面组件加载完成');
        setTimeout(resolve, 100);
    });
}

// 新增：内置占位符生成（WebView兜底保障）
function getFallbackHtml_7ree(type) {
    if (type === 'header') {
        return (
            '<div class="header-top">' +
            '  <div class="header-left" id="headerLeft">' +
            '    <div class="auth-links" id="authLinks">' +
            '      <a href="auth.html" class="auth-link">登录</a>' +
            '    </div>' +
            '    <div class="user-logout hidden" id="userLogout">' +
            '      <button class="logout-btn" id="logoutBtn" aria-label="登出">' +
            '        <img src="img/logout.svg" alt="登出图标" class="logout-icon">' +
            '      </button>' +
            '    </div>' +
            '  </div>' +
            '  <div class="header-center" id="headerCenter">' +
            '    <div class="welcome-message" id="welcomeMessage">' +
            '      <span class="welcome-text" id="welcomeText">请先登录</span>' +
            '    </div>' +
            '  </div>' +
            '  <div class="header-right" id="headerRight">' +
            '  </div>' +
            '</div>'
        );
    }
    if (type === 'history') {
        return (
            '<div class="history-container">' +
            '  <div id="history-records" class="history-records"></div>' +
            '  <div id="loading-indicator" class="loading-indicator" style="display: none;">' +
            '    <div class="loading-spinner"></div><span>加载中...</span>' +
            '  </div>' +
            '  <div id="load-more-indicator" class="load-more-indicator" style="display: none;">' +
            '    <div class="loading-spinner"></div><span>加载更多...</span>' +
            '  </div>' +
            '  <div id="no-more-data" class="no-more-data" style="display: none;"><span>没有更多记录了</span></div>' +
            '  <div id="error-message" class="error-message" style="display: none;"></div>' +
            '</div>'
        );
    }
    if (type === 'nav') {
        return (
            '<nav class="bottom-nav">' +
            '  <a href="index.html" class="nav-item" data-page="index">' +
            '    <img src="img/search.svg" alt="查找图标" class="nav-icon">' +
            '    <span class="nav-label">查找</span>' +
            '  </a>' +
            '  <a href="history.html" class="nav-item" data-page="history">' +
            '    <img src="img/history.svg" alt="记录图标" class="nav-icon">' +
            '    <span class="nav-label">记录</span>' +
            '  </a>' +
            '</nav>' +
            '<div class="page-loading-indicator hidden" id="pageLoadingIndicator">' +
            '  <div class="loading-spinner"></div>' +
            '  <div class="loading-text">载入中，请稍候</div>' +
            '</div>'
        );
    }
    return '';
}

// 强制加载缺失的组件
async function forceLoadMissingComponents_7ree() {
    const loadComponent = async (url, varName) => {
        try {
            const response = await fetch(url);
            if (response.ok) {
                const html = await response.text();
                window[varName] = html;
                // console.log(`强制加载组件成功: ${url}`);
                return true;
            }
        } catch (error) {
            console.error(`强制加载组件失败: ${url}`, error);
        }
        return false;
    };
    
    const promises = [];
    
    if (!window.preloadedHeaderHtml) {
        promises.push(loadComponent('components/header-top.html', 'preloadedHeaderHtml'));
    }
    
    if (!window.preloadedHistoryHtml) {
        promises.push(loadComponent('components/history-records_7ree.html', 'preloadedHistoryHtml'));
    }
    
    if (!window.preloadedNavHtml) {
        promises.push(loadComponent('components/bottom-nav.html', 'preloadedNavHtml'));
    }
    
    await Promise.all(promises);

    // 兜底：仍有缺失则注入占位符，避免WebView白屏
    let usedFallback = false;
    if (!window.preloadedHeaderHtml) {
        window.preloadedHeaderHtml = getFallbackHtml_7ree('header');
        usedFallback = true;
    }
    if (!window.preloadedHistoryHtml) {
        window.preloadedHistoryHtml = getFallbackHtml_7ree('history');
        usedFallback = true;
    }
    if (!window.preloadedNavHtml) {
        window.preloadedNavHtml = getFallbackHtml_7ree('nav');
        usedFallback = true;
    }
    if (usedFallback) {
        console.warn('部分组件加载失败，已使用内置占位符以保证页面渲染');
    }
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
    
    // 超时后尝试强制加载组件
    // console.warn('组件预加载超时，尝试强制加载组件...');
    console.log('预加载状态:', {
        header: !!window.preloadedHeaderHtml,
        history: !!window.preloadedHistoryHtml,
        nav: !!window.preloadedNavHtml
    });
    
    // 强制加载缺失的组件（包含占位符兜底）
    await forceLoadMissingComponents_7ree();
    await loadHistoryComponents_7ree();
    return true;
}

// 确保登出按钮事件监听器正确绑定
function ensureLogoutButtonHandler() {
    // 等待DOM更新完成
    setTimeout(() => {
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            // 移除所有已有的事件监听器
            const newLogoutBtn = logoutBtn.cloneNode(true);
            logoutBtn.parentNode.replaceChild(newLogoutBtn, logoutBtn);
            
            // 添加新的事件监听器
            newLogoutBtn.addEventListener('click', async (e) => {
                // console.log('登出按钮被点击(ensureLogoutButtonHandler)');
                e.preventDefault();
                e.stopPropagation();
                
                // 调用UserStateManager中的登出处理函数
                if (window.userStateManager) {
                    await window.userStateManager.handleLogout();
                } else {
                    // 如果UserStateManager不可用，使用备选方案
                    try {
                        const userEmail = window.authManager?.user?.email || '当前用户';
                        const confirmMessage = `确定要退出登录吗？\n\n当前登录用户：${userEmail}`;
                        
                        const confirmed = await customConfirm_7ree(confirmMessage, {
                            title: '退出登录',
                            confirmText: '退出',
                            cancelText: '取消',
                            danger: true
                        });
                        
                        if (confirmed) {
                            const success = await window.authManager.logout();
                            if (success) {
                                alert('已成功退出登录');
                                // 刷新页面以更新状态
                                location.reload();
                            } else {
                                alert('退出登录失败，请重试');
                            }
                        }
                    } catch (error) {
                        alert('退出登录时发生错误：' + error.message);
                    }
                }
            });
            // console.log('登出按钮事件监听器绑定完成');
        } else {
            console.log('未找到登出按钮元素');
        }
    }, 100);
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
        'js/main.js',
        'js/UserStateManager.js',
        'js/volume-visualizer.js'  // 新增：音量可视化模块
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

    // 确保登出按钮事件监听器正确绑定
    ensureLogoutButtonHandler();

    // 需要作为模块加载的脚本
    const moduleScripts = new Set([
        'js/main.js',
        'js/UserStateManager.js',
        'js/volume-visualizer.js'  // 新增：音量可视化模块
    ]);

    // 动态加载JavaScript文件，防止缓存
    const jsTimestamp = Date.now();
    let loadedCount = 0;
    let hasError = false;

    // 创建Promise来跟踪所有脚本的加载状态
    const scriptPromises = scripts.map((src, index) => {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src + '?v=' + jsTimestamp + '&t=' + Math.random();
            // 如果是模块脚本，设置type="module"
            if (moduleScripts.has(src)) {
                script.type = 'module';
            }
            script.async = false; // 确保按顺序加载
            
            script.onerror = function () {
                console.error('Failed to load script:', src);
                hasError = true;
                reject(new Error(`Failed to load script: ${src}`));
            };
            
            script.onload = function () {
                console.log('Loaded script:', src);
                loadedCount++;
                resolve();
            };
            
            document.head.appendChild(script);
        });
    });

    try {
        // 等待所有脚本加载完成
        await Promise.all(scriptPromises);
        console.log(`所有历史页面脚本加载完成 (${loadedCount}/${scripts.length})`);
        
        // 再次确保登出按钮事件监听器正确绑定
        ensureLogoutButtonHandler();
        
        // 确保HistoryManager正确初始化
        setTimeout(() => {
            if (!window.historyManager) {
                if (window.initHistoryManager_7ree) {
                    console.log('调用专用初始化函数...');
                    window.initHistoryManager_7ree();
                } else if (window.HistoryManager) {
                    console.log('手动初始化HistoryManager...');
                    window.historyManager = new window.HistoryManager();
                }
            }
            
            // 如果是页面刷新，延迟恢复状态
            if (isPageRefresh) {
                console.log('页面刷新后恢复用户状态...');
                if (window.forceUpdateUserDisplay) {
                    window.forceUpdateUserDisplay();
                }
            }
        }, 100);
        
    } catch (error) {
        console.error('脚本加载失败:', error);
        // 即使有脚本加载失败，也尝试初始化已加载的功能
        setTimeout(() => {
            if (!window.historyManager) {
                if (window.initHistoryManager_7ree) {
                    console.log('部分脚本加载失败，调用专用初始化函数...');
                    window.initHistoryManager_7ree();
                } else if (window.HistoryManager) {
                    console.log('部分脚本加载失败，尝试初始化HistoryManager...');
                    window.historyManager = new window.HistoryManager();
                }
            }
        }, 200);
    }
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
window.ensureLogoutButtonHandler = ensureLogoutButtonHandler;
