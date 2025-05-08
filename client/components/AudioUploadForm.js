'use client';

import { useState } from 'react';
import { fetchApi } from '../app/utils/api';

export default function AudioUploadForm({ radioId, onSuccess }) {
  const [title, setTitle] = useState('');
  const [file, setFile] = useState(null);
  const [type, setType] = useState('music'); // 'music' ou 'spot'
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setProgress(0);
    
    if (!file) {
      setError('Por favor, selecione um arquivo de áudio');
      return;
    }

    if (!title) {
      setError('Por favor, insira um título para o arquivo');
      return;
    }

    // Verify file type
    const fileType = file.type;
    if (!fileType.startsWith('audio/')) {
      setError('Por favor, selecione apenas arquivos de áudio');
      return;
    }

    // Verify file extension
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.mp3') && !fileName.endsWith('.wav') && !fileName.endsWith('.ogg')) {
      setError('Por favor, selecione apenas arquivos MP3, WAV ou OGG');
      return;
    }

    // Verify file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      setError('O arquivo selecionado é muito grande. O tamanho máximo é 50MB.');
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('file', file);
      formData.append('type', type);
      formData.append('file_type', fileType);
      formData.append('radio_id', radioId);

      console.log('Uploading audio file:', {
        title,
        type,
        fileName: file.name,
        fileSize: file.size,
        fileType,
        radioId
      });

      // Use XMLHttpRequest for upload progress
      const xhr = new XMLHttpRequest();
      
      // Setup progress listener
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          setProgress(percentComplete);
        }
      });
      
      // Wait for the upload to complete
      const uploadPromise = new Promise((resolve, reject) => {
        xhr.onreadystatechange = function() {
          if (xhr.readyState === 4) {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const response = JSON.parse(xhr.responseText);
                resolve(response);
              } catch (e) {
                reject(new Error('Invalid server response'));
              }
            } else {
              let errorMessage = 'Upload failed';
              try {
                const errorResponse = JSON.parse(xhr.responseText);
                errorMessage = errorResponse.message || errorResponse.error || 'Server error';
              } catch (e) {
                // If we can't parse the error, use the status text
                errorMessage = `Server error: ${xhr.status} ${xhr.statusText}`;
              }
              reject(new Error(errorMessage));
            }
          }
        };
      });
      
      // Open and send the request
      xhr.open('POST', `${window.getApiUrl ? window.getApiUrl('/api/audio/upload') : '/api/audio/upload'}`);
      
      // Add auth token
      const token = localStorage.getItem('authToken');
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }
      
      xhr.send(formData);
      
      // Wait for upload to complete
      await uploadPromise;
      
      // Reset form
      setTitle('');
      setFile(null);
      setType('music');
      setProgress(0);
      
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error uploading audio:', error);
      setError(error.message || 'Erro ao fazer upload do arquivo');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">Upload de Áudio</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Título
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
            placeholder="Nome do arquivo de áudio"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">
            Tipo de Áudio
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
            required
          >
            <option value="music">Música</option>
            <option value="spot">Spot</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">
            Arquivo de Áudio
          </label>
          <input
            type="file"
            accept="audio/*"
            onChange={(e) => setFile(e.target.files[0])}
            className="w-full px-3 py-2 border rounded-md"
            required
          />
          <p className="mt-1 text-sm text-gray-500">
            Formatos aceitos: MP3, WAV, OGG (máx. 50MB)
          </p>
        </div>
        
        {isUploading && progress > 0 && (
          <div className="mt-4">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-sm text-center mt-1">{progress}% completo</p>
          </div>
        )}
        
        <button
          type="submit"
          disabled={isUploading}
          className={`w-full px-4 py-2 rounded-md text-white ${
            isUploading 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-primary hover:bg-primary-dark'
          }`}
        >
          {isUploading ? 'Enviando...' : 'Enviar Áudio'}
        </button>
      </form>
    </div>
  );
} 