/*
 * ========================================
 * 📋 历史记录页面管理器
 * ========================================
 * 管理历史记录的加载、显示和分页
 */

class HistoryManager {
    constructor() {
        this.currentPage = 1;
        this.limit = 20;
        this.isLoading = false;
        this.hasMore = true;
        this.records = [];
        
        // 测试模式 - 可以通过URL参数启用
        this.testMode = new URLSearchParams(window.location.search).get('test') === 'true';
        console.log('历史记录管理器初始化 - 测试模式:', this.testMode);
        
        this.init();
    }

    /**
     * 初始化历史记录管理器
     */
    init() {
        console.log('初始化历史记录管理器');
        
        // 检查用户登录状态
        this.checkAuthAndLoad();
        
        // 监听认证状态变化
        window.addEventListener('authStateChange', (event) => {
            const { type, isAuthenticated } = event.detail;
            console.log('历史记录页面收到认证状态变化:', type, isAuthenticated);
            
            if (type === 'logout' || !isAuthenticated) {
                this.redirectToAuth();
            } else if (type === 'login' || type === 'restore') {
                this.loadHistoryRecords(true);
            }
        });

        // 设置滚动监听
        this.setupScrollListener();
    }

    /**
     * 检查认证状态并加载数据
     */
    checkAuthAndLoad() {
        console.log('检查认证状态和加载数据...');
        
        if (!window.authManager) {
            console.log('认证管理器未就绪，等待...');
            setTimeout(() => this.checkAuthAndLoad(), 200);
            return;
        }

        console.log('认证管理器状态:', {
            isAuthenticated: window.authManager.isAuthenticated,
            user: window.authManager.user,
            hasTokens: !!window.authManager.tokens
        });

        if (!window.authManager.isAuthenticated) {
            console.log('用户未登录，跳转到认证页面');
            this.redirectToAuth();
            return;
        }

        console.log('用户已登录，开始加载历史记录');
        console.log('用户信息:', window.authManager.user);
        this.loadHistoryRecords(true);
    }

    /**
     * 跳转到认证页面
     */
    redirectToAuth() {
        console.log('跳转到认证页面');
        window.location.href = 'auth.html';
    }

    /**
     * 加载历史记录
     * @param {boolean} reset - 是否重置数据
     */
    async loadHistoryRecords(reset = false) {
        if (this.isLoading) {
            console.log('正在加载中，跳过重复请求');
            return;
        }

        if (!reset && !this.hasMore) {
            console.log('没有更多数据，跳过加载');
            return;
        }

        this.isLoading = true;
        
        try {
            if (reset) {
                this.currentPage = 1;
                this.records = [];
                this.hasMore = true;
                this.clearHistoryList();
                this.showLoading();
            } else {
                this.showLoadingMore();
            }

            console.log(`加载历史记录 - 页码: ${this.currentPage}, 每页: ${this.limit}`);
            
            const authHeaders = window.authManager.getAuthHeaders();
            console.log('请求头:', authHeaders);
            
            // 根据测试模式选择不同的API端点
            const apiEndpoint = this.testMode ? '/api/test-history' : '/api/user/history';
            const url = `${apiEndpoint}?page=${this.currentPage}&limit=${this.limit}`;
            console.log('请求URL:', url, '(测试模式:', this.testMode + ')');

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...authHeaders
                }
            });

            console.log('响应状态:', response.status, response.statusText);

            const result = await response.json();
            console.log('响应数据:', result);

            if (!response.ok) {
                console.error('HTTP错误:', response.status, result);
                throw new Error(result.error || `HTTP ${response.status}: 获取历史记录失败`);
            }

            if (!result.success) {
                console.error('业务逻辑错误:', result);
                throw new Error(result.error || '获取历史记录失败');
            }

            const { records, pagination } = result.data;
            
            console.log('历史记录加载成功:', {
                recordsCount: records.length,
                pagination
            });

            // 更新数据
            if (reset) {
                this.records = records;
            } else {
                this.records = [...this.records, ...records];
            }

            this.hasMore = pagination.hasMore;
            this.currentPage++;

            // 更新UI
            this.renderHistoryRecords(records, reset);
            this.hideLoading();

            if (!this.hasMore) {
                this.showNoMoreData();
            }

        } catch (error) {
            console.error('加载历史记录失败:', error);
            this.hideLoading();
            this.showError(error.message);
            
            // 如果是认证错误，跳转到登录页
            if (error.message.includes('认证') || error.message.includes('登录')) {
                setTimeout(() => this.redirectToAuth(), 2000);
            }
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * 渲染历史记录
     * @param {Array} records - 记录数组
     * @param {boolean} reset - 是否重置列表
     */
    renderHistoryRecords(records, reset = false) {
        const container = this.getHistoryContainer();
        
        if (reset) {
            container.innerHTML = '';
        }

        records.forEach(record => {
            const recordElement = this.createRecordElement(record);
            container.appendChild(recordElement);
        });

        // 如果没有记录，显示空状态
        if (this.records.length === 0) {
            this.showEmptyState();
        }
    }

    /**
     * 创建记录元素
     * @param {Object} record - 记录数据
     * @returns {HTMLElement} 记录元素
     */
    createRecordElement(record) {
        const div = document.createElement('div');
        div.className = 'history-record';
        div.innerHTML = `
            <div class="record-header">
                <div class="record-item">
                    <span class="item-name">${this.escapeHtml(record.itemName)}</span>
                    ${record.itemType ? `<span class="item-type">${this.escapeHtml(record.itemType)}</span>` : ''}
                </div>
                <div class="record-time">
                    <span class="relative-time">${record.relativeTime}</span>
                    <span class="absolute-time">${record.formattedTime}</span>
                </div>
            </div>
            <div class="record-location">
                <span class="location-label">位置:</span>
                <span class="location-value">${this.escapeHtml(record.location)}</span>
            </div>
            ${record.transcript ? `
                <div class="record-transcript">
                    <span class="transcript-label">原始语音:</span>
                    <span class="transcript-value">${this.escapeHtml(record.transcript)}</span>
                </div>
            ` : ''}
        `;
        return div;
    }

    /**
     * 转义HTML字符
     * @param {string} text - 原始文本
     * @returns {string} 转义后的文本
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * 获取历史记录容器
     * @returns {HTMLElement} 容器元素
     */
    getHistoryContainer() {
        let container = document.getElementById('history-records');
        if (!container) {
            // 如果容器不存在，创建它
            const mainContent = document.querySelector('.main-content');
            if (mainContent) {
                mainContent.innerHTML = `
                    <div class="history-container">
                        <div id="history-records" class="history-records"></div>
                        <div id="loading-indicator" class="loading-indicator" style="display: none;">
                            <div class="loading-spinner"></div>
                            <span>加载中...</span>
                        </div>
                        <div id="load-more-indicator" class="load-more-indicator" style="display: none;">
                            <div class="loading-spinner"></div>
                            <span>加载更多...</span>
                        </div>
                        <div id="no-more-data" class="no-more-data" style="display: none;">
                            <span>没有更多记录了</span>
                        </div>
                        <div id="error-message" class="error-message" style="display: none;"></div>
                    </div>
                `;
                container = document.getElementById('history-records');
            }
        }
        return container;
    }

    /**
     * 设置滚动监听
     */
    setupScrollListener() {
        let ticking = false;
        
        const handleScroll = () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                    const windowHeight = window.innerHeight;
                    const documentHeight = document.documentElement.scrollHeight;
                    
                    // 当滚动到距离底部100px时开始加载
                    if (scrollTop + windowHeight >= documentHeight - 100) {
                        if (this.hasMore && !this.isLoading) {
                            console.log('触发滚动加载');
                            this.loadHistoryRecords(false);
                        }
                    }
                    
                    ticking = false;
                });
                ticking = true;
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
    }

    /**
     * 显示加载状态
     */
    showLoading() {
        const indicator = document.getElementById('loading-indicator');
        if (indicator) {
            indicator.style.display = 'flex';
        }
    }

    /**
     * 显示加载更多状态
     */
    showLoadingMore() {
        const indicator = document.getElementById('load-more-indicator');
        if (indicator) {
            indicator.style.display = 'flex';
        }
    }

    /**
     * 隐藏加载状态
     */
    hideLoading() {
        const loadingIndicator = document.getElementById('loading-indicator');
        const loadMoreIndicator = document.getElementById('load-more-indicator');
        
        if (loadingIndicator) {
            loadingIndicator.style.display = 'none';
        }
        if (loadMoreIndicator) {
            loadMoreIndicator.style.display = 'none';
        }
    }

    /**
     * 显示没有更多数据
     */
    showNoMoreData() {
        const indicator = document.getElementById('no-more-data');
        if (indicator && this.records.length > 0) {
            indicator.style.display = 'block';
        }
    }

    /**
     * 显示空状态
     */
    showEmptyState() {
        const container = this.getHistoryContainer();
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📋</div>
                <h3>暂无记录</h3>
                <p>您还没有任何物品存储记录</p>
                <p>去首页开始记录您的物品位置吧！</p>
                <a href="index.html" class="btn-primary">开始记录</a>
            </div>
        `;
    }

    /**
     * 显示错误信息
     * @param {string} message - 错误信息
     */
    showError(message) {
        const errorElement = document.getElementById('error-message');
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
            
            // 3秒后自动隐藏
            setTimeout(() => {
                errorElement.style.display = 'none';
            }, 3000);
        }
    }

    /**
     * 清空历史记录列表
     */
    clearHistoryList() {
        const container = this.getHistoryContainer();
        if (container) {
            container.innerHTML = '';
        }
        
        // 隐藏所有状态指示器
        const indicators = ['no-more-data', 'error-message'];
        indicators.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.style.display = 'none';
            }
        });
    }

    /**
     * 刷新历史记录
     */
    refresh() {
        console.log('刷新历史记录');
        this.loadHistoryRecords(true);
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    console.log('历史记录页面DOM加载完成');
    
    // 延迟初始化，确保所有脚本都已加载
    setTimeout(() => {
        console.log('开始初始化历史记录管理器...');
        window.historyManager = new HistoryManager();
    }, 500);
});

// 额外的初始化检查
window.addEventListener('load', () => {
    console.log('页面完全加载完成');
    
    // 如果历史记录管理器还没有初始化，再次尝试
    if (!window.historyManager) {
        console.log('历史记录管理器未初始化，重新尝试...');
        setTimeout(() => {
            if (!window.historyManager) {
                window.historyManager = new HistoryManager();
            }
        }, 1000);
    }
});

// 导出类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HistoryManager;
}