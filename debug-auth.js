/**
 * VirtualRadio - Depurador de Autenticação
 * 
 * Este script testa todos os fluxos de autenticação com a API
 * para ajudar a diagnosticar problemas.
 * 
 * Uso: node debug-auth.js [local|remote]
 */

const fetch = require('node-fetch');

// Usuário de teste
const testUser = {
  email: 'admin@virtualradio.com',
  password: 'admin123'
};

// Configurações de API
const API_CONFIG = {
  local: {
    baseUrl: 'http://localhost:3000/api',
    name: 'LOCAL'
  },
  remote: {
    baseUrl: 'https://virtualradio.h4xd66.easypanel.host/api',
    name: 'REMOTA'
  }
};

// Determinar qual API testar com base no argumento da linha de comando
const apiTarget = process.argv[2] === 'remote' ? 'remote' : 'local';
const API = API_CONFIG[apiTarget];

console.log(`
========================================
 VirtualRadio - Depurador de Autenticação
========================================

Testando API ${API.name}: ${API.baseUrl}
`);

// Função para testar login normal
async function testLogin() {
  console.log('\n[TESTE] Login normal');
  
  try {
    const response = await fetch(`${API.baseUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testUser)
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Login bem-sucedido!');
      console.log(`Status: ${response.status}`);
      console.log('Token:', data.token ? data.token.substring(0, 20) + '...' : 'Não retornado');
      console.log('Usuário:', data.user ? JSON.stringify(data.user, null, 2) : 'Não retornado');
      
      // Retornar o token para uso em outros testes
      return data.token;
    } else {
      console.log('❌ Falha no login!');
      console.log(`Status: ${response.status}`);
      console.log('Erro:', data);
      return null;
    }
  } catch (error) {
    console.log('❌ Erro ao tentar login:');
    console.log(error.message);
    return null;
  }
}

// Função para testar login fallback
async function testLoginFallback() {
  console.log('\n[TESTE] Login fallback');
  
  try {
    const response = await fetch(`${API.baseUrl}/auth/login-fallback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testUser)
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Login fallback bem-sucedido!');
      console.log(`Status: ${response.status}`);
      console.log('Token:', data.token ? data.token.substring(0, 20) + '...' : 'Não retornado');
      console.log('Usuário:', data.user ? JSON.stringify(data.user, null, 2) : 'Não retornado');
      
      return data.token;
    } else {
      console.log('❌ Falha no login fallback!');
      console.log(`Status: ${response.status}`);
      console.log('Erro:', data);
      return null;
    }
  } catch (error) {
    console.log('❌ Erro ao tentar login fallback:');
    console.log(error.message);
    return null;
  }
}

// Função para testar verificação de autenticação
async function testAuthCheck(token) {
  console.log('\n[TESTE] Verificação de autenticação (/auth/me)');
  
  if (!token) {
    console.log('⚠️ Sem token disponível, teste será feito sem autenticação');
  }
  
  try {
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API.baseUrl}/auth/me`, {
      method: 'GET',
      headers: headers
    });
    
    try {
      const data = await response.json();
      
      if (response.ok) {
        console.log('✅ Verificação de autenticação bem-sucedida!');
        console.log(`Status: ${response.status}`);
        console.log('Dados:', JSON.stringify(data, null, 2));
      } else {
        console.log('❌ Falha na verificação de autenticação!');
        console.log(`Status: ${response.status}`);
        console.log('Erro:', data);
      }
    } catch (error) {
      console.log('❌ Erro ao tentar processar resposta:');
      console.log('Resposta não é um JSON válido ou outro erro de parsing');
      console.log('Erro:', error.message);
    }
  } catch (error) {
    console.log('❌ Erro ao tentar verificar autenticação:');
    console.log(error.message);
  }
}

// Função para testar conexão básica
async function testBasicConnection() {
  console.log('\n[TESTE] Conexão básica com a API (/test)');
  
  try {
    const response = await fetch(`${API.baseUrl}/test`);
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Conexão básica bem-sucedida!');
      console.log(`Status: ${response.status}`);
      console.log('Dados:', JSON.stringify(data, null, 2));
      return true;
    } else {
      console.log('❌ Falha na conexão básica!');
      console.log(`Status: ${response.status}`);
      console.log('Erro:', data);
      return false;
    }
  } catch (error) {
    console.log('❌ Erro ao tentar conexão básica:');
    console.log(error.message);
    return false;
  }
}

// Função principal que executa todos os testes
async function runTests() {
  // Primeiro verificar conexão básica
  const connected = await testBasicConnection();
  
  if (!connected) {
    console.log('\n⚠️ A conexão básica com a API falhou. Os outros testes podem não funcionar.');
    
    if (apiTarget === 'local') {
      console.log('\nVerificando se o servidor local está rodando...');
      
      // Sugerir ao usuário iniciar o servidor
      console.log('\nRecomendações:');
      console.log('1. Verifique se o servidor está rodando (npm run dev)');
      console.log('2. Verifique se não há outro processo usando a porta 3000');
      console.log('3. Tente usar o outro ambiente: node debug-auth.js remote');
    } else {
      console.log('\nVerificando conexão com o servidor remoto...');
      console.log('\nRecomendações:');
      console.log('1. Verifique sua conexão com a internet');
      console.log('2. Verifique se o servidor remoto está online');
      console.log('3. Tente usar o ambiente local: node debug-auth.js local');
    }
  }
  
  // Continua com os testes mesmo se a conexão básica falhar
  console.log('\n-----------------------------------------');
  
  // Testa login normal
  const token = await testLogin();
  
  // Testa login fallback
  const fallbackToken = await testLoginFallback();
  
  // Usa o token disponível, priorizando o normal
  const bestToken = token || fallbackToken;
  
  // Testa verificação de autenticação
  await testAuthCheck(bestToken);
  
  // Sugere ações com base nos resultados
  console.log('\n========================================');
  console.log('DIAGNÓSTICO E RECOMENDAÇÕES:');
  
  if (!connected) {
    console.log('❌ Problemas de conexão com a API. Verifique se o servidor está rodando e acessível.');
  } else if (!token && !fallbackToken) {
    console.log('❌ Todos os métodos de login falharam. Verifique as credenciais e o servidor.');
  } else if (!token && fallbackToken) {
    console.log('⚠️ Login normal falhou, mas o fallback funcionou. Pode haver problemas no banco de dados.');
  } else if (token) {
    console.log('✅ Login normal funcionou corretamente.');
  }
  
  console.log('\nPróximos passos:');
  console.log('1. Se o login funcionou mas a verificação de autenticação falhou, pode haver problemas no middleware de autenticação.');
  console.log('2. Se estiver usando o cliente da web, verifique se api-config.js e api-config.local.js estão configurados corretamente.');
  console.log('3. Para mais diagnósticos, use o servidor proxy de debug: node api-proxy-debug.js');
}

// Executar todos os testes
runTests().catch(error => {
  console.error('Erro fatal durante os testes:', error);
}); 