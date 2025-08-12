@echo off
echo 正在构建Android应用...
call gradlew assembleDebug

if %ERRORLEVEL% EQU 0 (
    echo 构建成功！
    echo 正在安装到设备...
    call gradlew installDebug
    
    if %ERRORLEVEL% EQU 0 (
        echo 安装成功！
        echo 正在启动应用...
        adb shell am start -n com.x7ree.zhaoqiuku/.MainActivity
    ) else (
        echo 安装失败，请检查设备连接
    )
) else (
    echo 构建失败，请检查错误信息
)

pause