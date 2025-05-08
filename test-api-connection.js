/**
 * Script de teste para verificar a conexão com a API do VirtualRadio
 * Execute com: node test-api-connection.js
 */

const fetch = require('node-fetch');

// URLs de teste
const urls = [
  'http://localhost:3000/api/test',
  'http://localhost:3000/api/auth/me',
  'http://localhost:3000/api/debug/status',
  'http://localhost:3000/db-status',
  'http://localhost:3000/health'
];

async function testConnection() {
  console.log('Testando conexão com a API...\n');

  for (const url of urls) {
    try {
      console.log(`Testando: ${url}`);
      const response = await fetch(url);
      const status = response.status;
      
      console.log(`Status: ${status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`Resposta: ${JSON.stringify(data, null, 2)}\n`);
      } else {
        console.log(`Erro: ${response.statusText}\n`);
      }
    } catch (error) {
      console.error(`Falha ao se conectar: ${error.message}\n`);
    }
  }
}

testConnection(); 