// WebView性能优化模块
// 专门处理Android WebView中的性能问题和加载优化

class WebViewPerformanceOptimizer {
    constructor() {
        this.isWebView = this.detectWebView();
        this.optimizations = {
            prefetchEnabled: false,
            cacheOptimized: false,
            loadingOptimized: false
        };
        this.init();
    }

    // 检测WebView环境
    detectWebView() {
        const userAgent = navigator.userAgent;
        const isAndroid = /Android/i.test(userAgent);
        const isWebView = /wv/i.test(userAgent) || /Version\/[\d\.]+.*Chrome/i.test(userAgent);
        
        return isAndroid && isWebView;
    }

    // 初始化优化
    init() {
        if (this.isWebView) {
            console.log('🚀 检测到WebView环境，启用性能优化');
            this.enableCacheOptimization();
            this.optimizeResourceLoading();
            this.setupFastDOMReady();
        }
    }

    // 优化缓存策略
    enableCacheOptimization() {
        // 为关键资源添加缓存控制
        const meta = document.createElement('meta');
        meta.httpEquiv = 'Cache-Control';
        meta.content = 'private, max-age=86400';
        document.head.appendChild(meta);

        // 预加载关键SVG图标
        this.preloadCriticalAssets();
        
        this.optimizations.cacheOptimized = true;
        console.log('✅ WebView缓存优化已启用');
    }

    // 预加载关键资源
    preloadCriticalAssets() {
        const criticalAssets = [
            'img/help.svg',
            'img/logout.svg',
            'img/search.svg',
            'img/history.svg'
            // 注意：help-body_7ree.html 改为闲时预取，避免与首屏关键请求竞争_7ree
        ];

        criticalAssets.forEach(asset => {
            if (asset.endsWith('.svg')) {
                // 预加载SVG图标
                const link = document.createElement('link');
                link.rel = 'preload';
                link.href = asset;
                link.as = 'image';
                document.head.appendChild(link);
            }
        });

        this.optimizations.prefetchEnabled = true;
        console.log('✅ 关键资源预加载已启用');
    }

    // 优化资源加载
    optimizeResourceLoading() {
        // 使用requestIdleCallback优化非关键脚本加载
        if (window.requestIdleCallback) {
            window.requestIdleCallback(() => {
                this.loadNonCriticalResources();
            });
        } else {
            // fallback for older WebView
            setTimeout(() => {
                this.loadNonCriticalResources();
            }, 100);
        }

        this.optimizations.loadingOptimized = true;
        console.log('✅ WebView资源加载优化已启用');
    }

    // 加载非关键资源
    loadNonCriticalResources() {
        // 检查是否已经预加载过help-body_7ree.html，避免重复请求
        if (!window.preloadedHelpBodyHtml_7ree) {
            // 将 help-body_7ree.html 放入闲时预取，避免阻塞首屏关键路径_7ree
            fetch('components/help-body_7ree.html')
                .then(response => response.text())
                .then(html => {
                    window.preloadedHelpBodyHtml_7ree = html;
                    console.log('✅ 闲时预加载help-body_7ree.html成功');
                })
                .catch(e => console.log('闲时预加载失败:', 'components/help-body_7ree.html', e));
        } else {
            console.log('✅ help-body_7ree.html已预加载，跳过重复请求');
        }
    }

    // 设置快速DOM准备检测
    setupFastDOMReady() {
        const originalAddEventListener = document.addEventListener;
        const self = this;
        
        // 拦截DOMContentLoaded事件，提供更快的检测
        document.addEventListener = function(type, listener, options) {
            if (type === 'DOMContentLoaded') {
                // 如果DOM已经加载完成，立即执行回调
                if (document.readyState === 'interactive' || document.readyState === 'complete') {
                    setTimeout(listener, 0);
                    return;
                }
            }
            originalAddEventListener.call(this, type, listener, options);
        };
    }

    // 优化图片加载
    optimizeImageLoading() {
        // 为SVG图标设置loading="eager"
        const images = document.querySelectorAll('img[src$=".svg"]');
        images.forEach(img => {
            img.loading = 'eager';
            img.decoding = 'sync';
        });
    }

    // 获取优化状态
    getOptimizationStatus() {
        return {
            isWebView: this.isWebView,
            optimizations: this.optimizations,
            userAgent: navigator.userAgent
        };
    }

    // 手动触发帮助系统快速初始化
    fastInitHelpSystem() {
        if (window.initHelpSystem) {
            console.log('🚀 WebView优化器触发帮助系统快速初始化');
            window.initHelpSystem();
        }
    }

    // 监控性能指标
    measurePerformance() {
        if (performance.mark && performance.measure) {
            performance.mark('webview-optimization-start');
            
            setTimeout(() => {
                performance.mark('webview-optimization-end');
                performance.measure('webview-optimization', 'webview-optimization-start', 'webview-optimization-end');
                
                const measures = performance.getEntriesByName('webview-optimization');
                if (measures.length > 0) {
                    console.log(`⏱️ WebView优化耗时: ${measures[0].duration.toFixed(2)}ms`);
                }
            }, 1000);
        }
    }
}

// 创建全局实例并立即初始化
if (!window.webViewOptimizer) {
    window.webViewOptimizer = new WebViewPerformanceOptimizer();
    window.webViewOptimizer.measurePerformance();
}

// 导出类到全局作用域
window.WebViewPerformanceOptimizer = WebViewPerformanceOptimizer;

// 在DOM准备好后立即触发帮助系统初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            if (window.webViewOptimizer) {
                window.webViewOptimizer.fastInitHelpSystem();
                window.webViewOptimizer.optimizeImageLoading();
            }
        }, 50); // 极短延迟确保DOM完全就绪
    });
} else {
    // DOM已经加载完成
    setTimeout(() => {
        if (window.webViewOptimizer) {
            window.webViewOptimizer.fastInitHelpSystem();
            window.webViewOptimizer.optimizeImageLoading();
        }
    }, 10);
}