# 长按麦克风/上滑取消 相关遗留代码清理记录_7ree

本记录用于梳理并清理项目中已废弃的“长按麦克风录音 + 上滑取消”交互相关的残留代码（HTML/CSS/JS）。当前规范为：点击麦克风按钮进入录音，录音期间使用左右明确按钮“取消/结束并发送”。

## 一、发现位置清单

- HTML
  - public/components/main.html
    - 存在“上滑取消录音”的提示块：
      <div class="cancel-indicator" id="cancelIndicator">
          <span>向上滑动取消录音</span>
      </div>

- CSS
  - public/css/microphone.css
    - 与“上滑取消”提示块配套的样式：
      - .cancel-indicator {...}
      - .cancel-indicator.active {...}
      - .cancel-indicator.canceling {...}

- JS（说明性记录，非所有均需删除）
  - public/js/ui-controller/UITouchHandler.js
    - setupTouchEvents 中存在旧的触摸/鼠标“长按开始 + 上滑取消”绑定逻辑；但当前已启用 useClickToRecord_7ree=true，进入点击录音分支后 return，旧逻辑不会被绑定（运行时不生效）。
    - 注释中仍有“向上滑动超过阈值，显示取消状态”等说明。
  - public/js/ui-controller/UIController.js
    - elements 中仍保留 cancelIndicator 的引用（即使DOM被移除，代码有空值判断，不影响运行）。
    - showRecordingState/hideRecordingState 等方法内对 cancelIndicator 的 class 处理均带空值判断，安全无副作用。
  - public/js/ui-controller/UIDisplayManager.js
    - hideCancelState 内含对 cancelIndicator 的安全处理（空值判断），以及结果区文案恢复逻辑。

以上 JS 逻辑在新交互下均不触发“上滑取消”，保留不会影响现有功能，但为避免误读，建议至少移除过时的事件绑定代码或注释明确。

## 二、清理动作

- 已移除
  - public/components/main.html
    - 删除“上滑取消录音”提示块 cancel-indicator（对应DOM完全移除）。
  - public/css/microphone.css
    - 删除 .cancel-indicator、.cancel-indicator.active、.cancel-indicator.canceling 样式规则。
  - public/js/ui-controller.js
    - 注释掉（废弃）旧的触摸/鼠标事件处理方法绑定（handleTouchStart/Move/End, handleMouseStart/Move/End），避免误用。

- 暂留（不影响现有点击 + 左右按钮流程）
  - public/js/ui-controller/UITouchHandler.js 中旧的长按/上滑相关方法与注释；因当前进入点击录音分支后提前 return，不会绑定旧事件，运行时不生效。后续如需彻底精简，可删除对应方法与注释，并同步移除聚合绑定（本次已注释掉聚合绑定）。
  - public/js/ui-controller/UIController.js 与 UIDisplayManager.js 中对 cancelIndicator 的空值保护性处理保留（不影响运行）。

## 三、验证要点

- 录音入口：点击麦克风按钮开始录音，无需长按。
- 录音期间：显示左右“取消/结束并发送”按钮；不再出现“上滑取消录音”提示。
- UI：主界面无多余提示；样式无布局错位。

## 四、回滚说明

清理仅删除了对应 HTML 块与 CSS 选择器，并注释掉聚合层的旧事件绑定；如需恢复，可从版本管理或本记录中的片段进行还原。