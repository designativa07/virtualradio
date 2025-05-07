'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { getApiUrl, fetchApi } from '../../utils/api';

export default function CreateRadioPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [usingMockData, setUsingMockData] = useState(false);
  const [useDebugEndpoint, setUseDebugEndpoint] = useState(false);
  
  const { register, handleSubmit, formState: { errors } } = useForm();
  
  useEffect(() => {
    // Check authentication
    const checkAuth = async () => {
      try {
        // Use fetchApi instead of direct fetch to handle authentication errors and fallbacks
        const data = await fetchApi('/api/auth/me');
        
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
      // Check if we should use debug endpoint
      if (useDebugEndpoint) {
        try {
          console.log('Creating radio using debug endpoint...');
          const result = await fetchApi('/api/radio/debug-create', {
            method: 'POST',
            body: JSON.stringify(data),
          });
          
          console.log('Debug endpoint success:', result);
          setError('Radio created successfully via debug endpoint! ID: ' + result.radioId);
          setTimeout(() => {
            router.push('/radios');
          }, 3000);
          return;
        } catch (err) {
          console.error('Error using debug endpoint:', err);
          setError('Error using debug endpoint: ' + err.message);
          setIsLoading(false);
          return;
        }
      }
      
      // Try the real endpoint using our enhanced fetchApi function that handles errors and 401 responses
      try {
        console.log('Creating radio using real endpoint...');
        const result = await fetchApi('/api/radio', {
          method: 'POST',
          body: JSON.stringify(data),
        });
        
        // If we get here, it worked (or returned a mock response)
        if (result.isMock) {
          setUsingMockData(true);
          setError('Radio created in mock mode due to server unavailability. The data will not be permanently saved.');
          
          // After 3 seconds, redirect to radios list
          setTimeout(() => {
            router.push('/radios');
          }, 3000);
          return;
        }
        
        // Real success - redirect to the new radio page
        if (result.radioId) {
          router.push(`/radios/${result.radioId}`);
        } else {
          router.push('/radios');
        }
        return;
      } catch (err) {
        console.error('Error using real endpoint:', err);
        setError(`Radio creation failed: ${err.message}. Try using the debug endpoint.`);
      }
    } catch (error) {
      console.error('Error creating radio:', error);
      setError('An error occurred. Please try again or use the debug option.');
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
        {usingMockData && (
          <div className="mb-6 p-4 bg-yellow-100 text-yellow-700 rounded-md">
            <p>⚠️ Using mock mode due to database connection issues. This radio will not be permanently saved.</p>
          </div>
        )}
        
        {error && (
          <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}
        
        {/* Debugging options */}
        <div className="mb-6 p-4 bg-blue-100 text-blue-700 rounded-md">
          <h3 className="font-bold mb-2">Debug Options</h3>
          
          <div className="flex flex-col space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={useDebugEndpoint}
                onChange={(e) => setUseDebugEndpoint(e.target.checked)}
                className="mr-2"
              />
              Use debug endpoint (fixed admin_id=1)
            </label>
          </div>
          
          {useDebugEndpoint && (
            <p className="mt-2 text-sm">Debug mode enabled. The radio will be created with admin_id=1 for debugging.</p>
          )}
        </div>
        
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