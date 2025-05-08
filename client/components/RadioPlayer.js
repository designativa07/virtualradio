'use client';

import { useState, useEffect, useRef } from 'react';
import { Howl } from 'howler';

export default function RadioPlayer({ 
  stationName, 
  audioFiles, 
  autoplay = false,
  fadeOutDuration = 5,
  backgroundVolume = 0.3,
  spotVolume = 1
}) {
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isSpotPlaying, setIsSpotPlaying] = useState(false);
  const [nextSpotTime, setNextSpotTime] = useState(null);
  const [isFading, setIsFading] = useState(false);
  
  const audioRef = useRef(null);
  const spotAudioRef = useRef(null);
  const fadeIntervalRef = useRef(null);
  const spotIntervalRef = useRef(null);

  // Função para iniciar o fade out
  const startFadeOut = () => {
    if (isFading) return;
    
    setIsFading(true);
    const startVolume = audioRef.current.volume;
    const steps = 20; // número de passos para o fade
    const stepDuration = (fadeOutDuration * 1000) / steps;
    const volumeStep = startVolume / steps;
    
    let currentStep = 0;
    
    fadeIntervalRef.current = setInterval(() => {
      currentStep++;
      if (currentStep <= steps) {
        audioRef.current.volume = startVolume - (volumeStep * currentStep);
      } else {
        clearInterval(fadeIntervalRef.current);
        setIsFading(false);
      }
    }, stepDuration);
  };

  // Função para iniciar o fade in
  const startFadeIn = () => {
    if (isFading) return;
    
    setIsFading(true);
    const targetVolume = backgroundVolume;
    const steps = 20;
    const stepDuration = (fadeOutDuration * 1000) / steps;
    const volumeStep = targetVolume / steps;
    
    let currentStep = 0;
    
    fadeIntervalRef.current = setInterval(() => {
      currentStep++;
      if (currentStep <= steps) {
        audioRef.current.volume = volumeStep * currentStep;
      } else {
        clearInterval(fadeIntervalRef.current);
        setIsFading(false);
      }
    }, stepDuration);
  };

  // Função para tocar o próximo spot
  const playNextSpot = () => {
    if (!audioFiles.length) return;
    
    const spots = audioFiles.filter(file => file.type === 'spot');
    if (!spots.length) return;
    
    const randomSpot = spots[Math.floor(Math.random() * spots.length)];
    setCurrentTrack(randomSpot);
    
    if (spotAudioRef.current) {
      spotAudioRef.current.src = randomSpot.file_path;
      spotAudioRef.current.volume = spotVolume;
      spotAudioRef.current.play();
      setIsSpotPlaying(true);
    }
  };

  // Função para agendar o próximo spot
  const scheduleNextSpot = () => {
    const minInterval = 3 * 60 * 1000; // 3 minutos
    const maxInterval = 10 * 60 * 1000; // 10 minutos
    const randomInterval = Math.floor(Math.random() * (maxInterval - minInterval + 1)) + minInterval;
    
    setNextSpotTime(Date.now() + randomInterval);
  };

  useEffect(() => {
    if (autoplay && audioFiles.length > 0) {
      const music = audioFiles.find(file => file.type === 'music');
      if (music) {
        setCurrentTrack(music);
        if (audioRef.current) {
          audioRef.current.src = music.file_path;
          audioRef.current.volume = backgroundVolume;
          audioRef.current.play();
          setIsPlaying(true);
        }
      }
      scheduleNextSpot();
    }
  }, [audioFiles, autoplay]);

  useEffect(() => {
    if (nextSpotTime && Date.now() >= nextSpotTime) {
      startFadeOut();
      playNextSpot();
      scheduleNextSpot();
    }
  }, [nextSpotTime]);

  useEffect(() => {
    if (spotAudioRef.current) {
      spotAudioRef.current.onended = () => {
        setIsSpotPlaying(false);
        startFadeIn();
      };
    }
  }, []);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setDuration(audioRef.current.duration);
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">{stationName}</h2>
        <div className="flex items-center space-x-4">
          <button
            onClick={togglePlay}
            className="p-2 rounded-full bg-primary text-white hover:bg-primary-dark"
          >
            {isPlaying ? '⏸️' : '▶️'}
          </button>
          <div className="flex items-center space-x-2">
            <span>🔈</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={handleVolumeChange}
              className="w-24"
            />
          </div>
        </div>
      </div>

      {currentTrack && (
        <div className="mt-4">
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300 mb-2">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full"
              style={{ width: `${(currentTime / duration) * 100}%` }}
            />
          </div>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            {currentTrack.title}
          </p>
        </div>
      )}

      {isSpotPlaying && (
        <div className="mt-4 p-3 bg-yellow-100 dark:bg-yellow-900 rounded-md">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            🎙️ Spot em reprodução
          </p>
        </div>
      )}

      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => {
          const nextMusic = audioFiles.find(file => file.type === 'music');
          if (nextMusic) {
            setCurrentTrack(nextMusic);
            audioRef.current.src = nextMusic.file_path;
            audioRef.current.volume = backgroundVolume;
            audioRef.current.play();
          }
        }}
      />
      <audio ref={spotAudioRef} />
    </div>
  );
} 