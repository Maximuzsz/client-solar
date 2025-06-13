# Etapa 1: build da aplicação Vite
FROM node:18 AS builder

WORKDIR /app
COPY . .
RUN npm install
RUN npm run build

# Etapa 2: nginx para servir a aplicação
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY ./nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
