import { readFileSync } from 'fs'
import { resolve } from 'path'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import { PrismaClient } from './generated/client'

/**
 * Seed script, run via `pnpm prisma db seed` (and at the end of
 * `pnpm prisma:reset`).
 *
 * User accounts are seeded from `prisma/seed/users.json` so everything the
 * seed needs lives inside `prisma/`. That file is a one-time conversion of
 * the HR roster CSV export: names are already split into first/last fields,
 * emails are lowercased, and each row carries its resolved `role`
 * (admin | supervisor | employee) and `status` (active | on_leave). To change
 * who gets seeded, edit users.json directly — no parsing happens here.
 *
 * Locations, items, and checkout logs are defined inline below. Checkout
 * timestamps are computed relative to "now" so history views always look
 * recent.
 *
 * Every write is an `upsert`, so re-running the seed is idempotent. User rows
 * are refreshed from the fixture on re-run; items and checkout logs skip
 * creation when they already exist.
 */

const adapter = new PrismaBetterSqlite3({ url: `${process.env.DATABASE_URL}` })
const prisma = new PrismaClient({ adapter })

// --- Fixture types ---

type FixtureUser = {
  legalFirstName: string
  legalLastName: string
  preferredFirstName: string | null
  preferredLastName: string | null
  email: string
  role: string
  status: string
}

// --- Locations ---

const LOCATIONS = [
  {
    name: 'The Warren Center - Central',
    address: '320 Custer Rd, Richardson, TX 75080',
  },
  {
    name: 'The Warren Center - East',
    address: '2625 Anita Dr, Garland, TX 75041',
  },
  {
    name: 'The Warren Center - West',
    address: '400 E Royal Ln Suite 112, Irving, TX 75039',
  },
]

// --- Main ---

async function main() {
  console.log('Start seeding...')

  // 1. Upsert locations
  for (const loc of LOCATIONS) {
    await prisma.location.upsert({
      where: { name: loc.name },
      update: { address: loc.address },
      create: { name: loc.name, address: loc.address },
    })
  }
  console.log(`Seeded ${LOCATIONS.length} locations`)

  // 2. Load users from prisma/seed/users.json
  const usersPath = resolve(import.meta.dirname!, 'seed', 'users.json')
  const users: FixtureUser[] = JSON.parse(readFileSync(usersPath, 'utf-8'))

  // 3. Upsert users (roster + extra accounts live in the same fixture)
  for (const user of users) {
    const displayFirst = user.preferredFirstName || user.legalFirstName
    const displayLast = user.preferredLastName || user.legalLastName
    const name = `${displayFirst} ${displayLast}`

    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name,
        legalFirstName: user.legalFirstName,
        legalLastName: user.legalLastName,
        preferredFirstName: user.preferredFirstName,
        preferredLastName: user.preferredLastName,
        role: user.role,
        status: user.status,
      },
      create: {
        name,
        email: user.email,
        legalFirstName: user.legalFirstName,
        legalLastName: user.legalLastName,
        preferredFirstName: user.preferredFirstName,
        preferredLastName: user.preferredLastName,
        role: user.role,
        status: user.status,
      },
    })
  }
  console.log(`Seeded ${users.length} users from seed/users.json`)

  // 4. Seed sample items
  const allLocations = await prisma.location.findMany({ select: { id: true, name: true } })
  const locationByName = Object.fromEntries(allLocations.map((l) => [l.name, l.id]))

  const central = locationByName['The Warren Center - Central']
  const east = locationByName['The Warren Center - East']
  const west = locationByName['The Warren Center - West']

  const ITEMS = [
    { name: 'iPad Pro #1', description: 'Silver, 12.9 inch, with case', locationId: central },
    { name: 'iPad Pro #2', description: 'Space Gray, 11 inch', locationId: east },
    { name: 'Therapy Ball - Large', description: 'Blue, 75cm diameter', locationId: central },
    {
      name: 'Projector',
      description: 'Epson portable projector with HDMI cable',
      locationId: west,
    },
    {
      name: 'Laptop Cart',
      description: 'Rolling cart with charging station, holds 10 laptops',
      locationId: east,
    },
    { name: 'First Aid Kit', description: 'Wall-mounted, fully stocked', locationId: central },
    { name: 'Audio System', description: 'Bluetooth speaker and microphone set', locationId: west },
    {
      name: 'Therapy Swing',
      description: 'Indoor sensory swing, ceiling-mounted',
      locationId: east,
    },
  ]

  // Delete existing seeded items to allow re-seeding
  // Removed deleteMany to make seed safe for production
  // await prisma.item.deleteMany({
  //   where: { name: { in: ITEMS.map((i) => i.name) } },
  // })

  for (const item of ITEMS) {
    const exists = await prisma.item.findFirst({
      where: { name: item.name, description: item.description },
    })

    if (!exists) {
      await prisma.item.create({
        data: {
          name: item.name,
          description: item.description,
          condition: 'good',
          status: 'available',
          homeLocationId: item.locationId,
          currentLocationId: item.locationId,
        },
      })
    }
  }
  console.log(`Seeded ${ITEMS.length} items`)

  // 5. Seed checkout logs
  // Check if we already have logs to prevent duplicating seed logs
  const existingLogsCount = await prisma.checkoutLog.count()

  if (existingLogsCount === 0) {
    const allItems = await prisma.item.findMany({ select: { id: true, name: true } })
    const itemByName = Object.fromEntries(allItems.map((i) => [i.name, i.id]))

    // Grab some users to use as holders and performers
    const adminUser = await prisma.user.findFirst({
      where: { email: 'brandy.lindsey@thewarrencenter.org' },
      select: { id: true },
    })
    const supervisorUser = await prisma.user.findFirst({
      where: { email: 'isabel.saenz@thewarrencenter.org' },
      select: { id: true },
    })
    const employees = await prisma.user.findMany({
      where: { role: 'employee', status: 'active' },
      select: { id: true },
      take: 6,
    })

    if (adminUser && supervisorUser && employees.length >= 6) {
      const now = Date.now()
      const day = 86_400_000

      // --- Open checkouts (items currently checked out) ---

      // iPad Pro #1 — checked out 3 days ago (green badge)
      await prisma.checkoutLog.create({
        data: {
          itemId: itemByName['iPad Pro #1'],
          userId: employees[0].id,
          checkedOutBy: adminUser.id,
          checkedOutFromLocationId: central,
          checkedOutAt: new Date(now - 3 * day),
        },
      })
      await prisma.item.update({
        where: { id: itemByName['iPad Pro #1'] },
        data: { status: 'checked_out' },
      })

      // Projector — checked out 12 days ago (yellow badge)
      await prisma.checkoutLog.create({
        data: {
          itemId: itemByName['Projector'],
          userId: employees[1].id,
          checkedOutBy: supervisorUser.id,
          checkedOutFromLocationId: west,
          checkedOutAt: new Date(now - 12 * day),
        },
      })
      await prisma.item.update({
        where: { id: itemByName['Projector'] },
        data: { status: 'checked_out' },
      })

      // Audio System — checked out 35 days ago (red badge)
      await prisma.checkoutLog.create({
        data: {
          itemId: itemByName['Audio System'],
          userId: employees[2].id,
          checkedOutBy: adminUser.id,
          checkedOutFromLocationId: west,
          checkedOutAt: new Date(now - 35 * day),
        },
      })
      await prisma.item.update({
        where: { id: itemByName['Audio System'] },
        data: { status: 'checked_out' },
      })

      // Laptop Cart — checked out 5 days ago (green badge)
      await prisma.checkoutLog.create({
        data: {
          itemId: itemByName['Laptop Cart'],
          userId: employees[3].id,
          checkedOutBy: adminUser.id,
          checkedOutFromLocationId: east,
          checkedOutAt: new Date(now - 5 * day),
        },
      })
      await prisma.item.update({
        where: { id: itemByName['Laptop Cart'] },
        data: { status: 'checked_out' },
      })

      // --- Completed checkouts (for history views) ---

      // iPad Pro #2 — was checked out 20 days ago, returned 14 days ago
      await prisma.checkoutLog.create({
        data: {
          itemId: itemByName['iPad Pro #2'],
          userId: employees[4].id,
          checkedOutBy: adminUser.id,
          checkedOutFromLocationId: east,
          checkedOutAt: new Date(now - 20 * day),
          checkedInBy: supervisorUser.id,
          checkedInAtLocationId: central,
          checkedInAt: new Date(now - 14 * day),
          conditionOnReturn: 'good',
        },
      })

      // Therapy Ball — was checked out 30 days ago, returned 25 days ago with fair condition
      await prisma.checkoutLog.create({
        data: {
          itemId: itemByName['Therapy Ball - Large'],
          userId: employees[5].id,
          checkedOutBy: supervisorUser.id,
          checkedOutFromLocationId: central,
          checkedOutAt: new Date(now - 30 * day),
          checkedInBy: adminUser.id,
          checkedInAtLocationId: central,
          checkedInAt: new Date(now - 25 * day),
          conditionOnReturn: 'fair',
        },
      })
      await prisma.item.update({
        where: { id: itemByName['Therapy Ball - Large'] },
        data: { condition: 'fair' },
      })

      // Therapy Swing — two cycles: checked out 45 days ago, returned 40 days ago, then again 15 days ago, returned 10 days ago
      await prisma.checkoutLog.create({
        data: {
          itemId: itemByName['Therapy Swing'],
          userId: employees[0].id,
          checkedOutBy: adminUser.id,
          checkedOutFromLocationId: east,
          checkedOutAt: new Date(now - 45 * day),
          checkedInBy: adminUser.id,
          checkedInAtLocationId: east,
          checkedInAt: new Date(now - 40 * day),
          conditionOnReturn: 'good',
        },
      })
      await prisma.checkoutLog.create({
        data: {
          itemId: itemByName['Therapy Swing'],
          userId: employees[2].id,
          checkedOutBy: supervisorUser.id,
          checkedOutFromLocationId: east,
          checkedOutAt: new Date(now - 15 * day),
          checkedInBy: adminUser.id,
          checkedInAtLocationId: west,
          checkedInAt: new Date(now - 10 * day),
          conditionOnReturn: 'good',
        },
      })
      await prisma.item.update({
        where: { id: itemByName['Therapy Swing'] },
        data: { currentLocationId: west },
      })

      console.log('Seeded 8 checkout logs (4 open, 4 completed)')
    } else {
      console.log('Skipped checkout log seeding (required users not found)')
    }
  } else {
    console.log(`Skipped checkout log seeding (found ${existingLogsCount} existing logs)`)
  }

  console.log('Seeding finished.')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
