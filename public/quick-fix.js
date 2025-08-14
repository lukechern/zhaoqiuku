// 快速修复录音按钮问题
console.log('🚀 加载快速修复脚本...');

// 等待页面完全加载
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        console.log('🔧 开始快速修复...');
        
        const button = document.getElementById('microphoneButton');
        if (!button) {
            console.error('❌ 未找到麦克风按钮');
            return;
        }
        
        console.log('✅ 找到麦克风按钮');
        
        // 移除所有现有的事件监听器（通过克隆节点）
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);
        
        console.log('🔄 已重置按钮事件');
        
        // 添加简单直接的事件监听器
        newButton.addEventListener('mousedown', (e) => {
            console.log('🖱️ 鼠标按下事件触发');
            e.preventDefault();
            startRecordingProcess();
        });
        
        newButton.addEventListener('touchstart', (e) => {
            console.log('👆 触摸开始事件触发');
            e.preventDefault();
            startRecordingProcess();
        }, { passive: false });
        
        newButton.addEventListener('mouseup', (e) => {
            console.log('🖱️ 鼠标释放事件触发');
            stopRecordingProcess();
        });
        
        newButton.addEventListener('touchend', (e) => {
            console.log('👆 触摸结束事件触发');
            e.preventDefault();
            stopRecordingProcess();
        }, { passive: false });
        
        // 添加点击事件作为后备
        newButton.addEventListener('click', (e) => {
            console.log('🖱️ 点击事件触发（后备）');
            e.preventDefault();
            
            // 如果没有正在录音，开始录音
            if (!window.isRecording) {
                startRecordingProcess();
                
                // 2秒后自动停止（用于测试）
                setTimeout(() => {
                    if (window.isRecording) {
                        stopRecordingProcess();
                    }
                }, 2000);
            }
        });
        
        console.log('✅ 新事件监听器已添加');
        
        // 简化的录音开始流程
        function startRecordingProcess() {
            console.log('🎤 开始录音流程...');
            
            // 检查认证状态
            if (!window.authManager?.isAuthenticated && !window.bypassAuthCheck) {
                console.log('❌ 用户未登录');
                alert('请先登录后再使用录音功能');
                return;
            }
            
            console.log('✅ 认证检查通过');
            
            // 设置录音状态
            window.isRecording = true;
            
            // 更新UI
            newButton.classList.add('recording');
            const soundWaves = document.getElementById('soundWaves');
            if (soundWaves) {
                soundWaves.classList.add('active', 'recording');
            }
            
            const indicator = document.getElementById('listeningIndicator');
            if (indicator) {
                indicator.classList.add('active');
            }
            
            // 调用原始的录音开始方法
            if (window.app?.handleRecordingStart) {
                window.app.handleRecordingStart();
            } else if (window.app?.audioRecorder) {
                window.app.audioRecorder.startRecording().catch(error => {
                    console.error('录音开始失败:', error);
                    stopRecordingProcess();
                });
            } else {
                console.log('⚠️ 未找到录音器，使用简单测试');
                testBasicRecording();
            }
            
            console.log('🎤 录音已开始');
        }
        
        // 简化的录音停止流程
        function stopRecordingProcess() {
            console.log('⏹️ 停止录音流程...');
            
            if (!window.isRecording) {
                console.log('⚠️ 当前没有在录音');
                return;
            }
            
            // 重置录音状态
            window.isRecording = false;
            
            // 更新UI
            newButton.classList.remove('recording');
            const soundWaves = document.getElementById('soundWaves');
            if (soundWaves) {
                soundWaves.classList.remove('active', 'recording');
            }
            
            const indicator = document.getElementById('listeningIndicator');
            if (indicator) {
                indicator.classList.remove('active');
            }
            
            // 调用原始的录音停止方法
            if (window.app?.handleRecordingStop) {
                window.app.handleRecordingStop();
            } else if (window.app?.audioRecorder) {
                window.app.audioRecorder.stopRecording();
            }
            
            console.log('⏹️ 录音已停止');
        }
        
        // 基础录音测试
        async function testBasicRecording() {
            try {
                console.log('🧪 开始基础录音测试...');
                
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                console.log('✅ 获取麦克风权限成功');
                
                const recorder = new MediaRecorder(stream);
                const chunks = [];
                
                recorder.ondataavailable = (e) => {
                    chunks.push(e.data);
                };
                
                recorder.onstop = () => {
                    const blob = new Blob(chunks, { type: 'audio/webm' });
                    console.log('✅ 录音完成，大小:', blob.size, 'bytes');
                    
                    // 显示结果
                    const container = document.getElementById('resultsContainer');
                    if (container) {
                        container.innerHTML = `
                            <div style="color: #48bb78; text-align: center;">
                                ✅ 录音测试成功！<br>
                                录音大小: ${(blob.size / 1024).toFixed(2)} KB<br>
                                <small>这证明录音功能正常工作</small>
                            </div>
                        `;
                    }
                    
                    // 清理资源
                    stream.getTracks().forEach(track => track.stop());
                };
                
                recorder.start();
                console.log('🎤 测试录音开始...');
                
                // 监听停止录音
                const checkStop = () => {
                    if (!window.isRecording) {
                        recorder.stop();
                        console.log('⏹️ 测试录音停止');
                    } else {
                        setTimeout(checkStop, 100);
                    }
                };
                checkStop();
                
            } catch (error) {
                console.error('❌ 基础录音测试失败:', error);
                
                const container = document.getElementById('resultsContainer');
                if (container) {
                    container.innerHTML = `
                        <div style="color: #f56565; text-align: center;">
                            ❌ 录音测试失败<br>
                            错误: ${error.message}<br>
                            <small>请检查麦克风权限</small>
                        </div>
                    `;
                }
            }
        }
        
        console.log('✅ 快速修复完成！');
        console.log('💡 现在尝试点击麦克风按钮');
        
    }, 1000); // 延迟1秒确保所有脚本都加载完成
});

// 提供手动触发函数
window.manualTestRecording = () => {
    console.log('🧪 手动触发录音测试...');
    const button = document.getElementById('microphoneButton');
    if (button) {
        button.click();
    } else {
        console.error('❌ 未找到按钮');
    }
};

console.log('🚀 快速修复脚本已加载');
console.log('💡 如果按钮仍然不工作，请在控制台运行: manualTestRecording()');