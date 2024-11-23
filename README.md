This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Funding Arbitrage Monitor

Real-time monitoring of funding rates and spreads across cryptocurrency exchanges (Hyperliquid, Binance, Bybit).

## Features
- Real-time funding rates comparison
- Spread monitoring
- Automatic data cleanup
- Symbol filtering and pinning
- Trash data hiding

## Deployment Guide

### Prerequisites
- Docker and Docker Compose installed on the server
- Domain name pointing to your server
- Git access to the repository

### Initial Setup

1. Clone the repository on your server:
```bash
git clone https://github.com/your-username/fund-arb.git
cd fund-arb
```

2. Create a `.env` file:
```bash
# Database
DATABASE_URL="postgresql://user:password@postgres:5432/fundarb?schema=public"

# Port for the application
PORT=3000

# Add any other environment variables here
```

3. Create a `docker-compose.yml` file:
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
    depends_on:
      - postgres
    restart: always

  postgres:
    image: postgres:14
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=fundarb
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: always

  spreads-worker:
    build: .
    command: npm run worker:spreads
    environment:
      - DATABASE_URL=${DATABASE_URL}
    depends_on:
      - postgres
    restart: always

  cleanup-worker:
    build: .
    command: npm run worker:cleanup
    environment:
      - DATABASE_URL=${DATABASE_URL}
    depends_on:
      - postgres
    restart: always

volumes:
  postgres_data:
```

4. Create a `Dockerfile`:
```dockerfile
# Base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy project files
COPY . .

# Build the application
RUN npm run build

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
```

### Deployment

1. Build and start the containers:
```bash
docker-compose up -d
```

2. Initialize the database:
```bash
docker-compose exec app npx prisma migrate deploy
```

### Updating the Application

To update the application with new changes:

1. Pull the latest changes:
```bash
git pull origin main
```

2. Rebuild and restart the containers:
```bash
docker-compose down
docker-compose up -d --build
```

### Monitoring

- View application logs:
```bash
docker-compose logs -f app
```

- View worker logs:
```bash
docker-compose logs -f spreads-worker
docker-compose logs -f cleanup-worker
```

### Nginx Configuration (Optional)

If you're using Nginx as a reverse proxy, here's a sample configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Backup

The PostgreSQL data is persisted in a Docker volume. To backup the database:

```bash
docker-compose exec postgres pg_dump -U user fundarb > backup.sql
```

To restore from a backup:

```bash
docker-compose exec -T postgres psql -U user fundarb < backup.sql
```

## Development

To run the application locally:

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Start the workers:
```bash
npm run worker:spreads
npm run worker:cleanup
```

## License

MIT

---

# Мониторинг Финансового Арбитража

Мониторинг ставок финансирования и спредов на криптовалютных биржах (Hyperliquid, Binance, Bybit) в реальном времени.

## Возможности
- Сравнение ставок финансирования в реальном времени
- Мониторинг спредов
- Автоматическая очистка устаревших данных
- Фильтрация и закрепление символов
- Скрытие "мусорных" данных

## Руководство по развертыванию

### Предварительные требования
- Docker и Docker Compose установлены на сервере
- Доменное имя, указывающее на ваш сервер
- Доступ к Git репозиторию

### Начальная настройка

1. Клонируйте репозиторий на вашем сервере:
```bash
git clone https://github.com/your-username/fund-arb.git
cd fund-arb
```

2. Создайте файл `.env`:
```bash
# База данных
DATABASE_URL="postgresql://user:password@postgres:5432/fundarb?schema=public"

# Порт для приложения
PORT=3000

# Добавьте другие переменные окружения здесь
```

3. Создайте файл `docker-compose.yml`:
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
    depends_on:
      - postgres
    restart: always

  postgres:
    image: postgres:14
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=fundarb
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: always

  spreads-worker:
    build: .
    command: npm run worker:spreads
    environment:
      - DATABASE_URL=${DATABASE_URL}
    depends_on:
      - postgres
    restart: always

  cleanup-worker:
    build: .
    command: npm run worker:cleanup
    environment:
      - DATABASE_URL=${DATABASE_URL}
    depends_on:
      - postgres
    restart: always

volumes:
  postgres_data:
```

4. Создайте файл `Dockerfile`:
```dockerfile
# Базовый образ
FROM node:18-alpine

# Рабочая директория
WORKDIR /app

# Копируем файлы package.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install

# Копируем файлы проекта
COPY . .

# Собираем приложение
RUN npm run build

# Открываем порт
EXPOSE 3000

# Запускаем приложение
CMD ["npm", "start"]
```

### Развертывание

1. Соберите и запустите контейнеры:
```bash
docker-compose up -d
```

2. Инициализируйте базу данных:
```bash
docker-compose exec app npx prisma migrate deploy
```

### Обновление приложения

Для обновления приложения с новыми изменениями:

1. Получите последние изменения:
```bash
git pull origin main
```

2. Пересоберите и перезапустите контейнеры:
```bash
docker-compose down
docker-compose up -d --build
```

### Мониторинг

- Просмотр логов приложения:
```bash
docker-compose logs -f app
```

- Просмотр логов воркеров:
```bash
docker-compose logs -f spreads-worker
docker-compose logs -f cleanup-worker
```

### Настройка Nginx (Опционально)

Если вы используете Nginx как обратный прокси, вот пример конфигурации:

```nginx
server {
    listen 80;
    server_name ваш-домен.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Резервное копирование

Данные PostgreSQL хранятся в Docker volume. Для создания резервной копии базы данных:

```bash
docker-compose exec postgres pg_dump -U user fundarb > backup.sql
```

Для восстановления из резервной копии:

```bash
docker-compose exec -T postgres psql -U user fundarb < backup.sql
```

## Разработка

Для локального запуска приложения:

1. Установите зависимости:
```bash
npm install
```

2. Запустите сервер разработки:
```bash
npm run dev
```

3. Запустите воркеры:
```bash
npm run worker:spreads
npm run worker:cleanup
```

## Лицензия

MIT
