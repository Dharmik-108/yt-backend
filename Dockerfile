# Use Node.js base image
FROM node:20

# Install ffmpeg and other dependencies
RUN apt-get update && apt-get install -y ffmpeg curl

# Set working directory
WORKDIR /app

# Copy package files and install deps
COPY package*.json ./
RUN npm install

# Download yt-dlp binary
RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp && chmod +x /usr/local/bin/yt-dlp

# Copy rest of the source
COPY . .

# Expose port
EXPOSE 5000

# Start server
CMD ["npm", "start"]
