FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --omit=dev
COPY . .
EXPOSE 4000
CMD ["sh", "-c", "node src/db/migrate.js && node src/db/seed.js && node src/index.js"]
