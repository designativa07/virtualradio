# MyRadio Next.js Frontend

This is the Next.js frontend for the MyRadio application. It's designed to work with the backend API at `https://myradio.h4xd66.easypanel.host/api`.

## API Connection Issue Fix

This application includes a fix for the connection refused error when the frontend tries to connect to `localhost:3000/api/auth/me`.

The fix works by:

1. Adding API proxy routes in `pages/api/*` that redirect to the production API
2. Configuring Next.js to rewrite API requests to the production server in `next.config.js`
3. Overriding the `fetch` function to redirect any hardcoded localhost:3000 API calls
4. Setting environment variables to point to the production API

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Deployment

To deploy this application:

1. Build the application:
```bash
npm run build
```

2. Start the production server:
```bash
npm start
```

## Environment Variables

Create a `.env.local` file with the following variables:

```
NEXT_PUBLIC_API_URL=https://myradio.h4xd66.easypanel.host/api
API_URL=https://myradio.h4xd66.easypanel.host/api
``` 