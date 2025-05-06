import { useEffect } from 'react';
import '../styles/globals.css';

// Override the API_URL in the browser
function setApiUrl() {
  if (typeof window !== 'undefined') {
    // Set a global variable to ensure components use the correct API URL
    window.API_URL = 'https://myradio.h4xd66.easypanel.host/api';
    console.log('Set API_URL to:', window.API_URL);
    
    // Replace any fetch calls to localhost:3000/api with the production URL
    const originalFetch = window.fetch;
    window.fetch = function(url, options) {
      if (typeof url === 'string' && url.includes('localhost:3000/api')) {
        const newUrl = url.replace('localhost:3000/api', 'myradio.h4xd66.easypanel.host/api');
        console.log(`Redirecting fetch from ${url} to ${newUrl}`);
        return originalFetch(newUrl, options);
      }
      return originalFetch(url, options);
    };
  }
}

function MyApp({ Component, pageProps }) {
  useEffect(() => {
    // Set the API URL when the app loads
    setApiUrl();
  }, []);
  
  return <Component {...pageProps} />;
}

export default MyApp; 