const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Tentar localizar o arquivo .env
console.log('Current working directory:', process.cwd());
console.log('Checking if .env exists in current directory:', fs.existsSync('.env'));
console.log('Absolute path to .env:', path.resolve('.env'));

// Carregar variáveis de ambiente manualmente com caminho absoluto
const result = dotenv.config({ path: path.resolve('.env') });
console.log('dotenv.config result:', result);

// Verificar variáveis carregadas
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASS:', process.env.DB_PASS);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('SESSION_SECRET:', process.env.SESSION_SECRET);

// Tentar carregar .env de diferentes locais
const locations = [
  '.env',
  '../.env',
  '../../.env',
  './server/.env',
  './config/.env'
];

locations.forEach(location => {
  const absPath = path.resolve(location);
  console.log(`Checking ${location}:`, {
    path: absPath,
    exists: fs.existsSync(absPath)
  });
}); 