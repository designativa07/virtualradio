@echo off
echo Iniciando MyRadio Server...
cd /d %~dp0
node server/index.js
pause 