const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

// Log da configuração do banco de dados (excluindo senha)
console.log('Configuração do banco de dados:', {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  database: process.env.DB_NAME || 'virtualradio',
  connectionLimit: 10,
});

// Criar uma versão do pool que falha graciosamente
const createFallbackPool = () => {
  console.warn('Usando pool de banco de dados fallback - funcionalidade limitada');
  return {
    execute: async (...args) => {
      console.error('Tentativa de executar query com banco de dados indisponível:', args[0]);
      throw new Error('Conexão com banco de dados falhou');
    },
    query: async (...args) => {
      console.error('Tentativa de executar query com banco de dados indisponível:', args[0]);
      throw new Error('Conexão com banco de dados falhou');
    },
    getConnection: async () => {
      throw new Error('Conexão com banco de dados falhou');
    }
  };
};

// Configuração do pool real
const createRealPool = () => {
  return mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'virtualradio',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 20000, // 20 segundos
    acquireTimeout: 20000, // 20 segundos
    timeout: 20000, // 20 segundos
    debug: process.env.NODE_ENV !== 'production',
  });
};

// Sistema de fallback com retry
let pool;
let isConnected = false;
let connectionAttempts = 0;
const MAX_CONNECTION_ATTEMPTS = 5;

// Criar pool inicial - mesmo que falhe, o aplicativo continua
try {
  pool = createRealPool();
  console.log('Pool de banco de dados criado, tentando conectar...');
} catch (err) {
  console.error('Falha ao criar pool de banco de dados:', err.message);
  pool = createFallbackPool();
}

// Função para verificar a conexão
const checkConnection = async () => {
  if (connectionAttempts >= MAX_CONNECTION_ATTEMPTS) {
    console.error(`Máximo de ${MAX_CONNECTION_ATTEMPTS} tentativas de conexão atingido. Usando modo fallback.`);
    return;
  }

  connectionAttempts++;
  console.log(`Tentativa de conexão ao banco de dados (${connectionAttempts}/${MAX_CONNECTION_ATTEMPTS})...`);

  try {
    // Tentar obter uma conexão
    const connection = await pool.getConnection();
    connection.release();
    console.log('Conexão com banco de dados estabelecida com sucesso!');
    isConnected = true;
  } catch (err) {
    console.error(`Falha na tentativa ${connectionAttempts}: ${err.message}`);
    
    // Se ainda estiver usando o pool real mas falhou, tentar reconectar depois
    if (!(pool.query === createFallbackPool().query)) {
      setTimeout(checkConnection, 5000 * connectionAttempts); // Aumento gradual do tempo de retry
    }
  }
};

// Interceptar chamadas para garantir que tentamos reconectar automaticamente
const proxyHandler = {
  get: function(target, prop) {
    // Para métodos que fazem queries
    if (['query', 'execute', 'getConnection'].includes(prop)) {
      return async function(...args) {
        try {
          // Tentar executar a query normalmente
          return await target[prop](...args);
        } catch (err) {
          // Se a conexão falhou mas estamos usando o pool real, tente reconectar
          if (!isConnected && !(pool.query === createFallbackPool().query)) {
            console.log('Conexão perdida, tentando reconectar...');
            checkConnection();
          }
          throw err; // Continua propagando o erro para o handler no endpoint
        }
      };
    }
    return target[prop];
  }
};

// Iniciar a verificação de conexão (não espera, apenas inicia o processo)
checkConnection();

// Exportar um proxy para o pool que tenta reconectar quando necessário
module.exports = new Proxy(pool, proxyHandler); 