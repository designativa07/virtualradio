const { Radio, Music, Spot } = require('../models');

// Criar uma nova rádio
exports.createRadio = async (req, res) => {
  try {
    const { name, description, spotInterval, musicVolume, spotVolume, fadeInDuration, fadeOutDuration, volumeTransitionDuration } = req.body;
    
    // Modo offline - criar rádio de exemplo
    const newRadio = {
      id: Date.now(), // ID único baseado no timestamp
      name: name || "Nova Rádio",
      description: description || "",
      spotInterval: spotInterval || 180,
      musicVolume: musicVolume || 70,
      spotVolume: spotVolume || 100,
      fadeInDuration: fadeInDuration || 3,
      fadeOutDuration: fadeOutDuration || 3,
      volumeTransitionDuration: volumeTransitionDuration || 2,
      userId: req.user.id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Adicionar à lista global de rádios (que será criada se não existir)
    global.offlineRadios = global.offlineRadios || [];
    global.offlineRadios.push(newRadio);
    
    res.status(201).json({
      success: true,
      data: newRadio
    });
    
    return;
    
    /* Código original comentado
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
    */
  } catch (error) {
    console.error('Erro ao criar rádio:', error);
    res.status(500).json({ message: 'Erro no servidor', error: error.message });
  }
};

// Obter todas as rádios do usuário
exports.getUserRadios = async (req, res) => {
  try {
    // Modo offline - usar rádios adicionadas globalmente ou retornar um exemplo se vazio
    // Inicializar a lista global se não existir
    global.offlineRadios = global.offlineRadios || [
      {
        id: 1,
        name: "Minha Rádio Exemplo",
        description: "Uma rádio de teste para modo offline",
        spotInterval: 180,
        musicVolume: 70,
        spotVolume: 100,
        fadeInDuration: 3,
        fadeOutDuration: 3,
        volumeTransitionDuration: 2,
        userId: req.user.id,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    // Retornar apenas rádios do usuário atual
    const userRadios = global.offlineRadios.filter(radio => radio.userId === req.user.id);
    
    res.status(200).json({
      success: true,
      count: userRadios.length,
      data: userRadios
    });
    
    return;
    
    /* Código original comentado
    const radios = await Radio.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']]
    });
    
    res.status(200).json({
      success: true,
      count: radios.length,
      data: radios
    });
    */
  } catch (error) {
    console.error('Erro ao buscar rádios:', error);
    res.status(500).json({ message: 'Erro no servidor', error: error.message });
  }
};

// Obter uma rádio específica
exports.getRadio = async (req, res) => {
  try {
    const radioId = req.params.id;
    
    // Modo offline - retornar dados de exemplo com músicas e spots
    const exampleRadio = {
      id: parseInt(radioId),
      name: "Minha Rádio Exemplo",
      description: "Uma rádio de teste para modo offline",
      spotInterval: 180,
      musicVolume: 70,
      spotVolume: 100,
      fadeInDuration: 3,
      fadeOutDuration: 3,
      volumeTransitionDuration: 2,
      userId: req.user.id,
      createdAt: new Date(),
      updatedAt: new Date(),
      Music: [
        {
          id: 1,
          title: "Música Exemplo 1",
          artist: "Artista de Teste",
          filePath: "/uploads/music/exemplo1.mp3",
          duration: 240,
          radioId: parseInt(radioId)
        },
        {
          id: 2,
          title: "Música Exemplo 2",
          artist: "Outro Artista",
          filePath: "/uploads/music/exemplo2.mp3",
          duration: 180,
          radioId: parseInt(radioId)
        }
      ],
      Spots: [
        {
          id: 1,
          name: "Spot Promocional",
          description: "Um spot de teste",
          filePath: "/uploads/spot/exemplo1.mp3",
          duration: 30,
          isActive: true,
          radioId: parseInt(radioId)
        }
      ]
    };
    
    res.status(200).json({
      success: true,
      data: exampleRadio
    });
    
    return;
    
    /* Código original comentado
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
    */
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