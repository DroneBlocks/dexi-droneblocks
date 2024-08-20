FROM nginx:latest
RUN apt update
ADD .output/public /usr/share/nginx/html