// 组件管理器
class ComponentManager {
    constructor() {
        this.currentPage = this.getCurrentPage();
        this.init();
    }

    getCurrentPage() {
        const path = window.location.pathname;
        if (path.includes('history.html')) {
            return 'history';
        }
        return 'index';
    }

    async loadHeaderTop() {
        try {
            const response = await fetch('components/header-top.html');
            const headerHtml = await response.text();
            
            // 找到header并插入header-top
            const header = document.querySelector('.header');
            if (header) {
                header.insertAdjacentHTML('afterbegin', headerHtml);
            }
        } catch (error) {
            console.error('Failed to load header-top:', error);
        }
    }

    async loadNavigation() {
        try {
            const response = await fetch('components/bottom-nav.html');
            const navHtml = await response.text();
            
            // 找到容器并插入导航栏
            const container = document.querySelector('.container');
            if (container) {
                container.insertAdjacentHTML('beforeend', navHtml);
                this.setActiveState();
            }
        } catch (error) {
            console.error('Failed to load navigation:', error);
        }
    }

    setActiveState() {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            const page = item.getAttribute('data-page');
            if (page === this.currentPage) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }

    async loadComponents() {
        await Promise.all([
            this.loadHeaderTop(),
            this.loadNavigation()
        ]);
    }

    init() {
        // 页面加载完成后加载所有组件
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.loadComponents();
            });
        } else {
            this.loadComponents();
        }
    }
}

// 初始化组件管理器
new ComponentManager();