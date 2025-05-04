'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [radios, setRadios] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Check authentication
    const checkAuth = async () => {
      try {
        // Obter o token do localStorage
        const token = localStorage.getItem('authToken');
        
        if (!token) {
          // Redirect to login if not authenticated
          router.push('/login');
          return;
        }
        
        const response = await fetch(`${getApiUrl()}/api/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          // Redirect to login if not authenticated
          router.push('/login');
          return;
        }
        
        const data = await response.json();
        setUser(data.user);
        
        // Fetch radios
        fetchRadios();
      } catch (error) {
        console.error('Error checking authentication:', error);
        router.push('/login');
      }
    };
    
    checkAuth();
  }, [router]);
  
  const fetchRadios = async () => {
    try {
      // Obter o token do localStorage
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
      }
    } catch (error) {
      console.error('Error fetching radios:', error);
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
        <h1 className="text-3xl font-bold">Dashboard</h1>
        
        {(user?.role === 'system_admin' || user?.role === 'radio_admin') && (
          <Link href="/radios/create" className="btn btn-primary">
            Create New Radio
          </Link>
        )}
      </div>
      
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Welcome, {user?.username}!</h2>
        <p className="text-gray-600 dark:text-gray-300">
          Your role: <span className="font-medium">{formatRole(user?.role)}</span>
        </p>
      </div>
      
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Your Radios</h2>
        
        {radios.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 text-center">
            <p className="text-gray-600 dark:text-gray-300 mb-4">You don't have any radios yet.</p>
            {(user?.role === 'system_admin' || user?.role === 'radio_admin') && (
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
      
      {user?.role === 'system_admin' && (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Admin Actions</h2>
          <div className="flex space-x-4">
            <Link href="/admin/users" className="btn btn-secondary">
              Manage Users
            </Link>
            <Link href="/admin/radios" className="btn btn-secondary">
              All Radios
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function formatRole(role) {
  if (!role) return '';
  
  switch (role) {
    case 'system_admin':
      return 'System Administrator';
    case 'radio_admin':
      return 'Radio Administrator';
    case 'listener':
      return 'Listener';
    default:
      return role;
  }
} 