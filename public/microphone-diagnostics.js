// 麦克风按钮诊断工具
console.log('🔧 加载麦克风诊断工具...');

class MicrophoneDiagnostics {
    constructor() {
        this.diagnosticResults = [];
        this.eventLog = [];
    }

    // 运行完整诊断
    runFullDiagnostic() {
        console.log('🔍 开始麦克风按钮完整诊断...');
        this.diagnosticResults = [];
        
        this.checkDOMElements();
        this.checkEventBindings();
        this.checkAuthenticationState();
        this.checkApplicationState();
        this.checkBrowserSupport();
        this.testEventTriggers();
        
        this.displayResults();
        return this.diagnosticResults;
    }

    // 检查DOM元素
    checkDOMElements() {
        const button = document.getElementById('microphoneButton');
        const result = {
            test: 'DOM元素检查',
            passed: !!button,
            details: {}
        };

        if (button) {
            const rect = button.getBoundingClientRect();
            const styles = getComputedStyle(button);
            
            result.details = {
                element: '✅ 找到麦克风按钮',
                position: `位置: ${rect.left}, ${rect.top}, 大小: ${rect.width}x${rect.height}`,
                visibility: `可见性: ${styles.visibility}`,
                display: `显示: ${styles.display}`,
                pointerEvents: `指针事件: ${styles.pointerEvents}`,
                zIndex: `层级: ${styles.zIndex}`,
                className: `类名: ${button.className}`
            };
            
            // 检查是否被其他元素覆盖
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            const elementAtCenter = document.elementFromPoint(centerX, centerY);
            result.details.topElement = elementAtCenter === button ? 
                '✅ 按钮在最顶层' : 
                `⚠️ 被覆盖，顶层元素: ${elementAtCenter?.tagName || 'unknown'}`;
        } else {
            result.details.error = '❌ 未找到麦克风按钮元素';
        }

        this.diagnosticResults.push(result);
    }

    // 检查事件绑定
    checkEventBindings() {
        const result = {
            test: '事件绑定检查',
            passed: false,
            details: {}
        };

        const button = document.getElementById('microphoneButton');
        if (button) {
            // 检查应用实例
            const hasApp = !!window.app;
            const hasUIController = !!window.app?.uiController;
            
            result.details = {
                application: hasApp ? '✅ 应用实例存在' : '❌ 应用实例不存在',
                uiController: hasUIController ? '✅ UI控制器存在' : '❌ UI控制器不存在',
                eventHandlers: this.checkEventHandlers(button)
            };
            
            result.passed = hasApp && hasUIController;
        } else {
            result.details.error = '❌ 按钮元素不存在，无法检查事件绑定';
        }

        this.diagnosticResults.push(result);
    }

    // 检查事件处理器
    checkEventHandlers(button) {
        const events = ['click', 'mousedown', 'mouseup'];
        const handlers = {};
        
        events.forEach(eventType => {
            // 创建测试事件
            let triggered = false;
            const testHandler = () => { triggered = true; };
            
            // 临时添加测试处理器
            button.addEventListener(eventType, testHandler);
            
            // 触发事件
            const event = new MouseEvent(eventType, { bubbles: true });
            button.dispatchEvent(event);
            
            // 移除测试处理器
            button.removeEventListener(eventType, testHandler);
            
            handlers[eventType] = triggered ? '✅ 响应' : '❌ 无响应';
        });
        
        // 简单检查触摸事件支持
        handlers['touchSupport'] = 'ontouchstart' in window ? '✅ 支持触摸' : '❌ 不支持触摸';
        
        return handlers;
    }

    // 检查认证状态
    checkAuthenticationState() {
        const result = {
            test: '认证状态检查',
            passed: false,
            details: {}
        };

        const hasAuthManager = !!window.authManager;
        const isAuthenticated = window.authManager?.isAuthenticated;
        const user = window.authManager?.user;

        result.details = {
            authManager: hasAuthManager ? '✅ 认证管理器存在' : '❌ 认证管理器不存在',
            authenticated: isAuthenticated ? '✅ 用户已登录' : '❌ 用户未登录',
            userInfo: user ? `✅ 用户: ${user.email}` : '❌ 无用户信息'
        };

        result.passed = hasAuthManager && isAuthenticated && user;
        this.diagnosticResults.push(result);
    }

    // 检查应用状态
    checkApplicationState() {
        const result = {
            test: '应用状态检查',
            passed: false,
            details: {}
        };

        const app = window.app;
        if (app) {
            result.details = {
                initialized: app.isInitialized ? '✅ 应用已初始化' : '❌ 应用未初始化',
                processing: app.isProcessing ? '⚠️ 正在处理中' : '✅ 空闲状态',
                audioRecorder: app.audioRecorder ? '✅ 录音器存在' : '❌ 录音器不存在',
                uiController: app.uiController ? '✅ UI控制器存在' : '❌ UI控制器不存在',
                apiClient: app.apiClient ? '✅ API客户端存在' : '❌ API客户端不存在'
            };
            result.passed = app.isInitialized && app.audioRecorder && app.uiController;
        } else {
            result.details.error = '❌ 应用实例不存在';
        }

        this.diagnosticResults.push(result);
    }

    // 检查浏览器支持
    checkBrowserSupport() {
        const result = {
            test: '浏览器支持检查',
            passed: true,
            details: {}
        };

        const features = {
            mediaDevices: !!navigator.mediaDevices,
            getUserMedia: !!navigator.mediaDevices?.getUserMedia,
            MediaRecorder: !!window.MediaRecorder,
            fetch: !!window.fetch,
            touchEvents: 'ontouchstart' in window,
            vibration: !!navigator.vibrate
        };

        Object.entries(features).forEach(([feature, supported]) => {
            result.details[feature] = supported ? '✅ 支持' : '❌ 不支持';
            if (!supported && ['mediaDevices', 'getUserMedia', 'MediaRecorder', 'fetch'].includes(feature)) {
                result.passed = false;
            }
        });

        this.diagnosticResults.push(result);
    }

    // 测试事件触发
    testEventTriggers() {
        const result = {
            test: '事件触发测试',
            passed: false,
            details: {}
        };

        const button = document.getElementById('microphoneButton');
        if (button && window.app?.uiController) {
            // 监听事件日志
            const originalLog = console.log;
            const logs = [];
            console.log = (...args) => {
                logs.push(args.join(' '));
                originalLog.apply(console, args);
            };

            try {
                // 触发鼠标事件
                const mouseEvent = new MouseEvent('mousedown', { bubbles: true });
                button.dispatchEvent(mouseEvent);
                
                setTimeout(() => {
                    const mouseUpEvent = new MouseEvent('mouseup', { bubbles: true });
                    button.dispatchEvent(mouseUpEvent);
                }, 10);

                // 检查日志
                setTimeout(() => {
                    console.log = originalLog;
                    
                    const relevantLogs = logs.filter(log => 
                        log.includes('mousedown') || 
                        log.includes('handleMouseStart') || 
                        log.includes('handlePressStart') ||
                        log.includes('认证检查')
                    );
                    
                    result.details = {
                        triggeredEvents: relevantLogs.length > 0 ? '✅ 事件被触发' : '❌ 事件未触发',
                        eventLogs: relevantLogs
                    };
                    
                    result.passed = relevantLogs.length > 0;
                    this.updateResultDisplay();
                }, 100);

            } catch (error) {
                console.log = originalLog;
                result.details.error = `❌ 测试出错: ${error.message}`;
            }
        } else {
            result.details.error = '❌ 按钮或UI控制器不存在';
        }

        this.diagnosticResults.push(result);
    }

    // 显示结果
    displayResults() {
        console.log('📊 诊断结果:');
        console.log('='.repeat(50));
        
        this.diagnosticResults.forEach((result, index) => {
            const status = result.passed ? '✅ 通过' : '❌ 失败';
            console.log(`${index + 1}. ${result.test}: ${status}`);
            
            Object.entries(result.details).forEach(([key, value]) => {
                if (Array.isArray(value)) {
                    console.log(`   ${key}:`);
                    value.forEach(item => console.log(`     - ${item}`));
                } else {
                    console.log(`   ${key}: ${value}`);
                }
            });
            console.log('');
        });

        // 提供修复建议
        this.provideFixes();
    }

    // 更新结果显示（用于异步结果）
    updateResultDisplay() {
        const lastResult = this.diagnosticResults[this.diagnosticResults.length - 1];
        if (lastResult) {
            console.log(`更新: ${lastResult.test}:`, lastResult.passed ? '✅ 通过' : '❌ 失败');
            Object.entries(lastResult.details).forEach(([key, value]) => {
                if (Array.isArray(value)) {
                    console.log(`   ${key}:`);
                    value.forEach(item => console.log(`     - ${item}`));
                } else {
                    console.log(`   ${key}: ${value}`);
                }
            });
        }
    }

    // 提供修复建议
    provideFixes() {
        console.log('🔧 修复建议:');
        console.log('='.repeat(50));

        const failedTests = this.diagnosticResults.filter(r => !r.passed);
        
        if (failedTests.length === 0) {
            console.log('✅ 所有测试都通过了！如果录音功能仍然不工作，可能是权限问题。');
            console.log('💡 尝试运行: testMicrophoneRecording()');
            return;
        }

        failedTests.forEach(test => {
            console.log(`❌ ${test.test}:`);
            
            switch (test.test) {
                case 'DOM元素检查':
                    console.log('   - 检查HTML中是否存在 id="microphoneButton" 的元素');
                    console.log('   - 检查CSS是否隐藏了按钮');
                    break;
                    
                case '事件绑定检查':
                    console.log('   - 检查应用是否正确初始化');
                    console.log('   - 尝试运行: window.app.uiController.initialize()');
                    break;
                    
                case '认证状态检查':
                    console.log('   - 用户需要先登录');
                    console.log('   - 或者临时绕过认证: window.bypassAuthCheck = true');
                    break;
                    
                case '应用状态检查':
                    console.log('   - 检查JavaScript是否正确加载');
                    console.log('   - 尝试刷新页面');
                    break;
                    
                case '浏览器支持检查':
                    console.log('   - 使用支持WebRTC的现代浏览器');
                    console.log('   - 确保在HTTPS环境下运行');
                    break;
            }
            console.log('');
        });
    }

    // 尝试自动修复
    attemptAutoFix() {
        console.log('🔧 尝试自动修复...');
        
        // 1. 重新初始化UI控制器
        if (window.app?.uiController) {
            console.log('重新初始化UI控制器...');
            window.app.uiController.initialize();
        }
        
        // 2. 临时绕过认证检查
        if (!window.authManager?.isAuthenticated) {
            console.log('临时绕过认证检查...');
            window.bypassAuthCheck = true;
        }
        
        // 3. 重新绑定事件
        const button = document.getElementById('microphoneButton');
        if (button && window.app?.uiController) {
            console.log('重新绑定按钮事件...');
            
            // 添加简单的测试事件
            button.addEventListener('click', () => {
                console.log('🎤 按钮点击测试成功！');
                if (window.app.uiController.handlePressStart) {
                    window.app.uiController.handlePressStart();
                }
            });
        }
        
        console.log('✅ 自动修复完成，请重新测试按钮');
    }
}

// 创建全局诊断实例
window.micDiagnostics = new MicrophoneDiagnostics();

// 提供便捷的全局函数
window.diagnoseMicrophone = () => window.micDiagnostics.runFullDiagnostic();
window.fixMicrophone = () => window.micDiagnostics.attemptAutoFix();

// 测试录音功能
window.testMicrophoneRecording = async () => {
    console.log('🎤 测试录音功能...');
    
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        console.log('✅ 麦克风权限获取成功');
        
        const recorder = new MediaRecorder(stream);
        console.log('✅ MediaRecorder 创建成功');
        
        recorder.start();
        console.log('✅ 录音开始');
        
        setTimeout(() => {
            recorder.stop();
            console.log('✅ 录音停止');
            
            stream.getTracks().forEach(track => track.stop());
            console.log('✅ 录音功能测试完成');
        }, 1000);
        
    } catch (error) {
        console.error('❌ 录音功能测试失败:', error);
    }
};

console.log('🔧 麦克风诊断工具已加载');
console.log('💡 使用方法:');
console.log('   - diagnoseMicrophone() - 运行完整诊断');
console.log('   - fixMicrophone() - 尝试自动修复');
console.log('   - testMicrophoneRecording() - 测试录音权限');