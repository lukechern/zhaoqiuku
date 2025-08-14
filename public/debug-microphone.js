// 临时调试脚本 - 用于排查麦克风按钮问题
console.log('加载麦克风调试脚本...');

// 等待页面加载完成
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        console.log('开始麦克风按钮调试...');
        
        const button = document.getElementById('microphoneButton');
        if (!button) {
            console.error('未找到麦克风按钮');
            return;
        }
        
        console.log('找到麦克风按钮:', button);
        
        // 添加临时的点击事件监听器
        button.addEventListener('click', function(e) {
            console.log('临时点击事件被触发');
            e.stopPropagation();
        }, true);
        
        button.addEventListener('mousedown', function(e) {
            console.log('临时 mousedown 事件被触发');
            e.stopPropagation();
        }, true);
        
        button.addEventListener('touchstart', function(e) {
            console.log('临时 touchstart 事件被触发');
            e.stopPropagation();
        }, true);
        
        // 检查是否有其他元素覆盖按钮
        const rect = button.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const elementAtCenter = document.elementFromPoint(centerX, centerY);
        
        console.log('按钮中心位置的元素:', elementAtCenter);
        console.log('是否是按钮本身:', elementAtCenter === button);
        
        // 临时绕过认证检查
        window.bypassAuthCheck = true;
        
        // 修改 UI 控制器的认证检查
        if (window.app && window.app.uiController) {
            const originalCheck = window.app.uiController.checkAuthenticationStatus;
            window.app.uiController.checkAuthenticationStatus = function() {
                if (window.bypassAuthCheck) {
                    console.log('绕过认证检查');
                    this.clearLoginRequiredState();
                    return true;
                }
                return originalCheck.call(this);
            };
            console.log('已修改认证检查逻辑');
        }
        
    }, 1000);
});

// 全局测试函数
window.testMicButton = function() {
    const button = document.getElementById('microphoneButton');
    if (button) {
        console.log('手动触发按钮事件...');
        
        // 创建并触发 mousedown 事件
        const mouseDownEvent = new MouseEvent('mousedown', {
            bubbles: true,
            cancelable: true,
            clientX: button.getBoundingClientRect().left + 60,
            clientY: button.getBoundingClientRect().top + 60
        });
        
        button.dispatchEvent(mouseDownEvent);
        
        setTimeout(() => {
            const mouseUpEvent = new MouseEvent('mouseup', {
                bubbles: true,
                cancelable: true
            });
            button.dispatchEvent(mouseUpEvent);
        }, 1000);
    }
};

console.log('麦克风调试脚本加载完成');
console.log('使用 testMicButton() 来测试按钮');
console.log('使用 window.bypassAuthCheck = false 来恢复认证检查');