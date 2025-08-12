/*
 * ========================================
 * 🐛 调试配置文件
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
const CURRENT_DEBUG_LEVEL = 'debug';

export const DEBUG_LEVELS = {
    NORMAL: 'normal',           // 正常模式
    DEBUG: 'debug',             // 关键调试信息
    FULL_DEBUG: 'full_debug'    // 完整调试信息
};

export const DEBUG_CONFIG = {
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

// 获取当前调试配置
export function getCurrentDebugConfig() {
    return DEBUG_CONFIG.levels[DEBUG_CONFIG.currentLevel];
}

// 设置调试级别
export function setDebugLevel(level) {
    if (DEBUG_CONFIG.levels[level]) {
        DEBUG_CONFIG.currentLevel = level;
        console.log(`调试级别已设置为: ${DEBUG_CONFIG.levels[level].name}`);
        return true;
    }
    console.error(`无效的调试级别: ${level}`);
    return false;
}

// 检查是否应该显示某种信息
export function shouldShow(infoType) {
    const config = getCurrentDebugConfig();
    return config[infoType] || false;
}

// 获取所有可用的调试级别
export function getAvailableLevels() {
    return Object.keys(DEBUG_CONFIG.levels).map(key => ({
        key,
        name: DEBUG_CONFIG.levels[key].name,
        description: DEBUG_CONFIG.levels[key].description
    }));
}

// 导出默认配置
export default DEBUG_CONFIG;