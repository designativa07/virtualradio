const jwt = require('jsonwebtoken');
const { User } = require('../models');
require('dotenv').config();

// Configuração do JWT usando variáveis de ambiente
const JWT_SECRET = process.env.JWT_SECRET || 'myradio_secret_key';

// Middleware para proteger rotas que requerem autenticação
exports.protect = async (req, res, next) => {
  try {
    let token;
    
    // Verificar se o token está no header Authorization
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    // Verificar se o token existe
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Acesso não autorizado. Por favor, faça login.'
      });
    }
    
    try {
      // Verificar e decodificar o token
      const decoded = jwt.verify(token, JWT_SECRET);
      
      // Buscar o usuário pelo ID do token decodificado
      const user = await User.findByPk(decoded.id);
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'O usuário deste token não existe mais.'
        });
      }
      
      // Adicionar usuário à requisição
      req.user = user;
      next();
    } catch (error) {
      console.error('Erro na verificação do token:', error);
      
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Sua sessão expirou. Por favor, faça login novamente.'
        });
      }
      
      return res.status(401).json({
        success: false,
        message: 'Token inválido. Por favor, faça login novamente.'
      });
    }
  } catch (error) {
    console.error('Erro no middleware de autenticação:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno no servidor',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Middleware para verificar permissões de administrador
exports.isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Acesso negado. Você não tem permissões de administrador.'
    });
  }
}; 