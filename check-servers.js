/**
 * VirtualRadio - Verificador de Servidores
 * 
 * Este script verifica o status de todos os servidores e endpoints
 * necessários para o funcionamento da aplicação.
 * 
 * Uso: node check-servers.js
 */

const fetch = require('node-fetch');
const { execSync } = require('child_process');
const os = require('os');
const net = require('net');
const dns = require('dns');
const fs = require('fs');

// URLs para verificar
const endpoints = {
  local: {
    api: 'http://localhost:3000/api/test',
    health: 'http://localhost:3000/health',
    dbStatus: 'http://localhost:3000/db-status'
  },
  remote: {
    api: 'https://virtualradio.h4xd66.easypanel.host/api/test',
    health: 'https://virtualradio.h4xd66.easypanel.host/health'
  }
};

// Verificar se uma porta está em uso
function isPortInUse(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(true); // Porta está em uso
      } else {
        resolve(false);
      }
    });
    
    server.once('listening', () => {
      server.close();
      resolve(false); // Porta está livre
    });
    
    server.listen(port);
  });
}

// Verificar se um processo está rodando
function isProcessRunning(processName) {
  try {
    let command;
    if (process.platform === 'win32') {
      command = `tasklist /FI "IMAGENAME eq ${processName}" | find /i "${processName}"`;
    } else {
      command = `ps aux | grep -v grep | grep ${processName}`;
    }
    
    const output = execSync(command, { encoding: 'utf8' });
    return output.toLowerCase().includes(processName.toLowerCase());
  } catch (error) {
    return false;
  }
}

// Testar conexão DNS
function testDnsResolution(hostname) {
  return new Promise((resolve) => {
    dns.lookup(hostname, (err, address) => {
      if (err) {
        resolve({ success: false, error: err.message });
      } else {
        resolve({ success: true, address });
      }
    });
  });
}

// Testar um endpoint
async function testEndpoint(name, url) {
  try {
    console.log(`Testando ${name}: ${url}`);
    const startTime = Date.now();
    const response = await fetch(url, { timeout: 5000 });
    const endTime = Date.now();
    
    const data = await response.json();
    
    return {
      success: response.ok,
      status: response.status,
      responseTime: endTime - startTime,
      data: data
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// Função principal
async function checkServers() {
  console.log('===========================================');
  console.log('  VirtualRadio - Verificador de Servidores');
  console.log('===========================================\n');
  
  // Informações do sistema
  console.log('INFORMAÇÕES DO SISTEMA:');
  console.log(`Sistema Operacional: ${os.type()} ${os.release()}`);
  console.log(`Hostname: ${os.hostname()}`);
  console.log(`Memória Total: ${Math.round(os.totalmem() / (1024 * 1024 * 1024))} GB`);
  console.log(`Memória Livre: ${Math.round(os.freemem() / (1024 * 1024 * 1024))} GB`);
  console.log(`CPUs: ${os.cpus().length}`);
  console.log(`Node.js: ${process.version}`);
  console.log('\n');
  
  // Verificar se o servidor local está rodando
  console.log('VERIFICANDO SERVIDOR LOCAL:');
  const port3000InUse = await isPortInUse(3000);
  console.log(`Porta 3000 em uso: ${port3000InUse ? 'Sim ✓' : 'Não ✗'}`);
  
  const nodeRunning = isProcessRunning('node.exe') || isProcessRunning('node');
  console.log(`Processo Node.js em execução: ${nodeRunning ? 'Sim ✓' : 'Não ✗'}`);
  
  // Verificar arquivos de configuração
  console.log('\nARQUIVOS DE CONFIGURAÇÃO:');
  const envExists = fs.existsSync('.env');
  console.log(`.env existe: ${envExists ? 'Sim ✓' : 'Não ✗'}`);
  
  const envLocalExists = fs.existsSync('.env.local');
  console.log(`.env.local existe: ${envLocalExists ? 'Sim ✓' : 'Não ✗'}`);
  
  const apiConfigExists = fs.existsSync('client/api-config.js');
  console.log(`client/api-config.js existe: ${apiConfigExists ? 'Sim ✓' : 'Não ✗'}`);
  
  const apiConfigLocalExists = fs.existsSync('client/api-config.local.js');
  console.log(`client/api-config.local.js existe: ${apiConfigLocalExists ? 'Sim ✓' : 'Não ✗'}`);
  
  // Testar DNS para o site remoto
  console.log('\nTESTANDO RESOLUÇÃO DNS:');
  const dnsResult = await testDnsResolution('virtualradio.h4xd66.easypanel.host');
  console.log(`Resolução de virtualradio.h4xd66.easypanel.host: ${dnsResult.success ? 'Sucesso ✓' : 'Falha ✗'}`);
  if (dnsResult.success) {
    console.log(`Endereço IP: ${dnsResult.address}`);
  } else {
    console.log(`Erro: ${dnsResult.error}`);
  }
  
  // Testar endpoints
  console.log('\nTESTANDO ENDPOINTS LOCAIS:');
  for (const [name, url] of Object.entries(endpoints.local)) {
    const result = await testEndpoint(`local.${name}`, url);
    if (result.success) {
      console.log(`✅ ${name}: ${result.status} OK (${result.responseTime}ms)`);
    } else {
      console.log(`❌ ${name}: Falha - ${result.error}`);
    }
  }
  
  console.log('\nTESTANDO ENDPOINTS REMOTOS:');
  for (const [name, url] of Object.entries(endpoints.remote)) {
    const result = await testEndpoint(`remote.${name}`, url);
    if (result.success) {
      console.log(`✅ ${name}: ${result.status} OK (${result.responseTime}ms)`);
    } else {
      console.log(`❌ ${name}: Falha - ${result.error}`);
    }
  }
  
  // Diagnóstico final
  console.log('\n===========================================');
  console.log('DIAGNÓSTICO:');
  
  if (!port3000InUse) {
    console.log('❌ O servidor local não parece estar rodando na porta 3000.');
    console.log('   - Tente iniciar o servidor com "npm run dev"');
  }
  
  if (!dnsResult.success) {
    console.log('❌ Problemas de DNS ao acessar o servidor remoto.');
    console.log('   - Verifique sua conexão com a internet');
    console.log('   - Verifique se o endereço do servidor está correto');
  }
  
  console.log('\nRECOMENDAÇÕES:');
  console.log('1. Se estiver desenvolvendo localmente:');
  console.log('   - Certifique-se que o servidor local esteja rodando (npm run dev)');
  console.log('   - Verifique se o cliente está configurado para usar a API local');
  
  console.log('\n2. Se estiver usando o servidor remoto:');
  console.log('   - Verifique sua conexão com a internet');
  console.log('   - Verifique se o servidor remoto está online');
  
  console.log('\n3. Para corrigir problemas com a API:');
  console.log('   - Tente usar o servidor proxy de debug: node api-proxy-debug.js');
  console.log('   - Configure o cliente para usar http://localhost:3001/api');
}

// Executar a verificação
checkServers().catch(error => {
  console.error('Erro durante a verificação:', error);
}); 