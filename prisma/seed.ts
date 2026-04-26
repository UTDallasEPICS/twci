import { readFileSync } from 'fs'
import { resolve } from 'path'
import Papa from 'papaparse'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import { PrismaClient } from './generated/client'

const adapter = new PrismaBetterSqlite3({ url: `${process.env.DATABASE_URL}` })
const prisma = new PrismaClient({ adapter })

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

// --- Role assignments ---

const ADMIN_EMAILS = [
  'brandy.lindsey@thewarrencenter.org',
  'isabel.saenz@thewarrencenter.org',
  'reachtusharwani@gmail.com',
]

const SUPERVISOR_EMAILS = ['tmw220003@utdallas.edu']

function getRole(email: string): string {
  const lower = email.toLowerCase()
  if (ADMIN_EMAILS.includes(lower)) return 'admin'
  if (SUPERVISOR_EMAILS.includes(lower)) return 'supervisor'
  return 'employee'
}

// --- Status mapping ---

function mapStatus(positionStatus: string): string {
  const normalized = positionStatus.trim().toLowerCase()
  if (normalized === 'leave') return 'on_leave'
  return 'active'
}

// --- CSV row type ---

interface RosterRow {
  'Legal Name': string
  'Preferred or Chosen First Name': string
  'Preferred or Chosen Last Name': string
  'Work Contact: Work Email': string
  'Position Status': string
  'Job Title Description': string
}

// --- Non-roster users ---

const EXTRA_USERS = [
  {
    legalFirstName: 'Tushar',
    legalLastName: 'Wani',
    preferredFirstName: null,
    preferredLastName: null,
    email: 'reachtusharwani@gmail.com',
    role: 'admin' as const,
    status: 'active' as const,
  },
  {
    legalFirstName: 'Tushar',
    legalLastName: 'Wani',
    preferredFirstName: null,
    preferredLastName: null,
    email: 'tmw220003@utdallas.edu',
    role: 'supervisor' as const,
    status: 'active' as const,
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

  // 2. Parse roster.csv
  const csvPath = resolve(import.meta.dirname!, '..', 'roster.csv')
  const csvContent = readFileSync(csvPath, 'utf-8')
  const { data: rows } = Papa.parse<RosterRow>(csvContent, {
    header: true,
    skipEmptyLines: true,
  })

  // 3. Upsert roster users
  let rosterCount = 0
  for (const row of rows) {
    const legalName = row['Legal Name']?.trim()
    if (!legalName) continue

    const commaIndex = legalName.indexOf(',')
    const legalLastName = legalName.substring(0, commaIndex).trim()
    const legalFirstName = legalName.substring(commaIndex + 1).trim()

    const preferredFirstName = row['Preferred or Chosen First Name']?.trim() || null
    const preferredLastName = row['Preferred or Chosen Last Name']?.trim() || null
    const email = row['Work Contact: Work Email']?.trim().toLowerCase()
    const status = mapStatus(row['Position Status'] || 'Active')
    const role = getRole(email)

    const displayFirst = preferredFirstName || legalFirstName
    const displayLast = preferredLastName || legalLastName
    const name = `${displayFirst} ${displayLast}`

    await prisma.user.upsert({
      where: { email },
      update: {
        name,
        legalFirstName,
        legalLastName,
        preferredFirstName,
        preferredLastName,
        role,
        status,
      },
      create: {
        name,
        email,
        legalFirstName,
        legalLastName,
        preferredFirstName,
        preferredLastName,
        role,
        status,
      },
    })
    rosterCount++
  }
  console.log(`Seeded ${rosterCount} users from roster.csv`)

  // 4. Upsert extra (non-roster) users
  for (const user of EXTRA_USERS) {
    const name = `${user.legalFirstName} ${user.legalLastName}`
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
  console.log(`Seeded ${EXTRA_USERS.length} extra users`)

  // 5. Seed sample items
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
  await prisma.item.deleteMany({
    where: { name: { in: ITEMS.map((i) => i.name) } },
  })

  for (const item of ITEMS) {
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
  console.log(`Seeded ${ITEMS.length} items`)

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
