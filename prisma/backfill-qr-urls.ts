import 'dotenv/config'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import { PrismaClient } from './generated/client'

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  const items = await prisma.item.findMany({
    where: { qrCodeUrl: null },
    select: { id: true },
  })

  for (const item of items) {
    await prisma.item.update({
      where: { id: item.id },
      data: { qrCodeUrl: `/api/items/${item.id}/qr` },
    })
  }

  console.log(`Updated ${items.length} items with qrCodeUrl`)
}

main().finally(() => prisma.$disconnect())
