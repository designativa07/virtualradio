'use client';

import { useState, useEffect } from 'react';
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

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    // Check if user is logged in
    const checkAuth = async () => {
      try {
        const response = await fetch(`${getApiUrl()}/api/auth/me`, {
          credentials: 'include', // Importante: envia cookies com a requisição
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
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col items-center">
      <h1 className="text-4xl font-bold mb-6">Welcome to VirtualRadio</h1>
      <p className="text-xl mb-8 text-center max-w-2xl">
        A complete web platform for creating and managing internal radio stations
      </p>
      
      {user ? (
        <div className="flex flex-col items-center space-y-4">
          <p className="text-lg">Welcome back, {user.username}!</p>
          <div className="flex space-x-4">
            <Link href="/dashboard" className="btn btn-primary">
              Go to Dashboard
            </Link>
            <Link href="/radios" className="btn btn-secondary">
              My Radios
            </Link>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center space-y-4">
          <p className="text-lg">Please log in to access your radios</p>
          <div className="flex space-x-4">
            <Link href="/login" className="btn btn-primary">
              Login
            </Link>
          </div>
        </div>
      )}
      
      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl">
        <FeatureCard 
          title="Audio Management" 
          description="Upload and manage your audio files, including music and spots."
          icon="🎵"
        />
        <FeatureCard 
          title="Special Effects" 
          description="Play audio with crossfade, fadein, and fadeout effects."
          icon="✨"
        />
        <FeatureCard 
          title="User Roles" 
          description="Different permission levels for system admins, radio admins, and listeners."
          icon="👥"
        />
      </div>
    </div>
  );
}

function FeatureCard({ title, description, icon }) {
  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
      <div className="text-3xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-600 dark:text-gray-300">{description}</p>
    </div>
  );
} 