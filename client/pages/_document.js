import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  const csp = `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval';
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    font-src 'self' https://fonts.gstatic.com;
    img-src 'self' blob: data:;
    media-src 'self' blob:;
    connect-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com;
  `.replace(/\s{2,}/g, ' ').trim();

  return (
    <Html lang="en">
      <Head>
        <meta httpEquiv="Content-Security-Policy" content={csp} />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
} 