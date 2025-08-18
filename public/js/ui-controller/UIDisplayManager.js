// UIDisplayManager.js - UI显示管理器

export class UIDisplayManager {
    constructor(uiController) {
        this.uiController = uiController;
    }

    // 隐藏取消状态
    hideCancelState() {
        if (this.uiController.elements.cancelIndicator) {
            this.uiController.elements.cancelIndicator.classList.remove('canceling');
        }
        // 通过resultsContainer恢复状态文本
        if (this.uiController.elements.resultsContainer) {
            const statusElement = this.uiController.elements.resultsContainer.querySelector('.listening-status');
            if (statusElement) {
                statusElement.textContent = '聆听中……';
            }
        }
    }

    // 格式化调试数据显示
    formatDebugData(data) {
        const debugConfig = window.debugConfig.getCurrentConfig();
        let html = '';

        // 显示当前调试级别（仅在非normal模式下显示）
        if (window.debugConfig.config.currentLevel !== 'normal') {
            html += `<div style="color: var(--text-muted); font-size: 0.8rem; margin-bottom: 10px; text-align: right;">
                调试级别: ${window.debugConfig.getCurrentLevelName()}
            </div>`;
        }

        // 显示业务处理结果（如果有）
        if (data.business_result) {
            const business = data.business_result;
            const resultColor = business.success ? 'var(--success)' : 'var(--error)';

            // 显示用户提问和AI回复的对话格式（使用CSS类减少内联样式）
            html += `<div class="user-ai-dialog">
                <span class="user-say">${this.uiController.escapeHtml(data.transcript)}</span>
                <span class="ai-reply">${this.uiController.escapeHtml(business.message)}</span>
            </div>`;
        } else if (debugConfig.showTranscript && data.transcript) {
            // 如果没有业务结果，但有转录结果且在调试模式下，显示转录结果
            html += `<div style="color: var(--success); font-weight: bold; margin-bottom: 5px; font-size: 1.1rem;">
                📝 识别结果: ${this.uiController.escapeHtml(data.transcript)}
            </div>`;
        }

        // 显示操作详情（仅在调试模式下）
        if (debugConfig.showApiResponse) {
            if (data.action) {
                const actionNames = {
                    'put': '存放物品',
                    'get': '查找物品',
                    'unknown': '未知操作'
                };
                html += `<div style="color: var(--primary-color); margin-bottom: 10px;">
                        🎯 操作类型: ${actionNames[data.action] || data.action}
                    </div>`;
            }

            if (data.object) {
                html += `<div style="color: var(--primary-color); margin-bottom: 10px;">
                        📦 物品名称: ${this.uiController.escapeHtml(data.object)}
                    </div>`;
            }

            if (data.location) {
                html += `<div style="color: var(--primary-color); margin-bottom: 10px;">
                        📍 存放位置: ${this.uiController.escapeHtml(data.location)}
                    </div>`;
            }
        }

        // 2. 显示API响应的关键信息（调试模式及以上）
        if(debugConfig.showApiResponse) {
            if (data.keywords && data.keywords.length > 0) {
                html += `<div style="color: var(--primary-color); margin-bottom: 10px;">
                    🏷️ 关键词: ${data.keywords.map(k => this.uiController.escapeHtml(k)).join(', ')}
                </div>`;
            }

            if (data.confidence !== undefined && data.confidence !== null) {
                html += `<div style="color: var(--warning); margin-bottom: 10px;">
                    📊 置信度: ${data.confidence}
                </div>`;
            }

            // 显示解析后的API响应
            if (data.raw_response) {
                // 使用传统方式检查，避免可选链操作符导致的兼容性问题
                let rawResponse = data.raw_response;
                if (rawResponse !== undefined && rawResponse !== null) {
                    html += `<div style="color: var(--text-secondary); margin: 15px 0 5px 0; font-weight: bold;">
                        📋 API 响应内容:
                    </div>`;
                    html += `<pre style="font-size: 0.85rem; color: var(--text-primary); background: var(--background); border: 1px solid var(--border); border-radius: 8px; padding: 10px; margin-bottom: 10px;">${JSON.stringify(rawResponse, null, 2)}</pre>`;
                }
            }
        }

        // 3. 显示完整调试信息（完整调试模式）
        if(debugConfig.showRequestInfo && data.debug && data.debug.request) {
            html += `<div style="color: var(--text-secondary); margin: 15px 0 5px 0; font-weight: bold;">
                📤 API 请求详情:
            </div>`;
            html += `<pre style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 10px;">${JSON.stringify(data.debug.request, null, 2)}</pre>`;
        }

        if (debugConfig.showRequestInfo && data.debug && data.debug.response) {
            html += `<div style="color: var(--text-secondary); margin: 15px 0 5px 0; font-weight: bold;">
                📥 API 响应详情:
            </div>`;
            html += `<pre style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 10px;">${JSON.stringify(data.debug.response, null, 2)}</pre>`;
        }

        // 如果是正常模式但没有识别结果，显示简单提示
        if (debugConfig.currentLevel === 'normal' && !data.transcript) {
            html = `<div style="color: var(--text-muted); text-align: center; font-style: italic;">
                没有听清你说了什么
            </div>`;
        }

        // 如果没有任何内容，显示完整JSON作为后备
        if (!html.trim()) {
            html = `<pre style="font-size: 0.85rem;">${JSON.stringify(data, null, 2)}</pre>`;
        }

        return html;
    }

    // 显示加载状态
    showLoading(message = '处理中...') {
        if (this.uiController.elements.resultsContainer) {
            this.uiController.elements.resultsContainer.innerHTML = `<div class="loading">${message}</div>`;
        }
    }

    // 显示错误
    showError(error) {
        const errorMessage = typeof error === 'string' ? error : error.message || '发生未知错误';
        if (this.uiController.elements.resultsContainer) {
            this.uiController.elements.resultsContainer.innerHTML = `
                <div style="color: var(--error); text-align: center;">
                    <strong>错误:</strong> ${this.uiController.escapeHtml(errorMessage)}
                </div>
            `;
        }
    }

    // 显示提示消息
    showMessage(message, type = 'info') {
        const colors = {
            info: 'var(--primary-color)',
            success: 'var(--success)',
            warning: 'var(--warning)',
            error: 'var(--error)'
        };

        if (this.uiController.elements.resultsContainer) {
            this.uiController.elements.resultsContainer.innerHTML = `
                <div style="color: ${colors[type]}; text-align: center;">
                    ${this.uiController.escapeHtml(message)}
                </div>
            `;
        }
    }

    // 显示权限请求提示
    showPermissionPrompt() {
        this.showMessage('请允许访问麦克风权限以使用语音功能', 'warning');
    }

    // 显示不支持提示
    showUnsupportedPrompt() {
        this.showError('您的浏览器不支持语音录制功能，请使用现代浏览器');
    }
}