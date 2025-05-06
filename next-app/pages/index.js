import { useEffect } from 'react';
import Head from 'next/head';

export default function Home() {
  useEffect(() => {
    // Log information about API configuration
    console.log('Next.js frontend starting');
    console.log('API URL:', process.env.NEXT_PUBLIC_API_URL || 'https://myradio.h4xd66.easypanel.host/api');
    
    // If we're in a browser, set the global API_URL
    if (typeof window !== 'undefined') {
      window.API_URL = 'https://myradio.h4xd66.easypanel.host/api';
      console.log('Set window.API_URL:', window.API_URL);
    }
  }, []);
  
  return (
    <div>
      <Head>
        <title>MyRadio - Sistema de Rádio Interna Personalizada</title>
        <meta name="description" content="Sistema de rádio interna personalizada" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '100vh',
        padding: '20px',
        textAlign: 'center',
        backgroundColor: '#f5f5f5'
      }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '20px' }}>
          MyRadio - Sistema de Rádio Interna Personalizada
        </h1>
        
        <p style={{ fontSize: '1.2rem', marginBottom: '30px', maxWidth: '800px' }}>
          Esta é a página de redirecionamento para o sistema MyRadio.
          Você será redirecionado para a interface principal em instantes.
        </p>
        
        <div>
          <a 
            href="/client" 
            style={{ 
              display: 'inline-block',
              margin: '10px',
              padding: '15px 30px', 
              backgroundColor: '#0070f3',
              color: 'white',
              borderRadius: '5px',
              textDecoration: 'none',
              fontSize: '1.1rem',
              fontWeight: 'bold'
            }}
          >
            Acessar Interface do Cliente
          </a>
          
          <a 
            href="/admin" 
            style={{ 
              display: 'inline-block',
              margin: '10px',
              padding: '15px 30px', 
              backgroundColor: '#333',
              color: 'white',
              borderRadius: '5px',
              textDecoration: 'none',
              fontSize: '1.1rem',
              fontWeight: 'bold'
            }}
          >
            Acessar Painel Administrativo
          </a>
        </div>
        
        <div style={{ marginTop: '40px', color: '#666' }}>
          <p>API URL: {process.env.NEXT_PUBLIC_API_URL || 'https://myradio.h4xd66.easypanel.host/api'}</p>
        </div>
      </main>
    </div>
  );
} 