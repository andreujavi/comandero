# Usa una imagen oficial ligera de Node.js
FROM node:18-alpine

# Define el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copia los archivos de dependencias
COPY package*.json ./

# Instala las dependencias en producción
RUN npm install --production

# Copia el resto del código del proyecto
COPY . .

# Expone el puerto por defecto
EXPOSE 3000

# Comando para arrancar el servidor automáticamente al encender la máquina
CMD ["npm", "start"]