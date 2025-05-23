'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AudioPlayer from '../../../components/AudioPlayer';
import AudioUploadForm from '../../../components/AudioUploadForm';
import RadioPlayer from '../../../components/RadioPlayer';
import { fetchApi } from '../../utils/api';

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

export default function RadioDetail({ params }) {
  const router = useRouter();
  const [radioId, setRadioId] = useState(null);
  
  const [radio, setRadio] = useState(null);
  const [audioFiles, setAudioFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [selectedAudio, setSelectedAudio] = useState(null);
  const [usingMockData, setUsingMockData] = useState(false);
  const [showRadioPlayer, setShowRadioPlayer] = useState(false);
  const [fadeOutDuration, setFadeOutDuration] = useState(5); // duração do fade out em segundos
  const [backgroundVolume, setBackgroundVolume] = useState(0.3); // volume da música de fundo (0-1)
  const [spotVolume, setSpotVolume] = useState(1); // volume do spot (0-1)

  useEffect(() => {
    // Set the radioId from params safely
    const initParams = async () => {
      try {
        // Safely handle params which may be a promise in Next.js
        const id = typeof params === 'object' ? params.id : (await params).id;
        if (!id) {
          throw new Error('Missing radio ID parameter');
        }
        setRadioId(id);
      } catch (error) {
        console.error('Error getting params:', error);
        setError('Failed to get radio ID from URL');
      }
    };
    
    initParams();
  }, [params]);

  useEffect(() => {
    // Skip if radioId is not yet set
    if (!radioId) return;
    
    // Check authentication and load data
    const loadData = async () => {
      try {
        // Check authentication with our enhanced fetchApi
        const authData = await fetchApi('/api/auth/me');
        setUser(authData.user);
        
        // Fetch radio details and audio files
        await Promise.all([fetchRadio(), fetchAudioFiles()]);
      } catch (error) {
        console.error('Error loading data:', error);
        setError('Failed to load radio data: ' + error.message);
        if (error.message.includes('Authentication required')) {
          router.push('/login');
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [radioId, router]);
  
  const fetchRadio = async () => {
    if (!radioId) return;
    
    try {
      // Use enhanced fetchApi for better error handling and offline support
      console.log('Fetching radio details...');
      const data = await fetchApi(`/api/radio/${radioId}`);
      
      setRadio(data.radio);
      
      // Check if the response is from a mock handler
      if (data.isMock) {
        setUsingMockData(true);
        console.log('Using mock radio data');
      } else {
        setUsingMockData(false);
      }
    } catch (error) {
      console.error('Error fetching radio:', error);
      setError('Failed to load radio information: ' + error.message);
      throw error; // Re-throw to be caught by the parent
    }
  };
  
  const fetchAudioFiles = async () => {
    if (!radioId) return;
    
    try {
      // Use enhanced fetchApi for better error handling and offline support
      console.log('Fetching audio files...');
      const data = await fetchApi(`/api/audio/radio/${radioId}`);
      
      setAudioFiles(data.audioFiles || data.files || []);
      
      // Check if the response is from a mock handler
      if (data.isMock) {
        setUsingMockData(true);
        console.log('Using mock audio data');
      }
    } catch (error) {
      console.error('Error fetching audio files:', error);
      // Don't throw here, just log it - we can still show the radio without audio files
    }
  };
  
  const handleAudioSelect = (audio) => {
    // Adiciona a URL completa ao objeto de áudio, se necessário
    if (audio && audio.file_path && !audio.file_path.startsWith('http')) {
      console.log(`Preparando áudio para reprodução: ${audio.title}`);
      audio.full_url = getFullAudioUrl(audio.file_path);
    }
    
    setSelectedAudio(audio);
    setShowRadioPlayer(false); // Hide radio player when selecting individual audio
  };
  
  const handleAudioDelete = async (audioId) => {
    if (!confirm('Are you sure you want to delete this audio file?')) {
      return;
    }
    
    if (usingMockData) {
      // In mock mode, just remove from the local state
      setAudioFiles(audioFiles.filter(file => file.id !== audioId));
      
      // Clear selected audio if it was deleted
      if (selectedAudio && selectedAudio.id === audioId) {
        setSelectedAudio(null);
      }
      
      alert('Mock delete successful. Note: This is in mock mode, so no actual deletion occurred.');
      return;
    }
    
    try {
      // Use enhanced fetchApi
      await fetchApi(`/api/audio/${audioId}`, {
        method: 'DELETE'
      });
      
      // Remove file from list
      setAudioFiles(audioFiles.filter(file => file.id !== audioId));
      
      // Clear selected audio if it was deleted
      if (selectedAudio && selectedAudio.id === audioId) {
        setSelectedAudio(null);
      }
    } catch (error) {
      console.error('Error deleting audio:', error);
      alert('An error occurred while deleting the audio file: ' + error.message);
    }
  };
  
  const toggleRadioPlayer = () => {
    setShowRadioPlayer(!showRadioPlayer);
    if (!showRadioPlayer) {
      setSelectedAudio(null); // Clear selected audio when showing radio player
    }
  };
  
  const isAdmin = () => {
    if (!user || !radio) return false;
    return user.role === 'system_admin' || user.id === radio.admin_id || user.role === 'admin';
  };
  
  const handleDeleteRadio = async () => {
    if (!confirm('Tem certeza que deseja excluir esta rádio? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      await fetchApi(`/api/radio/${radioId}`, {
        method: 'DELETE'
      });

      router.push('/radios');
    } catch (error) {
      console.error('Error deleting radio:', error);
      setError('Erro ao excluir rádio: ' + error.message);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-100 p-4 rounded-md text-red-700">
        <p>{error}</p>
        <Link href="/dashboard" className="text-primary hover:underline mt-2 inline-block">
          Return to Dashboard
        </Link>
      </div>
    );
  }
  
  return (
    <div>
      {usingMockData && (
        <div className="mb-6 p-4 bg-yellow-100 text-yellow-700 rounded-md">
          <p>⚠️ Usando dados mockados devido a problemas de conexão com o banco de dados.</p>
        </div>
      )}
      
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <Link href="/radios" className="text-primary hover:underline mr-4">
            ← Voltar para Rádios
          </Link>
          <h1 className="text-3xl font-bold">{radio.name}</h1>
        </div>
        
        <div className="flex gap-4">
          {isAdmin() && (
            <>
              <Link
                href={`/radios/${radioId}/edit`}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                Editar Rádio
              </Link>
              <button
                onClick={handleDeleteRadio}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
              >
                Excluir Rádio
              </button>
            </>
          )}
          <button
            onClick={toggleRadioPlayer}
            className={`px-4 py-2 rounded-md ${showRadioPlayer ? 'bg-gray-200 text-gray-800' : 'bg-primary text-white'}`}
          >
            {showRadioPlayer ? 'Ocultar Player' : 'Iniciar Rádio'}
          </button>
        </div>
      </div>
      
      {showRadioPlayer && audioFiles.length > 0 && (
        <div className="mb-8">
          <RadioPlayer 
            stationName={radio.name}
            audioFiles={audioFiles}
            autoplay={true}
            fadeOutDuration={fadeOutDuration}
            backgroundVolume={backgroundVolume}
            spotVolume={spotVolume}
          />
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {selectedAudio && !showRadioPlayer && (
            <div className="mb-8">
              <AudioPlayer 
                audioSrc={
                  selectedAudio.file_path 
                    ? getFullAudioUrl(selectedAudio.file_path) 
                    : `/api/audio/stream/${selectedAudio.id}`
                }
                title={selectedAudio.title || 'Áudio sem título'}
              />
            </div>
          )}
          
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Audio Library</h2>
            
            <div className="mb-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Music</h3>
                <span className="text-gray-500 text-sm">
                  {audioFiles.filter(file => file.type === 'music').length} files
                </span>
              </div>
              <div className="mt-2 divide-y divide-gray-200 dark:divide-gray-700">
                {audioFiles
                  .filter(file => file.type === 'music')
                  .map(file => (
                    <div key={file.id} className="py-3 flex justify-between items-center">
                      <button
                        className="text-left flex-grow hover:text-primary truncate"
                        onClick={() => handleAudioSelect(file)}
                      >
                        {file.title}
                      </button>
                      {isAdmin() && (
                        <button
                          onClick={() => handleAudioDelete(file.id)}
                          className="text-red-500 hover:text-red-700 ml-2"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  ))}
                
                {audioFiles.filter(file => file.type === 'music').length === 0 && (
                  <p className="text-gray-500 py-3">No music files yet</p>
                )}
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Spots</h3>
                <span className="text-gray-500 text-sm">
                  {audioFiles.filter(file => file.type === 'spot').length} files
                </span>
              </div>
              <div className="mt-2 divide-y divide-gray-200 dark:divide-gray-700">
                {audioFiles
                  .filter(file => file.type === 'spot')
                  .map(file => (
                    <div key={file.id} className="py-3 flex justify-between items-center">
                      <button
                        className="text-left flex-grow hover:text-primary truncate"
                        onClick={() => handleAudioSelect(file)}
                      >
                        {file.title}
                      </button>
                      {isAdmin() && (
                        <button
                          onClick={() => handleAudioDelete(file.id)}
                          className="text-red-500 hover:text-red-700 ml-2"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  ))}
                
                {audioFiles.filter(file => file.type === 'spot').length === 0 && (
                  <p className="text-gray-500 py-3">No spot files yet</p>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {isAdmin() && (
          <div>
            <AudioUploadForm radioId={radioId} onSuccess={fetchAudioFiles} />
            
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 mt-8">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-semibold">About this Radio</h2>
                  <p className="text-gray-600 dark:text-gray-300 mt-2">
                    {radio.description || 'No description provided'}
                  </p>
                </div>
                {isAdmin() && (
                  <Link href={`/radios/${radioId}/edit`} className="text-primary hover:underline">
                    Edit Radio
                  </Link>
                )}
              </div>
              <div className="text-sm text-gray-500">
                <p>Created: {new Date(radio.created_at).toLocaleDateString()}</p>
                <p>Admin: {radio.admin_username}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 