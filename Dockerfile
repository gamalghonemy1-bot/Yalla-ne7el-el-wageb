FROM node:20-slim
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY backend/package*.json ./
COPY backend/prisma ./prisma
RUN npm install --include=dev
RUN npx prisma generate
COPY backend/ .
RUN npm run build
EXPOSE 3000
CMD ["sh", "-c", "npx prisma db push && node dist/main"]
