# VirtualRadio

A complete web platform for creating and managing internal radio stations. This system allows audio uploads (music and spots), playback with special effects (crossfade, fadein/fadeout), and management by different types of users.

## Features

- User authentication with three roles: system admin, radio admin, and listener
- Audio upload and management
- Radio station creation and management
- Audio player with special effects
- Docker deployment ready for Easypanel

## Tech Stack

- **Backend:** Node.js with Express
- **Frontend:** React with Next.js (App Router)
- **Database:** MySQL 8.0
- **Deployment:** Docker + Easypanel

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

# Database Configuration
DB_HOST=108.167.132.244
DB_USER=desig938_myradio
DB_PASS=giNdvTR[l*Tm
DB_NAME=desig938_myradio

# Server Configuration
PORT=80
NODE_ENV=production
SESSION_SECRET=virtualradioappsecretkey 