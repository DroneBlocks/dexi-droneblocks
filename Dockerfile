FROM node:lts AS builder
WORKDIR /app
COPY . .
RUN npm i
RUN npm run generate

FROM nginx:latest
RUN apt update
COPY --from=builder /app/.output/public /usr/share/nginx/html