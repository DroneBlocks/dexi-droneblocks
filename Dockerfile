FROM nginx:latest
RUN apt update && rm -rf /usr/share/nginx/html/*
ADD .output/public /usr/share/nginx/html