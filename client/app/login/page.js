'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';

// Função para obter a URL base da API
const getApiUrl = () => {
  // Forçar uso do servidor local para testes
  if (typeof window !== 'undefined') {
    // Comentado temporariamente para forçar uso local
    // if (window.location.hostname === 'localhost') {
    //   return 'http://localhost:3000';
    // }
    // Em produção, usamos a mesma origem com protocolo e host
    // return window.location.origin;
    
    // TEMPORÁRIO: Forçar uso do servidor local para testes
    return window.location.hostname === 'localhost' 
      ? 'http://localhost:3000' 
      : 'http://localhost:3000';
  }
  
  // Fallback para url local
  return 'http://localhost:3000';
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
      const apiUrl = `${getApiUrl()}/api/auth/login`;
      console.log('Tentando login em:', apiUrl);
      console.log('Dados:', data);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      console.log('Status da resposta:', response.status);
      
      // Se a resposta for 503 (serviço indisponível), tente o login de fallback
      if (response.status === 503 || response.status === 500 || response.status === 400) {
        console.log('Tentando login fallback devido ao status:', response.status);
        if (await tryFallbackLogin(data)) {
          return;
        }
      }
      
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
      
      // Se houver um erro na chamada regular, tente o fallback 
      // (especialmente útil se o banco de dados estiver indisponível)
      console.log('Tentando login fallback após erro');
      if (await tryFallbackLogin(data)) {
        return;
      }
      
      setError(`Erro: ${error.message}. Tente admin@admin.com / admin123 se o banco de dados estiver indisponível.`);
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