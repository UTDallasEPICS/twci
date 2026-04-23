import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import { PrismaClient } from './generated/client'

const adapter = new PrismaBetterSqlite3({ url: `${process.env.DATABASE_URL}` })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Start seeding...')

  // Create a User
  const user1 = await prisma.user.create({
    data: {
      name: "Sample Name", // modify this fit your needs
      email: "email@example.com"
    }
  })

  console.log({ user1 })
  console.log('Seeding finished.')
}
// You can seed other models in your db as well depending on project needs

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
