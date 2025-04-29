const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const { Music, Radio } = require('../models');

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

// Adicionar música por upload
exports.uploadMusic = async (req, res) => {
  try {
    const { radioId } = req.params;
    const { title, artist } = req.body;

    // Verificar se o arquivo foi enviado
    if (!req.file) {
      return res.status(400).json({ message: 'Nenhum arquivo foi enviado.' });
    }

    // Modo offline - criar música de exemplo
    const exampleMusic = {
      id: Date.now(), // ID único baseado no timestamp
      title: title || (req.file ? path.basename(req.file.originalname, path.extname(req.file.originalname)) : 'Música Exemplo'),
      artist: artist || 'Artista',
      filePath: req.file ? req.file.path : '/uploads/music/exemplo_novo.mp3',
      duration: Math.floor(Math.random() * (300 - 180 + 1) + 180),
      radioId: parseInt(radioId),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Responder com sucesso e dados de exemplo
    res.status(201).json({
      success: true,
      data: exampleMusic
    });
    
    return;
    
    /* Código original comentado
    // Verificar se a rádio pertence ao usuário
    const isOwner = await checkRadioOwnership(radioId, req.user.id);
    if (!isOwner) {
      // Remover o arquivo enviado
      if (req.file) {
        await unlinkAsync(req.file.path);
      }
      return res.status(403).json({ message: 'Você não tem permissão para adicionar músicas a esta rádio.' });
    }

    // Obter duração do arquivo (em uma implementação real, você usaria uma biblioteca como ffmpeg)
    // Por enquanto, vamos simular com um valor aleatório entre 3 e 5 minutos
    const duration = Math.floor(Math.random() * (300 - 180 + 1) + 180);

    // Criar novo registro de música
    const music = await Music.create({
      title: title || path.basename(req.file.originalname, path.extname(req.file.originalname)),
      artist: artist || 'Desconhecido',
      filePath: req.file.path,
      duration,
      radioId
    });

    res.status(201).json({
      success: true,
      data: music
    });
    */
  } catch (error) {
    console.error('Erro ao fazer upload de música:', error);
    
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

// Adicionar música do YouTube
exports.addYoutubeMusic = async (req, res) => {
  try {
    const { radioId } = req.params;
    const { title, artist, youtubeId, duration } = req.body;

    // Verificar se a rádio pertence ao usuário
    const isOwner = await checkRadioOwnership(radioId, req.user.id);
    if (!isOwner) {
      return res.status(403).json({ message: 'Você não tem permissão para adicionar músicas a esta rádio.' });
    }

    // Validar dados
    if (!youtubeId) {
      return res.status(400).json({ message: 'ID do YouTube é obrigatório.' });
    }

    // Criar novo registro de música
    const music = await Music.create({
      title: title || 'Música do YouTube',
      artist: artist || 'Desconhecido',
      youtubeId,
      duration: duration || 0,
      radioId
    });

    res.status(201).json({
      success: true,
      data: music
    });
  } catch (error) {
    console.error('Erro ao adicionar música do YouTube:', error);
    res.status(500).json({ message: 'Erro no servidor', error: error.message });
  }
};

// Listar músicas de uma rádio
exports.getMusicsByRadio = async (req, res) => {
  try {
    const { radioId } = req.params;

    // Modo offline - retornar dados de exemplo
    const exampleMusics = [
      {
        id: 1,
        title: "Música Exemplo 1",
        artist: "Artista de Teste",
        filePath: "/uploads/music/exemplo1.mp3",
        duration: 240,
        radioId: radioId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 2,
        title: "Música Exemplo 2",
        artist: "Outro Artista",
        filePath: "/uploads/music/exemplo2.mp3",
        duration: 180,
        radioId: radioId,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    res.status(200).json({
      success: true,
      count: exampleMusics.length,
      data: exampleMusics
    });
    
    return;
    
    /* Código original comentado
    // Verificar se a rádio pertence ao usuário
    const isOwner = await checkRadioOwnership(radioId, req.user.id);
    if (!isOwner) {
      return res.status(403).json({ message: 'Você não tem permissão para acessar as músicas desta rádio.' });
    }

    // Buscar músicas
    const music = await Music.findAll({
      where: { radioId },
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      count: music.length,
      data: music
    });
    */
  } catch (error) {
    console.error('Erro ao buscar músicas:', error);
    res.status(500).json({ message: 'Erro no servidor', error: error.message });
  }
};

// Excluir música
exports.deleteMusic = async (req, res) => {
  try {
    const { id } = req.params;

    // Buscar música
    const music = await Music.findByPk(id, {
      include: [{ model: Radio, attributes: ['userId'] }]
    });

    if (!music) {
      return res.status(404).json({ message: 'Música não encontrada.' });
    }

    // Verificar se o usuário é dono da rádio à qual a música pertence
    if (music.Radio.userId !== req.user.id) {
      return res.status(403).json({ message: 'Você não tem permissão para excluir esta música.' });
    }

    // Se for um arquivo local, excluir o arquivo
    if (music.filePath) {
      try {
        await unlinkAsync(music.filePath);
      } catch (unlinkError) {
        console.error('Erro ao excluir arquivo físico:', unlinkError);
        // Continuar mesmo se falhar ao excluir o arquivo
      }
    }

    // Excluir registro da música
    await music.destroy();

    res.status(200).json({
      success: true,
      message: 'Música excluída com sucesso.'
    });
  } catch (error) {
    console.error('Erro ao excluir música:', error);
    res.status(500).json({ message: 'Erro no servidor', error: error.message });
  }
}; 