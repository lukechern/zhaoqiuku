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
 * 生成记录ID
 * @param {Object} record - 记录数据
 * @returns {string} 生成的记录ID
 */
function generateRecordId_7ree(record) {
    // 尝试使用时间戳和项目名称生成唯一ID
    const timestamp = record.timestamp || record.createdAt || Date.now();
    const itemName = record.itemName || 'unknown';
    const hash = btoa(timestamp + itemName).replace(/[^a-zA-Z0-9]/g, '').substring(0, 10);
    return `record_${hash}_${Math.random().toString(36).substr(2, 5)}`;
}

// 导出工具函数
export { escapeHtml, generateRecordId_7ree };