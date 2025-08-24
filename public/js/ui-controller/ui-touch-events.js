/**
 * UI 触摸事件处理模块
 * 处理触摸事件、按下、滑动等交互
 */

// 设置触摸事件
function setupTouchEvents(uiController) {
    const elements = uiController.elements;

    if (!elements.microphoneButton) {
        console.error('麦克风按钮未找到，无法设置触摸事件');
        return;
    }

    // 触摸开始事件
    elements.microphoneButton.addEventListener('touchstart', (e) => {
        e.preventDefault();
        handleTouchStart(uiController, e);
    }, { passive: false });

    // 触摸移动事件
    elements.microphoneButton.addEventListener('touchmove', (e) => {
        e.preventDefault();
        handleTouchMove(uiController, e);
    }, { passive: false });

    // 触摸结束事件
    elements.microphoneButton.addEventListener('touchend', (e) => {
        e.preventDefault();
        handleTouchEnd(uiController, e);
    }, { passive: false });

    // 鼠标事件支持（用于桌面测试）
    elements.microphoneButton.addEventListener('mousedown', (e) => {
        e.preventDefault();
        handleMouseDown(uiController, e);
    });

    elements.microphoneButton.addEventListener('mouseup', (e) => {
        e.preventDefault();
        handleMouseUp(uiController, e);
    });

    console.log('触摸事件设置完成');
}

// 处理触摸开始
function handleTouchStart(uiController, e) {
    const touches = e.touches;
    if (touches.length > 0) {
        uiController.startTouchY = touches[0].clientY;
        uiController.currentTouchY = touches[0].clientY;

        // 检查认证状态
        if (window.checkAuthenticationStatus) {
            if (!window.checkAuthenticationStatus(uiController.elements)) {
                return; // 如果未登录，不继续录音流程
            }
        }

        // 开始录音（统一延时320ms）_7ree
        if (uiController.handlePressStart) {
            if (typeof window.pressStartDelayMs_7ree === 'undefined') {
                window.pressStartDelayMs_7ree = 320;
            }
            if (typeof window.delayStartModeEnabled_7ree === 'undefined') {
                window.delayStartModeEnabled_7ree = true;
            }
            if (typeof window.pressStartTimerId_7ree === 'undefined') {
                window.pressStartTimerId_7ree = null;
            }

            if (window.delayStartModeEnabled_7ree) {
                if (window.pressStartTimerId_7ree) {
                    clearTimeout(window.pressStartTimerId_7ree);
                    window.pressStartTimerId_7ree = null;
                }
                window.pressStartTimerId_7ree = setTimeout(() => {
                    if (!uiController.isRecording) {
                        uiController.handlePressStart();
                    }
                    window.pressStartTimerId_7ree = null;
                }, window.pressStartDelayMs_7ree || 320);
            } else {
                uiController.handlePressStart();
            }
        }
    }
}

// 处理触摸移动
function handleTouchMove(uiController, e) {
    if (!uiController.isRecording) return;

    const touches = e.touches;
    if (touches.length > 0) {
        uiController.currentTouchY = touches[0].clientY;
        const deltaY = uiController.startTouchY - uiController.currentTouchY;

        // 检查是否达到取消阈值
        if (deltaY > uiController.cancelThreshold && !uiController.isCanceling) {
            uiController.isCanceling = true;
            if (window.showCancelState) {
                window.showCancelState(uiController.elements);
            }
        } else if (deltaY <= uiController.cancelThreshold && uiController.isCanceling) {
            uiController.isCanceling = false;
            if (window.hideCancelState) {
                window.hideCancelState(uiController.elements);
            }
        }
    }
}

// 处理触摸结束
function handleTouchEnd(uiController, e) {
    if (uiController.isCanceling) {
        // 取消录音
        if (uiController.handleCancel) {
            uiController.handleCancel();
        }
    } else {
        // 结束录音
        if (uiController.handlePressEnd) {
            uiController.handlePressEnd();
        }
    }

    // 重置状态
    uiController.startTouchY = null;
    uiController.currentTouchY = null;
    uiController.isCanceling = false;
}

// 处理鼠标按下（桌面支持）
function handleMouseDown(uiController, e) {
    uiController.startTouchY = e.clientY;
    uiController.currentTouchY = e.clientY;

    // 检查认证状态
    if (window.checkAuthenticationStatus) {
        if (!window.checkAuthenticationStatus(uiController.elements)) {
            return;
        }
    }

    // 开始录音（统一延时320ms）_7ree
    if (uiController.handlePressStart) {
        if (typeof window.pressStartDelayMs_7ree === 'undefined') {
            window.pressStartDelayMs_7ree = 320;
        }
        if (typeof window.delayStartModeEnabled_7ree === 'undefined') {
            window.delayStartModeEnabled_7ree = true;
        }
        if (typeof window.pressStartTimerId_7ree === 'undefined') {
            window.pressStartTimerId_7ree = null;
        }

        if (window.delayStartModeEnabled_7ree) {
            if (window.pressStartTimerId_7ree) {
                clearTimeout(window.pressStartTimerId_7ree);
                window.pressStartTimerId_7ree = null;
            }
            window.pressStartTimerId_7ree = setTimeout(() => {
                if (!uiController.isRecording) {
                    uiController.handlePressStart();
                }
                window.pressStartTimerId_7ree = null;
            }, window.pressStartDelayMs_7ree || 320);
        } else {
            uiController.handlePressStart();
        }
    }
}

// 处理鼠标松开（桌面支持）
function handleMouseUp(uiController, e) {
    uiController.currentTouchY = e.clientY;
    const deltaY = uiController.startTouchY - uiController.currentTouchY;

    if (deltaY > uiController.cancelThreshold) {
        // 取消录音
        if (uiController.handleCancel) {
            uiController.handleCancel();
        }
    } else {
        // 结束录音
        if (uiController.handlePressEnd) {
            uiController.handlePressEnd();
        }
    }

    // 重置状态
    uiController.startTouchY = null;
    uiController.currentTouchY = null;
    uiController.isCanceling = false;
}

// 导出函数到全局作用域
window.setupTouchEvents = setupTouchEvents;
window.handleTouchStart = handleTouchStart;
window.handleTouchMove = handleTouchMove;
window.handleTouchEnd = handleTouchEnd;
window.handleMouseDown = handleMouseDown;
window.handleMouseUp = handleMouseUp;