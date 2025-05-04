FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Build the frontend
WORKDIR /app/client
RUN npm install
RUN npm run build

# Return to main directory
WORKDIR /app

# Create directory for uploads
RUN mkdir -p uploads
RUN mkdir -p server/tmp

# Expose port
EXPOSE 3000

# Start server
CMD ["npm", "start"] 