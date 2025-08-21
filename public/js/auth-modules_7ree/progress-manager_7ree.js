/*
 * ========================================
 * 📊 进度条管理器模块
 * ========================================
 * 处理进度条相关的所有功能
 */

class ProgressManager_7ree {
    constructor() {
        // 进度条相关DOM元素
        this.progressBar_7ree = null;
        this.progressSteps_7ree = null;
        
        // 步骤配置
        this.stepConfig_7ree = {
            invitation: { progress: 33, step: 1 },
            email: { progress: 33, step: 1 },
            verify: { progress: 66, step: 2 },
            success: { progress: 100, step: 3 }
        };
    }

    // 初始化进度条相关DOM元素
    initializeElements() {
        this.progressBar_7ree = document.getElementById('progressBar_7ree');
        this.progressSteps_7ree = document.querySelectorAll('.progress-step_7ree');
    }

    // 更新进度条（_7ree）
    updateProgressBar_7ree(currentStep) {
        if (!this.progressBar_7ree || !this.stepConfig_7ree[currentStep]) {
            return;
        }

        const config = this.stepConfig_7ree[currentStep];
        const currentStepNumber = config.step;

        // 更新步骤状态（容器类 + 图标显隐）
        this.progressSteps_7ree.forEach((stepEl, index) => {
            const stepNumber = index + 1;
            const isCompleted = (stepNumber < currentStepNumber)
                || (currentStep === 'verify' && stepNumber === currentStepNumber)
                || (currentStep === 'success');
            const isActive = stepNumber === currentStepNumber && currentStep !== 'success';

            // 1) 容器类
            if (isCompleted) {
                stepEl.classList.add('completed_7ree');
                stepEl.classList.remove('active_7ree');
            } else if (isActive) {
                stepEl.classList.add('active_7ree');
                stepEl.classList.remove('completed_7ree');
            } else {
                stepEl.classList.remove('active_7ree', 'completed_7ree');
            }

            // 2) 图标显隐
            const incompleteIcon = stepEl.querySelector('.progress-icon_7ree.incomplete_7ree');
            const completeIcon = stepEl.querySelector('.progress-icon_7ree.complete_7ree');
            if (incompleteIcon && completeIcon) {
                if (isCompleted) {
                    // 完成：显示“完成”图标，隐藏“未完成”图标
                    completeIcon.classList.remove('hidden');
                    incompleteIcon.classList.add('hidden');
                } else {
                    // 未完成/当前步骤：显示“未完成”图标，隐藏“完成”图标
                    completeIcon.classList.add('hidden');
                    incompleteIcon.classList.remove('hidden');
                }
            }
        });
    }

    // 标记进度完成（_7ree）
    markProgressComplete_7ree() {
        if (!this.progressBar_7ree) {
            return;
        }

        this.progressSteps_7ree.forEach(stepEl => {
            stepEl.classList.add('completed_7ree');
            stepEl.classList.remove('active_7ree');
            const incompleteIcon = stepEl.querySelector('.progress-icon_7ree.incomplete_7ree');
            const completeIcon = stepEl.querySelector('.progress-icon_7ree.complete_7ree');
            if (incompleteIcon && completeIcon) {
                completeIcon.classList.remove('hidden');
                incompleteIcon.classList.add('hidden');
            }
        });

        this.progressBar_7ree.classList.add('completed_7ree');
        setTimeout(() => {
            this.progressBar_7ree.classList.add('success-animation_7ree');
        }, 300);
    }

    // 重置进度条
    resetProgress_7ree() {
        if (!this.progressBar_7ree) {
            return;
        }

        // 不再重置容器宽度，保持布局稳定（_7ree）
        // this.progressBar_7ree.style.width = '0%';
        this.progressBar_7ree.classList.remove('completed_7ree', 'success-animation_7ree');
        
        // 重置所有步骤
        this.progressSteps_7ree.forEach(step => {
            step.classList.remove('active_7ree', 'completed_7ree');
        });
    }

    // 获取当前进度百分比（已不再使用宽度驱动，保留兼容，固定返回0）（_7ree）
    getCurrentProgress_7ree() {
        return 0;
    }

    // 设置自定义进度（为避免移动端横向拉伸，禁用宽度赋值，方法保留为兼容）（_7ree）
    setCustomProgress_7ree(percent) {
        // no-op: 不再通过 style.width 控制容器宽度
        return;
    }

    // 添加步骤配置
    addStepConfig_7ree(stepName, progress, stepNumber) {
        this.stepConfig_7ree[stepName] = {
            progress: progress,
            step: stepNumber
        };
    }

    // 获取步骤配置
    getStepConfig_7ree(stepName) {
        return this.stepConfig_7ree[stepName] || null;
    }

    // 检查进度条是否完成（已不再用百分比语义，保持兼容返回false）（_7ree）
    isProgressComplete_7ree() {
        return false;
    }

    // 平滑动画更新进度（为避免移动端横向拉伸，禁用宽度动画，方法保留为兼容）（_7ree）
    animateProgress_7ree(targetPercent, duration = 500) {
        // no-op: 不再通过 style.width 做动画
        return;
    }

    // 缓动函数（保留以兼容旧代码引用）
    easeInOutCubic_7ree(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProgressManager_7ree;
} else if (typeof window !== 'undefined') {
    window.ProgressManager_7ree = ProgressManager_7ree;
}