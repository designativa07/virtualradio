'use client';

import { useState, useEffect, useRef } from 'react';
import { Howl } from 'howler';

// Função auxiliar para gerar URLs completas para áudios
const getFullAudioUrl = (audioPath) => {
  if (!audioPath) return '';
  
  // Se o caminho já é uma URL completa, retornar como está
  if (audioPath.startsWith('http://') || audioPath.startsWith('https://')) {
    return audioPath;
  }
  
  // Se o caminho começa com /api/, vamos usar a função do Next.js API Routes
  if (audioPath.startsWith('/api/')) {
    return audioPath; // O Next.js vai lidar com isso internamente
  }
  
  // Remover a barra inicial se existir
  const cleanPath = audioPath.startsWith('/') ? audioPath.substring(1) : audioPath;
  
  // Construir a URL base para o arquivo de áudio
  const baseUrl = process.env.NODE_ENV === 'production'
    ? 'https://virtualradio.h4xd66.easypanel.host'
    : 'http://localhost:3001';
    
  return `${baseUrl}/${cleanPath}`;
};

export default function AudioPlayer({ audioSrc, title }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.8);
  
  const soundRef = useRef(null);
  const animationRef = useRef(null);
  
  // Initialize Howler sound
  useEffect(() => {
    if (!audioSrc) return;
    
    // Clean up previous sound
    if (soundRef.current) {
      soundRef.current.stop();
      soundRef.current.unload();
    }
    
    // Obter a URL completa
    const fullAudioUrl = getFullAudioUrl(audioSrc);
    console.log("Loading audio from URL:", fullAudioUrl);
    
    // Create new sound
    const sound = new Howl({
      src: [fullAudioUrl],
      html5: true, // Use HTML5 Audio
      volume: volume,
      onload: () => {
        console.log("Audio loaded successfully");
        setDuration(sound.duration());
      },
      onloaderror: (id, error) => {
        console.error("Error loading audio:", error);
      },
      onplayerror: (id, error) => {
        console.error("Error playing audio:", error);
      },
      onend: () => {
        setIsPlaying(false);
        setCurrentTime(0);
        cancelAnimationFrame(animationRef.current);
      },
    });
    
    soundRef.current = sound;
    
    // Clean up on component unmount
    return () => {
      if (soundRef.current) {
        soundRef.current.stop();
        soundRef.current.unload();
      }
      cancelAnimationFrame(animationRef.current);
    };
  }, [audioSrc]);
  
  // Handle volume change
  useEffect(() => {
    if (soundRef.current) {
      soundRef.current.volume(volume);
    }
  }, [volume]);
  
  // Update progress bar
  const updateProgress = () => {
    if (soundRef.current) {
      const time = soundRef.current.seek();
      setCurrentTime(time);
      animationRef.current = requestAnimationFrame(updateProgress);
    }
  };
  
  const togglePlayPause = () => {
    if (!soundRef.current) return;
    
    if (!isPlaying) {
      soundRef.current.play();
      setIsPlaying(true);
      animationRef.current = requestAnimationFrame(updateProgress);
    } else {
      soundRef.current.pause();
      setIsPlaying(false);
      cancelAnimationFrame(animationRef.current);
    }
  };
  
  const handleSeek = (e) => {
    if (!soundRef.current) return;
    
    const seekTime = parseFloat(e.target.value);
    soundRef.current.seek(seekTime);
    setCurrentTime(seekTime);
  };
  
  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
  };
  
  // Format time in MM:SS
  const formatTime = (time) => {
    if (isNaN(time)) return '00:00';
    
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  
  return (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-2 truncate">{title || 'Audio Player'}</h3>
      
      <div className="flex items-center justify-center mb-4">
        <button
          onClick={togglePlayPause}
          className="w-12 h-12 rounded-full bg-primary hover:bg-primary-dark text-white flex items-center justify-center"
        >
          {isPlaying ? (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
              <path fillRule="evenodd" d="M6.75 5.25a.75.75 0 01.75-.75H9a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H7.5a.75.75 0 01-.75-.75V5.25zm7.5 0A.75.75 0 0115 4.5h1.5a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H15a.75.75 0 01-.75-.75V5.25z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
              <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
            </svg>
          )}
        </button>
      </div>
      
      <div className="mb-4 flex items-center space-x-2">
        <span className="text-sm">{formatTime(currentTime)}</span>
        <input
          type="range"
          min="0"
          max={duration || 0}
          step="0.01"
          value={currentTime || 0}
          onChange={handleSeek}
          className="w-full h-2 rounded-lg appearance-none bg-gray-300 dark:bg-gray-700 cursor-pointer"
        />
        <span className="text-sm">{formatTime(duration)}</span>
      </div>
      
      <div className="flex items-center space-x-2">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
        </svg>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={handleVolumeChange}
          className="w-24 h-2 rounded-lg appearance-none bg-gray-300 dark:bg-gray-700 cursor-pointer"
        />
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
        </svg>
      </div>
    </div>
  );
} 