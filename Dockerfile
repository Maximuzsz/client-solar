# Etapa de build
FROM node:20 AS build
WORKDIR /app
COPY . .
RUN npm install

# Aumenta a memória disponível para o Node.js no build
ENV NODE_OPTIONS="--max-old-space-size=4096"

RUN npm run build

# Etapa de produção (servidor estático)
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html

# Copiar arquivo customizado do Nginx (opcional)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
