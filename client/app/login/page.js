'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';

// Função para obter a URL base da API
const getApiUrl = () => {
  // Detectar ambiente e usar a origem apropriada
  if (typeof window !== 'undefined') {
    // Em desenvolvimento local, usar o localhost:3000
    if (window.location.hostname === 'localhost') {
      return 'http://localhost:3000';
    }
    
    // Em ambiente de produção
    // 1. Se estamos acessando via site-designativa-virutalradio.h4xd66.easypanel.host, 
    // usamos esse mesmo endereço
    if (window.location.hostname.includes('h4xd66.easypanel.host')) {
      return window.location.origin;
    }
    
    // 2. Caso contrário, tentamos o localhost
    return 'http://localhost:3000';
  }
  
  // Fallback
  return '';
};

export default function Login() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { register, handleSubmit, formState: { errors } } = useForm();
  
  // Tentar autenticar com as credenciais padrão se houver problemas de banco de dados
  const tryFallbackLogin = async (data) => {
    try {
      const fallbackUrl = `${getApiUrl()}/api/auth/login-fallback`;
      console.log('Tentando login fallback em:', fallbackUrl);
      
      const response = await fetch(fallbackUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      console.log('Status da resposta fallback:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('Fallback login successful:', result);
        router.push('/dashboard');
        return true;
      }
      
      // Tentar ler a resposta de erro
      try {
        const errorData = await response.json();
        console.log('Erro no fallback login:', errorData);
      } catch (e) {
        console.log('Não foi possível ler resposta de erro do fallback');
      }
      
      return false;
    } catch (error) {
      console.error('Erro no fallback login:', error);
      return false;
    }
  };
  
  const onSubmit = async (data) => {
    setIsLoading(true);
    setError('');
    
    try {
      // Log para debug
      console.log('Tentando login com credenciais:', data.email);
      
      // Tentar primeiro o login fallback para simplificar os testes
      console.log('Tentando login fallback primeiro para simplificar testes');
      if (await tryFallbackLogin(data)) {
        return;
      }
      
      // Se o fallback falhar, tenta o login normal
      const apiUrl = `${getApiUrl()}/api/auth/login`;
      console.log('Tentando login normal em:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      console.log('Status da resposta:', response.status);
      
      let result;
      try {
        result = await response.json();
        console.log('Resposta:', result);
      } catch (e) {
        console.error('Erro ao processar JSON da resposta:', e);
        result = { message: 'Erro ao processar resposta do servidor' };
      }
      
      if (!response.ok) {
        setError(result.message || 'Login failed');
        return;
      }
      
      // Redirect to dashboard on successful login
      router.push('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      setError(`Erro: ${error.message}. Tente admin@admin.com / admin123.`);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="flex justify-center items-center min-h-[80vh]">
      <div className="w-full max-w-md p-8 bg-white dark:bg-slate-800 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Login to VirtualRadio</h1>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="email" className="form-label">
              Email
            </label>
            <input
              id="email"
              type="email"
              className="form-input"
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address',
                },
              })}
            />
            {errors.email && (
              <p className="form-error">{errors.email.message}</p>
            )}
          </div>
          
          <div>
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="form-input"
              {...register('password', {
                required: 'Password is required',
              })}
            />
            {errors.password && (
              <p className="form-error">{errors.password.message}</p>
            )}
          </div>
          
          <button 
            type="submit" 
            className="btn btn-primary w-full"
            disabled={isLoading}
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        
        <div className="mt-4 text-center text-sm">
          <p>Default credentials: admin@admin.com / admin123</p>
        </div>
        
        <div className="mt-6 text-center">
          <Link href="/" className="text-primary hover:underline">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
} 