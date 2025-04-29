const express = require('express');
const router = express.Router();
const radioController = require('../controllers/radioController');
const { protect } = require('../middleware/auth');

// Todas as rotas protegidas por autenticação
router.use(protect);

// Rotas para rádios
router.post('/', radioController.createRadio);
router.get('/', radioController.getUserRadios);
router.get('/:id', radioController.getRadio);
router.put('/:id', radioController.updateRadio);
router.delete('/:id', radioController.deleteRadio);

module.exports = router; 