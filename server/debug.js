// Arquivo de diagnóstico avançado para problemas persistentes de modo offline
// Execute este arquivo diretamente para diagnóstico detalhado: node debug.js

console.log('\n\n============= DIAGNÓSTICO COMPLETO DE MODO OFFLINE =============');

// Verifica o ambiente atual
console.log('Ambiente Node.js:', process.version);
console.log('Variáveis de ambiente:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('OFFLINE_MODE:', process.env.OFFLINE_MODE);

// Verifica valores globais
console.log('\nVariáveis globais:');
if (global.OFFLINE_MODE !== undefined) {
  console.log('global.OFFLINE_MODE =', global.OFFLINE_MODE);
} else {
  console.log('global.OFFLINE_MODE não está definido');
}

// Procurar por require e módulos carregados
console.log('\nVerificando módulos carregados:');
console.log('require.cache keys:', Object.keys(require.cache));

// Mensagem específica para debugar
console.log('\nINJETANDO MONITORAMENTO DE VARIÁVEIS GLOBAIS');
const originalDefineProperty = Object.defineProperty;
Object.defineProperty = function(obj, prop, descriptor) {
  if (prop === 'OFFLINE_MODE' && obj === global) {
    console.log('TENTATIVA DE DEFINIR OFFLINE_MODE DETECTADA!');
    console.log('Stack trace:');
    console.log(new Error().stack);
  }
  return originalDefineProperty(obj, prop, descriptor);
};

// Verificar se os controladores alterados estão usando o código correto
console.log('\nVerificando controladores:');
try {
  // Tenta carregar o controlador de rádio para verificar
  const radioController = require('./controllers/radioController');
  console.log('✅ Controlador de rádio carregado, verificando implementação...');
  
  // Análise do código fonte
  const fs = require('fs');
  const controllerFiles = [
    './controllers/radioController.js',
    './controllers/musicController.js',
    './controllers/spotController.js'
  ];

  controllerFiles.forEach(file => {
    try {
      const content = fs.readFileSync(file, 'utf8');
      const hasOfflineCode = 
        content.includes('Modo offline') || 
        content.includes('global.offlineRadios') ||
        content.includes('exampleRadio') ||
        content.includes('exampleMusic') ||
        content.includes('exampleSpot');
      
      if (hasOfflineCode) {
        console.log(`❌ ${file} ainda contém código de modo offline!`);
      } else {
        console.log(`✅ ${file} não contém código de modo offline.`);
      }
    } catch (err) {
      console.log(`❌ Erro ao analisar ${file}:`, err.message);
    }
  });
} catch (error) {
  console.log('❌ Erro ao carregar controlador:', error.message);
}

// Testar conexão com banco de dados
console.log('\nVerificando conexão com banco de dados:');
try {
  const sequelize = require('./config/db');
  
  // Testa a conexão
  sequelize.authenticate()
    .then(() => {
      console.log('✅ Conexão com banco de dados OK!');
      finishDiagnostic();
    })
    .catch(err => {
      console.log('❌ Erro na conexão com banco de dados:', err.message);
      finishDiagnostic();
    });
} catch (error) {
  console.log('❌ Erro ao carregar módulo de banco de dados:', error.message);
  finishDiagnostic();
}

function finishDiagnostic() {
  console.log('\n============= RECOMENDAÇÕES =============');
  console.log('1. Verifique se todos os controladores foram corretamente alterados');
  console.log('2. Confirme que as credenciais do banco de dados estão corretas');
  console.log('3. Verifique se o banco de dados está acessível a partir do servidor');
  console.log('4. Reinicie o servidor após as alterações');
  console.log('\n============= FIM DO DIAGNÓSTICO =============\n');
  
  // Encerra o processo se este arquivo for executado diretamente
  if (require.main === module) {
    process.exit(0);
  }
}

// Se este arquivo for importado como módulo, exporta funções úteis
module.exports = {
  runDiagnostic: finishDiagnostic,
  disableOfflineMode: () => {
    global.OFFLINE_MODE = false;
    process.env.OFFLINE_MODE = 'false';
    console.log('Modo offline desativado por módulo de diagnóstico');
  }
}; 