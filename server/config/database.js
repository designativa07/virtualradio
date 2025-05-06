const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

// Log da configuração do banco de dados (excluindo senha)
console.log('Configuração do banco de dados:', {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'desig938_myradio',
  database: process.env.DB_NAME || 'desig938_myradio',
  connectionLimit: 10,
});

// Criar uma versão do pool que falha graciosamente
const createFallbackPool = () => {
  console.warn('\n=============================================================');
  console.warn('ATENÇÃO: Usando pool de banco de dados fallback!');
  console.warn('O aplicativo está operando em modo de mock (dados simulados).');
  console.warn('Verifique se o servidor MySQL está ativo e as credenciais estão corretas.');
  console.warn('=============================================================\n');
  
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
  // Configurações fixas para garantir a conexão
  const dbConfig = {
    host: 'localhost',
    user: 'desig938_myradio',
    password: 'giNdvTR[l*Tm',
    database: 'desig938_myradio',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 20000, // 20 segundos
    acquireTimeout: 20000, // 20 segundos
    timeout: 20000, // 20 segundos
    debug: process.env.NODE_ENV !== 'production',
  };
  
  // Log para debug
  console.log('Tentando conectar ao banco de dados com configuração fixa:', {
    host: dbConfig.host,
    user: dbConfig.user,
    database: dbConfig.database,
    connectionLimit: dbConfig.connectionLimit
  });
  
  return mysql.createPool(dbConfig);
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
    console.error(`\n===================================================`);
    console.error(`Máximo de ${MAX_CONNECTION_ATTEMPTS} tentativas de conexão atingido.`);
    console.error(`Usando modo fallback - DADOS SIMULADOS ATIVOS.`);
    console.error(`Verifique as credenciais do banco de dados em seu arquivo .env:`);
    console.error(`HOST: ${process.env.DB_HOST || 'não definido'}`);
    console.error(`USER: ${process.env.DB_USER || 'não definido'}`);
    console.error(`DB: ${process.env.DB_NAME || 'não definido'}`);
    console.error(`===================================================\n`);
    return;
  }

  connectionAttempts++;
  console.log(`Tentativa de conexão ao banco de dados (${connectionAttempts}/${MAX_CONNECTION_ATTEMPTS})...`);

  try {
    // Tentar obter uma conexão
    const connection = await pool.getConnection();
    connection.release();
    console.log('\n===================================================');
    console.log('Conexão com banco de dados estabelecida com sucesso!');
    console.log('===================================================\n');
    isConnected = true;
  } catch (err) {
    console.error(`Falha na tentativa ${connectionAttempts}: ${err.message}`);
    console.error('Código de erro:', err.code || 'DESCONHECIDO');
    
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