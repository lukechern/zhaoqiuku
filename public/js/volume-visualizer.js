// 麦克风音量可视化模块
export class VolumeVisualizer {
    constructor(audioStream, container) {
        this.audioStream = audioStream;
        this.container = container;
        this.isActive = false;
        this.animationFrame = null;
        this.audioContext = null;
        this.analyser = null;
        this.dataArray = null;
        this.volumeBars = [];

        this.init();
    }

    // 初始化音量可视化
    init() {
        try {
            // 检查AudioContext支持
            if (!VolumeVisualizer.isSupported()) {
                console.warn('浏览器不支持Web Audio API，音量可视化不可用');
                return;
            }

            // 创建音频上下文
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

            // 创建分析器节点
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 512; // 增加FFT大小提高精度
            this.analyser.smoothingTimeConstant = 0.3; // 降低平滑时间常数提高响应性

            // 连接音频流到分析器
            const source = this.audioContext.createMediaStreamSource(this.audioStream);
            source.connect(this.analyser);

            // 创建数据数组
            this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);

            // 获取音量条元素
            this.volumeBars = Array.from(this.container.querySelectorAll('.volume-bar'));

            if (this.volumeBars.length === 0) {
                console.warn('未找到音量条元素，音量可视化可能无法正常工作');
            }

            console.log('音量可视化初始化完成');
        } catch (error) {
            console.error('音量可视化初始化失败:', error);
            this.volumeBars = [];
        }
    }

    // 开始音量可视化
    start() {
        if (this.isActive || !this.analyser) {
            console.log('音量可视化启动被阻止:', { isActive: this.isActive, hasAnalyser: !!this.analyser });
            return;
        }

        // 重新获取音量条元素引用，确保在DOM重新创建后能正常工作
        this.refreshVolumeBarReferences();

        this.isActive = true;
        this.container.style.display = 'flex';
        this.container.classList.add('active');

        // 强制设置可见样式，避免CSS问题
        this.container.style.opacity = '1';
        this.container.style.transform = 'translateY(0)';
        this.container.style.visibility = 'visible';

        // 详细调试日志
        console.log('音量可视化开始', {
            element: this.container,
            classes: this.container.className,
            style: this.container.style.cssText,
            volumeBarsCount: this.volumeBars.length,
            containerVisible: this.container.offsetWidth > 0 && this.container.offsetHeight > 0,
            computedStyle: {
                display: getComputedStyle(this.container).display,
                opacity: getComputedStyle(this.container).opacity,
                visibility: getComputedStyle(this.container).visibility,
                transform: getComputedStyle(this.container).transform
            }
        });

        // 检查音量条元素状态
        if (this.volumeBars.length > 0) {
            console.log('音量条元素状态:', {
                firstBarVisible: this.volumeBars[0].offsetWidth > 0 && this.volumeBars[0].offsetHeight > 0,
                firstBarStyle: this.volumeBars[0].style.cssText,
                firstBarClasses: this.volumeBars[0].className
            });
        }

        // 开始动画循环
        this.animate();

        console.log('音量可视化启动完成');
    }

    // 停止音量可视化
    stop() {
        if (!this.isActive) return;

        this.isActive = false;
        this.container.classList.remove('active');

        // 延迟隐藏，避免闪烁
        setTimeout(() => {
            if (!this.isActive) {
                this.container.style.display = 'none';
                this.resetBars();
            }
        }, 300);

        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }

        console.log('音量可视化停止');
    }

    // 动画循环
    animate() {
        if (!this.isActive) {
            console.log('动画循环停止：isActive =', this.isActive);
            return;
        }

        // 获取频域数据
        this.analyser.getByteFrequencyData(this.dataArray);

        // 计算音量级别
        const volume = this.calculateVolume();

        // 调试日志（只在前几次输出）
        if (!this.debugCount) this.debugCount = 0;
        if (this.debugCount < 5) {
            console.log('音量数据:', {
                volume: volume,
                dataArraySample: Array.from(this.dataArray.slice(0, 10)),
                volumeBarsCount: this.volumeBars.length,
                isActive: this.isActive
            });
            this.debugCount++;
        }

        // 更新音量条
        this.updateVolumeBars(volume);

        // 继续动画
        this.animationFrame = requestAnimationFrame(() => this.animate());
    }

    // 计算音量级别 (0-10)
    calculateVolume() {
        let sum = 0;
        const length = this.dataArray.length;

        // 使用更宽的频率范围，提高灵敏度
        const lowFreqEnd = Math.floor(length * 0.5); // 增加到50%

        for (let i = 0; i < lowFreqEnd; i++) {
            sum += this.dataArray[i];
        }

        const average = sum / lowFreqEnd;
        const normalizedVolume = average / 255; // 0-1

        // 提高灵敏度，使用对数缩放
        let volumeLevel;
        if (normalizedVolume < 0.01) {
            volumeLevel = 1;
        } else {
            // 使用对数缩放提高小音量的敏感度
            const logVolume = Math.log10(normalizedVolume * 10 + 1) / Math.log10(11);
            volumeLevel = Math.max(1, Math.min(10, Math.floor(logVolume * 12) + 1));
        }

        return volumeLevel;
    }

    // 更新音量条显示
    updateVolumeBars(volumeLevel) {
        if (!this.volumeBars || this.volumeBars.length === 0) return;

        this.volumeBars.forEach((bar, index) => {
            if (!bar) return; // 跳过不存在的元素

            // 创建波浪效果 - 中间柱子更高
            const distanceFromCenter = Math.abs(index - 4.5);
            const waveMultiplier = 1 - (distanceFromCenter / 5) * 0.3;
            const adjustedLevel = Math.min(10, volumeLevel * waveMultiplier);

            // 清除之前的级别类
            for (let i = 1; i <= 10; i++) {
                bar.classList.remove(`level-${i}`);
            }

            // 添加当前级别类
            const barLevel = Math.max(1, Math.min(10, Math.floor(adjustedLevel)));
            bar.classList.add(`level-${barLevel}`);

            // 根据音量添加活跃状态
            if (adjustedLevel > 2) {
                bar.classList.add('active');
            } else {
                bar.classList.remove('active');
            }
        });
    }

    // 重置音量条
    resetBars() {
        this.volumeBars.forEach(bar => {
            // 清除所有级别类
            for (let i = 1; i <= 10; i++) {
                bar.classList.remove(`level-${i}`);
            }
            bar.classList.remove('active');
            bar.classList.add('level-1');
        });
    }

    // 刷新音量条元素引用
    refreshVolumeBarReferences() {
        if (!this.container) {
            console.warn('音量可视化容器不存在');
            return;
        }
        
        // 重新获取音量条元素
        this.volumeBars = Array.from(this.container.querySelectorAll('.volume-bar'));
        
        if (this.volumeBars.length === 0) {
            console.warn('未找到音量条元素，音量可视化可能无法正常工作');
        } else {
            console.log(`成功刷新音量条引用，共${this.volumeBars.length}个元素`);
        }
    }

    // 更新容器引用
    updateContainer(newContainer) {
        if (newContainer && newContainer !== this.container) {
            console.log('更新音量可视化容器');
            this.container = newContainer;
            this.refreshVolumeBarReferences();
        }
    }

    // 清理资源
    destroy() {
        this.stop();

        if (this.audioContext) {
            this.audioContext.close().catch(console.error);
            this.audioContext = null;
        }

        this.analyser = null;
        this.dataArray = null;
        this.volumeBars = [];
    }

    // 检查是否支持
    static isSupported() {
        return !!(window.AudioContext || window.webkitAudioContext);
    }

    // 调试用：强制显示音量可视化
    debugShow() {
        this.container.style.display = 'flex';
        this.container.classList.add('active');
        this.container.style.opacity = '1';
        this.container.style.transform = 'translateY(0)';

        // 模拟一些音量条跳动
        setInterval(() => {
            this.volumeBars.forEach((bar, index) => {
                const level = Math.floor(Math.random() * 10) + 1;
                for (let i = 1; i <= 10; i++) {
                    bar.classList.remove(`level-${i}`);
                }
                bar.classList.add(`level-${level}`);
                if (level > 3) {
                    bar.classList.add('active');
                } else {
                    bar.classList.remove('active');
                }
            });
        }, 100);

        console.log('音量可视化调试显示已启动');
    }
}