FROM node:20-alpine
# Install netcat for wait-for-db
RUN apk add --no-cache netcat-openbsd
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
