/**
 * ========================================
 * 🔧 应用调试工具模块
 * ========================================
 * 包含应用的调试、检测和测试函数
 */

/**
 * 麦克风按钮测试函数
 * 检查麦克风按钮和相关图标的状态
 */
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
    
    console.log('调试工具已初始化并暴露到全局作用域');
}