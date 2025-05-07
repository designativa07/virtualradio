'use client';

import { useState, useEffect, useRef } from 'react';
import { Howl } from 'howler';

export default function RadioPlayer({ stationName, audioFiles, autoplay = false }) {
  const [isPlaying, setIsPlaying] = useState(autoplay);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [nowPlaying, setNowPlaying] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const playerRef = useRef(null);
  const playlist = useRef([]);
  
  // Initialize the playlist when audioFiles change
  useEffect(() => {
    if (!audioFiles || audioFiles.length === 0) {
      // No audio files available
      setError('No audio files available for this radio station');
      return;
    }
    
    // Reset any errors
    setError('');
    
    // Create playlist from audioFiles
    playlist.current = audioFiles.map(file => ({
      id: file.id,
      title: file.title || file.name,
      src: file.file_path ? `/${file.file_path}` : `/api/audio/stream/${file.id}`,
      duration: file.duration || 0
    }));
    
    // Set initial track
    setCurrentTrack(playlist.current[0]);
    setCurrentTrackIndex(0);
    
    // Auto-play if enabled
    if (autoplay) {
      playTrack(playlist.current[0], 0);
    }
    
    return () => {
      // Clean up on unmount
      if (playerRef.current) {
        playerRef.current.stop();
        playerRef.current.unload();
      }
    };
  }, [audioFiles, autoplay]);
  
  // Play a specific track
  const playTrack = (track, index) => {
    setIsLoading(true);
    
    // Unload previous track if exists
    if (playerRef.current) {
      playerRef.current.stop();
      playerRef.current.unload();
    }
    
    // Create new Howl instance for this track
    const sound = new Howl({
      src: [track.src],
      html5: true,
      volume: volume,
      onload: () => {
        setIsLoading(false);
      },
      onplay: () => {
        setIsPlaying(true);
        setNowPlaying(track.title);
      },
      onend: () => {
        // Play next track when current one ends
        playNextTrack();
      },
      onloaderror: (id, error) => {
        console.error('Error loading track:', error);
        setIsLoading(false);
        setError(`Failed to load track: ${track.title}`);
        
        // Try next track after a short delay
        setTimeout(() => {
          playNextTrack();
        }, 2000);
      },
      onplayerror: (id, error) => {
        console.error('Error playing track:', error);
        setIsLoading(false);
        setError(`Failed to play track: ${track.title}`);
        
        // Try next track after a short delay
        setTimeout(() => {
          playNextTrack();
        }, 2000);
      }
    });
    
    // Store the sound object in ref and play
    playerRef.current = sound;
    sound.play();
    
    // Update state
    setCurrentTrack(track);
    setCurrentTrackIndex(index);
  };
  
  // Play next track in playlist
  const playNextTrack = () => {
    if (playlist.current.length === 0) return;
    
    // Calculate next index, wrapping around to start if at end
    const nextIndex = (currentTrackIndex + 1) % playlist.current.length;
    const nextTrack = playlist.current[nextIndex];
    
    // Play the next track
    playTrack(nextTrack, nextIndex);
  };
  
  // Play previous track in playlist
  const playPrevTrack = () => {
    if (playlist.current.length === 0) return;
    
    // Calculate previous index, wrapping around to end if at start
    const prevIndex = (currentTrackIndex - 1 + playlist.current.length) % playlist.current.length;
    const prevTrack = playlist.current[prevIndex];
    
    // Play the previous track
    playTrack(prevTrack, prevIndex);
  };
  
  // Toggle play/pause
  const togglePlayPause = () => {
    if (!playerRef.current) {
      // If no track is currently loaded, play the first one
      if (playlist.current.length > 0) {
        playTrack(playlist.current[0], 0);
      }
      return;
    }
    
    if (isPlaying) {
      playerRef.current.pause();
      setIsPlaying(false);
    } else {
      playerRef.current.play();
      setIsPlaying(true);
    }
  };
  
  // Handle volume change
  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    
    if (playerRef.current) {
      playerRef.current.volume(newVolume);
    }
  };
  
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-4 w-full">
      <div className="flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">{stationName || 'Radio Player'}</h2>
          
          {isLoading && (
            <span className="text-sm text-yellow-500 animate-pulse">Loading...</span>
          )}
        </div>
        
        {error && (
          <div className="mb-3 text-sm text-red-500">{error}</div>
        )}
        
        <div className="mb-4">
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Now Playing:</div>
          <div className="font-medium truncate">{nowPlaying || 'Nothing playing'}</div>
        </div>
        
        <div className="flex items-center justify-center space-x-4 mb-4">
          <button
            onClick={playPrevTrack}
            className="w-10 h-10 rounded-full bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 flex items-center justify-center"
            disabled={isLoading}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M9.195 18.44c1.25.713 2.805-.19 2.805-1.629v-2.34l6.945 3.968c1.25.714 2.805-.188 2.805-1.628V8.688c0-1.44-1.555-2.342-2.805-1.628L12 11.03v-2.34c0-1.44-1.555-2.343-2.805-1.629l-7.108 4.062c-1.26.72-1.26 2.536 0 3.256l7.108 4.061z" />
            </svg>
          </button>
          
          <button
            onClick={togglePlayPause}
            className="w-14 h-14 rounded-full bg-primary hover:bg-primary-dark text-white flex items-center justify-center"
            disabled={isLoading}
          >
            {isPlaying ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
                <path fillRule="evenodd" d="M6.75 5.25a.75.75 0 01.75-.75H9a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H7.5a.75.75 0 01-.75-.75V5.25zm7.5 0A.75.75 0 0115 4.5h1.5a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H15a.75.75 0 01-.75-.75V5.25z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
                <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
              </svg>
            )}
          </button>
          
          <button
            onClick={playNextTrack}
            className="w-10 h-10 rounded-full bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 flex items-center justify-center"
            disabled={isLoading}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M5.055 7.06c-1.25-.714-2.805.189-2.805 1.628v8.123c0 1.44 1.555 2.342 2.805 1.628L12 14.471v2.34c0 1.44 1.555 2.342 2.805 1.628l7.108-4.061c1.26-.72 1.26-2.536 0-3.256L14.805 7.06C13.555 6.346 12 7.25 12 8.688v2.34L5.055 7.06z" />
            </svg>
          </button>
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
            className="w-full h-2 rounded-lg appearance-none bg-gray-300 dark:bg-gray-700 cursor-pointer"
          />
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
          </svg>
        </div>
      </div>
    </div>
  );
} 