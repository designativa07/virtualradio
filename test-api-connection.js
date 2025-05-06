/**
 * Teste de Conexão com API
 * Este script simples testa a conexão com a API local ou remota
 * Pode ser executado com Node.js
 */

// Função para testar a conexão com a API
async function testApiConnection() {
  const urls = [
    'http://localhost:3000/api/auth/me',
    'https://virtualradio.h4xd66.easypanel.host/api/auth/me'
  ];

  console.log('Iniciando testes de conexão com API...');

  for (const url of urls) {
    try {
      console.log(`\nTestando conexão com: ${url}`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // Adicionando um token fake para testar
          'Authorization': 'Bearer test-token'
        }
      });

      const data = await response.json();
      console.log(`Status: ${response.status}`);
      console.log('Resposta:', data);
    } catch (error) {
      console.error(`Erro ao conectar com ${url}:`, error.message);
    }
  }
}

// Executar o teste
testApiConnection().then(() => {
  console.log('\nTestes de conexão concluídos.');
}); 