'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchApi } from '../../../utils/api';

export default function EditRadio({ params }) {
  const router = useRouter();
  const [radioId, setRadioId] = useState(null);
  const [radio, setRadio] = useState({
    name: '',
    description: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [usingMockData, setUsingMockData] = useState(false);

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
        
        // Fetch radio details
        await fetchRadio();
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading data:', error);
        setError('Failed to load radio data: ' + error.message);
        if (error.message.includes('Authentication required')) {
          router.push('/login');
        }
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
      
      const radioData = data.radio || {};
      setRadio({
        name: radioData.name || '',
        description: radioData.description || ''
      });
      
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
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSaving(true);
    
    try {
      const response = await fetchApi(`/api/radio/${radioId}`, {
        method: 'PUT',
        body: JSON.stringify(radio)
      });
      
      if (response.success) {
        router.push(`/radios/${radioId}`);
      } else {
        throw new Error(response.message || 'Failed to update radio');
      }
    } catch (error) {
      console.error('Error updating radio:', error);
      setError('Failed to update radio: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setRadio(prev => ({
      ...prev,
      [name]: value
    }));
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
  
  if (!isAdmin()) {
    return (
      <div className="bg-red-100 p-4 rounded-md text-red-700">
        <p>You don't have permission to edit this radio.</p>
        <Link href={`/radios/${radioId}`} className="text-primary hover:underline mt-2 inline-block">
          Back to Radio Details
        </Link>
      </div>
    );
  }
  
  return (
    <div>
      {usingMockData && (
        <div className="mb-6 p-4 bg-yellow-100 text-yellow-700 rounded-md">
          <p>⚠️ Using mock data due to database connection issues.</p>
        </div>
      )}
      
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <Link href={`/radios/${radioId}`} className="text-primary hover:underline mr-4">
            ← Back to Radio
          </Link>
          <h1 className="text-3xl font-bold">Edit Radio</h1>
        </div>
      </div>
      
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Radio Name
            </label>
            <input
              type="text"
              name="name"
              value={radio.name}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="Radio Name"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={radio.description}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="Radio Description"
              rows={4}
            />
          </div>
          
          <div className="flex justify-end gap-4">
            <Link 
              href={`/radios/${radioId}`}
              className="px-4 py-2 border rounded-md hover:bg-gray-100"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSaving}
              className={`px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark ${
                isSaving ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 