/**
 * ========================================
 * 📜 历史页面 - 核心模块（合并版）_7ree
 * ========================================
 * 合并自：history-utils.js、history-manager.js
 * 职责：工具函数与主数据管理器
 */

// --- 来自 history-utils.js ---
/**
 * 转义HTML字符
 * @param {string} text - 原始文本
 * @returns {string} 转义后的文本
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * 安全的 btoa 封装，支持中文等非ASCII字符
 * @param {string} input - 原始字符串
 * @returns {string} Base64 编码结果或回退字符串
 */
function safeBtoa_7ree(input) {
    try {
        // 先用 encodeURIComponent 转义为 UTF-8，再用 unescape 转为 Latin1，最后 btoa
        return btoa(unescape(encodeURIComponent(String(input))));
    } catch (e1) {
        try {
            return btoa(String(input));
        } catch (e2) {
            // 仍失败则回退到随机字符串，避免抛错导致页面白屏
            return Math.random().toString(36).slice(2, 12);
        }
    }
}

/**
 * 生成记录ID
 * @param {Object} record - 记录数据
 * @returns {string} 生成的记录ID
 */
function generateRecordId_7ree(record) {
    // 尝试使用时间戳和项目名称生成唯一ID（兼容中文）
    const timestamp = record.timestamp || record.createdAt || Date.now();
    const itemName = record.itemName || 'unknown';
    const base = `${timestamp}|${itemName}`;
    const base64 = safeBtoa_7ree(base);
    const hash = String(base64).replace(/[^a-zA-Z0-9]/g, '').substring(0, 10) || Math.random().toString(36).slice(2, 12);
    return `record_${hash}_${Math.random().toString(36).substr(2, 5)}`;
}

// 将工具函数添加到全局作用域
window.escapeHtml = escapeHtml;
window.generateRecordId_7ree = generateRecordId_7ree;

// --- 来自 history-manager.js ---
/**
 * 历史记录页面管理器
 * 管理历史记录的加载、显示和分页
 */
class HistoryManager {
    constructor() {
        this.currentPage = 1;
        this.limit = 20;
        this.isLoading = false;
        this.hasMore = true;
        this.records = [];
        this.currentSearchKeyword_7ree = '';

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

            let url = `/api/user/history?page=${this.currentPage}&limit=${this.limit}`;
            if (this.currentSearchKeyword_7ree) {
                url += `&keyword=${encodeURIComponent(this.currentSearchKeyword_7ree)}`;
            }
            const response = await fetch(url, {
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
        const recordId = record.id || record._id || window.generateRecordId_7ree(record);
        div.setAttribute('data-record-id', recordId);

        div.innerHTML = `
            <div class="record-header">
                <div class="record-item">
                    ${record.itemType ? `<span class="item-type">${window.escapeHtml(record.itemType)}</span>` : ''}
                    <span class="item-name">${window.escapeHtml(record.itemName)}</span>
                </div>
                <div class="record-time">
                    <span class="relative-time">${record.relativeTime}</span>
                </div>
            </div>
            <div class="record-location">
                <div class="location-info">
                    <span class="location-label">存放位置</span>
                    <span class="location-value">${window.escapeHtml(record.location)}</span>
                </div>
                <span class="absolute-time">${record.formattedTime}</span>
            </div>
            ${record.transcript ? `
                <div class="record-transcript">
                    <span class="transcript-label">原始语音</span><span class="transcript-value">${window.escapeHtml(record.transcript)}</span>
                </div>
            ` : ''}
        `;

        // 设置滑动删除功能
        setTimeout(() => {
            // 确保滑动删除管理器已初始化
            if (window.initSwipeDeleteManager_7ree) {
                window.initSwipeDeleteManager_7ree();
            }

            // 等待滑动删除管理器初始化后再设置
            const setupSwipeForElement = () => {
                if (window.swipeDeleteManager_7ree && typeof window.swipeDeleteManager_7ree.setupSwipeForElement === 'function') {
                    window.swipeDeleteManager_7ree.setupSwipeForElement(div);
                    // console.log('SwipeDeleteManager_7ree: 为记录元素设置滑动功能', div);
                } else {
                    // 如果滑动删除管理器还没有初始化，等待一段时间后重试
                    setTimeout(() => {
                        if (window.swipeDeleteManager_7ree && typeof window.swipeDeleteManager_7ree.setupSwipeForElement === 'function') {
                            window.swipeDeleteManager_7ree.setupSwipeForElement(div);
                            // console.log('SwipeDeleteManager_7ree: 延迟为记录元素设置滑动功能', div);
                        } else {
                            // 如果仍然找不到，记录警告但不影响功能
                            // console.warn('SwipeDeleteManager_7ree: 滑动删除管理器未找到或方法不存在，跳过滑动功能设置');
                        }
                    }, 300);
                }
            };

            setupSwipeForElement();
        }, 100);

        return div;
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
                        <div id="error-message" class="error-message" style="显示: none;"></div>
                `;
                const errorMessage = document.createElement('div');
                errorMessage.id = 'error-message';
                errorMessage.className = 'error-message';
                errorMessage.style.display = 'none';
                mainContent.querySelector('.history-container').appendChild(errorMessage);
                container = document.getElementById('history-records');
            }
        }
        return container;
    }

    /** 省略：滚动与状态显示方法，保持与原文件一致 */
    setupScrollListener() {
        const container = document.querySelector('.history-container');
        const checkScroll = () => {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const windowHeight = window.innerHeight || document.documentElement.clientHeight;
            const documentHeight = document.documentElement.scrollHeight;

            // 当滚动接近底部时加载更多
            if (scrollTop + windowHeight >= documentHeight - 100) {
                this.loadHistoryRecords(false);
            }
        };

        window.addEventListener('scroll', checkScroll, { passive: true });
    }

    showLoading() {
        const indicator = document.getElementById('loading-indicator');
        if (indicator) indicator.style.display = 'flex';
    }

    showLoadingMore() {
        const indicator = document.getElementById('load-more-indicator');
        if (indicator) indicator.style.display = 'flex';
    }

    hideLoading() {
        const loading = document.getElementById('loading-indicator');
        const loadMore = document.getElementById('load-more-indicator');
        if (loading) loading.style.display = 'none';
        if (loadMore) loadMore.style.display = 'none';
    }

    showNoMoreData() {
        const noMore = document.getElementById('no-more-data');
        if (noMore) noMore.style.display = 'block';
    }

    showEmptyState() {
        const container = this.getHistoryContainer();
        if (container && container.children.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'empty-state_7ree';
            empty.textContent = '暂无历史记录';
            container.appendChild(empty);
        }
    }

    showError(message) {
        const error = document.getElementById('error-message');
        if (error) {
            error.textContent = message || '加载失败，请稍后重试';
            error.style.display = 'block';
        }
    }

    clearHistoryList() {
        const container = document.getElementById('history-records');
        if (container) container.innerHTML = '';
    }

    refresh() {
        this.loadHistoryRecords(true);
    }

    setSearchKeyword_7ree(keyword) {
        this.currentSearchKeyword_7ree = keyword || '';
    }

    clearSearch_7ree() {
        this.setSearchKeyword_7ree('');
        this.loadHistoryRecords(true);
    }
}

window.HistoryManager = HistoryManager;