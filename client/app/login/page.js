'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';

// Função para obter a URL base da API
const getApiUrl = () => {
  // Forçar uso do localhost:3000
  return 'http://localhost:3000';
};

export default function Login() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { register, handleSubmit, formState: { errors } } = useForm();
  
  // Tentar autenticar com as credenciais padrão se houver problemas de banco de dados
  const tryFallbackLogin = async (data) => {
    const fallbackEmails = [
      data.email, // Email que o usuário forneceu
      'admin',    // Email simples (sem @)
      'admin@admin.com',  // Combinação que tentamos antes
      'admin@virtualradio.com' // Email do banco de dados padrão
    ];
    
    // Verificar se já estamos usando admin123
    const isUsingAdminPass = data.password === 'admin123';
    
    for (const email of fallbackEmails) {
      // Se não estamos usando a senha admin123, só tente com o email original
      if (!isUsingAdminPass && email !== data.email) continue;
      
      try {
        const credentials = { 
          email: email, 
          password: isUsingAdminPass ? 'admin123' : data.password 
        };
        
        const fallbackUrl = `${getApiUrl()}/api/auth/login-fallback`;
        console.log(`Tentando login fallback com email: ${email}`);
        
        const response = await fetch(fallbackUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(credentials),
        });
        
        console.log(`Status da resposta fallback (${email}):`, response.status);
        
        if (response.ok) {
          const result = await response.json();
          console.log('Fallback login successful:', result);
          
          // Salvar o token no localStorage
          if (result.token) {
            localStorage.setItem('authToken', result.token);
            console.log('Token salvo no localStorage');
          }
          
          router.push('/dashboard');
          return true;
        }
        
        // Tentar ler a resposta de erro
        try {
          const errorData = await response.json();
          console.log(`Erro no fallback login (${email}):`, errorData);
        } catch (e) {
          console.log('Não foi possível ler resposta de erro do fallback');
        }
      } catch (error) {
        console.error(`Erro no fallback login (${email}):`, error);
      }
    }
    
    // Se chegou aqui, todas as tentativas falharam
    return false;
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
        credentials: 'include',
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
      
      // Salvar o token no localStorage
      if (result.token) {
        localStorage.setItem('authToken', result.token);
        console.log('Token salvo no localStorage');
      }
      
      // Redirect to dashboard on successful login
      router.push('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      setError(`Erro: ${error.message}. Tente admin@virtualradio.com / admin123.`);
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
          <p>Default credentials: admin@virtualradio.com / admin123</p>
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