/**
 * 历史页面事件处理
 */

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    // 延迟初始化，确保所有脚本都已加载
    setTimeout(initHistoryManager_7ree, 500);

    // 使用事件委托处理登出按钮点击
    document.body.addEventListener('click', (event) => {
        console.log('点击事件触发，检查是否点击了登出按钮');
        const logoutBtn = event.target.closest('#logoutBtn');
        if (logoutBtn) {
            // console.log('登出按钮被点击');
            // console.log('事件对象:', event);
            // console.log('登出按钮元素:', logoutBtn);

            // 阻止事件冒泡和默认行为
            event.preventDefault();
            event.stopPropagation();

            // 显示确认对话框
            if (window.showConfirmDialog_7ree) {
                // console.log('使用自定义确认对话框');
                window.showConfirmDialog_7ree({
                    title: '确认退出',
                    message: '您确定要退出登录吗？',
                    confirmText: '退出',
                    cancelText: '取消',
                    onConfirm: async () => {
                        console.log('用户确认退出');
                        if (window.authManager) {
                            console.log('调用authManager.logout()');
                            await window.authManager.logout();
                            console.log('登出完成，刷新页面');
                            // 登出后可以刷新页面或跳转到登录页
                            window.location.reload();
                        } else {
                            console.error('authManager未找到');
                        }
                    },
                    onCancel: () => {
                        console.log('用户取消退出');
                    }
                });
            } else {
                console.error('确认对话框函数 showConfirmDialog_7ree 未找到');
                // Fallback to a simple confirm
                console.log('使用原生确认对话框');
                if (confirm('您确定要退出登录吗？')) {
                    if (window.authManager) {
                        console.log('调用authManager.logout()');
                        window.authManager.logout().then(() => {
                            console.log('登出完成，刷新页面');
                            window.location.reload();
                        });
                    } else {
                        console.error('authManager未找到');
                    }
                }
            }
        } else {
            console.log('点击的不是登出按钮');
        }
    });
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