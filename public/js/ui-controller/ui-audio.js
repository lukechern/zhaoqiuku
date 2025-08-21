/**
 * UI 音频管理模块
 * 处理音频播放、TTS等功能
 */

// 停止当前播放
function stopCurrentPlaying() {
    try {
        // 移除playing样式
        if (window.currentPlayingElement_7ree) {
            window.currentPlayingElement_7ree.classList.remove('playing');
        }
        // 停止用户气泡的本地音频
        if (window.currentPlayingAudio_7ree) {
            try { window.currentPlayingAudio_7ree.pause(); } catch (_) {}
            try { window.currentPlayingAudio_7ree.currentTime = 0; } catch (_) {}
            window.currentPlayingAudio_7ree = null;
        }
        // 停止TTS播放
        if (window.ttsService && window.ttsService.isPlaying) {
            try { window.ttsService.stop(); } catch (_) {}
        }
    } finally {
        window.currentPlayingElement_7ree = null;
    }
}

// 自动朗读API响应内容
async function autoReadResponse(data) {
    try {
        // 检查TTS服务是否可用
        if (window.ttsService && window.ttsService.isAvailable()) {
            // 提取需要朗读的消息内容
            let message = '';

            // 根据数据结构提取消息
            if (typeof data === 'string') {
                message = data;
            } else if (data.business_result && data.business_result.message) {
                message = data.business_result.message;
            } else if (data.message) {
                message = data.message;
            }

            // 如果有消息内容，调用TTS服务朗读
            if (message) {
                await window.ttsService.speak(message);
            } else {
                console.log('没有可朗读的消息内容');
            }
        } else {
            console.log('TTS服务不可用或未配置');
        }
    } catch (error) {
        console.error('自动朗读失败:', error);
    }
}

// 格式化AI消息，允许<br>标签换行
function formatAiMessage(message) {
    if (!message) return '';

    // 先转义所有HTML标签，然后将<br>标签还原
    const escapedMessage = window.escapeHtml ? window.escapeHtml(message) : message;
    return escapedMessage.replace(/<br>/g, '<br>');
}

// 导出函数到全局作用域
window.stopCurrentPlaying = stopCurrentPlaying;
window.autoReadResponse = autoReadResponse;
window.formatAiMessage = formatAiMessage;

// 全局音频状态追踪变量
window.currentPlayingElement_7ree = null;
window.currentPlayingAudio_7ree = null;