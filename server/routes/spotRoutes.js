const express = require('express');
const router = express.Router();
const spotController = require('../controllers/spotController');
const { protect } = require('../middleware/auth');
const { spotUpload } = require('../middleware/upload');

// Todas as rotas protegidas por autenticação
router.use(protect);

// Rotas para spots
router.post('/upload/:radioId', spotUpload, spotController.uploadSpot);
router.get('/radio/:radioId', spotController.getSpotsByRadio);
router.put('/:id', spotController.updateSpot);
router.delete('/:id', spotController.deleteSpot);

module.exports = router; 