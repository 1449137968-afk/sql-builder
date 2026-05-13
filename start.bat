@echo off
chcp 65001 >nul
title SQL 点选式生成器

echo ========================================
echo   SQL 点选式生成器 - 启动中...
echo ========================================
echo.

cd /d "%~dp0"

:: 启动后端
echo [1/3] 启动后端 (FastAPI)...
start "SQL-Backend" /d "%~dp0backend" cmd /k "echo 后端运行中 - http://localhost:8000 && uvicorn main:app --host 0.0.0.0 --port 8000 --reload"

:: 启动前端
echo [2/3] 启动前端 (Vite)...
start "SQL-Frontend" /d "%~dp0frontend" cmd /k "echo 前端运行中 - http://localhost:5173 && npx vite --host 0.0.0.0 --port 5173"

:: 等待服务启动后打开浏览器
echo [3/3] 等待服务就绪后打开浏览器...
timeout /t 4 /nobreak >nul
start http://localhost:5173

echo.
echo ========================================
echo   启动完成！
echo   构建器: http://localhost:5173
echo   后端API: http://localhost:8000
echo   关闭窗口不会停止服务，需手动关闭命令行窗口
echo ========================================
echo.

pause
