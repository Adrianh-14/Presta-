FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY index.html postcss.config.js tailwind.config.js vite.config.js ./
COPY src ./src
COPY public ./public
COPY marketing ./marketing
ARG SITE_URL=https://prestamosplus.com
ARG GOOGLE_SITE_VERIFICATION
ENV SITE_URL=${SITE_URL}
ENV GOOGLE_SITE_VERIFICATION=${GOOGLE_SITE_VERIFICATION}
RUN npm run build:all && npm run marketing:verify

FROM nginx:1.27-alpine AS runtime
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY docker/security-headers.conf /etc/nginx/security-headers.conf
COPY --from=build /app/dist /usr/share/nginx/html/app
COPY --from=build /app/dist/assets /usr/share/nginx/html/assets
COPY --from=build /app/dist/branding /usr/share/nginx/html/branding
COPY --from=build /app/dist/app-showcase /usr/share/nginx/html/app-showcase
COPY --from=build /app/marketing/dist /usr/share/nginx/html

EXPOSE 3005

HEALTHCHECK --interval=10s --timeout=5s --retries=5 \
  CMD wget --quiet --spider http://localhost:3005/healthz || exit 1
