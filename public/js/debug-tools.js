/**
 * ========================================
 * 🔧 应用调试工具模块
 * ========================================
 * 包含应用的调试、检测和测试函数
 */

/**
 * 测试流式错误显示的调试函数
 */
export function testStreamErrorDisplay() {
    console.log('=== 测试流式错误显示 ===');
    
    const container = document.querySelector('.results-container');
    if (!container) {
        console.log('未找到结果容器');
        return;
    }
    
    // 检查流式渲染器是否可用
    if (!window.streamRenderer_7ree) {
        console.log('流式渲染器不可用');
        return;
    }
    
    // 清空容器
    container.innerHTML = '';
    
    // 构建错误数据
    const errorData = {
        transcript: '❓❓❓❓❓❓',
        action: 'error',
        business_result: {
            success: false,
            message: '抱歉，没听清你说了什么，请稍后重试。'
        }
    };
    
    console.log('开始流式渲染错误信息...');
    
    // 使用流式渲染器渲染错误
    window.streamRenderer_7ree.renderResults(errorData, container, false)
        .then(() => {
            console.log('流式错误显示完成');
            
            // 等待一下然后测试点击事件
            setTimeout(() => {
                const userBubble = container.querySelector('.user-say.error-user');
                const aiBubble = container.querySelector('.ai-reply');
                
                console.log('流式渲染结果检查:', {
                    userBubble: !!userBubble,
                    aiBubble: !!aiBubble,
                    userHasErrorClass: userBubble ? userBubble.classList.contains('error-user') : false,
                    aiAction: aiBubble ? aiBubble.getAttribute('data-action') : null
                });
                
                // 测试点击事件
                if (userBubble) {
                    console.log('测试点击用户错误气泡...');
                    userBubble.click();
                }
                
                if (aiBubble) {
                    console.log('测试点击AI错误气泡...');
                    aiBubble.click();
                }
            }, 1000);
        })
        .catch((error) => {
            console.error('流式错误显示失败:', error);
        });
}

/**
 * 测试普通错误显示和点击事件的调试函数
 */
export function testErrorDisplay() {
    console.log('=== 测试错误显示 ===');
    
    const container = document.querySelector('.results-container');
    if (!container) {
        console.log('未找到结果容器');
        return;
    }
    
    // 手动触发错误显示
    if (window.showError) {
        console.log('触发错误显示...');
        window.showError('测试错误消息', { resultsContainer: container });
        
        // 等待DOM渲染完成后检查元素
        setTimeout(() => {
            const userBubble = container.querySelector('.user-say.error-user');
            const aiBubble = container.querySelector('.ai-reply');
            
            console.log('错误显示检查结果:', {
                userBubble: !!userBubble,
                aiBubble: !!aiBubble,
                userBubbleText: userBubble ? userBubble.textContent : null,
                aiBubbleAction: aiBubble ? aiBubble.getAttribute('data-action') : null,
                bindFallbackAvailable: !!window.bindFallbackPlayback_7ree
            });
            
            // 测试点击事件
            if (userBubble) {
                console.log('模拟点击用户气泡...');
                userBubble.click();
            }
            
            if (aiBubble) {
                console.log('模拟点击AI气泡...');
                aiBubble.click();
            }
        }, 100);
    } else {
        console.log('showError函数不可用');
    }
}

/**
 * 对比测试流式错误显示和静态错误显示
 */
export function compareErrorDisplayMethods() {
    console.log('=== 对比测试：流式 vs 静态错误显示 ===');
    
    const container = document.querySelector('.results-container');
    if (!container) {
        console.log('未找到结果容器');
        return;
    }
    
    console.log('1. 测试静态错误显示（原始方式）');
    
    // 先测试静态错误显示
    if (window.showError) {
        window.showError('测试错误 - 静态方式', { resultsContainer: container });
        
        setTimeout(() => {
            console.log('静态错误显示完成，5秒后将测试流式显示...');
            
            setTimeout(() => {
                console.log('2. 测试流式错误显示（新方式）');
                testStreamErrorDisplay();
            }, 5000);
        }, 1000);
    } else {
        console.log('showError函数不可用，直接测试流式显示');
        testStreamErrorDisplay();
    }
}

/**
 * 检查所有全局函数是否正确暴露
 */
export function checkGlobalFunctions() {
    const expectedFunctions = [
        'showResults',
        'clearResults', 
        'showLoading',
        'showError',
        'showMessage',
        'bindFallbackPlayback_7ree'
    ];
    
    console.log('=== 检查全局函数 ===');
    const results = {};
    
    expectedFunctions.forEach(func => {
        results[func] = !!window[func];
        console.log(`${func}: ${results[func] ? '✓ 可用' : '✗ 不可用'}`);
    });
    
    return results;
}
export function testMicrophoneButton() {
    console.log('=== 麦克风按钮测试 ===');
    
    const button = document.getElementById('microphoneButton');
    const icon = document.getElementById('microphoneIcon');
    const loadingIcon = document.getElementById('loadingIcon');
    console.log('按钮元素:', button);
    console.log('麦克风图标元素:', icon);
    console.log('加载图标元素:', loadingIcon);
    
    if (button) {
        console.log('按钮样式:', {
            display: getComputedStyle(button).display,
            visibility: getComputedStyle(button).visibility,
            pointerEvents: getComputedStyle(button).pointerEvents,
            opacity: getComputedStyle(button).opacity,
            classList: Array.from(button.classList)
        });
        
        console.log('按钮位置:', button.getBoundingClientRect());
    }
    
    if (icon) {
        console.log('麦克风图标样式:', {
            opacity: getComputedStyle(icon).opacity,
            pointerEvents: getComputedStyle(icon).pointerEvents,
            classList: Array.from(icon.classList)
        });
    }
    
    if (loadingIcon) {
        console.log('加载图标样式:', {
            opacity: getComputedStyle(loadingIcon).opacity,
            pointerEvents: getComputedStyle(loadingIcon).pointerEvents,
            classList: Array.from(loadingIcon.classList)
        });
    }
    
    console.log('初始化状态:', {
        voiceAppInitialized: window.voiceAppInitialized,
        hasAuthManager: !!window.authManager,
        isAuthenticated: window.authManager?.isAuthenticated,
        user: window.authManager?.user
    });
    
    console.log('应用状态:', {
        hasApp: !!window.app,
        hasUIController: !!window.app?.uiController,
        hasAudioRecorder: !!window.app?.audioRecorder
    });
}

/**
 * 检查应用初始化状态的便捷函数
 * @returns {Object} 包含应用各组件初始化状态的对象
 */
export function checkAppInitStatus() {
    return {
        initialized: window.voiceAppInitialized,
        microphoneReady: document.getElementById('microphoneButton')?.classList.contains('ready'),
        iconVisible: document.getElementById('microphoneIcon')?.classList.contains('show'),
        loadingIconHidden: document.getElementById('loadingIcon')?.classList.contains('hidden'),
        authReady: !!window.authManager,
        appReady: !!window.app
    };
}

/**
 * 手动测试图标切换的调试函数
 * 用于手动切换加载图标和麦克风图标的显示状态
 */
export function testIconSwitch() {
    const loadingIcon = document.getElementById('loadingIcon');
    const microphoneIcon = document.getElementById('microphoneIcon');
    const button = document.getElementById('microphoneButton');
    
    if (!loadingIcon || !microphoneIcon || !button) {
        console.log('图标元素未找到');
        return;
    }
    
    console.log('当前状态:', {
        loadingIconClasses: Array.from(loadingIcon.classList),
        microphoneIconClasses: Array.from(microphoneIcon.classList),
        buttonClasses: Array.from(button.classList)
    });
    
    // 切换到加载状态
    if (microphoneIcon.classList.contains('show')) {
        console.log('切换到加载状态');
        microphoneIcon.classList.remove('show');
        microphoneIcon.classList.add('hidden-initial');
        loadingIcon.classList.remove('hidden');
        button.classList.remove('ready');
        button.classList.add('initializing');
    } else {
        console.log('切换到麦克风状态');
        loadingIcon.classList.add('hidden');
        setTimeout(() => {
            microphoneIcon.classList.remove('hidden-initial');
            microphoneIcon.classList.add('show');
            button.classList.remove('initializing');
            button.classList.add('ready');
        }, 300);
    }
}

/**
 * 初始化调试工具
 * 将调试函数暴露到全局作用域
 */
export function initializeDebugTools() {
    // 将调试函数暴露到全局作用域
    window.testMicrophoneButton = testMicrophoneButton;
    window.checkAppInitStatus = checkAppInitStatus;
    window.testIconSwitch = testIconSwitch;
    window.testErrorDisplay = testErrorDisplay;
    window.testStreamErrorDisplay = testStreamErrorDisplay;
    window.compareErrorDisplayMethods = compareErrorDisplayMethods;
    window.checkGlobalFunctions = checkGlobalFunctions;
    
    console.log('调试工具已初始化并暴露到全局作用域');
}