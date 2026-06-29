# Use Microsoft's official Playwright image — Chromium + all system deps included
FROM mcr.microsoft.com/playwright:v1.45.0-jammy

WORKDIR /app

# Install only what we need
COPY package.json .
RUN npm install --omit=dev

# Pre-install Chromium browser (already in base image, but ensures it's linked)
RUN npx playwright install chromium --with-deps

COPY src/ ./src/

EXPOSE 3000

CMD ["node", "src/server.js"]
