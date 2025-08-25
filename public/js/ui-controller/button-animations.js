/**
 * 按钮点击反馈动画工具
 * 为按钮添加生动的0.3s反馈动画效果
 */

class ButtonAnimations {
    /**
     * 为按钮触发点击反馈动画
     * @param {HTMLElement} button - 按钮元素
     * @param {string} type - 动画类型 ('default', 'cancel', 'confirm')
     * @param {number} duration - 动画时长，默认300ms
     */
    static triggerClickFeedback(button, type = 'default', duration = 300) {
        if (!button) {
            console.warn('ButtonAnimations: 按钮元素不存在');
            return;
        }
        
        // 移除之前的动画类（如果有）
        button.classList.remove('click-feedback');
        
        // 强制重新渲染，然后添加动画类
        requestAnimationFrame(() => {
            button.classList.add('click-feedback');
            
            // 指定时长后移除动画类
            setTimeout(() => {
                button.classList.remove('click-feedback');
            }, duration);
        });
        
        console.log(`按钮点击反馈动画已触发: ${type}, 时长: ${duration}ms`);
    }

    /**
     * 为麦克风按钮触发点击反馈动画
     * @param {HTMLElement} button - 麦克风按钮元素
     */
    static triggerMicrophoneFeedback(button) {
        this.triggerClickFeedback(button, 'microphone', 300);
    }

    /**
     * 为取消按钮触发点击反馈动画
     * @param {HTMLElement} button - 取消按钮元素
     */
    static triggerCancelFeedback(button) {
        this.triggerClickFeedback(button, 'cancel', 300);
    }

    /**
     * 为确认按钮触发点击反馈动画
     * @param {HTMLElement} button - 确认按钮元素
     */
    static triggerConfirmFeedback(button) {
        this.triggerClickFeedback(button, 'confirm', 300);
    }

    /**
     * 批量为按钮添加点击反馈动画事件监听器
     * @param {Array} buttons - 按钮配置数组，格式：[{element, type}]
     */
    static setupMultipleButtons(buttons) {
        buttons.forEach(({ element, type = 'default' }) => {
            if (!element) return;
            
            element.addEventListener('click', () => {
                this.triggerClickFeedback(element, type, 300);
            });
        });
    }
}

// 将ButtonAnimations暴露到全局作用域，方便调试和使用
window.ButtonAnimations = ButtonAnimations;

// 为了向后兼容，提供简化的全局函数
window.triggerButtonAnimation = (button, type = 'default') => {
    ButtonAnimations.triggerClickFeedback(button, type, 300);
};

console.log('按钮动画工具已加载');