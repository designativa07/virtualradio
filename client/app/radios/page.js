'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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

export default function RadiosPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [radios, setRadios] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

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
        
        // Fetch radios
        fetchRadios();
      } catch (error) {
        console.error('Error checking authentication:', error);
        setError('Authentication error. Please try logging in again.');
        router.push('/login');
      }
    };
    
    checkAuth();
  }, [router]);
  
  const fetchRadios = async () => {
    try {
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        return;
      }
      
      const response = await fetch(`${getApiUrl()}/api/radio`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setRadios(data.radios || []);
      } else {
        setError('Failed to load radios. Please try again later.');
      }
    } catch (error) {
      console.error('Error fetching radios:', error);
      setError('An error occurred while loading radios.');
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }
  
  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Radios</h1>
        
        {(user?.role === 'system_admin' || user?.role === 'radio_admin' || user?.role === 'admin') && (
          <Link href="/radios/create" className="btn btn-primary">
            Create New Radio
          </Link>
        )}
      </div>
      
      {error && (
        <div className="bg-red-100 p-4 rounded-md text-red-700 mb-6">
          <p>{error}</p>
        </div>
      )}
      
      {radios.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 text-center">
          <p className="text-gray-600 dark:text-gray-300 mb-4">You don't have any radios yet.</p>
          {(user?.role === 'system_admin' || user?.role === 'radio_admin' || user?.role === 'admin') && (
            <Link href="/radios/create" className="btn btn-primary">
              Create Your First Radio
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {radios.map((radio) => (
            <div key={radio.id} className="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-2 truncate">{radio.name}</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
                  {radio.description || 'No description'}
                </p>
                <div className="flex justify-between">
                  <Link 
                    href={`/radios/${radio.id}`}
                    className="text-primary hover:underline"
                  >
                    Manage
                  </Link>
                  <span className="text-gray-500 text-sm">
                    {new Date(radio.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 