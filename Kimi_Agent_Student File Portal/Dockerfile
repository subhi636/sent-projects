# Use a lightweight Node.js image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy root package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy server package files and install server dependencies
COPY server/package*.json ./server/
RUN cd server && npm install

# Copy all project files
COPY . .

# Build the React frontend
RUN npm run build

# Expose the port
EXPOSE 3001

# Start the server
CMD ["node", "server/index.js"]
