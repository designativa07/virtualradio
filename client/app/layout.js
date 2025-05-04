import './globals.css';
import Navbar from '../components/Navbar';

export const metadata = {
  title: 'VirtualRadio - Web Platform for Radio Management',
  description: 'Create and manage internal radio stations with special effects',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  );
} 