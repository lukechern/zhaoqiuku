/*
 * ========================================
 * 🐛 前端调试配置文件
 * ========================================
 * 快速配置调试级别，无需深入代码
 */

// ==========================================
// 🔧 当前调试级别配置 - 修改这里来切换模式
// ==========================================
// 可选值说明:
// 'normal'     - 正常模式：只显示语音识别文本
// 'debug'      - 调试模式：显示文本 + API响应JSON
// 'full_debug' - 完整调试：显示所有请求和响应详情
// ==========================================
const CURRENT_DEBUG_LEVEL = 'normal';

const DEBUG_LEVELS = {
    NORMAL: 'normal',           // 正常模式
    DEBUG: 'debug',             // 关键调试信息
    FULL_DEBUG: 'full_debug'    // 完整调试信息
};

const DEBUG_CONFIG = {
    // 使用顶部定义的调试级别
    currentLevel: CURRENT_DEBUG_LEVEL,
    
    // 各级别的配置
    levels: {
        [DEBUG_LEVELS.NORMAL]: {
            name: '正常模式',
            description: '只显示语音识别的文本结果',
            showTranscript: true,
            showApiResponse: false,
            showRequestInfo: false,
            showRawData: false,
            showDebugInfo: false
        },
        
        [DEBUG_LEVELS.DEBUG]: {
            name: '调试模式',
            description: '显示语音文本和API返回的JSON内容',
            showTranscript: true,
            showApiResponse: true,
            showRequestInfo: false,
            showRawData: false,
            showDebugInfo: true
        },
        
        [DEBUG_LEVELS.FULL_DEBUG]: {
            name: '完整调试',
            description: '显示所有请求和响应的完整信息',
            showTranscript: true,
            showApiResponse: true,
            showRequestInfo: true,
            showRawData: true,
            showDebugInfo: true
        }
    }
};

// 调试配置管理类
class DebugConfigManager {
    constructor() {
        this.config = DEBUG_CONFIG;
        // 页面加载完成后显示调试信息
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.updateDebugInfoDisplay());
        } else {
            this.updateDebugInfoDisplay();
        }
    }
    
    // 获取当前调试配置
    getCurrentConfig() {
        return this.config.levels[this.config.currentLevel];
    }
    
    // 设置调试级别
    setLevel(level) {
        if (this.config.levels[level]) {
            this.config.currentLevel = level;
            console.log(`调试级别已设置为: ${this.config.levels[level].name}`);
            
            // 触发事件通知UI更新
            window.dispatchEvent(new CustomEvent('debugLevelChanged', {
                detail: { level, config: this.config.levels[level] }
            }));
            
            // 更新调试信息显示
            this.updateDebugInfoDisplay();
            
            return true;
        }
        console.error(`无效的调试级别: ${level}`);
        return false;
    }
    
    // 检查是否应该显示某种信息
    shouldShow(infoType) {
        const config = this.getCurrentConfig();
        return config[infoType] || false;
    }
    
    // 获取所有可用的调试级别
    getAvailableLevels() {
        return Object.keys(this.config.levels).map(key => ({
            key,
            name: this.config.levels[key].name,
            description: this.config.levels[key].description
        }));
    }
    
    // 获取当前级别名称
    getCurrentLevelName() {
        return this.getCurrentConfig().name;
    }
    
    // 更新调试信息显示
    updateDebugInfoDisplay() {
        // 等待DOM加载完成
        const update = () => {
            const debugInfoElement = document.getElementById('debugInfo');
            if (debugInfoElement) {
                const currentLevel = this.config.currentLevel;
                const currentConfig = this.getCurrentConfig();
                
                // 只有在非正常模式下才显示调试信息
                if (currentLevel !== DEBUG_LEVELS.NORMAL) {
                    debugInfoElement.textContent = `调试级别: ${currentConfig.name}`;
                    debugInfoElement.classList.remove('hidden');
                } else {
                    debugInfoElement.classList.add('hidden');
                }
            }
        };
        
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', update);
        } else {
            update();
        }
    }
}

// 全局调试配置实例
window.debugConfig = new DebugConfigManager();

// 在控制台提供快捷方法
window.setDebugLevel = (level) => window.debugConfig.setLevel(level);
window.showDebugLevels = () => {
    console.table(window.debugConfig.getAvailableLevels());
};

// 初始化时显示当前调试级别
console.log(`🔧 当前调试级别: ${window.debugConfig.getCurrentLevelName()}`);
console.log('');
console.log('📋 调试级别控制方法:');
console.log('1. 永久设置: 修改 config/debugConfig.js 中的 CURRENT_DEBUG_LEVEL');
console.log('2. 临时设置: 使用以下控制台命令');
console.log('   - setDebugLevel("normal") - 设置为正常模式');
console.log('   - setDebugLevel("debug") - 设置为调试模式');  
console.log('   - setDebugLevel("full_debug") - 设置为完整调试');
console.log('   - showDebugLevels() - 显示所有调试级别');
console.log('');
console.log('💡 提示: 前台调试控制已禁用，只能通过上述方式设置调试级别');