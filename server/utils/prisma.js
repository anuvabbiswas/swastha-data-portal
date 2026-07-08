const { PrismaClient } = require('@prisma/client');

// Create a single instance of the PrismaClient
const prisma = new PrismaClient();

module.exports = prisma;