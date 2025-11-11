FROM node:20-alpine

WORKDIR /app

# Instala dependencias primero (mejor cacheo)
COPY package*.json ./
RUN npm ci --omit=dev || npm install --omit=dev

# Copia el código
COPY . .

EXPOSE 8080
CMD ["npm", "start"]
