# Dockerfile
# Estágio de construção com otimizações
FROM node:20-alpine AS builder

WORKDIR /app

# 1. Copiar apenas os arquivos necessários para instalação de dependências
COPY package.json package-lock.json ./

# 2. Instalar dependências com cache eficiente
RUN npm ci --legacy-peer-deps --prefer-offline

# 3. Copiar o restante dos arquivos
COPY . .

# 4. Configurar limite de memória para o build
ENV NODE_OPTIONS="--max-old-space-size=2048"

# 5. Construir a aplicação com produção explícita
RUN npm run build

# Estágio de produção otimizado
FROM nginx:alpine

# 6. Remover arquivos desnecessários do nginx
RUN rm -rf /usr/share/nginx/html/*

# 7. Copiar os arquivos construídos
COPY --from=builder /app/dist /usr/share/nginx/html

# 8. Copiar configuração otimizada do nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 9. Configurações de segurança
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html && \
    # Remover versão do nginx dos headers
    sed -i 's/server_tokens.*/server_tokens off;/' /etc/nginx/nginx.conf

# 10. Expor as portas (HTTP e HTTPS para futuro uso)
EXPOSE 80 443

# 11. Health check
HEALTHCHECK --interval=30s --timeout=3s \
  CMD curl -f http://localhost/ || exit 1

# 12. Comando otimizado para iniciar o nginx
CMD ["nginx", "-g", "daemon off;"]