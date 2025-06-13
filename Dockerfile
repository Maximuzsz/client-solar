# Etapa de build com Node.js
FROM node:20-alpine AS builder

# Diretório de trabalho
WORKDIR /app

# Copia todos os arquivos do projeto
COPY . .

# Cria automaticamente o .env a partir do template
RUN cp .env.template .env

# Instala as dependências (sem cache para imagem menor)
RUN npm ci

# Evita erro por memória em builds pesados
RUN NODE_OPTIONS="--max-old-space-size=2048" npm run build

# Etapa final: imagem leve com NGINX
FROM nginx:alpine

# Remove os arquivos padrão do NGINX
RUN rm -rf /usr/share/nginx/html/*

# Copia a build do frontend
COPY --from=builder /app/dist /usr/share/nginx/html

# Copia o nginx.conf customizado
COPY ./nginx.conf /etc/nginx/conf.d/default.conf

# (Opcional) Healthcheck para ambientes com orquestradores
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -q --spider http://localhost/health || exit 1

# Expõe a porta 80
EXPOSE 80

# Executa o NGINX
CMD ["nginx", "-g", "daemon off;"]
