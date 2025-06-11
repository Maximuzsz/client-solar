FROM node:20-alpine AS builder

WORKDIR /app

# Copiar os arquivos de pacotes para instalar dependências
COPY package*.json ./

# Instalar dependências
RUN npm ci

# Copiar o restante do código-fonte
COPY . .

# Construir a aplicação para produção
RUN npm run build

# Etapa de produção - usando nginx para servir o frontend
FROM nginx:stable-alpine AS production

# Copiar configuração personalizada do Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar os arquivos de build da etapa anterior
COPY --from=builder /app/dist /usr/share/nginx/html

# Expor a porta 80
EXPOSE 80

# Iniciar o Nginx no foreground
CMD ["nginx", "-g", "daemon off;"]