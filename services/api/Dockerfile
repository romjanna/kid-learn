FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

FROM node:20-alpine AS runner
RUN addgroup -S appuser && adduser -S appuser -G appuser
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package.json ./
RUN chown -R appuser:appuser /app
USER appuser
EXPOSE 3000
CMD ["node", "dist/index.js"]
