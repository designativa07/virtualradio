const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { User } = require('../models');

// Tenta carregar as variáveis de ambiente, se existirem
try {
  require('dotenv').config();
} catch (err) {
  console.log('Arquivo .env não encontrado, usando valores padrão');
}

// Configuração do JWT usando variáveis de ambiente ou valores padrão
const JWT_SECRET = process.env.JWT_SECRET || 'myradio_secret_key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';

// Gerar token JWT
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  });
};

// Registrar novo usuário
exports.register = async (req, res) => {
  try {
    console.log('Requisição de registro recebida:', req.body);
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Por favor, preencha todos os campos.' 
      });
    }

    // Verificar se o usuário já existe
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: 'Este email já está registrado.' 
      });
    }

    // Hash da senha
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Criar novo usuário
    const user = await User.create({
      name,
      email,
      password: hashedPassword
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
    res.status(500).json({ 
      success: false,
      message: 'Erro no servidor', 
      details: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
};

// Login
exports.login = async (req, res) => {
  try {
    console.log('Requisição de login recebida:', req.body);
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Por favor, preencha todos os campos.' 
      });
    }

    // Buscar usuário
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'Email ou senha inválidos.' 
      });
    }

    // Verificar senha
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false,
        message: 'Email ou senha inválidos.' 
      });
    }

    // Gerar token
    const token = generateToken(user.id);

    // Retornar resposta
    res.status(200).json({
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
    console.error('Erro ao fazer login:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erro no servidor', 
      details: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
};

// Verificar usuário atual
exports.me = async (req, res) => {
  try {
    // Buscar usuário no banco
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'name', 'email', 'role']
    });

    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'Usuário não encontrado.' 
      });
    }

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Erro ao obter informações do usuário:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erro no servidor', 
      details: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
}; 