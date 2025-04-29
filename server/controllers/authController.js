const jwt = require('jsonwebtoken');
const { User } = require('../models');

// Configuração fixa do JWT
const JWT_SECRET = 'myradio_secret_key';
const JWT_EXPIRES_IN = '1d';

// Gerar token JWT
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  });
};

// Registrar novo usuário
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Verificar se o usuário já existe
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'Este email já está registrado.' });
    }

    // Criar novo usuário
    const user = await User.create({
      name,
      email,
      password
    });

    // Gerar token
    const token = generateToken(user.id);

    // Retornar resposta
    res.status(201).json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Erro ao registrar usuário:', error);
    res.status(500).json({ message: 'Erro no servidor', error: error.message });
  }
};

// Login
exports.login = async (req, res) => {
  try {
    // Bypass de autenticação - criar usuário temporário sem verificar no banco
    const tempUser = {
      id: 1,
      name: 'Administrador Temporário',
      email: req.body.email || 'admin@temp.com',
      role: 'admin'
    };

    // Gerar token
    const token = generateToken(tempUser.id);

    // Retornar resposta
    res.status(200).json({
      success: true,
      token,
      user: tempUser
    });
  } catch (error) {
    console.error('Erro ao fazer login:', error);
    res.status(500).json({ message: 'Erro no servidor', error: error.message });
  }
};

// Verificar usuário atual
exports.me = async (req, res) => {
  try {
    // Bypass - retornar o usuário do req sem consultar o banco
    res.status(200).json({
      success: true,
      user: req.user
    });
  } catch (error) {
    console.error('Erro ao obter informações do usuário:', error);
    res.status(500).json({ message: 'Erro no servidor', error: error.message });
  }
}; 