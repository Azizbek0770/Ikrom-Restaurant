FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Health check
HEALTHCHECK --interval=30s --timeout=3s \
  CMD node -e "process.exit(0)"

# Start bot
CMD ["npm", "start"]