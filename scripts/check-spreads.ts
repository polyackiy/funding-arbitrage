const { PrismaClient } = require('@prisma/client');

interface Spread {
  timestamp: Date;
  exchange: string;
  symbol: string;
  spread: number;
}

const prisma = new PrismaClient();

async function checkSpreads(): Promise<void> {
  try {
    // Получить последние 5 записей
    const latestSpreads: Spread[] = await prisma.spread.findMany({
      take: 5,
      orderBy: {
        timestamp: 'desc'
      }
    });

    if (latestSpreads.length > 0) {
      console.log('Последние записи спредов:');
      latestSpreads.forEach((spread: Spread) => {
        console.log(`[${spread.timestamp.toISOString()}] ${spread.exchange} - ${spread.symbol}: ${spread.spread}`);
      });
      
      // Показать время последней записи
      const lastRecord: Spread = latestSpreads[0];
      const timeSinceLastRecord = Date.now() - lastRecord.timestamp.getTime();
      console.log(`\nПоследняя запись была ${Math.round(timeSinceLastRecord / 1000)} секунд назад`);
    } else {
      console.log('Записей в базе данных не найдено');
    }
  } catch (error) {
    console.error('Ошибка при проверке базы данных:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSpreads();
