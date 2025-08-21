/**
 * UI 控制器模块入口文件
 * 导入所有UI相关的模块
 */

// 导入模块（按依赖顺序）
import './ui-utils.js';        // 工具函数（最先加载）
import './ui-elements.js';     // 元素管理
import './ui-auth.js';         // 认证处理
import './ui-touch-events.js'; // 触摸事件
import './ui-recording-states.js'; // 录音状态
import './ui-audio.js';        // 音频管理
import './ui-results.js';      // 结果显示

console.log('UI控制器模块加载完成');

// 可以在这里添加模块间的初始化逻辑
// 比如设置默认的错误处理等