// Arquivo de diagnóstico para problemas de modo offline
console.log('===================== DIAGNÓSTICO DE MODO =======================');
console.log('Variáveis de ambiente:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASS:', process.env.DB_PASS ? '[DEFINIDO]' : '[NÃO DEFINIDO]');
console.log('OFFLINE_MODE:', process.env.OFFLINE_MODE);

// Verificar se algum módulo está definindo um modo offline globalmente
if (global.OFFLINE_MODE !== undefined) {
  console.log('Modo offline definido globalmente:', global.OFFLINE_MODE);
}

// Verificar o status do arquivo de ambiente
try {
  require('dotenv').config();
  console.log('Arquivo .env carregado com sucesso');
} catch (error) {
  console.log('Erro ao carregar arquivo .env:', error.message);
}

console.log('===================== FIM DO DIAGNÓSTICO =======================');

// Exportar uma função para verificar o modo
module.exports = {
  isOfflineMode: () => {
    return process.env.OFFLINE_MODE === 'true' || global.OFFLINE_MODE === true;
  },
  disableOfflineMode: () => {
    if (global.OFFLINE_MODE !== undefined) {
      global.OFFLINE_MODE = false;
      console.log('Modo offline global desativado');
    }
    process.env.OFFLINE_MODE = 'false';
    console.log('Variável de ambiente OFFLINE_MODE definida como false');
  }
}; 