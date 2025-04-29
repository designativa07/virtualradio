const sequelize = require('./db');
const User = require('../models/User');
const Radio = require('../models/Radio');
const Music = require('../models/Music');
const Spot = require('../models/Spot');

const initDatabase = async () => {
  try {
    // Sincronizar todos os modelos com o banco de dados
    // A opção force: true recria as tabelas (use com cuidado em produção)
    await sequelize.sync({ force: false });
    console.log('Banco de dados sincronizado com sucesso');

    // Verificar se existe um usuário administrador, se não, criar um
    const adminExists = await User.findOne({ where: { email: 'admin@myradio.com' } });
    
    if (!adminExists) {
      await User.create({
        name: 'Administrador',
        email: 'admin@myradio.com',
        password: 'admin123', // Este será automaticamente criptografado pelo hook beforeCreate no modelo
        role: 'admin'
      });
      console.log('Usuário administrador criado com sucesso');
    }

    console.log('Inicialização do banco de dados concluída');
  } catch (error) {
    console.error('Erro ao inicializar o banco de dados:', error);
  }
};

module.exports = initDatabase; 