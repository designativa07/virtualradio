'use client';

import { useState, useEffect, useRef } from 'react';
import { Howl } from 'howler';
import { getApiUrl } from '../app/utils/api';

// Função auxiliar para gerar URLs completas para áudios
const getFullAudioUrl = (audioPath) => {
  if (!audioPath) return '';
  
  // Se o caminho já é uma URL completa, retornar como está
  if (audioPath.startsWith('http://') || audioPath.startsWith('https://')) {
    return audioPath;
  }
  
  // Remover a barra inicial se existir
  const cleanPath = audioPath.startsWith('/') ? audioPath.substring(1) : audioPath;
  
  // Construir a URL base para o arquivo de áudio
  const baseUrl = process.env.NODE_ENV === 'production'
    ? 'https://virtualradio.h4xd66.easypanel.host'
    : 'http://localhost:3001';
    
  return `${baseUrl}/${cleanPath}`;
};

// Função para verificar se uma URL está acessível
const checkUrlAccessibility = async (url) => {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    console.error(`Erro ao verificar acessibilidade da URL: ${url}`, error);
    return false;
  }
};

// Função para carregar áudio e converter em blob URL para evitar problemas de CSP
const loadAudioAsBlob = async (url) => {
  try {
    // Buscar o arquivo de áudio com cabeçalhos apropriados
    const response = await fetch(url, {
      mode: 'cors',
      headers: {
        'Origin': window.location.origin
      }
    });
    
    if (!response.ok) {
      throw new Error(`Falha ao carregar áudio: ${response.status} ${response.statusText}`);
    }
    
    // Converter para blob e criar URL de objeto
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error('Erro ao carregar áudio como blob:', error);
    throw error;
  }
};

export default function RadioPlayer({ 
  stationName, 
  audioFiles, 
  autoplay = false,
  fadeOutDuration = 5,
  backgroundVolume = 0.8,
  spotVolume = 1
}) {
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isSpotPlaying, setIsSpotPlaying] = useState(false);
  const [nextSpotTime, setNextSpotTime] = useState(null);
  const [isFading, setIsFading] = useState(false);
  const [audioError, setAudioError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [shuffleMode, setShuffleMode] = useState(false);
  const [currentMusicIndex, setCurrentMusicIndex] = useState(0);
  const [spotInterval, setSpotInterval] = useState(300); // Padrão: 300 segundos (5 minutos)
  const [spotPlaylist, setSpotPlaylist] = useState([]); // Sequência de spots
  const [currentSpotIndex, setCurrentSpotIndex] = useState(0); // Índice do spot atual
  const [isTimelineBeingDragged, setIsTimelineBeingDragged] = useState(false);
  const [musicPlaylist, setMusicPlaylist] = useState([]); // Sequência de músicas
  const [volumeReductionLevel, setVolumeReductionLevel] = useState(70); // Redução de 70% por padrão
  const [fadeOutTime, setFadeOutTime] = useState(5); // Tempo de fade out em segundos
  const [fadeInTime, setFadeInTime] = useState(3); // Tempo de fade in em segundos
  const [spotVolumeLevel, setSpotVolumeLevel] = useState(1); // Volume dos spots (100% por padrão)
  const [preFadeStarted, setPreFadeStarted] = useState(false); // Controle para fade antecipado
  const [nextSpotInfoText, setNextSpotInfoText] = useState(''); // Texto com info do próximo spot
  const [spotEntryDelay, setSpotEntryDelay] = useState(500); // Atraso (em ms) para entrada do spot após fade
  
  const audioRef = useRef(null);
  const spotAudioRef = useRef(null);
  const fadeIntervalRef = useRef(null);
  const spotIntervalRef = useRef(null);
  const progressBarRef = useRef(null);
  const blobUrlsRef = useRef([]); // Rastrear URLs de blob criadas para limpeza

  // Função de limpeza para URLs de blob
  const cleanupBlobUrls = () => {
    blobUrlsRef.current.forEach(url => {
      try {
        URL.revokeObjectURL(url);
      } catch (e) {
        console.error('Erro ao revogar URL de blob:', e);
      }
    });
    blobUrlsRef.current = [];
  };

  // Função para limpar qualquer fade interval existente
  const clearFadeInterval = () => {
    if (fadeIntervalRef.current) {
      console.log("Limpando intervalo de fade existente");
      clearInterval(fadeIntervalRef.current);
      fadeIntervalRef.current = null;
    }
  };

  // Função para iniciar o fade out com pré-fade configurável
  const startFadeOut = (withDelay = false, spotStartCallback = null) => {
    if (isFading || !audioRef.current) return;
    
    console.log("Iniciando fade out da música de fundo");
    setIsFading(true);
    setPreFadeStarted(true);
    
    // Limpar qualquer intervalo de fade anterior para evitar conflitos
    clearFadeInterval();
    
    const startVolume = audioRef.current.volume;
    // Calcular o volume alvo com base na porcentagem de redução definida pelo usuário
    // e no volume atual configurado na barra deslizante
    const targetVolume = volume * (1 - (volumeReductionLevel / 100));
    console.log(`Reduzindo volume de ${startVolume.toFixed(2)} para ${targetVolume.toFixed(2)} (redução de ${volumeReductionLevel}%)`);
    
    // Se o spotEntryDelay for muito negativo, precisamos ajustar o tempo de fade out
    // para garantir que o spot não comece antes que o fade tenha efeito audível
    const adjustedFadeOutTime = spotEntryDelay < -1000 
      ? Math.max(1, fadeOutTime - Math.abs(spotEntryDelay) / 1000) 
      : fadeOutTime;
    
    if (adjustedFadeOutTime !== fadeOutTime) {
      console.log(`Ajustando duração do fade out para ${adjustedFadeOutTime}s devido ao atraso negativo significativo`);
    }
    
    const steps = 20; // número de passos para o fade
    const stepDuration = (adjustedFadeOutTime * 1000) / steps;
    const volumeStep = (startVolume - targetVolume) / steps;
    
    let currentStep = 0;
    
    // Modificamos para exportar o tempo de passo para cálculos de timing mais precisos
    const calculatedStepDuration = stepDuration;
    console.log(`Fade out: ${steps} passos, ${calculatedStepDuration}ms por passo`);
    
    // IMPORTANTE: Se o atraso for negativo e temos um callback, chamamos ele no momento certo
    if (spotStartCallback && spotEntryDelay < 0) {
      // Calcular quando iniciar o spot durante o fade
      const totalFadeDuration = adjustedFadeOutTime * 1000;
      const timeBeforeFadeEnd = Math.abs(spotEntryDelay);
      const timeToStartSpot = Math.max(0, totalFadeDuration - timeBeforeFadeEnd);
      
      console.log(`Com fade de ${totalFadeDuration}ms e atraso de ${spotEntryDelay}ms, o spot iniciará após ${timeToStartSpot}ms do início do fade (${timeBeforeFadeEnd}ms antes do término)`);
      
      setTimeout(() => {
        console.log(`Executando callback para iniciar spot ${timeBeforeFadeEnd}ms antes do término do fade`);
        spotStartCallback();
      }, timeToStartSpot);
    }
    
    fadeIntervalRef.current = setInterval(() => {
      currentStep++;
      if (currentStep <= steps) {
        const newVolume = startVolume - (volumeStep * currentStep);
        // Garantir que o volume nunca seja negativo
        audioRef.current.volume = Math.max(0, newVolume);
        console.log(`Fade out passo ${currentStep}/${steps}: volume ${newVolume.toFixed(2)}`);
      } else {
        clearFadeInterval();
        setIsFading(false);
        console.log("Fade out concluído");
      }
    }, stepDuration);
    
    // Retornar o tempo de passo para cálculos externos
    return { 
      totalDuration: adjustedFadeOutTime * 1000,
      stepDuration: calculatedStepDuration,
      steps
    };
  };

  // Função para iniciar o fade in
  const startFadeIn = () => {
    if (isFading || !audioRef.current) return;
    
    console.log("Iniciando fade in da música de fundo");
    setIsFading(true);
    setPreFadeStarted(false);
    
    // Limpar qualquer intervalo de fade anterior para evitar conflitos
    clearFadeInterval();
    
    // Obter o volume atual do elemento de áudio
    const currentVolume = audioRef.current.volume;
    
    // Capturar uma referência fixa ao volume configurado pelo usuário no momento que o fade começa
    // Isso evita que alterações durante o fade in afetem o alvo final
    const targetVolume = volume;
    
    console.log(`Aumentando volume de ${currentVolume.toFixed(2)} para ${targetVolume.toFixed(2)} (volume configurado pelo usuário)`);
    
    // Se o volume atual já for igual ou maior que o volume alvo, definir diretamente
    if (currentVolume >= targetVolume) {
      console.log(`Volume atual já está em ${currentVolume.toFixed(2)}, apenas garantindo que seja exatamente ${targetVolume.toFixed(2)}`);
      audioRef.current.volume = targetVolume;
      setIsFading(false);
      return;
    }
    
    const steps = 20;
    // Usar o tempo de fade in configurado pelo usuário
    const stepDuration = (fadeInTime * 1000) / steps;
    const volumeStep = (targetVolume - currentVolume) / steps;
    
    let currentStep = 0;
    
    fadeIntervalRef.current = setInterval(() => {
      if (!audioRef.current) {
        clearFadeInterval();
        setIsFading(false);
        console.error("Referência de áudio perdida durante fade in");
        return;
      }
      
      currentStep++;
      if (currentStep <= steps) {
        const newVolume = currentVolume + (volumeStep * currentStep);
        audioRef.current.volume = Math.min(targetVolume, Math.max(0, newVolume)); // Garantir que esteja entre 0 e o volume alvo
        console.log(`Fade in passo ${currentStep}/${steps}: volume ${audioRef.current.volume.toFixed(2)}`);
      } else {
        clearFadeInterval();
        // Garantir explicitamente que o volume final é exatamente o valor configurado pelo usuário
        audioRef.current.volume = targetVolume;
        console.log(`Fade in concluído. Volume final definido explicitamente para: ${targetVolume.toFixed(2)}`);
        setIsFading(false);
      }
    }, stepDuration);
  };

  // Inicializar ou atualizar a playlist de spots
  const initSpotPlaylist = () => {
    if (!audioFiles) return [];
    
    const spots = audioFiles.filter(file => file.type === 'spot');
    if (spots.length === 0) return [];
    
    // Criar uma cópia para não modificar o original
    const playlist = [...spots];
    setSpotPlaylist(playlist);
    setCurrentSpotIndex(0);
    console.log('Playlist de spots inicializada:', playlist);
    return playlist;
  };

  // Inicializar ou atualizar a playlist de músicas
  const initMusicPlaylist = () => {
    if (!audioFiles) return [];
    
    const music = audioFiles.filter(file => file.type === 'music');
    if (music.length === 0) return [];
    
    // Criar uma cópia para não modificar o original
    const playlist = [...music];
    setMusicPlaylist(playlist);
    console.log('Playlist de músicas inicializada:', playlist);
    return playlist;
  };

  // Função para reordenar os spots na playlist (arrastar e soltar)
  const reorderSpotPlaylist = (fromIndex, toIndex) => {
    const updatedPlaylist = [...spotPlaylist];
    const [movedItem] = updatedPlaylist.splice(fromIndex, 1);
    updatedPlaylist.splice(toIndex, 0, movedItem);
    
    setSpotPlaylist(updatedPlaylist);
    
    // Ajustar o índice atual se necessário
    if (currentSpotIndex === fromIndex) {
      setCurrentSpotIndex(toIndex);
    } else if (
      (currentSpotIndex > fromIndex && currentSpotIndex <= toIndex) ||
      (currentSpotIndex < fromIndex && currentSpotIndex >= toIndex)
    ) {
      // Se o índice atual está entre as posições trocadas, ajustar
      const newIndex = currentSpotIndex + (fromIndex < toIndex ? -1 : 1);
      setCurrentSpotIndex(newIndex);
    }
  };

  // Função para reordenar as músicas na playlist (arrastar e soltar)
  const reorderMusicPlaylist = (fromIndex, toIndex) => {
    const updatedPlaylist = [...musicPlaylist];
    const [movedItem] = updatedPlaylist.splice(fromIndex, 1);
    updatedPlaylist.splice(toIndex, 0, movedItem);
    
    setMusicPlaylist(updatedPlaylist);
    
    // Ajustar o índice atual se necessário
    if (currentMusicIndex === fromIndex) {
      setCurrentMusicIndex(toIndex);
    } else if (
      (currentMusicIndex > fromIndex && currentMusicIndex <= toIndex) ||
      (currentMusicIndex < fromIndex && currentMusicIndex >= toIndex)
    ) {
      // Se o índice atual está entre as posições trocadas, ajustar
      const newIndex = currentMusicIndex + (fromIndex < toIndex ? -1 : 1);
      setCurrentMusicIndex(newIndex);
    }
  };

  // Funções para lidar com o arraste de spots
  const handleSpotDragStart = (e, index) => {
    e.dataTransfer.setData('text/spotIndex', index.toString());
    e.target.classList.add('dragging');
  };

  const handleSpotDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleSpotDragEnd = (e) => {
    e.target.classList.remove('dragging');
  };

  const handleSpotDrop = (e, toIndex) => {
    e.preventDefault();
    const fromIndex = parseInt(e.dataTransfer.getData('text/spotIndex'), 10);
    if (fromIndex !== toIndex) {
      reorderSpotPlaylist(fromIndex, toIndex);
    }
  };

  // Funções para lidar com o arraste de músicas
  const handleMusicDragStart = (e, index) => {
    e.dataTransfer.setData('text/musicIndex', index.toString());
    e.target.classList.add('dragging');
  };

  const handleMusicDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleMusicDragEnd = (e) => {
    e.target.classList.remove('dragging');
  };

  const handleMusicDrop = (e, toIndex) => {
    e.preventDefault();
    const fromIndex = parseInt(e.dataTransfer.getData('text/musicIndex'), 10);
    if (fromIndex !== toIndex) {
      reorderMusicPlaylist(fromIndex, toIndex);
    }
  };

  // Efeito para monitorar o tempo e verificar se é hora de reproduzir o próximo spot
  useEffect(() => {
    // Criar um intervalo para verificar constantemente se é hora de reproduzir o próximo spot
    const checkSpotTimer = setInterval(() => {
      // Verificar se há um próximo spot agendado e se já é hora de reproduzir
      if (isPlaying && nextSpotTime && Date.now() >= nextSpotTime && !isSpotPlaying) {
        console.log('Hora de reproduzir o próximo spot!', new Date().toLocaleTimeString());
        console.log(`Intervalo atual configurado: ${spotInterval} segundos`);
        playNextSpot();
        // O próximo spot será agendado quando o atual terminar
      } else if (isPlaying && nextSpotTime && !isSpotPlaying) {
        // Mostrar o tempo restante para o próximo spot
        const remaining = Math.round((nextSpotTime - Date.now()) / 1000);
        
        // Iniciar o fade out um pouco antes do spot tocar (com base no tempo de fade)
        const preFadeTime = Math.max(Math.ceil(fadeOutTime), 3);
        if (remaining <= preFadeTime && !isFading && !preFadeStarted && audioRef.current) {
          console.log(`Iniciando fade out antecipado ${preFadeTime} segundos antes do spot`);
          startFadeOut(true);
        }
        
        // Atualizar o texto informativo sobre o próximo spot
        if (spotPlaylist && spotPlaylist.length > 0) {
          const nextSpot = spotPlaylist[currentSpotIndex];
          setNextSpotInfoText(`Próximo spot em ${remaining}s: ${nextSpot?.title || 'Spot ' + (currentSpotIndex + 1)}`);
    }
        
        if (remaining % 10 === 0 || remaining <= 5) { // Log a cada 10 segundos ou nos últimos 5 segundos
          console.log(`Próximo spot em ${remaining} segundos (intervalo configurado: ${spotInterval}s)`);
        }
      } else if (isPlaying && !nextSpotTime && !isSpotPlaying && spotPlaylist && spotPlaylist.length > 0) {
        // Se não houver próximo spot agendado, mas existem spots na playlist e a música está tocando
        // isso pode indicar que o agendamento inicial não foi feito
        console.log('Nenhum spot agendado, mas há spots disponíveis. Agendando próximo spot...');
        console.log(`Usando intervalo de ${spotInterval} segundos`);
      scheduleNextSpot();
    }
    }, 1000); // Verificar a cada segundo

    return () => clearInterval(checkSpotTimer);
  }, [isPlaying, nextSpotTime, isSpotPlaying, spotPlaylist, spotInterval, fadeOutTime, isFading, preFadeStarted]);

  // Efeito para reagendar o próximo spot quando terminar a reprodução do spot atual
  useEffect(() => {
    if (spotAudioRef.current) {
      spotAudioRef.current.onended = () => {
        console.log("Spot terminou de reproduzir, retomando reprodução da música");
        setIsSpotPlaying(false);
        setPreFadeStarted(false);
        
        // Garantir que estamos usando o volume atual configurado pelo usuário
        console.log(`Iniciando fade in para retornar ao volume configurado: ${volume.toFixed(2)}`);
        startFadeIn();
        
        // Agendar o próximo spot apenas quando o atual terminar
        console.log("Agendando próximo spot após término do spot atual");
        console.log(`Usando intervalo configurado pelo usuário: ${spotInterval} segundos`);
        scheduleNextSpot();
      };
      
      spotAudioRef.current.onerror = (e) => {
        console.error("Erro no áudio do spot:", e);
        setAudioError(`Erro ao carregar spot de áudio: ${e.target.error?.message || 'Erro desconhecido'}`);
        setIsSpotPlaying(false);
        setPreFadeStarted(false);
        
        // Garantir restauração do volume após erro
        console.log(`Restaurando volume após erro para: ${volume.toFixed(2)}`);
        if (audioRef.current) {
          audioRef.current.volume = volume;
        }
        
        // Tentar agendar o próximo spot mesmo se houver erro
        console.log(`Tentando reagendar spot após erro (intervalo: ${spotInterval}s)`);
        scheduleNextSpot();
      };
    }
    
    if (audioRef.current) {
      audioRef.current.onerror = (e) => {
        console.error("Erro no áudio de fundo:", e);
        setAudioError(`Erro ao carregar áudio: ${e.target.error?.message || 'Erro desconhecido'}`);
        setIsPlaying(false);
      };
    }
    
    // Precisamos recriar estes manipuladores de eventos quando o spotInterval mudar
    return () => {
      if (spotAudioRef.current) {
        // Limpar os manipuladores de eventos antigos quando o spotInterval mudar
        spotAudioRef.current.onended = null;
        spotAudioRef.current.onerror = null;
      }
    };
  }, [spotInterval, volume]); // Adicionar volume como dependência
  
  // Efeito para verificar se os spots estão inicializados e agendar o próximo
  useEffect(() => {
    if (autoplay && audioFiles && audioFiles.length > 0) {
      const loadAndPlayMusic = async () => {
        const musicTracks = getMusicTracks();
        if (musicTracks.length && audioRef.current) {
          try {
            setIsLoading(true);
            const startIndex = shuffleMode 
              ? Math.floor(Math.random() * musicTracks.length) 
              : 0;
            
            const music = musicTracks[startIndex];
            setCurrentTrack(music);
            setCurrentMusicIndex(startIndex);
            
            const audioUrl = getFullAudioUrl(music.file_path);
            const blobUrl = await loadAudioAsBlob(audioUrl);
            blobUrlsRef.current.push(blobUrl); // Track for cleanup
            
            audioRef.current.src = blobUrl;
            
            // Usar o volume configurado nas props ou definido pelo usuário
            // Inicialmente vamos respeitar o volume passado como prop
            setVolume(backgroundVolume);
            audioRef.current.volume = backgroundVolume;
            console.log(`Música iniciando com volume ${backgroundVolume.toFixed(2)} (do backgroundVolume)`);
            
            await audioRef.current.play();
            setIsPlaying(true);
            setAudioError(null);
            
            // Inicializar a playlist de spots
            console.log('Inicializando playlist de spots no autoplay');
            initSpotPlaylist();
            
            // Inicializar a playlist de músicas
            console.log('Inicializando playlist de músicas no autoplay');
            initMusicPlaylist();
            
            // Agendar o primeiro spot
            console.log('Agendando o primeiro spot após iniciar a reprodução');
            scheduleNextSpot();
          } catch (err) {
            console.error("Erro ao reproduzir áudio:", err);
            setAudioError(`Erro ao reproduzir: ${err.message}`);
            setIsPlaying(false);
          } finally {
            setIsLoading(false);
          }
        }
      };
      
      loadAndPlayMusic();
    }
    
    // Cleanup function
    return () => {
      cleanupBlobUrls();
      clearFadeInterval();
    };
  }, [audioFiles, autoplay]);

  // Efeito para inicializar as playlists quando os audioFiles mudam
  useEffect(() => {
    // Inicializar as playlists sempre que os audioFiles mudarem
    if (audioFiles && audioFiles.length > 0) {
      const spots = audioFiles.filter(file => file.type === 'spot');
      if (spots.length > 0) {
        console.log('Inicializando playlist de spots automaticamente quando os arquivos mudam');
        initSpotPlaylist();
        
        // Se estiver tocando música, agendar o próximo spot
        if (isPlaying && !isSpotPlaying && !nextSpotTime) {
          console.log('Agendando o primeiro spot após inicialização da playlist');
          scheduleNextSpot();
        }
      }
      
      // Também inicializar a playlist de músicas
      const music = audioFiles.filter(file => file.type === 'music');
      if (music.length > 0) {
        console.log('Inicializando playlist de músicas automaticamente quando os arquivos mudam');
        initMusicPlaylist();
      }
    }
  }, [audioFiles, isPlaying]);
  
  // Efeito para reagendar o próximo spot quando o intervalo mudar
  useEffect(() => {
    // Reagendar o próximo spot quando o intervalo mudar
    if (nextSpotTime && isPlaying && !isSpotPlaying) {
      console.log('Intervalo de spots alterado para', spotInterval, 'segundos. Reagendando próximo spot...');
      scheduleNextSpot();
    }
  }, [spotInterval]);

  // Efeito para reaplicar a redução de volume quando a configuração de redução mudar
  useEffect(() => {
    if (isPlaying && isSpotPlaying && audioRef.current) {
      console.log('Configuração de redução de volume alterada, reaplicando:', volumeReductionLevel + '%');
      // Recalcular o volume baseado na nova porcentagem de redução e no volume configurado
      const targetVolume = volume * (1 - (volumeReductionLevel / 100));
      audioRef.current.volume = Math.max(0, targetVolume);
    }
  }, [volumeReductionLevel, volume]);

  // Efeito para atualizar o volume dos spots quando a configuração mudar
  useEffect(() => {
    if (spotAudioRef.current) {
      console.log('Atualizando volume dos spots para:', spotVolumeLevel * 100 + '%');
      spotAudioRef.current.volume = spotVolumeLevel;
    }
  }, [spotVolumeLevel]);

  // Função para agendar o próximo spot com base no intervalo atual definido pelo usuário
  const scheduleNextSpot = () => {
    // Usar o intervalo definido pelo usuário (em segundos) - obter o valor mais atual
    const currentInterval = spotInterval;
    const intervalMs = currentInterval * 1000;
    
    // Adicionar uma pequena variação aleatória (±10 segundos) para parecer mais natural
    const variation = Math.floor(Math.random() * 20000) - 10000;
    const finalInterval = Math.max(10000, intervalMs + variation); // Mínimo de 10 segundos
    
    const nextTime = Date.now() + finalInterval;
    setNextSpotTime(nextTime);
    
    const nextDateTime = new Date(nextTime);
    console.log(`Próximo spot agendado para ${nextDateTime.toLocaleTimeString()} (em ${Math.floor(finalInterval/1000)} segundos)`);
    console.log(`Usando intervalo configurado de ${currentInterval} segundos (+ variação aleatória)`);
    
    // Registrar qual será o próximo spot
    if (spotPlaylist && spotPlaylist.length > 0) {
      const nextSpot = spotPlaylist[currentSpotIndex];
      if (nextSpot) {
        console.log(`Próximo spot será: "${nextSpot.title || 'Sem título'}" (${currentSpotIndex + 1}/${spotPlaylist.length})`);
        // Atualizar o texto informativo sobre o próximo spot
        setNextSpotInfoText(`Próximo spot em ${Math.floor(finalInterval/1000)}s: ${nextSpot.title || 'Spot ' + (currentSpotIndex + 1)}`);
      }
    }
  };

  const togglePlay = async () => {
    if (!audioRef.current) return;
    
    try {
      if (isPlaying) {
        audioRef.current.pause();
        
        // Também pausar spots se estiverem tocando
        if (isSpotPlaying && spotAudioRef.current) {
          spotAudioRef.current.pause();
        }
        
        setIsPlaying(false);
      } else {
        await audioRef.current.play();
        
        // Retomar spot se estiver pausado mas ainda em reprodução
        if (isSpotPlaying && spotAudioRef.current) {
          try {
            await spotAudioRef.current.play();
          } catch (spotError) {
            console.error("Erro ao retomar reprodução de spot:", spotError);
          }
        } else if (!isSpotPlaying && spotPlaylist && spotPlaylist.length > 0 && !nextSpotTime) {
          // Se não houver spot em reprodução e não há próximo spot agendado, 
          // mas a playlist de spots existe, agendar o próximo spot
          console.log("Playlist de spots disponível, agendando próximo spot ao retomar reprodução");
          scheduleNextSpot();
        }
        
        setIsPlaying(true);
        setAudioError(null);
      }
    } catch (err) {
      console.error("Erro ao alternar reprodução de áudio:", err);
      setAudioError(`Erro ao reproduzir: ${err.message}`);
      setIsPlaying(false);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setDuration(audioRef.current.duration || 0);
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    
    // Sempre atualizar o estado do volume
    setVolume(newVolume);
    console.log(`Novo volume definido no controle: ${newVolume.toFixed(2)}`);
    
    if (audioRef.current) {
      if (!isSpotPlaying && !isFading) {
        // Aplicar volume diretamente somente se não estiver tocando spot ou durante fade
      audioRef.current.volume = newVolume;
        console.log(`Volume da música ajustado imediatamente para ${newVolume.toFixed(2)}`);
      } else if (isSpotPlaying) {
        // Se estiver tocando spot, calcular o volume reduzido com base no novo volume escolhido
        const reducedVolume = newVolume * (1 - (volumeReductionLevel / 100));
        audioRef.current.volume = reducedVolume;
        console.log(`Volume reduzido ajustado para ${reducedVolume.toFixed(2)} (durante spot)`);
      } else if (isFading) {
        // Se estiver em processo de fade, não alterar o volume diretamente
        // O volume será aplicado automaticamente após o fade ou no próximo fade
        console.log(`Alteração de volume durante fade. Será aplicado após o fade concluir: ${newVolume.toFixed(2)}`);
      }
    }
  };

  const formatTime = (time) => {
    if (!time || isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Filtrar apenas as músicas do array de áudios
  const getMusicTracks = () => {
    if (!audioFiles || !Array.isArray(audioFiles)) return [];
    return audioFiles.filter(file => file.type === 'music');
  };
  
  // Função para obter o índice da próxima música (considerando modo aleatório)
  const getNextTrackIndex = () => {
    const musicTracks = getMusicTracks();
    if (!musicTracks.length) return -1;
    
    if (shuffleMode) {
      // Em modo aleatório, escolher qualquer faixa exceto a atual
      let randomIndex;
      do {
        randomIndex = Math.floor(Math.random() * musicTracks.length);
      } while (randomIndex === currentMusicIndex && musicTracks.length > 1);
      
      return randomIndex;
    } else {
      // Em modo sequencial, ir para a próxima faixa ou voltar ao início
      return (currentMusicIndex + 1) % musicTracks.length;
    }
  };
  
  // Função para obter o índice da música anterior
  const getPreviousTrackIndex = () => {
    const musicTracks = getMusicTracks();
    if (!musicTracks.length) return -1;
    
    if (shuffleMode) {
      // Em modo aleatório, escolher qualquer faixa exceto a atual
      let randomIndex;
      do {
        randomIndex = Math.floor(Math.random() * musicTracks.length);
      } while (randomIndex === currentMusicIndex && musicTracks.length > 1);
      
      return randomIndex;
    } else {
      // Em modo sequencial, ir para a faixa anterior ou para a última
      return (currentMusicIndex - 1 + musicTracks.length) % musicTracks.length;
    }
  };
  
  // Função para alternar o modo aleatório
  const toggleShuffleMode = () => {
    setShuffleMode(prev => !prev);
  };
  
  // Função para carregar e reproduzir uma música específica
  const loadAndPlayTrack = async (trackIndex) => {
    const musicTracks = getMusicTracks();
    if (!musicTracks.length || trackIndex < 0 || trackIndex >= musicTracks.length || !audioRef.current) return;
    
    try {
      setIsLoading(true);
      const selectedTrack = musicTracks[trackIndex];
      setCurrentTrack(selectedTrack);
      setCurrentMusicIndex(trackIndex);
      
      const audioUrl = getFullAudioUrl(selectedTrack.file_path);
      const blobUrl = await loadAudioAsBlob(audioUrl);
      blobUrlsRef.current.push(blobUrl); // Track for cleanup
      
      audioRef.current.src = blobUrl;
      
      // Capturar o valor atual do volume para evitar condições de corrida
      const currentVolumeLevel = volume;
      
      // Usar sempre o volume configurado pelo usuário, aplicando redução se necessário
      if (isSpotPlaying) {
        // Se estiver tocando spot, aplicar a redução configurada
        const reducedVolume = currentVolumeLevel * (1 - (volumeReductionLevel / 100));
        audioRef.current.volume = reducedVolume;
        console.log(`Nova música iniciando com volume reduzido: ${reducedVolume.toFixed(2)} (${volumeReductionLevel}% de redução)`);
      } else {
        // Caso contrário, usar o volume normal configurado pelo usuário
        audioRef.current.volume = currentVolumeLevel;
        console.log(`Nova música iniciando com volume normal: ${currentVolumeLevel.toFixed(2)}`);
      }
      
      await audioRef.current.play();
      setIsPlaying(true);
      setAudioError(null);
    } catch (err) {
      console.error("Error playing track:", err);
      setAudioError(`Erro ao reproduzir: ${err.message}`);
      setIsPlaying(false);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Função para ir para a próxima faixa
  const playNextTrack = () => {
    const nextIndex = getNextTrackIndex();
    if (nextIndex >= 0) {
      loadAndPlayTrack(nextIndex);
    }
  };
  
  // Função para ir para a faixa anterior
  const playPreviousTrack = () => {
    const prevIndex = getPreviousTrackIndex();
    if (prevIndex >= 0) {
      loadAndPlayTrack(prevIndex);
    }
  };

  // Lidar com o clique/toque na timeline
  const handleTimelineClick = (e) => {
    if (!audioRef.current || !progressBarRef.current || isSpotPlaying) return;
    
    const progressBar = progressBarRef.current;
    const rect = progressBar.getBoundingClientRect();
    const clickPosition = (e.clientX - rect.left) / rect.width;
    
    // Calcular nova posição
    const newTime = clickPosition * audioRef.current.duration;
    
    // Definir novo tempo
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };
  
  // Iniciar o arraste na timeline
  const handleTimelineDragStart = (e) => {
    if (isSpotPlaying) return;
    setIsTimelineBeingDragged(true);
    handleTimelineClick(e);
  };
  
  // Terminar o arraste na timeline
  const handleTimelineDragEnd = () => {
    setIsTimelineBeingDragged(false);
  };
  
  // Arrastar na timeline
  const handleTimelineDrag = (e) => {
    if (!isTimelineBeingDragged || !audioRef.current || !progressBarRef.current) return;
    handleTimelineClick(e);
  };

  // Função para tocar o próximo spot
  const playNextSpot = async () => {
    if (!audioFiles || !audioFiles.length) {
      console.error("Nenhum arquivo de áudio disponível");
      return;
    }
    
    // Garantir que a playlist de spots está inicializada
    if (spotPlaylist.length === 0) {
      console.log("Playlist de spots vazia, inicializando...");
      const newPlaylist = initSpotPlaylist();
      if (!newPlaylist || newPlaylist.length === 0) {
        console.error("Nenhum spot disponível para reprodução");
        setAudioError("Nenhum spot disponível. Adicione spots para criar uma playlist.");
        return;
      }
    }
    
    // Verificar se temos spots na playlist
    if (spotPlaylist.length === 0) {
      console.error("Playlist de spots vazia após inicialização");
      setAudioError("Nenhum spot disponível para reprodução");
      return;
    }
    
    setIsLoading(true);
    try {
      // Obter o próximo spot da playlist sequencial
      console.log(`Reproduzindo spot ${currentSpotIndex + 1} de ${spotPlaylist.length}`);
      const spotToPlay = spotPlaylist[currentSpotIndex];
      
      if (!spotToPlay) {
        console.error("Spot não encontrado no índice atual:", currentSpotIndex);
        setAudioError("Erro ao localizar o spot para reprodução");
        return;
      }
      
      // Atualizar índice para o próximo spot (circular)
      const nextIndex = (currentSpotIndex + 1) % spotPlaylist.length;
      setCurrentSpotIndex(nextIndex);
      console.log(`Próximo spot será o #${nextIndex + 1}`);
      
      const audioUrl = getFullAudioUrl(spotToPlay.file_path);
      console.log("URL do spot:", audioUrl);
      
      try {
        // Carregar o spot como blob URL
        const blobUrl = await loadAudioAsBlob(audioUrl);
        blobUrlsRef.current.push(blobUrl);
        
        setCurrentTrack(spotToPlay);
        setAudioError(null);
        
        if (spotAudioRef.current) {
          // Configurar a fonte do áudio e o volume
          spotAudioRef.current.src = blobUrl;
          spotAudioRef.current.volume = spotVolumeLevel;
          console.log(`Configurando volume do spot para ${spotVolumeLevel * 100}%`);
          
          // Pré-carregar o áudio para evitar atrasos
          spotAudioRef.current.load();
          
          // Verificar se o atraso é negativo (spot deve iniciar antes do fim do fade)
          const isNegativeDelay = spotEntryDelay < 0;
          console.log(`Tipo de atraso: ${isNegativeDelay ? 'NEGATIVO' : 'POSITIVO'} (${spotEntryDelay}ms)`);
          
          // Função para iniciar o spot
          const playSpot = async () => {
            if (!spotAudioRef.current) return;
            
            console.log("INICIANDO REPRODUÇÃO DO SPOT");
            try {
              await spotAudioRef.current.play();
              setIsSpotPlaying(true);
              setNextSpotInfoText("");
              console.log("Spot reproduzindo com sucesso");
            } catch (err) {
              console.error("Erro ao reproduzir spot:", err);
              setAudioError(`Erro ao reproduzir spot: ${err.message}`);
              setIsSpotPlaying(false);
              startFadeIn(); // Restaurar volume
              scheduleNextSpot(); // Tentar próximo spot
            }
          };
          
          // Função para aplicar fade out na música
          const applyFadeOut = () => {
            if (!audioRef.current || isFading) return;
            
            const startVolume = audioRef.current.volume;
            const targetVolume = volume * (1 - (volumeReductionLevel / 100));
            
            console.log(`Aplicando fade out: ${startVolume.toFixed(2)} -> ${targetVolume.toFixed(2)}`);
            
            // Aplicar fade out da música usando a função existente
            startFadeOut();
          };
          
          // IMPLEMENTAÇÃO SIMPLIFICADA: ATRASO NEGATIVO
          if (isNegativeDelay) {
            // Para atraso negativo: PRIMEIRO iniciamos o spot, DEPOIS o fade
            console.log("FLUXO NEGATIVO: Primeiro o spot, depois o fade");
            
            // 1. Iniciar o spot imediatamente
            await playSpot();
            
            // 2. Se o spot iniciou corretamente, aplicar fade out na música
            if (isSpotPlaying) {
              console.log("Spot iniciado com sucesso, agora aplicando fade na música");
              applyFadeOut();
            }
          } 
          // IMPLEMENTAÇÃO PARA ATRASO POSITIVO
          else {
            // Para atraso positivo: PRIMEIRO o fade, DEPOIS o spot
            console.log("FLUXO POSITIVO: Primeiro o fade, depois o spot");
            
            // 1. Aplicar fade out na música
            if (!isFading && !preFadeStarted) {
              startFadeOut();
            }
            
            // 2. Aguardar o atraso e então iniciar o spot
            setTimeout(() => {
              console.log(`Iniciando spot após atraso positivo de ${spotEntryDelay}ms`);
              playSpot();
            }, Math.max(0, spotEntryDelay));
          }
        }
      } catch (error) {
        console.error("Erro ao carregar áudio como blob:", error);
        throw error;
      }
    } catch (error) {
      console.error("Erro geral na reprodução do spot:", error);
      setAudioError(`Erro ao reproduzir spot: ${error.message}`);
      setIsSpotPlaying(false);
      setPreFadeStarted(false);
      
      // Restaurar volume da música
      startFadeIn();
      
      // Tentar o próximo spot
      scheduleNextSpot();
    } finally {
      setIsLoading(false);
    }
  };

  // Quando o botão "Reproduzir spot agora" é clicado
  const handlePlaySpotNow = () => {
    // Se já estiver tocando um spot, não fazer nada
    if (isSpotPlaying) {
      console.log("Já existe um spot em reprodução");
      return;
    }
    
    // Remover qualquer agendamento existente para evitar duplicação
    setNextSpotTime(null);
    
    // Reproduzir o spot imediatamente
    playNextSpot();
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">{stationName}</h2>
        {isPlaying && nextSpotInfoText && !isSpotPlaying && (
          <div className="text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-full">
            {nextSpotInfoText}
          </div>
        )}
      </div>
      
      {/* Controles de volume */}
      <div className="bg-slate-800 p-5 rounded-md mb-6">
        <h3 className="text-xl font-semibold mb-3 text-white">Controles de Volume</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm font-medium text-white mb-1">Duração do Fade Out ({fadeOutTime} segundos)</p>
            <input
              type="range"
              min="1"
              max="15"
              step="1"
              value={fadeOutTime}
              onChange={(e) => setFadeOutTime(parseInt(e.target.value, 10))}
              className="w-full h-1 mt-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div>
            <p className="text-sm font-medium text-white mb-1">Duração do Fade In ({fadeInTime} segundos)</p>
            <input
              type="range"
              min="1"
              max="10"
              step="1"
              value={fadeInTime}
              onChange={(e) => setFadeInTime(parseInt(e.target.value, 10))}
              className="w-full h-1 mt-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm font-medium text-white mb-1">Nível de Redução do Volume ({volumeReductionLevel}%)</p>
            <input
              type="range"
              min="10"
              max="100"
              step="5"
              value={volumeReductionLevel}
              onChange={(e) => setVolumeReductionLevel(parseInt(e.target.value, 10))}
              className="w-full h-1 mt-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
            <p className="text-xs text-gray-400 mt-1">Reduz o volume da música para {Math.round(volume * (1 - volumeReductionLevel/100) * 100)}% quando um spot toca</p>
          </div>
        
          <div>
            <p className="text-sm font-medium text-white mb-1">Intervalo entre spots ({spotInterval} segundos)</p>
            <input
              type="range"
              min="10"
              max="600"
              step="10"
              value={spotInterval}
              onChange={(e) => setSpotInterval(parseInt(e.target.value, 10) || 300)}
              className="w-full h-1 mt-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm font-medium text-white mb-1">Volume da Música ({volume.toFixed(1)})</p>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={handleVolumeChange}
              className="w-full h-1 mt-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div>
            <p className="text-sm font-medium text-white mb-1">Volume do Spot ({spotVolumeLevel.toFixed(1)})</p>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={spotVolumeLevel}
              onChange={(e) => {
                const newVolume = parseFloat(e.target.value);
                setSpotVolumeLevel(newVolume);
                if (spotAudioRef.current) {
                  spotAudioRef.current.volume = newVolume;
                }
              }}
              className="w-full h-1 mt-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div>
            <p className="text-sm font-medium text-white mb-1">Atraso Entrada Spot ({spotEntryDelay}ms)</p>
            <input
              type="range"
              min="-5000"
              max="2000"
              step="100"
              value={spotEntryDelay}
              onChange={(e) => setSpotEntryDelay(parseInt(e.target.value, 10))}
              className="w-full h-1 mt-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
            <p className="text-xs text-gray-400 mt-1">
              {spotEntryDelay >= 0
                ? `Aguardar ${spotEntryDelay}ms após fade out`
                : `Iniciar ${Math.abs(spotEntryDelay)}ms antes do fim do fade`}
            </p>
          </div>
        </div>
      </div>

      {/* Layout em duas colunas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Coluna do player */}
        <div className="space-y-4">
          {/* Controles de reprodução */}
          <div className="flex justify-center items-center mb-4 space-x-4">
            {/* Botão anterior */}
            <button
              onClick={playPreviousTrack}
              disabled={isLoading}
              className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 flex items-center justify-center"
              aria-label="Faixa anterior"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 16.811c0 .864-.933 1.406-1.683.977l-7.108-4.061a1.125 1.125 0 0 1 0-1.954l7.108-4.061c.75-.429 1.683.113 1.683.977v8.122ZM11.25 16.811c0 .864-.933 1.406-1.683.977l-7.108-4.061a1.125 1.125 0 0 1 0-1.954l7.108-4.061c.75-.429 1.683.113 1.683.977v8.122Z" />
              </svg>
            </button>
            
            {/* Botão play/pause */}
            <button
              onClick={togglePlay}
              disabled={isLoading}
              className={`w-16 h-16 rounded-full ${isLoading ? 'bg-gray-500' : 'bg-primary'} text-white hover:bg-blue-700 flex items-center justify-center shadow-lg focus:outline-none transform transition-transform hover:scale-105`}
              aria-label={isPlaying ? "Pausar" : "Reproduzir"}
            >
              {isLoading ? (
                <svg className="animate-spin h-8 w-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : isPlaying ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
                  <path fillRule="evenodd" d="M6.75 5.25a.75.75 0 01.75-.75H9a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H7.5a.75.75 0 01-.75-.75V5.25zm7.5 0A.75.75 0 0115 4.5h1.5a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H15a.75.75 0 01-.75-.75V5.25z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
                  <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
                </svg>
              )}
            </button>
            
            {/* Botão próximo */}
            <button
              onClick={playNextTrack}
              disabled={isLoading}
              className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 flex items-center justify-center"
              aria-label="Próxima faixa"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8.689c0-.864.933-1.406 1.683-.977l7.108 4.061a1.125 1.125 0 0 1 0 1.954l-7.108 4.061A1.125 1.125 0 0 1 3 16.811V8.69ZM12.75 8.689c0-.864.933-1.406 1.683-.977l7.108 4.061a1.125 1.125 0 0 1 0 1.954l-7.108 4.061a1.125 1.125 0 0 1-1.683-.977V8.69Z" />
              </svg>
            </button>
            
            {/* Botão modo aleatório */}
            <button
              onClick={toggleShuffleMode}
              className={`w-10 h-10 rounded-full ${shuffleMode ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-gray-700'} hover:bg-gray-300 dark:hover:bg-gray-600 flex items-center justify-center`}
              aria-label="Modo aleatório"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 0 0-3.7-3.7 48.678 48.678 0 0 0-7.324 0 4.006 4.006 0 0 0-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 0 0 3.7 3.7 48.656 48.656 0 0 0 7.324 0 4.006 4.006 0 0 0 3.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3-3 3" />
              </svg>
            </button>
          </div>
          
          {isLoading && (
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-md">
              <p className="text-sm text-blue-800 dark:text-blue-200 text-center flex items-center justify-center">
                <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Carregando áudio...
              </p>
            </div>
          )}

          {audioError && (
            <div className="p-3 bg-red-100 dark:bg-red-900 rounded-md">
              <p className="text-sm text-red-800 dark:text-red-200">
                ⚠️ {audioError}
              </p>
            </div>
          )}

          {currentTrack && (
            <div>
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300 mb-2">
                <span className="text-black dark:text-white">{formatTime(currentTime)}</span>
                <span className="text-black dark:text-white">{formatTime(duration)}</span>
              </div>
              <div 
                ref={progressBarRef}
                className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 cursor-pointer"
                onClick={handleTimelineClick}
                onMouseDown={handleTimelineDragStart}
                onMouseMove={handleTimelineDrag}
                onMouseUp={handleTimelineDragEnd}
                onMouseLeave={handleTimelineDragEnd}
                onTouchStart={handleTimelineDragStart}
                onTouchMove={handleTimelineDrag}
                onTouchEnd={handleTimelineDragEnd}
              >
            <div
                  className="bg-primary h-3 rounded-full transition-all duration-100"
                  style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
            />
          </div>
              <p className="mt-2 text-sm font-medium text-gray-800 dark:text-gray-200 text-center">
                {isSpotPlaying ? (
                  <span className="flex items-center justify-center text-yellow-600 dark:text-yellow-400">
                    <svg className="w-4 h-4 mr-1 animate-pulse" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                    Spot: {currentTrack.title || 'Spot em reprodução'}
                  </span>
                ) : (
                  <span>
                    {currentTrack.title || 'Música em reprodução'}
                  </span>
                )}
          </p>
        </div>
      )}

      {isSpotPlaying && (
            <div className="p-3 mt-2 bg-yellow-100 dark:bg-yellow-900 rounded-md">
              <p className="text-sm text-yellow-800 dark:text-yellow-200 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mr-1 animate-pulse">
                  <path d="M10 8a3 3 0 100-6 3 3 0 000 6zM3.465 14.493a1.23 1.23 0 00.41 1.412A9.957 9.957 0 0010 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 00-13.074.003z" />
                </svg>
                Reproduzindo spot comercial
          </p>
        </div>
      )}

          {/* Playlist de Músicas */}
          <div className="mt-6">
            <h3 className="text-sm font-semibold mb-2 flex items-center justify-between">
              <span>Playlist de Músicas</span>
              <span className="text-xs bg-primary text-white px-2 py-1 rounded-full">
                {musicPlaylist.length} músicas
              </span>
            </h3>
            {musicPlaylist.length > 0 ? (
              <div className="max-h-80 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-md">
                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                  {musicPlaylist.map((music, index) => (
                    <li 
                      key={music.id || index} 
                      className={`px-3 py-2 text-sm ${index === currentMusicIndex && isPlaying && !isSpotPlaying ? 'bg-blue-100 dark:bg-blue-900' : ''} cursor-move transition-colors hover:bg-gray-50 dark:hover:bg-gray-800`}
                      draggable
                      onDragStart={(e) => handleMusicDragStart(e, index)}
                      onDragOver={handleMusicDragOver}
                      onDragEnd={handleMusicDragEnd}
                      onDrop={(e) => handleMusicDrop(e, index)}
                      onClick={() => loadAndPlayTrack(index)}
                    >
                      <div className="flex items-center">
                        <span className="w-5 h-5 flex items-center justify-center bg-gray-200 dark:bg-gray-700 rounded-full mr-2">
                          {index + 1}
                        </span>
                        <span className="flex-1 truncate">{music.title || `Música ${index + 1}`}</span>
                        {index === currentMusicIndex && isPlaying && !isSpotPlaying && (
                          <span className="ml-2 text-blue-600 dark:text-blue-400 text-xs font-semibold flex items-center">
                            <svg className="w-4 h-4 mr-1 animate-pulse" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                              <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
                            </svg>
                            Tocando
                          </span>
                        )}
                        {!(index === currentMusicIndex && isPlaying && !isSpotPlaying) && (
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="ml-2 w-4 h-4 text-gray-400">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-md text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Nenhuma música disponível. Adicione músicas para criar uma playlist.
                </p>
              </div>
            )}
            <div className="mt-2 text-xs text-gray-500 italic">
              Arraste e solte para reordenar as músicas
            </div>
          </div>
        </div>

        {/* Coluna da playlist e controles de spots */}
        <div className="space-y-4">
          {/* Botão para inicializar spots manualmente */}
          <button
            onClick={initSpotPlaylist}
            className="w-full px-3 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 flex items-center justify-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
            Atualizar playlists
          </button>
          
          {/* Playlist de Spots */}
          <div>
            <h3 className="text-sm font-semibold mb-2 flex items-center justify-between">
              <span>Playlist de Spots</span>
              {nextSpotTime && !isSpotPlaying && (
                <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded-full">
                  Próximo: {formatTime(Math.round((nextSpotTime - Date.now()) / 1000))}
                </span>
              )}
            </h3>
            
            {spotPlaylist.length > 0 ? (
              <div className="max-h-80 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-md">
                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                  {spotPlaylist.map((spot, index) => (
                    <li 
                      key={spot.id || index} 
                      className={`px-3 py-2 text-sm ${index === currentSpotIndex && !isSpotPlaying ? 'bg-yellow-50 dark:bg-yellow-900/40' : ''} ${isSpotPlaying && currentTrack && currentTrack.id === spot.id ? 'bg-yellow-100 dark:bg-yellow-900' : ''} cursor-move transition-colors hover:bg-gray-50 dark:hover:bg-gray-800`}
                      draggable
                      onDragStart={(e) => handleSpotDragStart(e, index)}
                      onDragOver={handleSpotDragOver}
                      onDragEnd={handleSpotDragEnd}
                      onDrop={(e) => handleSpotDrop(e, index)}
                    >
                      <div className="flex items-center">
                        <span className="w-5 h-5 flex items-center justify-center bg-gray-200 dark:bg-gray-700 rounded-full mr-2">
                          {index + 1}
                        </span>
                        <span className="flex-1 truncate">{spot.title || `Spot ${index + 1}`}</span>
                        {isSpotPlaying && currentTrack && currentTrack.id === spot.id ? (
                          <span className="ml-2 text-yellow-600 dark:text-yellow-400 text-xs font-semibold flex items-center">
                            <svg className="w-4 h-4 mr-1 animate-pulse" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                              <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                            </svg>
                            Tocando
                          </span>
                        ) : index === currentSpotIndex && !isSpotPlaying ? (
                          <span className="ml-2 text-blue-600 dark:text-blue-400 text-xs font-semibold">Próximo</span>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="ml-2 w-4 h-4 text-gray-400">
                            <path d="M7 3.5A1.5 1.5 0 018.5 2h3.879a1.5 1.5 0 011.06.44l3.122 3.12A1.5 1.5 0 0117 6.622V12.5a1.5 1.5 0 01-1.5 1.5h-1v-3.379a3 3 0 00-.879-2.121L10.5 5.379A3 3 0 008.379 4.5H7v-1z" />
                            <path d="M4.5 6A1.5 1.5 0 003 7.5v9A1.5 1.5 0 004.5 18h7a1.5 1.5 0 001.5-1.5v-5.879a1.5 1.5 0 00-.44-1.06L9.44 6.439A1.5 1.5 0 018.378 6H4.5z" />
                          </svg>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-md text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Nenhum spot disponível. Adicione spots para criar uma playlist.
                </p>
              </div>
            )}
            <div className="mt-2 text-xs text-gray-500 italic">
              Arraste e solte para reordenar os spots
            </div>
          </div>
          
          {/* Botão para reproduzir spot manualmente */}
          {spotPlaylist.length > 0 && (
            <button
              onClick={handlePlaySpotNow}
              disabled={isSpotPlaying || isLoading}
              className={`w-full py-2 px-4 mt-2 ${isSpotPlaying || isLoading ? 'bg-gray-400' : 'bg-yellow-500 hover:bg-yellow-600'} text-white rounded-md flex items-center justify-center`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 mr-2">
                <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
              </svg>
              Reproduzir spot agora
            </button>
          )}
        </div>
      </div>

      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => playNextTrack()}
      />
      <audio ref={spotAudioRef} />
    </div>
  );
} 