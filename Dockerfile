FROM node:24-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm i

COPY . .
RUN npm run build

FROM node:24-alpine

WORKDIR /app

COPY package*.json ./
RUN npm i --production

COPY --from=builder /app/dist ./dist

EXPOSE 5050

CMD ["node", "dist/src/main"]
