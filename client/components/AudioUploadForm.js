'use client';

import { useState } from 'react';
import { fetchApi } from '../app/utils/api';

export default function AudioUploadForm({ radioId, onSuccess }) {
  const [title, setTitle] = useState('');
  const [file, setFile] = useState(null);
  const [type, setType] = useState('music'); // 'music' ou 'spot'
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!file) {
      setError('Por favor, selecione um arquivo de áudio');
      return;
    }

    if (!title) {
      setError('Por favor, insira um título para o arquivo');
      return;
    }

    // Verificar o tipo do arquivo
    const fileType = file.type;
    if (!fileType.startsWith('audio/')) {
      setError('Por favor, selecione apenas arquivos de áudio');
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

      await fetchApi('/api/audio/upload', {
        method: 'POST',
        body: formData
      });

      setTitle('');
      setFile(null);
      setType('music');
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
            Formatos aceitos: MP3, WAV, OGG
          </p>
        </div>
        
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