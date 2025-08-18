/**
 * 跑马灯效果管理模块
 * 用于在对话气泡播放语音时添加光点围绕边框跑动的动画效果
 */
export class RunnerEffect_7ree {
    constructor() {
        this.activeRunners = new Map(); // 存储活跃的跑马灯元素
    }

    /**
     * 为元素添加跑马灯效果
     * @param {HTMLElement} element - 目标元素
     */
    addRunner(element) {
        // 如果已经有跑马灯效果，先移除
        if (this.activeRunners.has(element)) {
            this.removeRunner(element);
        }

        // 创建SVG元素
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.classList.add('runner');
        svg.setAttribute('viewBox', '0 0 100 100');
        svg.setAttribute('preserveAspectRatio', 'none');

        // 创建矩形路径
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.classList.add('runner__track');
        rect.setAttribute('x', '2.5');
        rect.setAttribute('y', '2.5');
        rect.setAttribute('width', '95');
        rect.setAttribute('height', '95');
        rect.setAttribute('rx', '12');
        rect.setAttribute('ry', '12');
        rect.setAttribute('pathLength', '100');

        // 将矩形添加到SVG
        svg.appendChild(rect);

        // 将SVG添加到目标元素
        element.appendChild(svg);

        // 存储引用
        this.activeRunners.set(element, svg);

        console.log('跑马灯效果已添加到元素:', element.className);
    }

    /**
     * 移除元素的跑马灯效果
     * @param {HTMLElement} element - 目标元素
     */
    removeRunner(element) {
        const svg = this.activeRunners.get(element);
        if (svg && svg.parentNode) {
            svg.parentNode.removeChild(svg);
            this.activeRunners.delete(element);
            console.log('跑马灯效果已移除:', element.className);
        }
    }

    /**
     * 检查元素是否有跑马灯效果
     * @param {HTMLElement} element - 目标元素
     * @returns {boolean}
     */
    hasRunner(element) {
        return this.activeRunners.has(element);
    }

    /**
     * 清除所有跑马灯效果
     */
    clearAllRunners() {
        this.activeRunners.forEach((svg, element) => {
            if (svg && svg.parentNode) {
                svg.parentNode.removeChild(svg);
            }
        });
        this.activeRunners.clear();
        console.log('所有跑马灯效果已清除');
    }

    /**
     * 获取活跃的跑马灯数量
     * @returns {number}
     */
    getActiveCount() {
        return this.activeRunners.size;
    }
}

// 创建全局实例
window.runnerEffect_7ree = new RunnerEffect_7ree();