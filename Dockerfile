# Etapa de build
FROM node:20-alpine AS builder

WORKDIR /app

COPY . .

# Cria automaticamente .env a partir do template
RUN cp .env.template .env

RUN npm install

# Evita erro de falta de memória na build
RUN NODE_OPTIONS="--max-old-space-size=2048" npm run build

# Etapa de produção com NGINX
FROM nginx:alpine

# Copia build final
COPY --from=builder /app/dist /usr/share/nginx/html

# Copia a config do nginx
COPY ./nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
