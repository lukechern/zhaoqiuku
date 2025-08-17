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



        this.init();
    }

    /**
     * 初始化历史记录管理器
     */
    init() {
        // 检查用户登录状态
        this.checkAuthAndLoad();

        // 监听认证状态变化
        window.addEventListener('authStateChange', (event) => {
            const { type, isAuthenticated } = event.detail;

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
        if (!window.authManager) {
            setTimeout(() => this.checkAuthAndLoad(), 200);
            return;
        }

        if (!window.authManager.isAuthenticated) {
            this.redirectToAuth();
            return;
        }

        this.loadHistoryRecords(true);
    }

    /**
     * 跳转到认证页面
     */
    redirectToAuth() {
        window.location.href = 'auth.html';
    }

    /**
     * 加载历史记录
     * @param {boolean} reset - 是否重置数据
     */
    async loadHistoryRecords(reset = false) {
        if (this.isLoading) {
            return;
        }

        if (!reset && !this.hasMore) {
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

            const response = await fetch(`/api/user/history?page=${this.currentPage}&limit=${this.limit}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...window.authManager.getAuthHeaders()
                }
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || '获取历史记录失败');
            }

            if (!result.success) {
                throw new Error(result.error || '获取历史记录失败');
            }

            const { records, pagination } = result.data;

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
        
        // 添加记录ID数据属性
        const recordId = record.id || record._id || this.generateRecordId_7ree(record);
        div.setAttribute('data-record-id', recordId);
        
        div.innerHTML = `
            <div class="record-header">
                <div class="record-item">
                    ${record.itemType ? `<span class="item-type">${this.escapeHtml(record.itemType)}</span>` : ''}
                    <span class="item-name">${this.escapeHtml(record.itemName)}</span>
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
                    <span class="transcript-label">原始语音:</span><span class="transcript-value">${this.escapeHtml(record.transcript)}</span>
                </div>
            ` : ''}
        `;
        
        // 设置滑动删除功能
        setTimeout(() => {
            // 确保滑动删除管理器已初始化
            if (window.initSwipeDeleteManager_7ree) {
                window.initSwipeDeleteManager_7ree();
            }
            
            if (window.swipeDeleteManager_7ree) {
                window.swipeDeleteManager_7ree.setupSwipeForElement(div);
                // console.log('SwipeDeleteManager_7ree: 为记录元素设置滑动功能', div);
            } else {
                // console.error('SwipeDeleteManager_7ree: 滑动删除管理器未找到');
                // 如果滑动删除管理器还没有初始化，等待一段时间后重试
                setTimeout(() => {
                    if (window.swipeDeleteManager_7ree) {
                        window.swipeDeleteManager_7ree.setupSwipeForElement(div);
                        // console.log('SwipeDeleteManager_7ree: 延迟为记录元素设置滑动功能', div);
                    }
                }, 100);
            }
        }, 0);
        
        return div;
    }

    /**
     * 生成记录ID
     * @param {Object} record - 记录数据
     * @returns {string} 生成的记录ID
     */
    generateRecordId_7ree(record) {
        // 尝试使用时间戳和项目名称生成唯一ID
        const timestamp = record.timestamp || record.createdAt || Date.now();
        const itemName = record.itemName || 'unknown';
        const hash = btoa(timestamp + itemName).replace(/[^a-zA-Z0-9]/g, '').substring(0, 10);
        return `record_${hash}_${Math.random().toString(36).substr(2, 5)}`;
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
        this.loadHistoryRecords(true);
    }
}

// 页面加载完成后初始化
// 初始化历史记录管理器的函数
function initHistoryManager_7ree() {
    if (window.historyManager) {
        console.log('HistoryManager已存在，跳过初始化');
        return;
    }
    
    // 检查必要的DOM元素是否存在
    const historyContainer = document.getElementById('history-records');
    if (!historyContainer) {
        console.warn('历史记录容器未找到，延迟初始化...');
        setTimeout(initHistoryManager_7ree, 200);
        return;
    }
    
    console.log('初始化HistoryManager...');
    window.historyManager = new HistoryManager();
}

document.addEventListener('DOMContentLoaded', () => {
    // 延迟初始化，确保所有脚本都已加载
    setTimeout(initHistoryManager_7ree, 500);
});

// 额外的初始化检查
window.addEventListener('load', () => {
    // 如果历史记录管理器还没有初始化，再次尝试
    if (!window.historyManager) {
        setTimeout(() => {
            if (!window.historyManager) {
                initHistoryManager_7ree();
            }
        }, 1000);
    }
});

// 提供全局初始化函数
window.initHistoryManager_7ree = initHistoryManager_7ree;

// 导出类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HistoryManager;
}