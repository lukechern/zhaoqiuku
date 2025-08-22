# 历史页面模块 (History Module)

该目录包含历史页面的核心与UI两部分，已完成合并精简，便于维护与在 WebView 环境的稳定运行。

## 文件结构（合并后）

```
public/js/history/
├── history-core_7ree.js   # 核心：工具函数 + HistoryManager
├── history-ui_7ree.js     # UI：初始化逻辑 + 事件处理
├── index.js               # 入口文件，用于健康检查与后续扩展
└── README.md              # 说明文档（本文件）
```

## 主要功能

- 历史记录管理：加载、显示、搜索
- 分页加载：无限滚动分页
- 滑动删除：与 Swipe 模块集成
- 搜索功能：关键词搜索
- 认证集成：与统一认证系统联动

## 使用方法

在 HTML 中通过顶层入口按顺序动态加载（推荐）：

```html
<script src="js/history.js"></script>
```

或在模块内部调用时，确保先加载 `history-core_7ree.js` 与 `history-ui_7ree.js`。

## API 摘要

- 全局类：`window.HistoryManager`
- 初始化函数：`window.initHistoryManager_7ree()`
- 全局实例：`window.historyManager`

常用方法：
- `loadHistoryRecords(reset)`：加载历史记录
- `setSearchKeyword_7ree(keyword)`：设置搜索关键词
- `clearSearch_7ree()`：清除搜索
- `refresh()`：刷新历史记录

## 依赖

- 认证管理器：`window.authManager`
- 确认对话框：`window.showConfirmDialog_7ree`
- 滑动删除管理器：`window.swipeDeleteManager_7ree`

## 维护建议

1. 核心与UI分层清晰，尽量保持接口稳定
2. 重要流程保持充分注释，便于 WebView 兼容调优
3. 修改后务必在浏览器与 WebView 双端进行验证

## 升级历史

- v3.0：合并至 `history-core_7ree.js` + `history-ui_7ree.js`，移除旧的拆分文件，增强初始化健壮性
- v2.0：历史模块化拆分，职责清晰