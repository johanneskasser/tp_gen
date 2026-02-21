# Dynamic Renderer — Puppeteer-based pre-rendering for search engine bots
# Based on the dynamic-rendering-ultra-generation approach:
# https://github.com/anhchangvt1994/dynamic-rendering-ultra-generation__vite-react
#
# Uses system Chromium instead of bundled one (smaller image, better on Ubuntu).

FROM node:20-slim

# Install Chromium and required system dependencies
RUN apt-get update && apt-get install -y \
    chromium \
fonts-freefont-ttf \
    fonts-noto \
    fonts-noto-cjk \
    ca-certificates \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Tell Puppeteer to use the system Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev

COPY server.mjs ./

EXPOSE 3000

USER node

CMD ["node", "server.mjs"]
