FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy source
COPY . .

# Build frontend
RUN cd client && npm ci && npm run build

# Create data directory
RUN mkdir -p data

EXPOSE 3000

CMD ["node", "src/index.js"]
