/**
 * UI 结果显示模块
 * 处理结果的显示、格式化和流式渲染
 */

// 显示结果 - 使用流式渲染器
async function showResults(data, elements) {
    // 保存最后的结果数据，用于调试级别切换时重新显示
    window.lastResultData = data;

    const container = elements.resultsContainer;

    // 使用流式渲染器渲染结果
    if (typeof data === 'string') {
        // 如果是字符串，使用原始方式显示
        container.innerHTML = `<div class="results-json">${window.escapeHtml ? window.escapeHtml(data) : data}</div>`;
    } else {
        // 使用流式渲染器，自动触发TTS并等待完成（注意：renderResults内部已不再等待TTS）
        if (window.streamRenderer_7ree) {
            await window.streamRenderer_7ree.renderResults(data, container, true);
        } else {
            // 如果流式渲染器不可用，使用简单格式化
            container.innerHTML = `<div class="results-json">${formatSimpleResult(data)}</div>`;
            // 在回退渲染下，给气泡绑定点击播放事件
            try {
                bindFallbackPlayback_7ree(container);
            } catch (e) {
                console.warn('绑定回退播放事件失败:', e);
            }
        }
    }

    // 自动滚动到顶部
    container.scrollTop = 0;

    // 注意：TTS朗读现在在流式渲染器中异步处理，无需在此调用
    // 修改为仅在流式渲染器不可用时才触发回退TTS_7ree
    if (!window.streamRenderer_7ree && window.autoReadResponse) {
        window.autoReadResponse(data);
    }
}

// 清除结果
function clearResults(elements) {
    if (elements.resultsContainer) {
        elements.resultsContainer.innerHTML = '<div class="placeholder">存放物品还是查找物品？<br>轻触麦克风问问AI助手…</div>';
    }
}

// 简单格式化结果（当流式渲染器不可用时）
function formatSimpleResult(data) {
    if (!data) return '';

    let html = '';

    // 如果有业务结果
    if (data.business_result && data.business_result.message) {
        const message = data.business_result.message;
        const success = data.business_result.success;

        // 用户问题
        let userSay = data.transcript;
        if (!userSay || (data.action && data.action === 'unknown')) {
            userSay = '抱歉，没有听清你说了什么';
        }

        const esc = (s) => (window.escapeHtml ? window.escapeHtml(s) : s);

        html += `<div class="user-ai-dialog">
            <span class="user-say playable" data-transcript="${esc(userSay)}">${esc(userSay)}</span>
            <span class="ai-reply playable" data-message="${esc(message)}">${window.formatAiMessage ? window.formatAiMessage(message) : esc(message)}</span>
        </div>`;
    } else if (data.transcript) {
        // 只有转录结果
        const esc = (s) => (window.escapeHtml ? window.escapeHtml(s) : s);
        html += `<div class="simple-result">
            <strong>识别结果:</strong> ${esc(data.transcript)}
        </div>`;
    }

    // 如果没有任何内容，显示JSON作为后备
    if (!html.trim()) {
        html = `<pre>${JSON.stringify(data, null, 2)}</pre>`;
    }

    return html;
}

// 显示加载状态
function showLoading(message = '处理中...', elements) {
    if (elements.resultsContainer) {
        // 所有加载消息都只显示文字，水波纹效果已移动到麦克风按钮区域
        elements.resultsContainer.innerHTML = `<div class="loading">${message}</div>`;
    }
}

// 显示错误
function showError(error, elements) {
    const errorMessage = typeof error === 'string' ? error : error.message || '发生未知错误';

    // 如果正在录音，不覆盖录音状态显示，而是通过console输出错误信息
    if (window.uiController && window.uiController.isRecording) {
        console.error('录音过程中发生错误:', errorMessage);
        return;
    }

    if (elements.resultsContainer) {
        elements.resultsContainer.innerHTML = `
            <div style="color: var(--error); text-align: center;">
                <strong>抱歉:</strong> AI开小差了，请稍后重试。
            </div>
        `;
    }
}

// 显示提示消息
function showMessage(message, type = 'info', elements) {
    const colors = {
        info: 'var(--primary-color)',
        success: 'var(--success)',
        warning: 'var(--warning)',
        error: 'var(--error)'
    };

    // 如果正在录音，不覆盖录音状态显示，而是通过console输出消息
    if (window.uiController && window.uiController.isRecording) {
        console.log(`录音过程中的消息 [${type}]:`, message);
        return;
    }

    if (elements.resultsContainer) {
        elements.resultsContainer.innerHTML = `
            <div style="color: ${colors[type]}; text-align: center;">
                ${window.escapeHtml ? window.escapeHtml(message) : message}
            </div>
        `;
    }
}

// 回退渲染下为用户/AI气泡绑定点击播放事件
function bindFallbackPlayback_7ree(container) {
    if (!container) return;

    const uiController = window.app && window.app.uiController ? window.app.uiController : null;

    const userEl = container.querySelector('.user-ai-dialog .user-say.playable');
    const aiEl = container.querySelector('.user-ai-dialog .ai-reply.playable');

    // 绑定用户录音播放
    if (userEl) {
        userEl.addEventListener('click', (event) => {
            event.stopPropagation();

            const audioUrl = window.app && window.app.audioRecorder ? window.app.audioRecorder.audioUrl : null;
            if (!audioUrl) return;

            // 若存在UIController则统一管理播放状态
            if (uiController) {
                if (uiController.currentPlayingElement_7ree) {
                    if (uiController.currentPlayingElement_7ree === userEl) {
                        uiController.stopCurrentPlaying_7ree();
                        return;
                    }
                    uiController.stopCurrentPlaying_7ree();
                }
                userEl.classList.add('playing');
                uiController.currentPlayingElement_7ree = userEl;

                const audio = new Audio(audioUrl);
                uiController.currentPlayingAudio_7ree = audio;
                audio.play().then(() => {
                    audio.onended = () => {
                        userEl.classList.remove('playing');
                        if (uiController.currentPlayingElement_7ree === userEl) uiController.currentPlayingElement_7ree = null;
                        if (uiController.currentPlayingAudio_7ree === audio) uiController.currentPlayingAudio_7ree = null;
                    };
                }).catch(() => {
                    userEl.classList.remove('playing');
                    if (uiController.currentPlayingElement_7ree === userEl) uiController.currentPlayingElement_7ree = null;
                    if (uiController.currentPlayingAudio_7ree === audio) uiController.currentPlayingAudio_7ree = null;
                });
            } else {
                // 简单回退：直接播放
                const audio = new Audio(audioUrl);
                audio.play().catch(() => {});
            }
        });
    }

    // 绑定AI TTS播放
    if (aiEl) {
        aiEl.addEventListener('click', async (event) => {
            event.stopPropagation();
            const tts = window.ttsService;
            if (!tts) return;

            const message = aiEl.getAttribute('data-message') || '';

            if (uiController) {
                if (uiController.currentPlayingElement_7ree) {
                    if (uiController.currentPlayingElement_7ree === aiEl) {
                        // 再次点击则停止
                        if (tts && tts.isPlaying) tts.stop();
                        uiController.stopCurrentPlaying_7ree();
                        return;
                    }
                    uiController.stopCurrentPlaying_7ree();
                }
                aiEl.classList.add('playing');
                uiController.currentPlayingElement_7ree = aiEl;

                try {
                    // 优先使用缓存音频
                    if (tts.cachedAudioData) {
                        await tts.playAudio(tts.cachedAudioData);
                    } else {
                        await tts.speak(message);
                    }
                } catch (err) {
                    // 忽略错误，仅做状态清理
                } finally {
                    aiEl.classList.remove('playing');
                    if (uiController.currentPlayingElement_7ree === aiEl) uiController.currentPlayingElement_7ree = null;
                }
            } else {
                // 简单回退：直接调用TTS
                try {
                    if (tts.cachedAudioData) {
                        await tts.playAudio(tts.cachedAudioData);
                    } else {
                        await tts.speak(message);
                    }
                } catch (e) {}
            }
        });
    }
}

// 导出函数到全局作用域
window.showResults = showResults;
window.clearResults = clearResults;
window.formatSimpleResult = formatSimpleResult;
window.showLoading = showLoading;
window.showError = showError;
window.showMessage = showMessage;