'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  useEffect(() => {
    // Verificar autenticação para mostrar o estado de login correto
    const checkAuth = async () => {
      try {
        // Obter o token do localStorage
        const token = localStorage.getItem('authToken');
        
        if (!token) {
          setIsLoading(false);
          return;
        }
        
        const response = await fetch(`${getApiUrl()}/api/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, []);
  
  const handleLogout = async () => {
    try {
      // Com JWT, apenas removemos o token do localStorage
      localStorage.removeItem('authToken');
      setUser(null);
      router.push('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };
  
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };
  
  return (
    <nav className="bg-white shadow-md dark:bg-slate-900">
      <div className="container mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <span className="text-xl font-bold text-primary">VirtualRadio</span>
            </Link>
            
            <div className="hidden md:ml-6 md:flex md:space-x-4">
              <Link 
                href="/" 
                className="px-3 py-2 rounded-md text-gray-700 hover:text-primary hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-slate-800"
              >
                Home
              </Link>
              
              {user && (
                <>
                  <Link 
                    href="/dashboard" 
                    className="px-3 py-2 rounded-md text-gray-700 hover:text-primary hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-slate-800"
                  >
                    Dashboard
                  </Link>
                  <Link 
                    href="/radios" 
                    className="px-3 py-2 rounded-md text-gray-700 hover:text-primary hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-slate-800"
                  >
                    My Radios
                  </Link>
                  {user.role === 'system_admin' && (
                    <Link 
                      href="/admin" 
                      className="px-3 py-2 rounded-md text-gray-700 hover:text-primary hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-slate-800"
                    >
                      Admin Panel
                    </Link>
                  )}
                </>
              )}
            </div>
          </div>
          
          <div className="hidden md:flex md:items-center md:ml-6">
            {isLoading ? (
              <div className="text-gray-500 dark:text-gray-400">Loading...</div>
            ) : user ? (
              <div className="flex items-center space-x-4">
                <span className="text-gray-700 dark:text-gray-300">
                  {user.username}
                </span>
                <button
                  onClick={handleLogout}
                  className="px-3 py-2 rounded-md text-red-600 hover:text-red-800 hover:bg-red-100 dark:hover:bg-red-900 dark:hover:text-red-300"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="px-3 py-2 rounded-md text-primary hover:bg-blue-100 dark:hover:bg-blue-900"
              >
                Login
              </Link>
            )}
          </div>
          
          <div className="flex md:hidden items-center">
            <button
              onClick={toggleMobileMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-primary hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              <span className="sr-only">Open main menu</span>
              {mobileMenuOpen ? (
                <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link
              href="/"
              className="block px-3 py-2 rounded-md text-gray-700 hover:text-primary hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-slate-800"
            >
              Home
            </Link>
            
            {user && (
              <>
                <Link
                  href="/dashboard"
                  className="block px-3 py-2 rounded-md text-gray-700 hover:text-primary hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-slate-800"
                >
                  Dashboard
                </Link>
                <Link
                  href="/radios"
                  className="block px-3 py-2 rounded-md text-gray-700 hover:text-primary hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-slate-800"
                >
                  My Radios
                </Link>
                {user.role === 'system_admin' && (
                  <Link
                    href="/admin"
                    className="block px-3 py-2 rounded-md text-gray-700 hover:text-primary hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-slate-800"
                  >
                    Admin Panel
                  </Link>
                )}
              </>
            )}
          </div>
          
          <div className="pt-4 pb-3 border-t border-gray-200 dark:border-gray-700">
            {isLoading ? (
              <div className="text-gray-500 dark:text-gray-400 px-4">Loading...</div>
            ) : user ? (
              <div className="px-4 space-y-2">
                <div className="text-base font-medium text-gray-800 dark:text-gray-200">{user.username}</div>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-3 py-2 rounded-md text-red-600 hover:text-red-800 hover:bg-red-100 dark:hover:bg-red-900 dark:hover:text-red-300"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="px-4">
                <Link
                  href="/login"
                  className="block px-3 py-2 rounded-md text-primary hover:bg-blue-100 dark:hover:bg-blue-900"
                >
                  Login
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
} 