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

# Build both client and server
RUN npm run build

# Expose the server port
EXPOSE 3001

# Start the server (which will also serve the static client)
CMD ["npm", "start"]
