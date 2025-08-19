// UI控制模块
import { UIController as BaseUIController } from './ui-controller/UIController.js';
import { UIButtonHandler } from './ui-controller/UIButtonHandler.js';
import { UITouchHandler } from './ui-controller/UITouchHandler.js';
import { UIDisplayManager } from './ui-controller/UIDisplayManager.js';
import { UITimerManager } from './ui-controller/UITimerManager.js';
import { DualButtonHandler_7ree } from './ui-controller/DualButtonHandler_7ree.js';

// 扩展UIController类，添加各模块功能
export class UIController extends BaseUIController {
    constructor() {
        // 调用父类构造函数
        super();
        
        // 初始化各功能模块
        this.buttonHandler = new UIButtonHandler(this);
        this.touchHandler = new UITouchHandler(this);
        this.displayManager = new UIDisplayManager(this);
        this.timerManager = new UITimerManager(this);
        // 新增：双按钮处理器
        this.dualButtonHandler_7ree = new DualButtonHandler_7ree(this);
        
        // 将模块方法绑定到实例上
        this.bindModuleMethods();
    }
    
    // 将模块方法绑定到实例上
    bindModuleMethods() {
        // 按钮处理方法
        this.setupButtonEvents = this.buttonHandler.setupButtonEvents.bind(this.buttonHandler);
        this.handleRefresh = this.buttonHandler.handleRefresh.bind(this.buttonHandler);
        
        // 触摸处理方法
        this.setupTouchEvents = this.touchHandler.setupTouchEvents.bind(this.touchHandler);
        this.handleTouchStart = this.touchHandler.handleTouchStart.bind(this.touchHandler);
        this.handleTouchMove = this.touchHandler.handleTouchMove.bind(this.touchHandler);
        this.handleTouchEnd = this.touchHandler.handleTouchEnd.bind(this.touchHandler);
        this.handleMouseStart = this.touchHandler.handleMouseStart.bind(this.touchHandler);
        this.handleMouseMove = this.touchHandler.handleMouseMove.bind(this.touchHandler);
        this.handleMouseEnd = this.touchHandler.handleMouseEnd.bind(this.touchHandler);
        
        // 显示管理方法
        this.hideCancelState = this.displayManager.hideCancelState.bind(this.displayManager);
        this.formatDebugData = this.displayManager.formatDebugData.bind(this.displayManager);
        this.showLoading = this.displayManager.showLoading.bind(this.displayManager);
        this.showError = this.displayManager.showError.bind(this.displayManager);
        this.showMessage = this.displayManager.showMessage.bind(this.displayManager);
        this.showPermissionPrompt = this.displayManager.showPermissionPrompt.bind(this.displayManager);
        this.showUnsupportedPrompt = this.displayManager.showUnsupportedPrompt.bind(this.displayManager);
        
        // 计时器管理方法
        this.startTimer = this.timerManager.startTimer.bind(this.timerManager);
        this.stopTimer = this.timerManager.stopTimer.bind(this.timerManager);
        this.updateTimer = this.timerManager.updateTimer.bind(this.timerManager);
        this.resetTimer = this.timerManager.resetTimer.bind(this.timerManager);
        this.enableControls = this.timerManager.enableControls.bind(this.timerManager);
        this.disableControls = this.timerManager.disableControls.bind(this.timerManager);

        // 新增：双按钮方法绑定
        this.setupDualButtons_7ree = this.dualButtonHandler_7ree.setupDualButtons_7ree.bind(this.dualButtonHandler_7ree);
        this.showDualButtons_7ree = this.dualButtonHandler_7ree.showDualButtons_7ree.bind(this.dualButtonHandler_7ree);
        this.hideDualButtons_7ree = this.dualButtonHandler_7ree.hideDualButtons_7ree.bind(this.dualButtonHandler_7ree);
    }
}