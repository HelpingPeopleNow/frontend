# Stage 1: Build the Preact app
FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ARG VITE_CAP_API_ENDPOINT
ENV VITE_CAP_API_ENDPOINT=$VITE_CAP_API_ENDPOINT
RUN npm run build

# Stage 2: Serve with nginx
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Run as the unprivileged nginx user
RUN chown -R nginx:nginx /usr/share/nginx/html /var/cache/nginx /run \
    && sed -i 's/listen\s*80;/listen 8080;/' /etc/nginx/conf.d/default.conf
USER nginx
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
    CMD wget -qO- http://127.0.0.1:8080/ >/dev/null 2>&1 || exit 1
CMD ["nginx", "-g", "daemon off;"]
