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
    
    if (window.authManager && window.authManager.isAuthenticated && window.authManager.user) {
        // 显示用户信息
        authLinks.style.display = 'none';
        userInfo.classList.remove('hidden');
        userEmail.textContent = window.authManager.user.email;
        console.log('已显示用户信息:', window.authManager.user.email);
    } else {
        // 显示登录链接
        authLinks.style.display = 'flex';
        userInfo.classList.add('hidden');
        console.log('已显示登录链接');
    }
}

// 模拟登录状态
function simulateLogin() {
    console.log('模拟登录状态...');
    
    const mockAuthData = {
        user: {
            id: 'debug-user-id',
            email: 'debug@example.com',
            status: 'active',
            isVerified: true
        },
        tokens: {
            accessToken: 'debug-access-token',
            refreshToken: 'debug-refresh-token',
            tokenType: 'Bearer'
        }
    };
    
    if (window.authManager) {
        window.authManager.saveAuthState(mockAuthData);
        console.log('模拟登录完成');
    } else {
        console.error('认证管理器不存在');
    }
}

// 清除登录状态
function clearLoginState() {
    console.log('清除登录状态...');
    
    if (window.authManager) {
        window.authManager.clearAuthState();
        console.log('登录状态已清除');
    } else {
        console.error('认证管理器不存在');
    }
}

// 添加到全局作用域，方便在控制台调用
window.debugAuthState = debugAuthState;
window.forceUpdateUserDisplay = forceUpdateUserDisplay;
window.simulateLogin = simulateLogin;
window.clearLoginState = clearLoginState;

// 页面加载完成后自动运行一次调试
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        console.log('页面加载完成，运行认证状态调试...');
        debugAuthState();
    }, 500);
});

console.log('认证调试工具已加载，可在控制台使用以下函数:');
console.log('- debugAuthState() - 检查认证状态');
console.log('- forceUpdateUserDisplay() - 强制更新显示');
console.log('- simulateLogin() - 模拟登录');
console.log('- clearLoginState() - 清除登录状态');