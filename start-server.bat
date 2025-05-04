@echo off
echo Iniciando MyRadio Server...
cd /d %~dp0
set OFFLINE_MODE=false
set NODE_ENV=production
node server/index.js
pause 