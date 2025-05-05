'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AudioPlayer from '../../../components/AudioPlayer';
import AudioUploadForm from '../../../components/AudioUploadForm';

// Função para obter a URL base da API
const getApiUrl = () => {
  // Forçar uso do localhost:3000
  return 'http://localhost:3000';
};

export default function RadioDetail({ params }) {
  const router = useRouter();
  const radioId = params.id;
  
  const [radio, setRadio] = useState(null);
  const [audioFiles, setAudioFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [selectedAudio, setSelectedAudio] = useState(null);
  const [usingMockData, setUsingMockData] = useState(false);

  useEffect(() => {
    // Check authentication
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('authToken');
        
        if (!token) {
          router.push('/login');
          return;
        }
        
        const response = await fetch(`${getApiUrl()}/api/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          router.push('/login');
          return;
        }
        
        const data = await response.json();
        setUser(data.user);
        
        // Fetch radio details and audio files
        fetchRadio();
        fetchAudioFiles();
      } catch (error) {
        console.error('Error checking authentication:', error);
        router.push('/login');
      }
    };
    
    checkAuth();
  }, [radioId, router]);
  
  const fetchRadio = async () => {
    try {
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        router.push('/login');
        return;
      }
      
      // First try the real endpoint
      try {
        console.log('Fetching radio from real endpoint...');
        const response = await fetch(`${getApiUrl()}/api/radio/${radioId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setRadio(data.radio);
          setUsingMockData(false);
          return;
        } else {
          console.error('Real endpoint failed with status:', response.status);
          // Continue to fallback
        }
      } catch (err) {
        console.error('Error fetching from real endpoint:', err);
        // Continue to fallback
      }
      
      // If real endpoint fails, try mock endpoint
      console.log('Trying fallback mock endpoint for radio details...');
      const mockResponse = await fetch(`${getApiUrl()}/api/debug/mock-radio/${radioId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (mockResponse.ok) {
        const mockData = await mockResponse.json();
        setRadio(mockData.radio);
        setUsingMockData(true);
      } else {
        setError('Failed to load radio. Database connection issue detected.');
      }
    } catch (error) {
      console.error('Error fetching radio:', error);
      setError('Failed to load radio information');
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchAudioFiles = async () => {
    try {
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        return;
      }
      
      // First try the real endpoint
      try {
        console.log('Fetching audio files from real endpoint...');
        const response = await fetch(`${getApiUrl()}/api/audio/radio/${radioId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setAudioFiles(data.files || []);
          return;
        } else {
          console.error('Real audio endpoint failed with status:', response.status);
          // Continue to fallback
        }
      } catch (err) {
        console.error('Error fetching audio from real endpoint:', err);
        // Continue to fallback
      }
      
      // If real endpoint fails, try mock endpoint
      console.log('Trying fallback mock endpoint for audio files...');
      const mockResponse = await fetch(`${getApiUrl()}/api/debug/mock-audio/radio/${radioId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (mockResponse.ok) {
        const mockData = await mockResponse.json();
        setAudioFiles(mockData.files || []);
        setUsingMockData(true);
      } else {
        console.error('Mock audio endpoint also failed');
      }
    } catch (error) {
      console.error('Error fetching audio files:', error);
    }
  };
  
  const handleAudioSelect = (audio) => {
    setSelectedAudio(audio);
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
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        return;
      }
      
      const response = await fetch(`${getApiUrl()}/api/audio/${audioId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        // Remove file from list
        setAudioFiles(audioFiles.filter(file => file.id !== audioId));
        
        // Clear selected audio if it was deleted
        if (selectedAudio && selectedAudio.id === audioId) {
          setSelectedAudio(null);
        }
      } else {
        alert('Failed to delete audio file');
      }
    } catch (error) {
      console.error('Error deleting audio:', error);
      alert('An error occurred while deleting the audio file');
    }
  };
  
  const isAdmin = () => {
    if (!user || !radio) return false;
    return user.role === 'system_admin' || user.id === radio.admin_id || user.role === 'admin';
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
          <p>⚠️ Using mock data due to database connection issues. Changes you make will not be permanently saved.</p>
        </div>
      )}
      
      <div className="flex items-center mb-8">
        <Link href="/radios" className="text-primary hover:underline mr-4">
          ← Back to Radios
        </Link>
        <h1 className="text-3xl font-bold">{radio.name}</h1>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 mb-8">
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
          
          {selectedAudio && (
            <div className="mb-8">
              <AudioPlayer 
                audioSrc={`/${selectedAudio.file_path}`} 
                title={selectedAudio.title}
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
          </div>
        )}
      </div>
    </div>
  );
} 