FROM nginx:alpine
# Bake nginx.conf into the image at build time.
# This eliminates the need for a bind-mount at runtime, which is
# fragile in Docker-in-Docker setups (the classic "not a directory" error).
COPY nginx.conf /etc/nginx/nginx.conf
