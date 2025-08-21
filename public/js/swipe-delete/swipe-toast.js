/**
 * ========================================
 * 🗑️ 滑动删除 - Toast提示模块
 * ========================================
 * 提供Toast提示功能
 */

window.SwipeToast_7ree = class SwipeToast_7ree {
    /**
     * 显示Toast提示
     */
    showToast(message, type = 'info') {
        if (typeof window.showToast === 'function') {
            window.showToast(message, type);
            return;
        }
        this.createToast(message, type);
    }

    /**
     * 创建Toast提示
     */
    createToast(message, type = 'info') {
        try {
            const toast = document.createElement('div');
            toast.className = `toast_7ree toast-${type}_7ree`;
            toast.textContent = message;
            Object.assign(toast.style, {
                position: 'fixed',
                top: '20px',
                right: '20px',
                left: 'auto',
                transform: 'none',
                backgroundColor: type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3',
                color: 'white',
                padding: '12px 16px',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                zIndex: '10000',
                opacity: '0',
                transition: 'opacity 0.3s ease-in-out'
            });
            document.body.appendChild(toast);
            requestAnimationFrame(() => { toast.style.opacity = '1'; });
            setTimeout(() => {
                toast.style.opacity = '0';
                setTimeout(() => { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 300);
            }, 3000);
        } catch (e) {
            console.error('showToast fallback error', e, message);
        }
    }
}

// 全局Toast函数（为了兼容性）
if (!window.showToast) {
    window.showToast = function showToast_7ree(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast_7ree toast-${type}_7ree`;
        toast.textContent = message;
        Object.assign(toast.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            left: 'auto',
            transform: 'none',
            backgroundColor: type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3',
            color: 'white',
            padding: '12px 16px',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '500',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            zIndex: '10000',
            opacity: '0',
            transition: 'opacity 0.3s ease-in-out'
        });
        document.body.appendChild(toast);
        requestAnimationFrame(() => { toast.style.opacity = '1'; });
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 300);
        }, 3000);
    };
}