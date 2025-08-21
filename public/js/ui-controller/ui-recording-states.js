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

    // 在 results-json 区域显示"请告诉AI，您是想记录物品的存放位置，或者查找物品…"和计时器（不显示动画效果）
    if (elements.resultsContainer) {
        elements.resultsContainer.innerHTML = `
            <div class="results-json">
                <div class="listening-status">请您告诉我:<br>是想记录物品位置,<br>还是查找物品…</div>

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
    if (elements.resultsContainer) {
        elements.resultsContainer.innerHTML = '';
    }

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
    }

    // 只有在非录音状态下，且结果容器为空时，才显示placeholder
    // 避免在录音过程中被错误地还原为placeholder
    if (!isRecording && elements.resultsContainer && elements.resultsContainer.innerHTML.trim() === '') {
        elements.resultsContainer.innerHTML = '<div class="placeholder">存放物品还是查找物品？<br>轻触麦克风问问AI助手</div>';
    }
}

// 导出函数到全局作用域
window.showRecordingState = showRecordingState;
window.hideRecordingState = hideRecordingState;
window.showCancelState = showCancelState;
window.hideCancelState = hideCancelState;
window.showProcessingState = showProcessingState;
window.hideProcessingState = hideProcessingState;