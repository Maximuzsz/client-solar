FROM node:18 AS builder

WORKDIR /app
COPY . .
RUN npm install
# aumenta memória disponível para o build
RUN NODE_OPTIONS="--max-old-space-size=2048" npm run build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY ./nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
