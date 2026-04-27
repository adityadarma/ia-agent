FROM node:24-alpine

WORKDIR /app

# Copy package dulu
COPY package*.json ./

# Install SEMUA dependency termasuk dev
RUN npm install

# Copy source
COPY . .

# Build TypeScript
RUN npm run build

# Remove devDependencies supaya lebih ringan (optional)
RUN npm prune --production

EXPOSE 3000

CMD ["node", "dist/server.js"]
