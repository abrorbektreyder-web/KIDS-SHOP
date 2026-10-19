@echo off
cd /d "%~dp0"
echo KIDS-SHOP lokal serveri ishga tushmoqda...
echo Brauzerda oching: http://127.0.0.1:4173
echo To'xtatish uchun ushbu oynada Ctrl+C bosing.
py -3 local_server.py
pause
