/**
 * UI 录音状态管理模块
 * 处理录音状态的显示和切换
 */

// 显示录音状态
function showRecordingState(elements) {
    // 隐藏麦克风按钮
    if (elements.microphoneButton) {
        elements.microphoneButton.style.display = 'none';
    }
    // 水波动效上移到计时器位置
    if (elements.soundWaves) {
        elements.soundWaves.classList.add('active', 'recording', 'moved-to-timer_7ree');
    }
    // 录音期间改用左右双按钮，不再显示"上滑取消"
    if (elements.cancelIndicator) {
        elements.cancelIndicator.classList.remove('active', 'canceling');
    }
    if (elements.timer) {
        elements.timer.classList.add('recording');
    }

    // 在 results-json 区域显示"请告诉AI，您是想记录物品的存放位置，或者查找物品…"、音量可视化和计时器
    if (elements.resultsContainer) {
        elements.resultsContainer.innerHTML = `
            <div class="results-json">
                <div class="listening-status">请您告诉我:<br>是想记录物品位置,<br>还是查找物品…</div>

                <!-- 音量可视化组件 -->
                <div class="volume-visualizer" id="volumeVisualizer" style="display: flex;">
                    <div class="volume-bars">
                        <div class="volume-bar"></div>
                        <div class="volume-bar"></div>
                        <div class="volume-bar"></div>
                        <div class="volume-bar"></div>
                        <div class="volume-bar"></div>
                        <div class="volume-bar"></div>
                        <div class="volume-bar"></div>
                        <div class="volume-bar"></div>
                        <div class="volume-bar"></div>
                        <div class="volume-bar"></div>
                    </div>
                </div>

                <div class="timer-display">您还可以说20秒</div>
            </div>
        `;
    }

    // 启动计时器
    if (window.startTimer) {
        window.startTimer();
    }

    // 新增：显示左右双按钮
    if (window.showDualButtons_7ree) {
        window.showDualButtons_7ree();
    }
}

// 隐藏录音状态
function hideRecordingState(elements, isRecording) {
    // 恢复麦克风按钮显示
    if (elements.microphoneButton) {
        elements.microphoneButton.style.display = '';
        elements.microphoneButton.classList.remove('recording');
    }
    // 移除水波动效（现在整合在loading-dots中，通过清空resultsContainer来处理）
    if (elements.cancelIndicator) {
        elements.cancelIndicator.classList.remove('active', 'canceling');
    }
    if (elements.timer) {
        elements.timer.classList.remove('recording');
    }

    // 清除 results-json 区域的内容，但不立即显示placeholder
    // 这样可以让后续的showLoading正常显示
    // 注：为避免结果气泡被清空，已不在此处清空 resultsContainer_7ree
    // if (elements.resultsContainer) {
    //     elements.resultsContainer.innerHTML = '';
    // }

    if (window.stopTimer) {
        window.stopTimer();
    }

    // 新增：隐藏左右双按钮
    if (window.hideDualButtons_7ree) {
        window.hideDualButtons_7ree();
    }
}

// 显示取消状态
function showCancelState(elements) {
    if (elements.cancelIndicator) {
        elements.cancelIndicator.classList.add('canceling');
    }
    // 通过resultsContainer更新取消状态文本
    if (elements.resultsContainer) {
        const statusElement = elements.resultsContainer.querySelector('.listening-status');
        if (statusElement) {
            statusElement.textContent = '松手取消录音';
        }
    }
    // 震动提示
    if (window.vibrate) {
        window.vibrate([30, 30, 30]);
    }
}

// 隐藏取消状态
function hideCancelState(elements) {
    if (elements.cancelIndicator) {
        elements.cancelIndicator.classList.remove('canceling');
    }
    // 通过resultsContainer恢复状态文本
    if (elements.resultsContainer) {
        const statusElement = elements.resultsContainer.querySelector('.listening-status');
        if (statusElement) {
            statusElement.textContent = '请告诉AI，您是想记录物品的存放位置，或者查找物品…';
        }
    }
}

// 显示处理状态（加载状态）
function showProcessingState(elements) {
    console.log('显示处理状态（加载状态）');
    if (elements.microphoneButton) {
        // 保存原始内容
        if (!elements.microphoneButton.dataset.originalContent) {
            elements.microphoneButton.dataset.originalContent = elements.microphoneButton.innerHTML;
        }

        // 替换为加载动画，包含水波纹效果
        elements.microphoneButton.innerHTML = `
            <div class="loading-dots">
                <div class="loading-dot"></div>
                <div class="loading-dot"></div>
                <div class="loading-dot"></div>
                <div class="sound-waves_7ree active recording" id="soundWaves_7ree">
                    <div class="wave_7ree"></div>
                    <div class="wave_7ree"></div>
                    <div class="wave_7ree"></div>
                    <div class="wave_7ree"></div>
                    <div class="wave_7ree"></div>
                </div>
            </div>
        `;

        // 添加加载状态样式
        elements.microphoneButton.classList.add('loading');

        // 禁用按钮
        elements.microphoneButton.disabled = true;
    }
}

// 隐藏处理状态（还原为空闲状态）
function hideProcessingState(elements, isRecording) {
    console.log('隐藏处理状态（还原为空闲状态）');
    if (elements.microphoneButton) {
        // 移除加载状态样式
        elements.microphoneButton.classList.remove('loading');

        // 启用按钮
        elements.microphoneButton.disabled = false;

        // 恢复原始内容
        if (elements.microphoneButton.dataset.originalContent) {
            elements.microphoneButton.innerHTML = elements.microphoneButton.dataset.originalContent;
        } else {
            // 如果没有保存原始内容，使用默认内容
            elements.microphoneButton.innerHTML = `
                <img src="img/microphone.svg" alt="麦克风图标" class="microphone-icon">
            `;
        }
        
        // 重要：在恢复按钮内容后重新绑定事件监听器
        setTimeout(() => {
            rebindMicrophoneButtonEvents(elements.microphoneButton);
        }, 50); // 稍微延迟确保DOM更新完成
    }

    // 只有在非录音状态下，且结果容器为空时，才显示placeholder
    // 避免在录音过程中被错误地还原为placeholder
    if (!isRecording && elements.resultsContainer && elements.resultsContainer.innerHTML.trim() === '') {
        elements.resultsContainer.innerHTML = '<div class="placeholder">存放物品还是查找物品？<br>轻触麦克风问问AI助手…</div>';
    }
}

// 新增：重新绑定麦克风按钮事件的函数
function rebindMicrophoneButtonEvents(button) {
    if (!button) {
        console.warn('麦克风按钮元素不存在，无法重新绑定事件');
        return;
    }
    
    console.log('重新绑定麦克风按钮事件');
    
    // 移除旧的事件监听器（通过克隆方式）
    const newButton = button.cloneNode(true);
    button.parentNode.replaceChild(newButton, button);
    
    // 重新绑定点击事件，包含动画效果
    newButton.addEventListener('click', (e) => {
        console.log('麦克风按钮被点击（重新绑定后）');
        e.preventDefault();
        e.stopPropagation();
        
        // 添加点击反馈动画
        if (window.ButtonAnimations) {
            window.ButtonAnimations.triggerMicrophoneFeedback(newButton);
        } else if (window.app && window.app.uiController && window.app.uiController.touchHandler) {
            window.app.uiController.touchHandler.triggerClickFeedback(newButton);
        }
        
        // 获取UIController实例并触发录音
        if (window.app && window.app.uiController) {
            if (window.app.uiController.isRecording) {
                // 正在录音，点击麦克风不结束，需使用左右按钮明确操作
                return;
            }
            window.app.uiController.handlePressStart();
        }
    });
    
    // 重新绑定基本保护事件
    newButton.addEventListener('contextmenu', (e) => { e.preventDefault(); e.stopPropagation(); return false; });
    newButton.addEventListener('selectstart', (e) => { e.preventDefault(); e.stopPropagation(); return false; });
    newButton.addEventListener('dragstart', (e) => { e.preventDefault(); e.stopPropagation(); return false; });
    
    // WebView保护
    if (window.webViewCompat_7ree) {
        window.webViewCompat_7ree.setupElementProtection(newButton, {
            preventContextMenu: true,
            preventSelection: true,
            preventDrag: true,
            longPressDelay: 300
        });
    }
    
    // 更新elements中的引用
    if (window.app && window.app.uiController && window.app.uiController.elements) {
        window.app.uiController.elements.microphoneButton = newButton;
    }
}

// 导出函数到全局作用域
window.showRecordingState = showRecordingState;
window.hideRecordingState = hideRecordingState;
window.showCancelState = showCancelState;
window.hideCancelState = hideCancelState;
window.showProcessingState = showProcessingState;
window.hideProcessingState = hideProcessingState;
window.rebindMicrophoneButtonEvents = rebindMicrophoneButtonEvents;