// 流式渲染服务 - 实现打字效果和异步TTS处理
export class StreamRenderer_7ree {
    constructor() {
        this.isRendering = false;
        this.currentRenderingElement = null;
        this.renderingQueue = [];
        this.typewriterSpeed = 120; // 打字速度（毫秒）
    }

    // 开始流式渲染结果
    async renderResults(data, container) {
        if (this.isRendering) {
            console.log('正在渲染中，跳过新的渲染请求');
            return;
        }

        try {
            this.isRendering = true;
            
            // 清空容器
            container.innerHTML = '';
            
            // 创建对话容器
            const dialogContainer = document.createElement('div');
            dialogContainer.className = 'user-ai-dialog';
            container.appendChild(dialogContainer);
            
            // 提取用户说话内容和AI回复内容
            const userText = this.extractUserText_7ree(data);
            const aiText = this.extractAiText_7ree(data);
            
            // 异步启动TTS请求（不等待完成，后台处理）
            this.startAsyncTTS_7ree(aiText);
            
            // 1. 先渲染用户气泡
            await this.renderUserBubble_7ree(dialogContainer, userText, data.transcript || '');
            
            // 2. 等待1200ms
            await this.delay_7ree(1200);
            
            // 3. 渲染AI气泡（流式打字效果）
            await this.renderAiBubble_7ree(dialogContainer, aiText);
            
        } catch (error) {
            console.error('流式渲染失败:', error);
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
    async startAsyncTTS_7ree(text) {
        try {
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

    // 渲染用户气泡
    async renderUserBubble_7ree(container, text, transcript) {
        const userBubble = document.createElement('span');
        userBubble.className = 'user-say playable';
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
        container.appendChild(aiBubble);
        
        // 流式打字效果渲染AI文本
        await this.typewriterEffect_7ree(aiBubble, text);
        
        // 添加点击播放事件
        this.addPlaybackEvent_7ree(aiBubble, 'ai');
    }

    // 打字机效果
    async typewriterEffect_7ree(element, text) {
        const escapedText = this.escapeHtml_7ree(text);
        let currentText = '';
        
        // 添加渲染状态样式
        element.classList.add('rendering_7ree');
        
        for (let i = 0; i < escapedText.length; i++) {
            currentText += escapedText[i];
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
        
        const message = element.getAttribute('data-message');
        
        // 检查是否有缓存的TTS音频数据
        if (window.ttsService && window.ttsService.cachedAudioData && window.ttsService.cachedText === message) {
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
}