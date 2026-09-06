FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY index.html postcss.config.js tailwind.config.js vite.config.js ./
COPY src ./src
RUN npm run build
COPY marketing ./marketing
ARG SITE_URL=http://localhost:3005
ENV SITE_URL=${SITE_URL}
RUN node marketing/build.mjs

FROM nginx:1.27-alpine AS runtime
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html/app
COPY --from=build /app/dist/assets /usr/share/nginx/html/assets
COPY --from=build /app/marketing/dist /usr/share/nginx/html

EXPOSE 3005

HEALTHCHECK --interval=10s --timeout=5s --retries=5 \
  CMD wget --quiet --spider http://localhost:3005/healthz || exit 1
