'use client';

import './globals.css';
import Navbar from '../components/Navbar';

// metadata precisa ser removida em componentes client
// ou alternativamente, usar uma página separada para metadados

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <title>VirtualRadio - Web Platform for Radio Management</title>
        <meta name="description" content="Create and manage internal radio stations with special effects" />
      </head>
      <body>
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  );
} 