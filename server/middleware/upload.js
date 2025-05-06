const path = require('path');
const multer = require('multer');
const fs = require('fs');

// Verificar e criar pastas de upload se não existirem
const createFolders = () => {
  const uploadsDir = path.join(__dirname, '../uploads');
  const musicDir = path.join(uploadsDir, 'music');
  const spotDir = path.join(uploadsDir, 'spot');
  
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
  }
  
  if (!fs.existsSync(musicDir)) {
    fs.mkdirSync(musicDir);
  }
  
  if (!fs.existsSync(spotDir)) {
    fs.mkdirSync(spotDir);
  }
};

// Criar pastas de upload ao iniciar
createFolders();

// Configuração de armazenamento para músicas
const musicStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/music'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    cb(null, `music-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

// Configuração de armazenamento para spots
const spotStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/spot'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    cb(null, `spot-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

// Filtro para arquivos de áudio
const audioFilter = (req, file, cb) => {
  // Tipos de arquivos de áudio aceitos
  const allowedTypes = [
    'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg',
    'audio/x-m4a', 'audio/aac', 'audio/flac', 'audio/x-wav'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Formato de arquivo não suportado. Somente arquivos de áudio são permitidos.'), false);
  }
};

// Inicializar uploads para músicas e spots
const uploadMusic = multer({
  storage: musicStorage,
  fileFilter: audioFilter,
  limits: {
    fileSize: 30 * 1024 * 1024, // 30MB
  }
}).single('music');

const uploadSpot = multer({
  storage: spotStorage,
  fileFilter: audioFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  }
}).single('spot');

// Middleware para upload de músicas com tratamento de erros
exports.musicUpload = (req, res, next) => {
  uploadMusic(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          message: 'O arquivo é muito grande. O limite é de 30MB.'
        });
      }
      return res.status(400).json({
        message: `Erro no upload: ${err.message}`
      });
    } else if (err) {
      return res.status(400).json({
        message: err.message
      });
    }
    next();
  });
};

// Middleware para upload de spots com tratamento de erros
exports.spotUpload = (req, res, next) => {
  uploadSpot(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          message: 'O arquivo é muito grande. O limite é de 10MB.'
        });
      }
      return res.status(400).json({
        message: `Erro no upload: ${err.message}`
      });
    } else if (err) {
      return res.status(400).json({
        message: err.message
      });
    }
    next();
  });
};