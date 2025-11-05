@echo off
REM Backend startup script for Windows

cd /d %~dp0
call venv\Scripts\activate.bat
uvicorn app:app --reload --port 5000

