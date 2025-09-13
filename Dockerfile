# Imagen base de Node
FROM node:20.18.0-alpine


# Directorio de trabajo
WORKDIR /app

RUN apk update && apk upgrade --no-cache

# Copiamos dependencias
COPY package*.json ./
RUN npm install

# Copiamos código fuente
COPY . .


# Exponemos el puerto (ajusta si usas otro)
EXPOSE 5000

# Comando para ejecutar
CMD ["npm", "run", "dev"]
