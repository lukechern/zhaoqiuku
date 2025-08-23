// 流式渲染服务 - 实现打字效果和异步TTS处理
export class StreamRenderer_7ree {
    constructor() {
        this.isRendering = false;
        this.currentRenderingElement = null;
        this.renderingQueue = [];
        this.typewriterSpeed = 120; // 打字速度（毫秒）
    }

    // 开始流式渲染结果
    async renderResults(data, container, autoTTS = true) {
        // 移除等待TTS完成的Promise逻辑，渲染流程不再依赖TTS播放完成
        if (this.isRendering) {
            // console.log('正在渲染中，跳过新的渲染请求');
            return;
        }

        try {
            this.isRendering = true;
            
            // 存储data对象以供后续使用
            this.currentData = data;
            
            // 清空容器
            container.innerHTML = '';
            
            // 创建对话容器
            const dialogContainer = document.createElement('div');
            dialogContainer.className = 'user-ai-dialog';
            container.appendChild(dialogContainer);
            
            // 提取用户说话内容和AI回复内容
            const userText = this.extractUserText_7ree(data);
            const aiText = this.extractAiText_7ree(data);
            
            // 如果需要自动TTS，则立即异步启动TTS请求（不等待完成，后台处理）
            if (autoTTS) {
                this.startAsyncTTS_7ree(aiText, data);
            }
            
            // 1. 先渲染用户气泡
            await this.renderUserBubble_7ree(dialogContainer, userText, data.transcript || '');
            
            // 2. 等待1200ms
            await this.delay_7ree(1200);
            
            // 3. 渲染AI气泡（流式打字效果）
            await this.renderAiBubble_7ree(dialogContainer, aiText);
            
            // 渲染完成后直接返回，不等待TTS
            return;
        } catch (error) {
            // console.error('流式渲染失败:', error);
            // 降级到原始渲染方式
            this.fallbackRender_7ree(data, container);
        } finally {
            this.isRendering = false;
        }
    }

    // 提取用户说话内容
    extractUserText_7ree(data) {
        let userSay = data.transcript;
        if (!userSay || (data.action && data.action === 'unknown')) {
            userSay = '抱歉，没有听清你说了什么';
        } else if (data.action === 'error') {
            // 错误情况下显示红色问号
            userSay = '❓❓❓❓❓❓';
        }
        return userSay;
    }

    // 提取AI回复内容
    extractAiText_7ree(data) {
        if (data.business_result && data.business_result.message) {
            return data.business_result.message;
        }
        return '抱歉，我无法理解您的请求';
    }

    // 异步启动TTS请求
    async startAsyncTTS_7ree(text, data) {
        try {
            // 检测意图不明确的情况，不调用TTS API
            if (data && data.action === 'unknown') {
                console.log('意图不明确，跳过TTS API调用');
                return;
            }
            
            // 检测错误情况，不调用TTS API
            if (data && data.action === 'error') {
                console.log('错误情况，跳过TTS API调用');
                return;
            }
            
            if (window.ttsService && window.ttsService.isAvailable()) {
                console.log('异步启动TTS请求:', text);
                // 不等待TTS完成，让它在后台处理
                window.ttsService.speak(text).catch(error => {
                    console.error('TTS异步处理失败:', error);
                });
            }
        } catch (error) {
            console.error('启动异步TTS失败:', error);
        }
    }
    
    // 同步播放TTS并等待完成
    async playTTSAndWait(text) {
        try {
            if (window.ttsService && window.ttsService.isAvailable()) {
                console.log('同步播放TTS:', text);
                // 等待TTS完成
                await window.ttsService.speak(text);
                console.log('TTS播放完成');
            } else {
                console.log('TTS服务不可用');
            }
        } catch (error) {
            console.error('TTS播放失败:', error);
        }
    }
    
    // 等待TTS完成（保留但不再被renderResults使用）
    async waitForTTSCompletion() {
        // 如果没有TTS服务，直接返回
        if (!window.ttsService) {
            return;
        }
        
        // 等待TTS开始播放
        let attempts = 0;
        const maxAttempts = 50; // 最多等待5秒 (50 * 100ms)
        while (!window.ttsService.isPlaying && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        // 如果TTS开始播放，等待其完成
        if (window.ttsService.isPlaying) {
            // 创建一个轮询检查TTS是否完成
            return new Promise(resolve => {
                const checkInterval = setInterval(() => {
                    if (!window.ttsService.isPlaying) {
                        clearInterval(checkInterval);
                        resolve();
                    }
                }, 100);
            });
        }
    }

    // 渲染用户气泡
    async renderUserBubble_7ree(container, text, transcript) {
        const userBubble = document.createElement('span');
        userBubble.className = 'user-say playable';
        
        // 如果是错误情况，添加特殊的CSS类
        if (this.currentData && this.currentData.action === 'error') {
            userBubble.classList.add('error-user');
        }
        
        userBubble.setAttribute('data-transcript', this.escapeHtml_7ree(transcript));
        container.appendChild(userBubble);
        
        // 流式打字效果渲染用户文本
        await this.typewriterEffect_7ree(userBubble, text);
        
        // 添加点击播放事件
        this.addPlaybackEvent_7ree(userBubble, 'user');
    }

    // 渲染AI气泡
    async renderAiBubble_7ree(container, text) {
        const aiBubble = document.createElement('span');
        aiBubble.className = 'ai-reply playable';
        aiBubble.setAttribute('data-message', this.escapeHtml_7ree(text));
        
        // 添加action信息供点击时判断
        if (this.currentData && this.currentData.action) {
            aiBubble.setAttribute('data-action', this.currentData.action);
        }
        
        container.appendChild(aiBubble);
        
        // 流式打字效果渲染AI文本
        await this.typewriterEffect_7ree(aiBubble, text);
        
        // 添加点击播放事件
        this.addPlaybackEvent_7ree(aiBubble, 'ai');
    }

    // 打字机效果
    async typewriterEffect_7ree(element, text) {
        const formattedText = this.formatAiMessage_7ree(text);
        let currentText = '';
        
        // 添加渲染状态样式
        element.classList.add('rendering_7ree');
        
        let i = 0;
        while (i < formattedText.length) {
            // 检查是否遇到HTML标签开始
            if (formattedText[i] === '<') {
                // 查找标签结束位置
                let tagEnd = formattedText.indexOf('>', i);
                if (tagEnd !== -1) {
                    // 将整个标签作为一个单位添加
                    const tag = formattedText.substring(i, tagEnd + 1);
                    currentText += tag;
                    i = tagEnd + 1;
                } else {
                    // 如果没有找到结束标签，按单个字符处理
                    currentText += formattedText[i];
                    i++;
                }
            } else {
                // 普通字符，逐个添加
                currentText += formattedText[i];
                i++;
            }
            
            // 添加光标效果
            element.innerHTML = currentText + '<span class="typewriter-cursor_7ree"></span>';
            
            // 等待打字间隔
            await this.delay_7ree(this.typewriterSpeed);
        }
        
        // 移除光标和渲染状态
        element.innerHTML = currentText;
        element.classList.remove('rendering_7ree');
    }

    // 添加播放事件监听
    addPlaybackEvent_7ree(element, type) {
        element.addEventListener('click', (event) => {
            event.stopPropagation();
            
            // 获取UIController实例并调用播放逻辑
            if (window.app && window.app.uiController) {
                const uiController = window.app.uiController;
                
                // 如果当前已有播放
                if (uiController.currentPlayingElement_7ree) {
                    // 再次点击同一气泡：停止播放并返回
                    if (uiController.currentPlayingElement_7ree === element) {
                        uiController.stopCurrentPlaying_7ree();
                        return;
                    }
                    // 点击了另一个气泡：先停止当前，再继续后续流程
                    uiController.stopCurrentPlaying_7ree();
                }

                // 添加播放状态样式
                element.classList.add('playing');
                uiController.currentPlayingElement_7ree = element;
                
                if (type === 'user') {
                    this.playUserAudio_7ree(element, uiController);
                } else if (type === 'ai') {
                    this.playAiAudio_7ree(element, uiController);
                }
            }
        });
    }

    // 播放用户录音
    playUserAudio_7ree(element, uiController) {
        if (window.app && window.app.audioRecorder && window.app.audioRecorder.audioUrl) {
            const audio = new Audio(window.app.audioRecorder.audioUrl);
            uiController.currentPlayingAudio_7ree = audio;
            
            audio.play().then(() => {
                audio.onended = () => {
                    element.classList.remove('playing');
                    if (uiController.currentPlayingElement_7ree === element) {
                        uiController.currentPlayingElement_7ree = null;
                    }
                    if (uiController.currentPlayingAudio_7ree === audio) {
                        uiController.currentPlayingAudio_7ree = null;
                    }
                };
            }).catch(() => {
                element.classList.remove('playing');
                if (uiController.currentPlayingElement_7ree === element) {
                    uiController.currentPlayingElement_7ree = null;
                }
                if (uiController.currentPlayingAudio_7ree === audio) {
                    uiController.currentPlayingAudio_7ree = null;
                }
            });
        } else {
            element.classList.remove('playing');
            if (uiController.currentPlayingElement_7ree === element) {
                uiController.currentPlayingElement_7ree = null;
            }
        }
    }

    // 播放AI语音
    playAiAudio_7ree(element, uiController) {
        if (window.ttsService && window.ttsService.isPlaying) {
            window.ttsService.stop();
        }
        
        // 检测意图不明确的情况，直接播放本地Unknow.mp3
        const action = element.getAttribute('data-action');
        if (action === 'unknown') {
            console.log('意图不明确，播放本地Unknow.mp3文件');
            
            try {
                const audio = new Audio('/mp3/Unknow.mp3');
                audio.volume = 0.7;
                uiController.currentPlayingAudio_7ree = audio;
                
                audio.play().then(() => {
                    audio.onended = () => {
                        element.classList.remove('playing');
                        if (uiController.currentPlayingElement_7ree === element) {
                            uiController.currentPlayingElement_7ree = null;
                        }
                        if (uiController.currentPlayingAudio_7ree === audio) {
                            uiController.currentPlayingAudio_7ree = null;
                        }
                    };
                }).catch(error => {
                    console.warn('播放Unknow.mp3失败:', error);
                    element.classList.remove('playing');
                    if (uiController.currentPlayingElement_7ree === element) {
                        uiController.currentPlayingElement_7ree = null;
                    }
                    if (uiController.currentPlayingAudio_7ree === audio) {
                        uiController.currentPlayingAudio_7ree = null;
                    }
                });
            } catch (error) {
                console.warn('创建Unknow.mp3播放器失败:', error);
                element.classList.remove('playing');
                if (uiController.currentPlayingElement_7ree === element) {
                    uiController.currentPlayingElement_7ree = null;
                }
            }
            return;
        }
        
        // 检测错误情况，直接播放本地unclear.mp3
        if (action === 'error') {
            console.log('错误情况，播放本地unclear.mp3文件');
            
            try {
                const audio = new Audio('/mp3/unclear.mp3');
                audio.volume = 0.7;
                uiController.currentPlayingAudio_7ree = audio;
                
                audio.play().then(() => {
                    audio.onended = () => {
                        element.classList.remove('playing');
                        if (uiController.currentPlayingElement_7ree === element) {
                            uiController.currentPlayingElement_7ree = null;
                        }
                        if (uiController.currentPlayingAudio_7ree === audio) {
                            uiController.currentPlayingAudio_7ree = null;
                        }
                    };
                }).catch(error => {
                    console.warn('播放unclear.mp3失败:', error);
                    element.classList.remove('playing');
                    if (uiController.currentPlayingElement_7ree === element) {
                        uiController.currentPlayingElement_7ree = null;
                    }
                    if (uiController.currentPlayingAudio_7ree === audio) {
                        uiController.currentPlayingAudio_7ree = null;
                    }
                });
            } catch (error) {
                console.warn('创建错误音频播放器失败:', error);
                element.classList.remove('playing');
                if (uiController.currentPlayingElement_7ree === element) {
                    uiController.currentPlayingElement_7ree = null;
                }
            }
            return;
        }
        
        const message = element.getAttribute('data-message');
        
        // 归一化文本以匹配TTS缓存键_7ree（与 TTSService.speak 内部一致的清洗与截断规则）
        let normalizedMessage_7ree = message;
        if (window.ttsService && typeof window.ttsService.cleanTextForTTS_7ree === 'function') {
            normalizedMessage_7ree = window.ttsService.cleanTextForTTS_7ree(message);
            if (normalizedMessage_7ree.length > 500) {
                normalizedMessage_7ree = normalizedMessage_7ree.substring(0, 500) + '...';
            }
        }
        
        // 检查是否有缓存的TTS音频数据
        // 若有缓存的TTS音频数据则直接播放（不做文本命中判定）_7ree
        if (window.ttsService && window.ttsService.cachedAudioData) {
        try {
            window.ttsService.playAudio(window.ttsService.cachedAudioData).then(() => {
                element.classList.remove('playing');
                if (uiController.currentPlayingElement_7ree === element) {
                    uiController.currentPlayingElement_7ree = null;
                }
            }).catch(() => {
                element.classList.remove('playing');
                if (uiController.currentPlayingElement_7ree === element) {
                    uiController.currentPlayingElement_7ree = null;
                }
            });
        } catch (error) {
            console.error('播放TTS音频失败:', error);
            element.classList.remove('playing');
            if (uiController.currentPlayingElement_7ree === element) {
                uiController.currentPlayingElement_7ree = null;
            }
        }
        } else {
            // 没有缓存，重新生成TTS
            if (window.ttsService) {
                window.ttsService.speak(message).then(() => {
                    element.classList.remove('playing');
                    if (uiController.currentPlayingElement_7ree === element) {
                        uiController.currentPlayingElement_7ree = null;
                    }
                }).catch(() => {
                    element.classList.remove('playing');
                    if (uiController.currentPlayingElement_7ree === element) {
                        uiController.currentPlayingElement_7ree = null;
                    }
                });
            } else {
                element.classList.remove('playing');
                if (uiController.currentPlayingElement_7ree === element) {
                    uiController.currentPlayingElement_7ree = null;
                }
            }
        }
    }

    // 降级渲染（使用原始方式）
    fallbackRender_7ree(data, container) {
        console.log('使用降级渲染方式');
        if (window.app && window.app.uiController && window.app.uiController.displayManager) {
            const formattedData = window.app.uiController.displayManager.formatDebugData(data);
            container.innerHTML = `<div class="results-json">${formattedData}</div>`;
        }
    }

    // 延迟函数
    delay_7ree(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // HTML转义
    escapeHtml_7ree(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // 停止当前渲染
    stopCurrentRendering_7ree() {
        this.isRendering = false;
        this.currentRenderingElement = null;
    }

    // 设置打字速度
    setTypewriterSpeed_7ree(speed) {
        this.typewriterSpeed = Math.max(10, Math.min(200, speed)); // 限制在10-200ms之间
    }

    // 格式化AI消息，允许<br>标签换行
    formatAiMessage_7ree(message) {
        if (!message) return '';
        
        // 先转义所有HTML标签，然后将<br>标签还原
        const escapedMessage = this.escapeHtml_7ree(message);
        return escapedMessage.replace(/&lt;br&gt;/g, '<br>');
    }
}