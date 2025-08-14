/*
 * ========================================
 * 🔍 认证状态调试工具
 * ========================================
 * 用于调试认证状态显示问题
 */

// 调试函数：检查认证状态
function debugAuthState() {
    console.log('=== 认证状态调试 ===');
    
    // 检查认证管理器
    console.log('1. 认证管理器状态:');
    console.log('   - 存在:', !!window.authManager);
    if (window.authManager) {
        console.log('   - 已认证:', window.authManager.isAuthenticated);
        console.log('   - 用户信息:', window.authManager.user);
        console.log('   - Token存在:', !!window.authManager.tokens);
    }
    
    // 检查DOM元素
    console.log('2. DOM元素状态:');
    const authLinks = document.getElementById('authLinks');
    const userInfo = document.getElementById('userInfo');
    const userEmail = document.getElementById('userEmail');
    
    console.log('   - authLinks存在:', !!authLinks);
    console.log('   - authLinks显示:', authLinks ? authLinks.style.display : 'N/A');
    console.log('   - userInfo存在:', !!userInfo);
    console.log('   - userInfo隐藏:', userInfo ? userInfo.classList.contains('hidden') : 'N/A');
    console.log('   - userEmail存在:', !!userEmail);
    console.log('   - userEmail内容:', userEmail ? userEmail.textContent : 'N/A');
    
    // 检查LocalStorage
    console.log('3. LocalStorage状态:');
    const storageKeys = [
        'zhaoqiuku_access_token',
        'zhaoqiuku_refresh_token',
        'zhaoqiuku_user_info',
        'zhaoqiuku_login_time'
    ];
    
    storageKeys.forEach(key => {
        const value = localStorage.getItem(key);
        console.log(`   - ${key}:`, value ? (key.includes('token') ? '存在' : value) : '不存在');
    });
    
    console.log('=== 调试结束 ===');
}

// 强制更新用户显示
function forceUpdateUserDisplay() {
    console.log('强制更新用户显示...');
    
    const authLinks = document.getElementById('authLinks');
    const userInfo = document.getElementById('userInfo');
    const userEmail = document.getElementById('userEmail');
    
    if (!authLinks || !userInfo || !userEmail) {
        console.error('DOM元素未找到');
        return;
    }
    
    // 检查认证管理器状态
    if (window.authManager && window.authManager.isAuthenticated && window.authManager.user) {
        // 显示用户信息，隐藏登录链接
        authLinks.style.display = 'none';
        authLinks.classList.add('hidden');
        userInfo.classList.remove('hidden');
        userInfo.style.display = 'flex';
        userEmail.textContent = window.authManager.user.email;
        console.log('已显示用户信息:', window.authManager.user.email);
    } else {
        // 显示登录链接，隐藏用户信息
        authLinks.style.display = 'flex';
        authLinks.classList.remove('hidden');
        userInfo.classList.add('hidden');
        userInfo.style.display = 'none';
        console.log('已显示登录链接');
    }
}

// 模拟登录
function simulateLogin() {
    if (!window.authManager) {
        console.error('认证管理器未初始化');
        return;
    }
    
    const mockUser = {
        email: 'test@example.com',
        id: 'test123'
    };
    
    // 模拟设置认证状态
    window.authManager.isAuthenticated = true;
    window.authManager.user = mockUser;
    window.authManager.tokens = {
        access: 'mock_access_token',
        refresh: 'mock_refresh_token'
    };
    
    // 保存到localStorage
    localStorage.setItem('zhaoqiuku_user_info', JSON.stringify(mockUser));
    localStorage.setItem('zhaoqiuku_access_token', 'mock_access_token');
    localStorage.setItem('zhaoqiuku_refresh_token', 'mock_refresh_token');
    localStorage.setItem('zhaoqiuku_login_time', Date.now().toString());
    
    // 触发认证状态变化事件
    window.dispatchEvent(new CustomEvent('authStateChange', {
        detail: {
            type: 'login',
            isAuthenticated: true,
            user: mockUser
        }
    }));
    
    console.log('模拟登录完成');
    forceUpdateUserDisplay();
}

// 清除登录状态
function clearLoginState() {
    if (!window.authManager) {
        console.error('认证管理器未初始化');
        return;
    }
    
    // 清除认证状态
    window.authManager.isAuthenticated = false;
    window.authManager.user = null;
    window.authManager.tokens = null;
    
    // 从localStorage清除
    localStorage.removeItem('zhaoqiuku_user_info');
    localStorage.removeItem('zhaoqiuku_access_token');
    localStorage.removeItem('zhaoqiuku_refresh_token');
    localStorage.removeItem('zhaoqiuku_login_time');
    
    // 触发认证状态变化事件
    window.dispatchEvent(new CustomEvent('authStateChange', {
        detail: {
            type: 'logout',
            isAuthenticated: false
        }
    }));
    
    console.log('登录状态已清除');
    forceUpdateUserDisplay();
}

// 检查主页面状态
function checkMainPageState() {
    console.log('=== 主页面状态检查 ===');
    
    // 检查必要的全局对象
    const checks = {
        'window.authManager': !!window.authManager,
        'window.app': !!window.app,
        'window.stateSyncManager': !!window.stateSyncManager
    };
    
    Object.entries(checks).forEach(([name, exists]) => {
        console.log(`${name}: ${exists ? '✅' : '❌'}`);
    });
    
    // 检查用户状态显示
    if (window.authManager) {
        const isAuthenticated = window.authManager.isAuthenticated;
        const user = window.authManager.user;
        console.log('认证状态:', isAuthenticated ? `已登录 (${user?.email})` : '未登录');
    }
    
    console.log('=== 检查完成 ===');
}

// 测试登出按钮
function testLogoutButton() {
    console.log('测试登出按钮...');
    
    const logoutBtn = document.getElementById('logoutBtn');
    if (!logoutBtn) {
        console.error('登出按钮未找到');
        return;
    }
    
    console.log('登出按钮状态:', {
        exists: true,
        visible: getComputedStyle(logoutBtn).display !== 'none',
        clickable: getComputedStyle(logoutBtn).pointerEvents !== 'none'
    });
    
    // 尝试触发点击事件
    logoutBtn.click();
    console.log('已触发登出按钮点击事件');
}

// 显示可用的调试命令
function showConsoleCommands() {
    console.log('输入以下命令进行调试:');
    console.log('- debugAuthState() - 检查认证状态');
    console.log('- forceUpdateUserDisplay() - 强制更新显示');
    console.log('- simulateLogin() - 模拟登录');
    console.log('- clearLoginState() - 清除登录状态');
    console.log('- checkMainPageState() - 检查主页面状态');
    console.log('- testLogoutButton() - 测试登出按钮');
}

// 页面加载完成后显示可用命令
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', showConsoleCommands);
} else {
    showConsoleCommands();
}

// 导出到全局作用域
window.debugAuthState = debugAuthState;
window.forceUpdateUserDisplay = forceUpdateUserDisplay;
window.simulateLogin = simulateLogin;
window.clearLoginState = clearLoginState;
window.checkMainPageState = checkMainPageState;
window.testLogoutButton = testLogoutButton;
window.showConsoleCommands = showConsoleCommands;

console.log('认证调试工具已加载，可在控制台使用以下函数:');
console.log('- debugAuthState() - 检查认证状态');
console.log('- forceUpdateUserDisplay() - 强制更新显示');
console.log('- simulateLogin() - 模拟登录');
console.log('- clearLoginState() - 清除登录状态');
console.log('- checkMainPageState() - 检查主页面状态');
console.log('- testLogoutButton() - 测试登出按钮');
