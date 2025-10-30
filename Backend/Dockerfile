FROM node:20-alpine

# Install netcat for DB connection check
RUN apk add --no-cache netcat-openbsd

WORKDIR /app

COPY package*.json ./
RUN npm install --only=production

COPY . .

EXPOSE 5000

# Optional: change DB_HOST if using an environment variable
CMD sh -c 'echo "Waiting for database..." && \
  until nc -z "$DB_HOST" "$DB_PORT"; do sleep 2; done && \
  echo "Database is up! Starting server..." && \
  npm start'

