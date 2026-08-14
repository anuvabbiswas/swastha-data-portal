const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seeding...');

  const salt = await bcrypt.genSalt(12);
  const hashedPassword = await bcrypt.hash('adminpass123', salt);

  const admin = await prisma.user.upsert({
    where: { employeeId: 'ADM-001' },
    update: {},
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