# Etapa 1: Build da aplicação
FROM node:20-alpine AS build

# Diretório de trabalho
WORKDIR /app

# Copia apenas os arquivos necessários primeiro (melhora cache)
COPY package*.json ./

# Instala apenas produção + dependências necessárias para o build
RUN npm ci

# Copia o restante do código
COPY . .

# Aumenta a memória disponível para o Node.js durante o build
ENV NODE_OPTIONS="--max-old-space-size=4096"

# Build da aplicação
RUN npm run build

# Etapa 2: Imagem final (Nginx)
FROM nginx:1.25-alpine

# Remove os arquivos padrão do Nginx (opcional, para limpeza)
RUN rm -rf /usr/share/nginx/html/*

# Copia os arquivos estáticos gerados no build
COPY --from=build /app/dist /usr/share/nginx/html

# Copia configuração customizada do Nginx (se necessário)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Define permissões adequadas (opcional, segurança)
RUN chmod -R 755 /usr/share/nginx/html

# Expondo a porta
EXPOSE 80

# Start do Nginx no modo foreground
CMD ["nginx", "-g", "daemon off;"]
