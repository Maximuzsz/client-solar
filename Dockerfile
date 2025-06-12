# Etapa 1: Build da aplicação usando imagem leve do Node
FROM node:20-alpine AS build

# Diretório de trabalho dentro do container
WORKDIR /app

# Copia somente arquivos de dependências para aproveitar cache do Docker
COPY package*.json ./

# Instala dependências exatas do package-lock (sem dev dependencies em produção, se quiser)
RUN npm ci

# Copia todo o código fonte restante para o container
COPY . .

# Aumenta memória para Node.js no build (evita erros de OOM)
ENV NODE_OPTIONS="--max-old-space-size=4096"

# Executa build da aplicação (gera arquivos estáticos)
RUN npm run build

# Etapa 2: Imagem final baseada em Nginx para servir conteúdo estático
FROM nginx:1.25-alpine

# Remove arquivos estáticos padrão do Nginx para limpar a imagem
RUN rm -rf /usr/share/nginx/html/*

# Copia os arquivos estáticos do build para o diretório padrão do Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Copia configuração customizada do Nginx (caso necessário)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Define permissões restritas para segurança (somente leitura e execução)
RUN chmod -R 755 /usr/share/nginx/html

# Expondo a porta padrão HTTP
EXPOSE 80

# Executa o Nginx em primeiro plano para manter o container ativo
CMD ["nginx", "-g", "daemon off;"]
