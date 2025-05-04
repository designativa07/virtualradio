#!/bin/bash

echo "===== REINICIANDO SERVIDOR MYRADIO ====="
echo "Desativando modo offline e aplicando correções..."

# Garantir que as dependências estão instaladas
echo "Atualizando dependências..."
npm install

# Executar o diagnóstico para verificar problemas
echo "Executando diagnóstico..."
node server/debug.js

# Parar o servidor atual (se estiver rodando)
if pgrep -f "node server/index.js" > /dev/null; then
  echo "Parando servidor atual..."
  pkill -f "node server/index.js"
fi

# Limpar logs e cache
echo "Limpando cache..."
rm -f nohup.out
npm cache clean --force

# Reiniciar o servidor
echo "Iniciando servidor em modo de produção..."
export NODE_ENV=production
export OFFLINE_MODE=false
nohup node server/index.js > server.log 2>&1 &

echo "Servidor reiniciado! Verificando logs..."
sleep 2
tail -n 20 server.log

echo "===== REINICIALIZAÇÃO CONCLUÍDA =====" 