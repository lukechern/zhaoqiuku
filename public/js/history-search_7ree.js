// 历史页顶部搜索交互脚本 _7ree
// 负责：
// 1) 在 header-top 左侧插入放大镜按钮；
// 2) 点击后切换为搜索模式：显示 关闭按钮 + 输入框 + 输入框内右侧放大镜；
// 3) 点击关闭按钮恢复原始 header;
// 4) 点击右侧放大镜或回车进行搜索，对 #history-records 下的 .history-record 进行关键字过滤；
// 5) 若无输入，复用 swipe-delete_7ree.js 的 showToast 提示。

(function(){
  const ICONS = {
    search: 'img/search.svg',
    close: 'img/cancel.svg' // 使用现有资源
  };

  let originalHeaderHtml_7ree = '';
  let isSearchMode_7ree = false;
  // 本次搜索模式期间是否提交过搜索（用于关闭时是否需要刷新列表）
  let hasSubmittedSearch_7ree = false;

  function ensureHeaderReady_7ree(){
    const header = document.querySelector('#headerTopContainer_7ree .header-top');
    if (!header) return null;
    return header;
  }

  function injectToggleSearchBtn_7ree(){
    const header = ensureHeaderReady_7ree();
    if (!header) return;

    // 已经有按钮则直接绑定点击事件（避免因 innerHTML 还原后事件丢失）
    const existing = header.querySelector('.search-toggle-btn_7ree');
    if (existing) {
      existing.onclick = () => enterSearchMode_7ree();
      return;
    }

    // 获取或创建右侧功能图标容器
    let rightContainer = header.querySelector('.header-actions-right');
    if (!rightContainer) {
      rightContainer = document.createElement('div');
      rightContainer.className = 'header-actions-right';
      rightContainer.id = 'headerActionsRight';
      header.appendChild(rightContainer);
    }

    // 在右侧容器中插入搜索按钮
    const btn = document.createElement('button');
    btn.className = 'search-toggle-btn_7ree';
    btn.setAttribute('aria-label', '搜索');
    btn.innerHTML = `<img class="search-icon_7ree" src="${ICONS.search}" alt="搜索">`;

    rightContainer.appendChild(btn);
    btn.addEventListener('click', () => enterSearchMode_7ree());
  }

  function enterSearchMode_7ree(){
    const header = ensureHeaderReady_7ree();
    if (!header || isSearchMode_7ree) return;

    // 记录原始内容，进入搜索模式
    originalHeaderHtml_7ree = header.innerHTML;
    isSearchMode_7ree = true;
    hasSubmittedSearch_7ree = false; // 进入时重置标记

    header.classList.add('header-search-mode_7ree');
    header.innerHTML = '';

    // 关闭按钮
    const closeBtn = document.createElement('button');
    closeBtn.className = 'search-close-btn_7ree';
    closeBtn.setAttribute('aria-label', '关闭搜索');
    closeBtn.innerHTML = `<img class="close-icon_7ree" src="${ICONS.close}" alt="关闭">`;

    // 输入框 + 内部放大镜
    const inputWrap = document.createElement('div');
    inputWrap.className = 'search-input-wrap_7ree';
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = '输入关键词搜索历史记录';
    input.className = 'search-input_7ree';
    input.setAttribute('id', 'historySearchInput_7ree');

    const submitBtn = document.createElement('button');
    submitBtn.className = 'search-submit-btn_7ree';
    submitBtn.setAttribute('aria-label', '开始搜索');
    submitBtn.innerHTML = `<img class="search-submit-icon_7ree" src="${ICONS.search}" alt="搜索">`;

    inputWrap.appendChild(input);
    inputWrap.appendChild(submitBtn);

    header.appendChild(closeBtn);
    header.appendChild(inputWrap);

    // 事件绑定
    closeBtn.addEventListener('click', () => exitSearchMode_7ree());
    submitBtn.addEventListener('click', () => doSearch_7ree());
    input.addEventListener('keydown', (e)=>{
      if(e.key === 'Enter') doSearch_7ree();
    });

    // 自动聚焦
    setTimeout(()=> input.focus(), 0);
  }

  function exitSearchMode_7ree(){
    const header = ensureHeaderReady_7ree();
    if (!header || !isSearchMode_7ree) return;

    // 恢复原有内容
    header.classList.remove('header-search-mode_7ree');
    header.innerHTML = originalHeaderHtml_7ree;
    isSearchMode_7ree = false;

    // 重新插入搜索切换按钮（放回右侧）
    injectToggleSearchBtn_7ree();

    // 恢复后需重新绑定登出按钮事件
    if (typeof window.ensureLogoutButtonHandler === 'function') {
      setTimeout(()=> window.ensureLogoutButtonHandler(), 0);
    }

    // 仅当本次搜索模式期间发生过搜索提交时，才清空搜索并恢复列表
    if (hasSubmittedSearch_7ree) {
      if (window.historyManager && typeof window.historyManager.clearSearch_7ree === 'function') {
        window.historyManager.clearSearch_7ree();
      } else {
        const container = document.getElementById('history-records');
        if (container) {
          Array.from(container.querySelectorAll('.history-record')).forEach(el => {
            el.style.display = '';
          });
        }
      }
    }

    // 退出搜索时，将加载指示器文案恢复为默认
    const loadingTextEl = document.querySelector('#loading-indicator span');
    if (loadingTextEl) loadingTextEl.textContent = '加载中...';

    // 重置标记
    hasSubmittedSearch_7ree = false;
  }

  function doSearch_7ree(){
    const input = document.getElementById('historySearchInput_7ree');
    const keyword = (input?.value || '').trim();

    if(!keyword){
      if (typeof window.showToast === 'function') {
        window.showToast('请输入搜索关键词', 'info');
      }
      return;
    }

    // 优先使用服务端搜索
    if (window.historyManager && typeof window.historyManager.setSearchKeyword_7ree === 'function') {
      // 在页面的加载指示器上展示“正在为您搜索...”
      const loadingTextEl = document.querySelector('#loading-indicator span');
      if (loadingTextEl) loadingTextEl.textContent = '正在为您搜索...';

      hasSubmittedSearch_7ree = true; // 标记为已提交
      window.historyManager.setSearchKeyword_7ree(keyword);
      return;
    }

    // 回退方案：本地过滤（仅在 historyManager 不可用时）
    const container = document.getElementById('history-records');
    if (!container) return;

    const items = Array.from(container.querySelectorAll('.history-record'));
    let matchCount = 0;
    const kw = keyword.toLowerCase();

    items.forEach(el => {
      const text = el.textContent.toLowerCase();
      const matched = text.includes(kw);
      el.style.display = matched ? '' : 'none';
      if (matched) matchCount++;
    });

    hasSubmittedSearch_7ree = true; // 标记为已提交（本地过滤场景）
    if (typeof window.showToast === 'function') {
      window.showToast(`找到 ${matchCount} 条匹配记录`, matchCount ? 'success' : 'info');
    }
  }

  // 在历史页面组件加载完后注入
  function tryInitAfterComponents_7ree(){
    const header = ensureHeaderReady_7ree();
    const historyContainer = document.getElementById('history-records');
    if (header && historyContainer){
      injectToggleSearchBtn_7ree();
      return true;
    }
    return false;
  }

  // 多次尝试等待组件加载
  let retries = 0;
  const maxRetries = 30;
  const timer = setInterval(()=>{
    if (tryInitAfterComponents_7ree()){
      clearInterval(timer);
    } else {
      retries++;
      if (retries >= maxRetries) clearInterval(timer);
    }
  }, 150);

  // 暴露到全局，便于其他脚本需要时调用
  window.enterSearchMode_7ree = enterSearchMode_7ree;
  window.exitSearchMode_7ree = exitSearchMode_7ree;
  window.doSearch_7ree = doSearch_7ree;
})();