'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';

// Função para obter a URL base da API
const getApiUrl = () => {
  // Detectar ambiente e usar a origem apropriada
  if (typeof window !== 'undefined') {
    // Em desenvolvimento local, usar o localhost:3000
    if (window.location.hostname === 'localhost') {
      return 'http://localhost:3000';
    }
    
    // Em ambiente de produção, usar a origem atual
    return window.location.origin;
  }
  
  // Fallback
  return '';
};

export default function AudioUploadForm({ radioId, onSuccess }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [fileName, setFileName] = useState('');
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  
  const onSubmit = async (data) => {
    setIsLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        setError('Authentication token not found. Please log in again.');
        return;
      }
      
      const formData = new FormData();
      formData.append('audio', data.audio[0]);
      formData.append('title', data.title);
      formData.append('type', data.type);
      formData.append('radioId', radioId);
      
      const response = await fetch(`${getApiUrl()}/api/audio/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        setError(result.message || 'Upload failed');
        return;
      }
      
      // Reset form
      reset();
      setFileName('');
      
      // Notify parent component
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      setError('An error occurred. Please try again.');
      console.error('Upload error:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFileName(file.name);
    } else {
      setFileName('');
    }
  };
  
  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Upload Audio</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="title" className="form-label">Title</label>
          <input
            id="title"
            type="text"
            className="form-input"
            {...register('title', { required: 'Title is required' })}
          />
          {errors.title && (
            <p className="form-error">{errors.title.message}</p>
          )}
        </div>
        
        <div>
          <label htmlFor="type" className="form-label">Type</label>
          <select
            id="type"
            className="form-input"
            {...register('type', { required: 'Type is required' })}
          >
            <option value="">Select type</option>
            <option value="music">Music</option>
            <option value="spot">Spot</option>
          </select>
          {errors.type && (
            <p className="form-error">{errors.type.message}</p>
          )}
        </div>
        
        <div>
          <label htmlFor="audio" className="form-label">Audio File (MP3, WAV, OGG)</label>
          <div className="flex items-center space-x-2 mt-1">
            <label className="btn btn-secondary cursor-pointer">
              <span>Choose File</span>
              <input
                id="audio"
                type="file"
                className="hidden"
                accept=".mp3,.wav,.ogg"
                {...register('audio', { 
                  required: 'Audio file is required',
                  onChange: handleFileChange
                })}
              />
            </label>
            <span className="text-gray-600 dark:text-gray-300 truncate">
              {fileName || 'No file chosen'}
            </span>
          </div>
          {errors.audio && (
            <p className="form-error mt-1">{errors.audio.message}</p>
          )}
        </div>
        
        <button
          type="submit"
          className="btn btn-primary"
          disabled={isLoading}
        >
          {isLoading ? 'Uploading...' : 'Upload Audio'}
        </button>
      </form>
    </div>
  );
} 