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
            // 创建音频上下文
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

            // 创建分析器节点
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 256;
            this.analyser.smoothingTimeConstant = 0.8;

            // 连接音频流到分析器
            const source = this.audioContext.createMediaStreamSource(this.audioStream);
            source.connect(this.analyser);

            // 创建数据数组
            this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);

            // 获取音量条元素
            this.volumeBars = Array.from(this.container.querySelectorAll('.volume-bar'));

            console.log('音量可视化初始化完成');
        } catch (error) {
            console.error('音量可视化初始化失败:', error);
        }
    }

    // 开始音量可视化
    start() {
        if (this.isActive || !this.analyser) return;

        this.isActive = true;
        this.container.style.display = 'flex';
        this.container.classList.add('active');

        // 开始动画循环
        this.animate();

        console.log('音量可视化开始');
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
        if (!this.isActive) return;

        // 获取频域数据
        this.analyser.getByteFrequencyData(this.dataArray);

        // 计算音量级别
        const volume = this.calculateVolume();

        // 更新音量条
        this.updateVolumeBars(volume);

        // 继续动画
        this.animationFrame = requestAnimationFrame(() => this.animate());
    }

    // 计算音量级别 (0-10)
    calculateVolume() {
        let sum = 0;
        const length = this.dataArray.length;

        // 只使用低频部分（人声主要在低频）
        const lowFreqEnd = Math.floor(length * 0.3);

        for (let i = 0; i < lowFreqEnd; i++) {
            sum += this.dataArray[i];
        }

        const average = sum / lowFreqEnd;
        const normalizedVolume = average / 255; // 0-1

        // 转换为1-10级别，降低灵敏度避免过度跳动
        const volumeLevel = Math.min(10, Math.max(1, Math.floor(normalizedVolume * 8) + 1));

        return volumeLevel;
    }

    // 更新音量条显示
    updateVolumeBars(volumeLevel) {
        this.volumeBars.forEach((bar, index) => {
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
}