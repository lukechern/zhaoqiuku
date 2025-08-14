// 简单诊断工具
console.log('🔍 加载简单诊断工具...');

window.quickDiagnose = function() {
    console.log('=== 🔍 快速诊断开始 ===');
    
    // 1. 检查基本元素
    const button = document.getElementById('microphoneButton');
    console.log('1. 麦克风按钮:', button ? '✅ 存在' : '❌ 不存在');
    
    if (button) {
        const rect = button.getBoundingClientRect();
        console.log('   - 位置:', `${rect.left}, ${rect.top}`);
        console.log('   - 大小:', `${rect.width} x ${rect.height}`);
        console.log('   - 可见:', rect.width > 0 && rect.height > 0 ? '✅ 是' : '❌ 否');
        
        const styles = getComputedStyle(button);
        console.log('   - 显示:', styles.display);
        console.log('   - 可见性:', styles.visibility);
        console.log('   - 指针事件:', styles.pointerEvents);
    }
    
    // 2. 检查应用状态
    console.log('2. 应用状态:');
    console.log('   - window.app:', window.app ? '✅ 存在' : '❌ 不存在');
    console.log('   - UI控制器:', window.app?.uiController ? '✅ 存在' : '❌ 不存在');
    console.log('   - 录音器:', window.app?.audioRecorder ? '✅ 存在' : '❌ 不存在');
    
    // 3. 检查认证状态
    console.log('3. 认证状态:');
    console.log('   - 认证管理器:', window.authManager ? '✅ 存在' : '❌ 不存在');
    console.log('   - 已登录:', window.authManager?.isAuthenticated ? '✅ 是' : '❌ 否');
    console.log('   - 用户信息:', window.authManager?.user?.email || '无');
    console.log('   - 绕过认证:', window.bypassAuthCheck ? '✅ 是' : '❌ 否');
    
    // 4. 测试事件响应
    console.log('4. 测试事件响应:');
    if (button) {
        let clickTriggered = false;
        let mousedownTriggered = false;
        
        const clickHandler = () => { clickTriggered = true; };
        const mousedownHandler = () => { mousedownTriggered = true; };
        
        button.addEventListener('click', clickHandler);
        button.addEventListener('mousedown', mousedownHandler);
        
        // 触发事件
        button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        button.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
        
        console.log('   - click事件:', clickTriggered ? '✅ 响应' : '❌ 无响应');
        console.log('   - mousedown事件:', mousedownTriggered ? '✅ 响应' : '❌ 无响应');
        
        // 清理
        button.removeEventListener('click', clickHandler);
        button.removeEventListener('mousedown', mousedownHandler);
    }
    
    // 5. 检查浏览器支持
    console.log('5. 浏览器支持:');
    console.log('   - MediaDevices:', navigator.mediaDevices ? '✅ 支持' : '❌ 不支持');
    console.log('   - getUserMedia:', navigator.mediaDevices?.getUserMedia ? '✅ 支持' : '❌ 不支持');
    console.log('   - MediaRecorder:', window.MediaRecorder ? '✅ 支持' : '❌ 不支持');
    console.log('   - 触摸事件:', 'ontouchstart' in window ? '✅ 支持' : '❌ 不支持');
    
    console.log('=== 🔍 快速诊断完成 ===');
    
    // 提供修复建议
    console.log('\n💡 修复建议:');
    
    if (!button) {
        console.log('❌ 按钮不存在 - 检查HTML结构');
        return;
    }
    
    if (!window.app) {
        console.log('❌ 应用未初始化 - 尝试刷新页面');
        return;
    }
    
    if (!window.authManager?.isAuthenticated && !window.bypassAuthCheck) {
        console.log('❌ 用户未登录 - 请登录或运行: window.bypassAuthCheck = true');
        return;
    }
    
    console.log('✅ 基本检查通过，尝试手动测试录音');
};

// 简单的手动测试函数
window.testButtonClick = function() {
    console.log('🧪 手动测试按钮点击...');
    
    const button = document.getElementById('microphoneButton');
    if (!button) {
        console.error('❌ 未找到按钮');
        return;
    }
    
    // 绕过认证检查
    window.bypassAuthCheck = true;
    
    console.log('🖱️ 模拟鼠标按下...');
    
    // 直接调用处理函数
    if (window.app?.uiController?.handlePressStart) {
        window.app.uiController.handlePressStart();
        
        setTimeout(() => {
            console.log('🖱️ 模拟鼠标释放...');
            if (window.app?.uiController?.handlePressEnd) {
                window.app.uiController.handlePressEnd();
            }
        }, 2000);
    } else {
        console.error('❌ 未找到处理函数');
    }
};

// 测试基础录音功能
window.testBasicRecording = async function() {
    console.log('🎤 测试基础录音功能...');
    
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        console.log('✅ 麦克风权限获取成功');
        
        const recorder = new MediaRecorder(stream);
        const chunks = [];
        
        recorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
                chunks.push(e.data);
            }
        };
        
        recorder.onstop = () => {
            const blob = new Blob(chunks, { type: 'audio/webm' });
            console.log('✅ 录音完成，大小:', blob.size, 'bytes');
            
            // 显示结果
            const container = document.getElementById('resultsContainer');
            if (container) {
                container.innerHTML = `
                    <div style="color: #48bb78; text-align: center; padding: 20px;">
                        <h3>🎤 录音测试成功！</h3>
                        <p>录音大小: ${(blob.size / 1024).toFixed(2)} KB</p>
                        <p>格式: ${blob.type}</p>
                        <small>这证明浏览器录音功能正常</small>
                    </div>
                `;
            }
            
            // 清理资源
            stream.getTracks().forEach(track => track.stop());
        };
        
        recorder.onerror = (e) => {
            console.error('❌ 录音出错:', e);
        };
        
        recorder.start();
        console.log('🎤 开始录音...');
        
        // 3秒后停止
        setTimeout(() => {
            recorder.stop();
            console.log('⏹️ 停止录音');
        }, 3000);
        
    } catch (error) {
        console.error('❌ 录音测试失败:', error);
        
        const container = document.getElementById('resultsContainer');
        if (container) {
            container.innerHTML = `
                <div style="color: #f56565; text-align: center; padding: 20px;">
                    <h3>❌ 录音测试失败</h3>
                    <p>错误: ${error.message}</p>
                    <small>请检查麦克风权限或使用HTTPS</small>
                </div>
            `;
        }
    }
};

console.log('🔍 简单诊断工具已加载');
console.log('💡 使用方法:');
console.log('   quickDiagnose() - 快速诊断');
console.log('   testButtonClick() - 测试按钮点击');
console.log('   testBasicRecording() - 测试基础录音');