// webview-compat_7ree.js - WebView兼容性处理模块
// 专门处理Android WebView中的长按菜单和系统功能选单问题

class WebViewCompat_7ree {
    constructor() {
        this.isAndroidWebView = this.detectAndroidWebView();
        this.longPressTimers = new Map();
        this.init();
    }

    // 检测是否为Android WebView环境
    detectAndroidWebView() {
        const userAgent = navigator.userAgent;
        const isAndroid = /Android/i.test(userAgent);
        const isWebView = /wv/i.test(userAgent) || /Version\/[\d\.]+.*Chrome/i.test(userAgent);
        
        console.log('WebView检测:', {
            userAgent,
            isAndroid,
            isWebView,
            result: isAndroid && isWebView
        });
        
        return isAndroid && isWebView;
    }

    // 初始化WebView兼容性处理
    init() {
        if (this.isAndroidWebView) {
            console.log('检测到Android WebView环境，启用兼容性处理');
            this.setupGlobalTouchHandling();
            this.disableSystemFeatures();
        }
    }

    // 设置全局触摸处理
    setupGlobalTouchHandling() {
        // 全局禁用长按上下文菜单
        document.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }, { passive: false, capture: true });

        // 全局禁用选择开始
        document.addEventListener('selectstart', (e) => {
            // 只对特定元素禁用选择
            if (e.target.closest('.microphone-button') || 
                e.target.closest('[data-no-select]')) {
                e.preventDefault();
                e.stopPropagation();
                return false;
            }
        }, { passive: false, capture: true });

        // 全局禁用拖拽开始
        document.addEventListener('dragstart', (e) => {
            if (e.target.closest('.microphone-button') || 
                e.target.closest('[data-no-drag]')) {
                e.preventDefault();
                e.stopPropagation();
                return false;
            }
        }, { passive: false, capture: true });
    }

    // 禁用系统功能
    disableSystemFeatures() {
        // 添加CSS样式来禁用系统功能
        const style = document.createElement('style');
        style.textContent = `
            /* WebView兼容性样式 */
            .microphone-button,
            [data-no-select] {
                -webkit-user-select: none !important;
                -webkit-touch-callout: none !important;
                -webkit-tap-highlight-color: transparent !important;
                -webkit-user-drag: none !important;
                -webkit-appearance: none !important;
                user-select: none !important;
                touch-action: manipulation !important;
            }
            
            /* 禁用长按高亮 */
            .microphone-button::-webkit-selection,
            [data-no-select]::-webkit-selection {
                background: transparent !important;
            }
            
            /* 禁用焦点轮廓 */
            .microphone-button:focus,
            [data-no-select]:focus {
                outline: none !important;
                -webkit-tap-highlight-color: transparent !important;
            }
        `;
        document.head.appendChild(style);
    }

    // 为特定元素设置防长按处理
    setupElementProtection(element, options = {}) {
        if (!element) return;

        const {
            preventContextMenu = true,
            preventSelection = true,
            preventDrag = true,
            longPressDelay = 500
        } = options;

        // 添加数据属性标记
        element.setAttribute('data-no-select', 'true');
        element.setAttribute('data-no-drag', 'true');

        let longPressTimer = null;
        let touchStartTime = 0;

        // 触摸开始
        const handleTouchStart = (e) => {
            touchStartTime = Date.now();
            
            // 设置长按检测定时器
            longPressTimer = setTimeout(() => {
                // 长按检测到，强制阻止默认行为
                console.log('检测到长按，阻止系统菜单');
                e.preventDefault();
                e.stopPropagation();
                
                // 触发自定义长按事件（如果需要）
                const longPressEvent = new CustomEvent('customlongpress', {
                    detail: { originalEvent: e }
                });
                element.dispatchEvent(longPressEvent);
            }, longPressDelay);
        };

        // 触摸结束
        const handleTouchEnd = (e) => {
            if (longPressTimer) {
                clearTimeout(longPressTimer);
                longPressTimer = null;
            }
            
            const touchDuration = Date.now() - touchStartTime;
            console.log('触摸持续时间:', touchDuration + 'ms');
        };

        // 触摸取消
        const handleTouchCancel = (e) => {
            if (longPressTimer) {
                clearTimeout(longPressTimer);
                longPressTimer = null;
            }
        };

        // 绑定事件
        element.addEventListener('touchstart', handleTouchStart, { passive: false });
        element.addEventListener('touchend', handleTouchEnd, { passive: false });
        element.addEventListener('touchcancel', handleTouchCancel, { passive: false });

        if (preventContextMenu) {
            element.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                e.stopPropagation();
                return false;
            }, { passive: false });
        }

        // 存储定时器引用以便清理
        this.longPressTimers.set(element, {
            timer: longPressTimer,
            cleanup: () => {
                element.removeEventListener('touchstart', handleTouchStart);
                element.removeEventListener('touchend', handleTouchEnd);
                element.removeEventListener('touchcancel', handleTouchCancel);
            }
        });

        console.log('已为元素设置WebView保护:', element);
    }

    // 移除元素保护
    removeElementProtection(element) {
        const timerData = this.longPressTimers.get(element);
        if (timerData) {
            if (timerData.timer) {
                clearTimeout(timerData.timer);
            }
            timerData.cleanup();
            this.longPressTimers.delete(element);
        }
    }

    // 清理所有定时器
    cleanup() {
        this.longPressTimers.forEach((timerData) => {
            if (timerData.timer) {
                clearTimeout(timerData.timer);
            }
            timerData.cleanup();
        });
        this.longPressTimers.clear();
    }

    // 获取WebView信息
    getWebViewInfo() {
        return {
            isAndroidWebView: this.isAndroidWebView,
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            vendor: navigator.vendor
        };
    }
}

// 创建全局实例
window.webViewCompat_7ree = new WebViewCompat_7ree();

// 将类添加到全局作用域
window.WebViewCompat_7ree = WebViewCompat_7ree;