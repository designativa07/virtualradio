@echo off
echo Configurando MyRadio...
cd /d %~dp0

echo Criando estrutura de pastas...
if not exist "server\uploads\music" mkdir server\uploads\music
if not exist "server\uploads\spot" mkdir server\uploads\spot

echo Configuração concluída!
echo Para iniciar o servidor, execute start-server.bat
pause 