/**
 * Script de teste para verificar a conexão com a API do VirtualRadio
 * Execute com: node test-api-connection.js
 */

const fetch = require('node-fetch');

// URLs de teste
const localEndpoints = [
  'http://localhost:3000/api/test',
  'http://localhost:3000/api/auth/me',
  'http://localhost:3000/api/debug/status',
  'http://localhost:3000/db-status',
  'http://localhost:3000/health'
];

const remoteEndpoints = [
  'https://virtualradio.h4xd66.easypanel.host/api/test',
  'https://virtualradio.h4xd66.easypanel.host/api/auth/me',
  'https://virtualradio.h4xd66.easypanel.host/health'
];

async function testConnection() {
  console.log('========== TESTE DE CONEXÃO COM API ==========\n');

  // Testar portas locais para ver se o servidor está rodando
  console.log('Verificando se o servidor local está em execução...');
  try {
    const portCheckResponse = await fetch('http://localhost:3000');
    console.log('✅ Servidor local encontrado na porta 3000\n');
  } catch (error) {
    console.error('❌ Servidor local não encontrado na porta 3000');
    console.error(`   Erro: ${error.message}\n`);
    console.log('   Verifique se o servidor está em execução com: npm run dev\n');
  }

  // Testar endpoints locais
  console.log('========== TESTANDO ENDPOINTS LOCAIS ==========');
  for (const url of localEndpoints) {
    try {
      console.log(`\nTestando: ${url}`);
      const startTime = Date.now();
      const response = await fetch(url);
      const endTime = Date.now();
      const status = response.status;
      
      console.log(`Status: ${status} (${endTime - startTime}ms)`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`Resposta: ${JSON.stringify(data, null, 2)}`);
      } else {
        console.log(`Erro: ${response.statusText}`);
      }
    } catch (error) {
      console.error(`❌ Falha ao se conectar: ${error.message}`);
    }
  }

  // Testar endpoints remotos
  console.log('\n========== TESTANDO ENDPOINTS REMOTOS ==========');
  for (const url of remoteEndpoints) {
    try {
      console.log(`\nTestando: ${url}`);
      const startTime = Date.now();
      const response = await fetch(url);
      const endTime = Date.now();
      const status = response.status;
      
      console.log(`Status: ${status} (${endTime - startTime}ms)`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`Resposta: ${JSON.stringify(data, null, 2)}`);
      } else {
        console.log(`Erro: ${response.statusText}`);
      }
    } catch (error) {
      console.error(`❌ Falha ao se conectar: ${error.message}`);
    }
  }

  console.log('\n============ DIAGNÓSTICO ============');
  console.log('1. Se a API remota funciona mas a local não:');
  console.log('   - Verifique se o servidor local está rodando com "npm run dev"');
  console.log('   - Verifique se não há outro processo usando a porta 3000');
  console.log('   - Verifique as configurações de API no cliente');
  console.log('\n2. Se ambas APIs não funcionam:');
  console.log('   - Verifique sua conexão com a internet');
  console.log('   - Verifique se o servidor remoto está online');
  console.log('\n3. Se você está usando o cliente com a API local:');
  console.log('   - Certifique-se que client/api-config.local.js está sendo carregado corretamente');
}

testConnection(); 