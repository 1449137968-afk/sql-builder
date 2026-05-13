@echo off
cd /d "%~dp0"

start "SQL-Backend" /d "%~dp0backend" cmd /k "uvicorn main:app --host 0.0.0.0 --port 8000 --reload"
start "SQL-Frontend" /d "%~dp0frontend" cmd /k "npx vite --host 0.0.0.0 --port 5173"

timeout /t 3 /nobreak >nul
start http://localhost:5173
