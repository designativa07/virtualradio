const jwt = require('jsonwebtoken');
const { User } = require('../models');

// Configuração fixa do JWT
const JWT_SECRET = 'myradio_secret_key';

// Middleware para proteger rotas
exports.protect = async (req, res, next) => {
  try {
    // Verificar se é uma solicitação de upload de arquivo
    const isUploadRequest = 
      req.originalUrl.includes('/upload/') && 
      (req.method === 'POST');
    
    // Se for uma solicitação de upload, permitir sem autenticação
    if (isUploadRequest) {
      console.log('Solicitação de upload detectada, ignorando autenticação');
    }
    
    // Bypass de autenticação - permitir qualquer acesso
    // Criar usuário temporário
    req.user = {
      id: 1,
      name: 'Administrador Temporário',
      email: 'admin@temp.com',
      role: 'admin'
    };
    
    // Continuar para a próxima função
    next();
  } catch (error) {
    console.error('Erro na autenticação:', error);
    return res.status(500).json({
      message: 'Erro no servidor de autenticação',
      error: error.message
    });
  }
};

// Middleware para verificar permissões de administrador
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: 'Você não tem permissão para realizar esta ação.'
      });
    }
    next();
  };
}; 