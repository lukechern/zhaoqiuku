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
            email: { progress: 25, step: 1 },
            invitation: { progress: 50, step: 2 },
            verify: { progress: 75, step: 3 },
            success: { progress: 100, step: 4 }
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
        const progressPercent = config.progress;
        const currentStepNumber = config.step;

        // 进度条容器不再用宽度表示进度，改为仅通过步骤状态展示（_7ree）
        // this.progressBar_7ree.style.width = progressPercent + '%';

        // 更新步骤状态
        this.progressSteps_7ree.forEach((step, index) => {
            const stepNumber = index + 1;
            
            if (stepNumber < currentStepNumber) {
                // 已完成的步骤
                step.classList.add('completed_7ree');
                step.classList.remove('active_7ree');
            } else if (stepNumber === currentStepNumber) {
                // 当前步骤
                step.classList.add('active_7ree');
                step.classList.remove('completed_7ree');
            } else {
                // 未开始的步骤
                step.classList.remove('active_7ree', 'completed_7ree');
            }
        });
    }

    // 标记进度完成（_7ree）
    markProgressComplete_7ree() {
        if (!this.progressBar_7ree) {
            return;
        }

        // 不再强制设置容器宽度为100%，避免影响布局（_7ree）
        // this.progressBar_7ree.style.width = '100%';
        
        // 标记所有步骤为已完成
        this.progressSteps_7ree.forEach(step => {
            step.classList.add('completed_7ree');
            step.classList.remove('active_7ree');
        });

        // 添加完成动画效果
        this.progressBar_7ree.classList.add('completed_7ree');
        
        // 可选：添加成功提示动画
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