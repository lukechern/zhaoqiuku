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