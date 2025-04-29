const express = require('express');
const router = express.Router();
const musicController = require('../controllers/musicController');
const { protect } = require('../middleware/auth');
const { musicUpload } = require('../middleware/upload');

// Todas as rotas protegidas por autenticação
router.use(protect);

// Rotas para músicas
router.post('/upload/:radioId', musicUpload, musicController.uploadMusic);
router.post('/youtube/:radioId', musicController.addYoutubeMusic);
router.get('/radio/:radioId', musicController.getMusicsByRadio);
router.delete('/:id', musicController.deleteMusic);

module.exports = router; 