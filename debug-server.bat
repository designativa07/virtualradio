@echo off
echo ===== INICIANDO MYRADIO EM MODO DEBUG =====
cd /d %~dp0

echo DEFININDO VARIAVEIS DE AMBIENTE...
set OFFLINE_MODE=false
set NODE_ENV=production
set DEBUG=true

echo LIMPANDO LOGS ANTIGOS...
if exist debug-log.txt del debug-log.txt

echo INICIANDO SERVIDOR COM MONITORAMENTO...
echo Pressione CTRL+C para interromper o servidor
node server/index.js > debug-log.txt 2>&1

echo SERVIDOR ENCERRADO - Verifique debug-log.txt para detalhes 