const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const { Spot, Radio } = require('../models');

const unlinkAsync = promisify(fs.unlink);

// Helper para verificar se a rádio pertence ao usuário
const checkRadioOwnership = async (radioId, userId) => {
  const radio = await Radio.findOne({
    where: {
      id: radioId,
      userId
    }
  });

  return !!radio;
};

// Adicionar spot por upload
exports.uploadSpot = async (req, res) => {
  try {
    const { radioId } = req.params;
    const { name, description, startDate, endDate } = req.body;

    // Verificar se o arquivo foi enviado
    if (!req.file) {
      return res.status(400).json({ message: 'Nenhum arquivo foi enviado.' });
    }

    // Verificar se a rádio pertence ao usuário
    const isOwner = await checkRadioOwnership(radioId, req.user.id);
    if (!isOwner) {
      // Remover o arquivo enviado
      if (req.file) {
        await unlinkAsync(req.file.path);
      }
      return res.status(403).json({ message: 'Você não tem permissão para adicionar spots a esta rádio.' });
    }

    // Obter duração do arquivo (em uma implementação real, você usaria uma biblioteca como ffmpeg)
    // Por enquanto, vamos simular com um valor aleatório entre 15 e 60 segundos
    const duration = Math.floor(Math.random() * (60 - 15 + 1) + 15);

    // Criar novo registro de spot
    const spot = await Spot.create({
      name: name || path.basename(req.file.originalname, path.extname(req.file.originalname)),
      description: description || '',
      filePath: req.file.path,
      duration,
      isActive: true,
      startDate: startDate || null,
      endDate: endDate || null,
      radioId
    });

    res.status(201).json({
      success: true,
      data: spot
    });
  } catch (error) {
    console.error('Erro ao fazer upload de spot:', error);
    
    // Remover o arquivo enviado em caso de erro
    if (req.file) {
      try {
        await unlinkAsync(req.file.path);
      } catch (unlinkError) {
        console.error('Erro ao remover arquivo temporário:', unlinkError);
      }
    }
    
    res.status(500).json({ message: 'Erro no servidor', error: error.message });
  }
};

// Listar spots de uma rádio
exports.getSpotsByRadio = async (req, res) => {
  try {
    const { radioId } = req.params;

    // Verificar se a rádio pertence ao usuário
    const isOwner = await checkRadioOwnership(radioId, req.user.id);
    if (!isOwner) {
      return res.status(403).json({ message: 'Você não tem permissão para acessar os spots desta rádio.' });
    }

    // Buscar spots
    const spots = await Spot.findAll({
      where: { radioId },
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      count: spots.length,
      data: spots
    });
  } catch (error) {
    console.error('Erro ao buscar spots:', error);
    res.status(500).json({ message: 'Erro no servidor', error: error.message });
  }
};

// Atualizar status, datas ou informações do spot
exports.updateSpot = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, isActive, startDate, endDate } = req.body;

    // Buscar spot
    const spot = await Spot.findByPk(id, {
      include: [{ model: Radio, attributes: ['userId'] }]
    });

    if (!spot) {
      return res.status(404).json({ message: 'Spot não encontrado.' });
    }

    // Verificar se o usuário é dono da rádio à qual o spot pertence
    if (spot.Radio.userId !== req.user.id) {
      return res.status(403).json({ message: 'Você não tem permissão para atualizar este spot.' });
    }

    // Atualizar spot
    const updatedSpot = await spot.update({
      name: name || spot.name,
      description: description !== undefined ? description : spot.description,
      isActive: isActive !== undefined ? isActive : spot.isActive,
      startDate: startDate !== undefined ? startDate : spot.startDate,
      endDate: endDate !== undefined ? endDate : spot.endDate
    });

    res.status(200).json({
      success: true,
      data: updatedSpot
    });
  } catch (error) {
    console.error('Erro ao atualizar spot:', error);
    res.status(500).json({ message: 'Erro no servidor', error: error.message });
  }
};

// Excluir spot
exports.deleteSpot = async (req, res) => {
  try {
    const { id } = req.params;

    // Buscar spot
    const spot = await Spot.findByPk(id, {
      include: [{ model: Radio, attributes: ['userId'] }]
    });

    if (!spot) {
      return res.status(404).json({ message: 'Spot não encontrado.' });
    }

    // Verificar se o usuário é dono da rádio à qual o spot pertence
    if (spot.Radio.userId !== req.user.id) {
      return res.status(403).json({ message: 'Você não tem permissão para excluir este spot.' });
    }

    // Excluir arquivo físico
    if (spot.filePath) {
      try {
        await unlinkAsync(spot.filePath);
      } catch (unlinkError) {
        console.error('Erro ao excluir arquivo físico:', unlinkError);
        // Continuar mesmo se falhar ao excluir o arquivo
      }
    }

    // Excluir registro do spot
    await spot.destroy();

    res.status(200).json({
      success: true,
      message: 'Spot excluído com sucesso.'
    });
  } catch (error) {
    console.error('Erro ao excluir spot:', error);
    res.status(500).json({ message: 'Erro no servidor', error: error.message });
  }
}; 