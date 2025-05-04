const { Radio, Music, Spot } = require('../models');

// Criar uma nova rádio
exports.createRadio = async (req, res) => {
  try {
    const { name, description, spotInterval, musicVolume, spotVolume, fadeInDuration, fadeOutDuration, volumeTransitionDuration } = req.body;
    
    // Criar nova rádio no banco de dados
    const radio = await Radio.create({
      name,
      description,
      spotInterval: spotInterval || 180, // 3 minutos em segundos
      musicVolume: musicVolume || 70,
      spotVolume: spotVolume || 100,
      fadeInDuration: fadeInDuration || 3,
      fadeOutDuration: fadeOutDuration || 3,
      volumeTransitionDuration: volumeTransitionDuration || 2,
      userId: req.user.id
    });
    
    res.status(201).json({
      success: true,
      data: radio
    });
  } catch (error) {
    console.error('Erro ao criar rádio:', error);
    res.status(500).json({ message: 'Erro no servidor', error: error.message });
  }
};

// Obter todas as rádios do usuário
exports.getUserRadios = async (req, res) => {
  try {
    const radios = await Radio.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']]
    });
    
    res.status(200).json({
      success: true,
      count: radios.length,
      data: radios
    });
  } catch (error) {
    console.error('Erro ao buscar rádios:', error);
    res.status(500).json({ message: 'Erro no servidor', error: error.message });
  }
};

// Obter uma rádio específica
exports.getRadio = async (req, res) => {
  try {
    const radioId = req.params.id;
    
    const radio = await Radio.findOne({
      where: { 
        id: radioId,
        userId: req.user.id 
      },
      include: [
        { model: Music, attributes: ['id', 'title', 'artist', 'filePath', 'youtubeId', 'spotifyId', 'duration'] },
        { model: Spot, attributes: ['id', 'name', 'description', 'filePath', 'duration', 'isActive', 'startDate', 'endDate'] }
      ]
    });
    
    if (!radio) {
      return res.status(404).json({ message: 'Rádio não encontrada.' });
    }
    
    res.status(200).json({
      success: true,
      data: radio
    });
  } catch (error) {
    console.error('Erro ao buscar rádio:', error);
    res.status(500).json({ message: 'Erro no servidor', error: error.message });
  }
};

// Atualizar uma rádio
exports.updateRadio = async (req, res) => {
  try {
    const radioId = req.params.id;
    const { name, description, spotInterval, musicVolume, spotVolume, fadeInDuration, fadeOutDuration, volumeTransitionDuration } = req.body;
    
    // Verificar se a rádio existe e pertence ao usuário
    const radio = await Radio.findOne({
      where: { 
        id: radioId,
        userId: req.user.id 
      }
    });
    
    if (!radio) {
      return res.status(404).json({ message: 'Rádio não encontrada.' });
    }
    
    // Atualizar rádio
    const updatedRadio = await radio.update({
      name: name || radio.name,
      description: description !== undefined ? description : radio.description,
      spotInterval: spotInterval || radio.spotInterval,
      musicVolume: musicVolume || radio.musicVolume,
      spotVolume: spotVolume || radio.spotVolume,
      fadeInDuration: fadeInDuration || radio.fadeInDuration,
      fadeOutDuration: fadeOutDuration || radio.fadeOutDuration,
      volumeTransitionDuration: volumeTransitionDuration || radio.volumeTransitionDuration
    });
    
    res.status(200).json({
      success: true,
      data: updatedRadio
    });
  } catch (error) {
    console.error('Erro ao atualizar rádio:', error);
    res.status(500).json({ message: 'Erro no servidor', error: error.message });
  }
};

// Excluir uma rádio
exports.deleteRadio = async (req, res) => {
  try {
    const radioId = req.params.id;
    
    // Verificar se a rádio existe e pertence ao usuário
    const radio = await Radio.findOne({
      where: { 
        id: radioId,
        userId: req.user.id 
      }
    });
    
    if (!radio) {
      return res.status(404).json({ message: 'Rádio não encontrada.' });
    }
    
    // Deletar a rádio (as músicas e spots serão excluídos por cascata)
    await radio.destroy();
    
    res.status(200).json({
      success: true,
      message: 'Rádio excluída com sucesso.'
    });
  } catch (error) {
    console.error('Erro ao excluir rádio:', error);
    res.status(500).json({ message: 'Erro no servidor', error: error.message });
  }
}; 