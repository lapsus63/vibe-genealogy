# Stage 1 — Build frontend
FROM node:20-alpine AS build
WORKDIR /app
RUN npm install -g bun
COPY frontend/package.json frontend/bun.lock ./
RUN bun install --frozen-lockfile
COPY frontend/ .
RUN bun run build

# Stage 2 — Serve (templates → envsubst au démarrage)
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY frontend/nginx.conf.template /etc/nginx/templates/default.conf.template
# Hostname Docker du service backend + context-path Spring (doit matcher le back)
ENV BACKEND_HOST=backend \
    BACKEND_CONTEXT_PATH=/vibe-genealogy
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
