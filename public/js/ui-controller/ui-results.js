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
            <span class="ai-reply playable" data-message="${esc(message)}" data-action="${data.action || 'unknown'}">${window.formatAiMessage ? window.formatAiMessage(message) : esc(message)}</span>
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
        // 使用与action: unknown相同的对话气泡UI格式
        const esc = (s) => (window.escapeHtml ? window.escapeHtml(s) : s);
        const errorDisplayMessage = '抱歉，没听清你说了什么，请稍后重试。';
        const userErrorDisplay = '❓❓❓❓❓❓'; // 红色问号
        
        elements.resultsContainer.innerHTML = `
            <div class="user-ai-dialog">
                <span class="user-say playable error-user" data-transcript="${esc(userErrorDisplay)}">${userErrorDisplay}</span>
                <span class="ai-reply playable" data-message="${esc(errorDisplayMessage)}" data-action="error">${window.formatAiMessage ? window.formatAiMessage(errorDisplayMessage) : esc(errorDisplayMessage)}</span>
            </div>
        `;
        
        // 绑定点击事件，与普通对话保持一致的交互
        // 使用setTimeout确保DOM完全渲染后再绑定事件
        setTimeout(() => {
            try {
                bindFallbackPlayback_7ree(elements.resultsContainer);
                console.log('错误显示事件绑定完成');
            } catch (e) {
                console.warn('绑定错误显示回退播放事件失败:', e);
            }
        }, 10);
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
    if (!container) {
        console.warn('bindFallbackPlayback_7ree: container为空');
        return;
    }

    const uiController = window.app && window.app.uiController ? window.app.uiController : null;

    // 使用更具体的选择器来确保找到正确的元素
    const userEl = container.querySelector('.user-ai-dialog .user-say.playable');
    const aiEl = container.querySelector('.user-ai-dialog .ai-reply.playable');
    
    console.log('bindFallbackPlayback_7ree 元素查找结果:', {
        container: !!container,
        userEl: !!userEl,
        aiEl: !!aiEl,
        userElClasses: userEl ? Array.from(userEl.classList) : null,
        aiElClasses: aiEl ? Array.from(aiEl.classList) : null
    });

    // 绑定用户录音播放
    if (userEl) {
        console.log('绑定用户气泡点击事件');
        userEl.addEventListener('click', (event) => {
            console.log('用户气泡被点击');
            event.stopPropagation();

            const audioUrl = window.app && window.app.audioRecorder ? window.app.audioRecorder.audioUrl : null;
            console.log('音频URL:', audioUrl);
            
            if (!audioUrl) {
                console.warn('没有可用的音频URL');
                return;
            }

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
        console.log('绑定AI气泡点击事件');
        aiEl.addEventListener('click', async (event) => {
            console.log('AI气泡被点击');
            event.stopPropagation();
            
            const message = aiEl.getAttribute('data-message') || '';
            const action = aiEl.getAttribute('data-action');
            
            console.log('AI气泡点击参数:', { message, action });
            
            // 检测意图不明确的情况，直接播放本地Unknow.mp3
            if (action === 'unknown') {
                console.log('意图不明确，播放本地Unknow.mp3文件');
                
                if (uiController) {
                    if (uiController.currentPlayingElement_7ree) {
                        if (uiController.currentPlayingElement_7ree === aiEl) {
                            uiController.stopCurrentPlaying_7ree();
                            return;
                        }
                        uiController.stopCurrentPlaying_7ree();
                    }
                    aiEl.classList.add('playing');
                    uiController.currentPlayingElement_7ree = aiEl;
                    
                    try {
                        const audio = new Audio('/mp3/Unknow.mp3');
                        audio.volume = 0.7;
                        uiController.currentPlayingAudio_7ree = audio;
                        
                        await audio.play();
                        audio.onended = () => {
                            aiEl.classList.remove('playing');
                            if (uiController.currentPlayingElement_7ree === aiEl) uiController.currentPlayingElement_7ree = null;
                            if (uiController.currentPlayingAudio_7ree === audio) uiController.currentPlayingAudio_7ree = null;
                        };
                    } catch (error) {
                        console.warn('播放Unknow.mp3失败:', error);
                        aiEl.classList.remove('playing');
                        if (uiController.currentPlayingElement_7ree === aiEl) uiController.currentPlayingElement_7ree = null;
                    }
                } else {
                    // 简单回退：直接播放
                    try {
                        const audio = new Audio('/mp3/Unknow.mp3');
                        audio.volume = 0.7;
                        await audio.play();
                    } catch (error) {
                        console.warn('播放Unknow.mp3失败:', error);
                    }
                }
                return;
            }
            
            // 检测错误情况，直接播放本地unclear.mp3
            if (action === 'error') {
                console.log('错误情况，播放本地unclear.mp3文件');
                
                if (uiController) {
                    if (uiController.currentPlayingElement_7ree) {
                        if (uiController.currentPlayingElement_7ree === aiEl) {
                            uiController.stopCurrentPlaying_7ree();
                            return;
                        }
                        uiController.stopCurrentPlaying_7ree();
                    }
                    aiEl.classList.add('playing');
                    uiController.currentPlayingElement_7ree = aiEl;
                    
                    try {
                        const audio = new Audio('/mp3/unclear.mp3');
                        audio.volume = 0.7;
                        uiController.currentPlayingAudio_7ree = audio;
                        
                        await audio.play();
                        audio.onended = () => {
                            aiEl.classList.remove('playing');
                            if (uiController.currentPlayingElement_7ree === aiEl) uiController.currentPlayingElement_7ree = null;
                            if (uiController.currentPlayingAudio_7ree === audio) uiController.currentPlayingAudio_7ree = null;
                        };
                    } catch (error) {
                        console.warn('播放unclear.mp3失败:', error);
                        aiEl.classList.remove('playing');
                        if (uiController.currentPlayingElement_7ree === aiEl) uiController.currentPlayingElement_7ree = null;
                    }
                } else {
                    // 简单回退：直接播放
                    try {
                        const audio = new Audio('/mp3/unclear.mp3');
                        audio.volume = 0.7;
                        await audio.play();
                    } catch (error) {
                        console.warn('播放unclear.mp3失败:', error);
                    }
                }
                return;
            }
            
            // 正常情况：使用TTS服务
            const tts = window.ttsService;
            if (!tts) return;

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
window.bindFallbackPlayback_7ree = bindFallbackPlayback_7ree;