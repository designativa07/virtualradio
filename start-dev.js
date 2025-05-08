/**
 * VirtualRadio - Script de Inicialização para Desenvolvimento
 * 
 * Este script configura e inicia o ambiente de desenvolvimento
 * incluindo o servidor da API e o proxy de debug se necessário.
 * 
 * Uso: node start-dev.js
 */

const { spawn, exec, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Cores para console
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Configurações
const config = {
  useProxy: true,
  proxyPort: 3001,
  apiPort: 3000,
  clientPort: 3002
};

// Interface de linha de comando
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Pergunta com opções
function question(text, options = []) {
  return new Promise((resolve) => {
    if (options.length === 0) {
      rl.question(text, (answer) => {
        resolve(answer);
      });
      return;
    }
    
    const optionsText = options.map((opt, index) => `${index + 1}. ${opt}`).join('\n');
    rl.question(`${text}\n${optionsText}\n> `, (answer) => {
      const num = parseInt(answer);
      if (num >= 1 && num <= options.length) {
        resolve(options[num - 1]);
      } else {
        resolve(answer);
      }
    });
  });
}

// Verificar se uma porta está em uso
function isPortInUse(port) {
  try {
    const command = process.platform === 'win32'
      ? `netstat -ano | findstr :${port}`
      : `lsof -i:${port} -t`;
      
    const output = execSync(command, { encoding: 'utf8' });
    return output.trim() !== '';
  } catch (error) {
    return false;
  }
}

// Verificar se um processo está rodando
function findProcess(name) {
  try {
    const command = process.platform === 'win32'
      ? `tasklist /FI "IMAGENAME eq ${name}" | find /i "${name}"`
      : `pgrep -l ${name}`;
      
    const output = execSync(command, { encoding: 'utf8' });
    return output.toLowerCase().includes(name.toLowerCase());
  } catch (error) {
    return false;
  }
}

// Verificar e configurar o ambiente
async function checkEnvironment() {
  console.log(`${colors.bright}${colors.blue}=== Verificando ambiente de desenvolvimento ===${colors.reset}\n`);
  
  // Verificar se os arquivos de configuração existem
  const envExists = fs.existsSync('.env');
  const envLocalExists = fs.existsSync('.env.local');
  
  if (!envExists && !envLocalExists) {
    console.log(`${colors.yellow}Aviso: Arquivos .env ou .env.local não encontrados.${colors.reset}`);
    const createEnv = await question('Deseja criar um arquivo .env.local com configurações padrão? (s/n): ');
    
    if (createEnv.toLowerCase() === 's') {
      const envContent = `# Configurações locais para VirtualRadio
DB_HOST=localhost
DB_USER=desig938_myradio
DB_PASS=VirtualRadio123
DB_NAME=desig938_myradio
PORT=3000
NODE_ENV=development
SESSION_SECRET=virtualradioappsecretkey
CLIENT_URL=http://localhost:3002
`;
      fs.writeFileSync('.env.local', envContent);
      console.log(`${colors.green}Arquivo .env.local criado com sucesso.${colors.reset}`);
    }
  }
  
  // Verificar configuração da API do cliente
  const apiConfigLocalExists = fs.existsSync('client/api-config.local.js');
  
  if (!apiConfigLocalExists) {
    console.log(`${colors.yellow}Aviso: Arquivo client/api-config.local.js não encontrado.${colors.reset}`);
    const createApiConfig = await question('Deseja criar o arquivo de configuração local da API? (s/n): ');
    
    if (createApiConfig.toLowerCase() === 's') {
      const configContent = `/**
 * Configuração local da API do VirtualRadio
 * Este arquivo é usado apenas em ambiente de desenvolvimento local
 */

// Definir a URL base da API local
window.API_BASE_URL = '${config.useProxy ? `http://localhost:${config.proxyPort}/api` : `http://localhost:${config.apiPort}/api`}';

// Função para construir URLs da API
window.getApiUrl = function(endpoint) {
  // Remover barra inicial se presente
  if (endpoint.startsWith('/')) {
    endpoint = endpoint.substring(1);
  }
  return \`\${window.API_BASE_URL}/\${endpoint}\`;
};

// Interceptar todas as chamadas de fetch para gerenciar APIs
(function() {
  const originalFetch = window.fetch;
  
  window.fetch = function(url, options = {}) {
    // Se for uma chamada para API
    if (typeof url === 'string' && (url.includes('/api/') || url.startsWith('/api/'))) {
      // Normalizar a URL
      const apiPath = url.split('/api/')[1];
      const newUrl = \`\${window.API_BASE_URL}/\${apiPath}\`;
      
      // Log para depuração
      console.log(\`[API Local] \${url} -> \${newUrl}\`);
      
      // Adicionar headers padrão se não existirem
      options.headers = options.headers || {};
      options.headers['Content-Type'] = options.headers['Content-Type'] || 'application/json';
      
      // Adicionar token de autenticação se disponível
      const token = localStorage.getItem('authToken');
      if (token && !options.headers['Authorization']) {
        options.headers['Authorization'] = \`Bearer \${token}\`;
      }
      
      // Tentar usar a API local
      return originalFetch(newUrl, options)
        .then(response => {
          console.log(\`[API Response] \${newUrl} - Status: \${response.status}\`);
          return response;
        })
        .catch(error => {
          console.error(\`[API Error] Falha ao conectar com \${newUrl}:\`, error.message);
          
          // Fallback para autenticação
          if (url.includes('/auth/me')) {
            console.log('[API Fallback] Usando mock de autenticação');
            return Promise.resolve(new Response(JSON.stringify({
              authenticated: true,
              user: {
                id: 1,
                name: 'Administrador',
                email: 'admin@virtualradio.com',
                role: 'admin'
              },
              isTest: true,
              message: 'Autenticação local (modo offline)'
            }), { 
              status: 200, 
              headers: { 'Content-Type': 'application/json' }
            }));
          }
          
          // Para outros endpoints sem fallback, retornar o erro
          return Promise.reject(error);
        });
    }
    
    // Para chamadas não-API, usar fetch normal
    return originalFetch(url, options);
  };
})();

console.log('[API Config] Configuração local carregada, usando:', window.API_BASE_URL);
`;
      
      fs.writeFileSync('client/api-config.local.js', configContent);
      console.log(`${colors.green}Arquivo client/api-config.local.js criado com sucesso.${colors.reset}`);
    }
  }
  
  // Verificar configuração do package.json
  if (fs.existsSync('package.json')) {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    if (!packageJson.scripts || !packageJson.scripts.dev) {
      console.log(`${colors.yellow}Aviso: Script 'dev' não encontrado no package.json.${colors.reset}`);
      const updatePackage = await question('Deseja adicionar os scripts de desenvolvimento? (s/n): ');
      
      if (updatePackage.toLowerCase() === 's') {
        packageJson.scripts = packageJson.scripts || {};
        packageJson.scripts.dev = 'nodemon server/index.js';
        packageJson.scripts['dev:client'] = 'cd client && npm run dev';
        packageJson.scripts['dev:proxy'] = 'node api-proxy-debug.js';
        packageJson.scripts['dev:all'] = 'node start-dev.js';
        
        fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
        console.log(`${colors.green}Scripts de desenvolvimento adicionados ao package.json.${colors.reset}`);
      }
    }
  }
  
  // Verificar pacotes necessários
  try {
    console.log(`${colors.dim}Verificando pacotes necessários...${colors.reset}`);
    execSync('npm list nodemon', { stdio: 'ignore' });
    execSync('npm list node-fetch', { stdio: 'ignore' });
  } catch (error) {
    console.log(`${colors.yellow}Aviso: Alguns pacotes necessários não estão instalados.${colors.reset}`);
    const installPackages = await question('Deseja instalar os pacotes necessários? (s/n): ');
    
    if (installPackages.toLowerCase() === 's') {
      console.log(`${colors.dim}Instalando pacotes...${colors.reset}`);
      execSync('npm install --save-dev nodemon', { stdio: 'inherit' });
      execSync('npm install node-fetch', { stdio: 'inherit' });
      console.log(`${colors.green}Pacotes instalados com sucesso.${colors.reset}`);
    }
  }
}

// Iniciar o servidor da API
function startApiServer() {
  console.log(`${colors.bright}${colors.green}=== Iniciando Servidor API (porta ${config.apiPort}) ===${colors.reset}`);
  
  const serverProcess = spawn('npm', ['run', 'dev'], {
    stdio: 'inherit',
    shell: true
  });
  
  serverProcess.on('error', (error) => {
    console.error(`${colors.red}Erro ao iniciar servidor API: ${error.message}${colors.reset}`);
  });
  
  return serverProcess;
}

// Iniciar o servidor proxy
function startProxyServer() {
  if (!config.useProxy) return null;
  
  console.log(`${colors.bright}${colors.magenta}=== Iniciando Servidor Proxy de Debug (porta ${config.proxyPort}) ===${colors.reset}`);
  
  const proxyProcess = spawn('node', ['api-proxy-debug.js'], {
    stdio: 'inherit',
    shell: true
  });
  
  proxyProcess.on('error', (error) => {
    console.error(`${colors.red}Erro ao iniciar servidor proxy: ${error.message}${colors.reset}`);
  });
  
  return proxyProcess;
}

// Iniciar o cliente
function startClient() {
  console.log(`${colors.bright}${colors.cyan}=== Iniciando Cliente (porta ${config.clientPort}) ===${colors.reset}`);
  
  const clientProcess = spawn('npm', ['run', 'dev:client'], {
    stdio: 'inherit',
    shell: true
  });
  
  clientProcess.on('error', (error) => {
    console.error(`${colors.red}Erro ao iniciar cliente: ${error.message}${colors.reset}`);
  });
  
  return clientProcess;
}

// Função principal
async function main() {
  try {
    console.log(`${colors.bright}${colors.green}
===========================================
  VirtualRadio - Ambiente de Desenvolvimento
===========================================
${colors.reset}`);
    
    // Verificar ambiente
    await checkEnvironment();
    
    // Verificar portas em uso
    if (isPortInUse(config.apiPort)) {
      console.log(`${colors.yellow}Aviso: Porta ${config.apiPort} já está em uso.${colors.reset}`);
      const answer = await question('Deseja encerrar o processo usando esta porta? (s/n): ');
      
      if (answer.toLowerCase() === 's') {
        try {
          if (process.platform === 'win32') {
            execSync(`for /f "tokens=5" %a in ('netstat -aon ^| findstr :${config.apiPort}') do taskkill /f /pid %a`, { stdio: 'inherit' });
          } else {
            execSync(`lsof -ti:${config.apiPort} | xargs kill -9`, { stdio: 'inherit' });
          }
          console.log(`${colors.green}Processo na porta ${config.apiPort} encerrado.${colors.reset}`);
        } catch (error) {
          console.error(`${colors.red}Não foi possível encerrar o processo: ${error.message}${colors.reset}`);
          process.exit(1);
        }
      } else {
        config.apiPort = parseInt(await question(`Informe uma porta alternativa para o servidor API: `)) || 3005;
        console.log(`${colors.green}Usando porta ${config.apiPort} para o servidor API.${colors.reset}`);
      }
    }
    
    if (config.useProxy && isPortInUse(config.proxyPort)) {
      console.log(`${colors.yellow}Aviso: Porta ${config.proxyPort} já está em uso.${colors.reset}`);
      const answer = await question('Deseja encerrar o processo usando esta porta? (s/n): ');
      
      if (answer.toLowerCase() === 's') {
        try {
          if (process.platform === 'win32') {
            execSync(`for /f "tokens=5" %a in ('netstat -aon ^| findstr :${config.proxyPort}') do taskkill /f /pid %a`, { stdio: 'inherit' });
          } else {
            execSync(`lsof -ti:${config.proxyPort} | xargs kill -9`, { stdio: 'inherit' });
          }
          console.log(`${colors.green}Processo na porta ${config.proxyPort} encerrado.${colors.reset}`);
        } catch (error) {
          console.error(`${colors.red}Não foi possível encerrar o processo: ${error.message}${colors.reset}`);
        }
      } else {
        config.proxyPort = parseInt(await question(`Informe uma porta alternativa para o servidor proxy: `)) || 3006;
        console.log(`${colors.green}Usando porta ${config.proxyPort} para o servidor proxy.${colors.reset}`);
      }
    }
    
    // Perguntar se deve usar o proxy
    const useProxyAnswer = await question('Deseja usar o servidor proxy de debug? (s/n): ');
    config.useProxy = useProxyAnswer.toLowerCase() === 's';
    
    // Iniciar servidores
    const apiProcess = startApiServer();
    
    // Esperar um pouco para o servidor API iniciar
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const proxyProcess = config.useProxy ? startProxyServer() : null;
    
    // Esperar um pouco para o proxy iniciar
    if (config.useProxy) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    const clientProcess = startClient();
    
    console.log(`${colors.bright}${colors.green}
===========================================
  Ambiente de desenvolvimento iniciado!
===========================================

Servidores em execução:
- API: http://localhost:${config.apiPort}${config.useProxy ? `
- Proxy: http://localhost:${config.proxyPort}` : ''}
- Cliente: http://localhost:${config.clientPort}

Pressione Ctrl+C para encerrar todos os processos.
${colors.reset}`);
    
    // Encerrar processos ao sair
    const cleanup = () => {
      console.log(`${colors.yellow}\nEncerrando processos...${colors.reset}`);
      if (apiProcess) apiProcess.kill();
      if (proxyProcess) proxyProcess.kill();
      if (clientProcess) clientProcess.kill();
      rl.close();
      process.exit(0);
    };
    
    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
    
  } catch (error) {
    console.error(`${colors.red}Erro ao iniciar ambiente de desenvolvimento: ${error.message}${colors.reset}`);
    rl.close();
    process.exit(1);
  }
}

// Executar função principal
main(); 