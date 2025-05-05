'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';

// Function to get the API base URL
const getApiUrl = () => {
  if (typeof window !== 'undefined') {
    if (window.location.hostname === 'localhost') {
      return 'http://localhost:3000';
    }
    return window.location.origin;
  }
  return '';
};

export default function CreateRadioPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  
  const { register, handleSubmit, formState: { errors } } = useForm();
  
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
        
        // Check if user has permission to create radios
        if (data.user.role !== 'system_admin' && data.user.role !== 'radio_admin' && data.user.role !== 'admin') {
          router.push('/dashboard');
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
        router.push('/login');
      }
    };
    
    checkAuth();
  }, [router]);
  
  const onSubmit = async (data) => {
    setIsLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        router.push('/login');
        return;
      }
      
      const response = await fetch(`${getApiUrl()}/api/radio`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        setError(result.message || 'Failed to create radio');
        return;
      }
      
      // Redirect to the new radio page
      if (result.radioId) {
        router.push(`/radios/${result.radioId}`);
      } else {
        router.push('/radios');
      }
    } catch (error) {
      console.error('Error creating radio:', error);
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div>
      <div className="flex items-center mb-8">
        <Link href="/radios" className="text-primary hover:underline mr-4">
          ← Back to Radios
        </Link>
        <h1 className="text-3xl font-bold">Create New Radio</h1>
      </div>
      
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 max-w-2xl mx-auto">
        {error && (
          <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label htmlFor="name" className="form-label">Radio Name</label>
            <input
              id="name"
              type="text"
              className="form-input w-full"
              {...register('name', { required: 'Radio name is required' })}
            />
            {errors.name && (
              <p className="form-error">{errors.name.message}</p>
            )}
          </div>
          
          <div>
            <label htmlFor="description" className="form-label">Description</label>
            <textarea
              id="description"
              rows="4"
              className="form-input w-full"
              {...register('description')}
            />
            <p className="text-gray-500 text-sm mt-1">Optional description of your radio station</p>
          </div>
          
          <div className="flex space-x-4">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading}
            >
              {isLoading ? 'Creating...' : 'Create Radio'}
            </button>
            
            <Link href="/radios" className="btn btn-secondary">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
} 