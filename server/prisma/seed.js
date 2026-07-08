const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seeding...');

  // 1. Hash the password "adminpass123"
  const salt = await bcrypt.genSalt(12);
  const hashedPassword = await bcrypt.hash('adminpass123', salt);

  // 2. Insert the Admin user
  const admin = await prisma.user.upsert({
    where: { employeeId: 'ADM-001' },
    update: {}, // If ADM-001 already exists, do nothing
    create: {
      employeeId: 'ADM-001',
      name: 'System Admin',
      role: 'ADMIN',
      passwordHash: hashedPassword,
    },
  });

  console.log('Seeded Admin User:', admin.employeeId);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });