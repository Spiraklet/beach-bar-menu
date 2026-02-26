import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Create admin user
  const adminPassword = 'Admin123!@#' // Strong password meeting requirements
  const adminHash = await bcrypt.hash(adminPassword, 12)

  const admin = await prisma.admin.upsert({
    where: { email: 'admin@beachbarmenu.com' },
    update: {},
    create: {
      email: 'admin@beachbarmenu.com',
      passwordHash: adminHash,
    },
  })

  console.log('Admin created:', admin.email)
  console.log('Admin password:', adminPassword)

  // Create a sample client
  // Password meets: 10+ chars, uppercase, lowercase, number, special char
  const clientPassword = 'Beach2024!@'
  const clientHash = await bcrypt.hash(clientPassword, 12)

  const client = await prisma.client.upsert({
    where: { email: 'demo@beachbar.com' },
    update: {},
    create: {
      clientId: '1234',
      companyName: 'Paradise Beach Bar',
      contactPerson: 'John Doe',
      phone: '+30 123 456 7890',
      email: 'demo@beachbar.com',
      passwordHash: clientHash,
    },
  })

  console.log('Client created:', client.email)
  console.log('Client ID:', client.clientId)
  console.log('Client password:', clientPassword)

  // Create sample menu items
  const categories = [
    { name: 'Cocktails', items: [
      { name: 'Mojito', price: 9.50, description: 'Fresh mint, lime, rum, and soda water' },
      { name: 'Pina Colada', price: 10.00, description: 'Coconut cream, pineapple juice, and rum' },
      { name: 'Aperol Spritz', price: 8.50, description: 'Aperol, prosecco, and soda water' },
    ]},
    { name: 'Beers', items: [
      { name: 'Mythos', price: 4.50, description: 'Greek lager beer' },
      { name: 'Fix Hellas', price: 4.50, description: 'Premium Greek beer' },
      { name: 'Corona', price: 5.50, description: 'Mexican lager with lime' },
    ]},
    { name: 'Snacks', items: [
      { name: 'Greek Salad', price: 8.00, description: 'Tomatoes, cucumber, feta, olives, onion' },
      { name: 'French Fries', price: 4.00, description: 'Crispy golden fries with seasoning' },
      { name: 'Calamari', price: 12.00, description: 'Fried squid rings with tzatziki' },
    ]},
  ]

  let itemCount = 100
  for (const category of categories) {
    for (const item of category.items) {
      await prisma.item.upsert({
        where: {
          clientId_itemId: {
            clientId: client.id,
            itemId: itemCount.toString(),
          },
        },
        update: {},
        create: {
          itemId: itemCount.toString(),
          clientId: client.id,
          name: item.name,
          price: item.price,
          description: item.description,
          category: category.name,
          active: true,
        },
      })
      itemCount++
    }
  }

  console.log('Sample menu items created')

  // Create sample QR codes
  const tables = ['A1', 'A2', 'A3', 'B1', 'B2', 'B3']
  for (const table of tables) {
    await prisma.qRCode.upsert({
      where: {
        clientId_tableIdentifier: {
          clientId: client.id,
          tableIdentifier: table,
        },
      },
      update: {},
      create: {
        clientId: client.id,
        tableIdentifier: table,
      },
    })
  }

  console.log('Sample QR codes created')

  // Create staff settings for the demo client
  // Password meets: 6+ chars, at least 1 letter, at least 1 number
  const staffPassword = 'Staff1'
  const staffHash = await bcrypt.hash(staffPassword, 12)

  const staffSettings = await prisma.staffSettings.upsert({
    where: { clientId: client.id },
    update: {},
    create: {
      clientId: client.id,
      staffToken: 'abc123def456ghi789jkl012', // 24-char token
      staffPasswordHash: staffHash,
    },
  })

  console.log('Staff settings created')

  console.log('\n=== Setup Complete ===')
  console.log(`\nAdmin Login:`)
  console.log(`  URL: http://localhost:3000/admin/login`)
  console.log(`  Email: admin@beachbarmenu.com`)
  console.log(`  Password: ${adminPassword}`)
  console.log(`\nClient Login:`)
  console.log(`  URL: http://localhost:3000/login`)
  console.log(`  Email: demo@beachbar.com`)
  console.log(`  Password: ${clientPassword}`)
  console.log(`\nStaff Portal:`)
  console.log(`  URL: http://localhost:3000/staff/${staffSettings.staffToken}/login`)
  console.log(`  Password: ${staffPassword}`)
  console.log(`\nCustomer Menu:`)
  console.log(`  URL: http://localhost:3000/1234/A1`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
