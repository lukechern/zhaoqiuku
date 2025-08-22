# 🗑️ 滑动删除功能模块（合并版）

该目录包含滑动删除功能，已合并为核心与UI两部分，接口不变、职责清晰。

## 📁 目录结构（合并后）

```
swipe-delete/
├── swipe-core_7ree.js   # 核心：工具方法 + 事件驱动
├── swipe-ui_7ree.js     # UI：DOM结构管理 + 删除处理 + Toast
├── index.js             # 入口：统一对外 API（可选使用）
└── README.md           # 说明文档（本文件）
```

## 🚀 使用方式

### 在 HTML 中引用（推荐）
```html
<script src="js/swipe-delete/swipe-core_7ree.js"></script>
<script src="js/swipe-delete/swipe-ui_7ree.js"></script>
```

或引用入口文件（会调用初始化）：
```html
<script src="js/swipe-delete/index.js"></script>
```

### 在 JavaScript 中调用
- 全局入口：`window.initSwipeDeleteManager_7ree()`
- 全局实例：`window.swipeDeleteManager_7ree`

## 🔄 向后兼容
仍保留 `js/swipe-delete_7ree.js` 的对外 API（由入口或 UI 模块实现），历史调用保持可用。

## 📈 优势
1. 合并精简：降低碎片化、减少加载失败概率
2. 模块职责清晰：核心与 UI 分层，易维护
3. WebView 友好：减少事件错过与样式抖动

## 📝 变更历史
- v3.0：合并为 `swipe-core_7ree.js` + `swipe-ui_7ree.js`，删除旧拆分文件
- v2.0：拆分为多个小模块