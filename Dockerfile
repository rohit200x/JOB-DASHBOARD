FROM mcr.microsoft.com/playwright:v1.49.1-jammy

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY server/package*.json ./server/
COPY client/package*.json ./client/

# Install all dependencies
RUN npm install
RUN cd server && npm install
RUN cd client && npm install

# Copy source code
COPY . .

# Build the client
RUN cd client && npm run build

# Expose the server port
EXPOSE 3001

# Start the server (which should serve the client in a real prod environment, but here we just start the backend)
# Wait, let's just run the dev server or add a start script
CMD ["npm", "run", "dev"]
