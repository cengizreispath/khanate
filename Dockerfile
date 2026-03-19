# Build stage for Next.js dashboard
FROM node:22-alpine AS dashboard-builder
WORKDIR /app

COPY dashboard/package*.json ./
RUN npm ci

COPY dashboard/ .
RUN npm run build

# Production image with Python + Node
FROM node:22-alpine AS runner
WORKDIR /app

# Install Python for Khanate CLI
RUN apk add --no-cache python3 py3-pip py3-yaml

# Copy Khanate CLI and libs
COPY lib/python /app/lib/python
RUN chmod +x /app/lib/python/*.py

# Create khanate CLI wrapper
RUN echo '#!/bin/sh' > /usr/local/bin/khanate && \
    echo 'python3 /app/lib/python/khanate_cli.py "$@"' >> /usr/local/bin/khanate && \
    chmod +x /usr/local/bin/khanate

# Copy entrypoint
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Setup for Next.js
ENV NODE_ENV=production

# Copy dashboard build
COPY --from=dashboard-builder /app/public ./public
COPY --from=dashboard-builder /app/.next/standalone ./
COPY --from=dashboard-builder /app/.next/static ./.next/static

# Copy default templates
COPY templates /app/templates

# Create data directories with proper permissions
RUN mkdir -p /data/worlds /data/registry /data/templates && \
    chmod -R 777 /data

# Environment
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV KHANATE_DATA_DIR=/data

EXPOSE 3000

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "server.js"]
