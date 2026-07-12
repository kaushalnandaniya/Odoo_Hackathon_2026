import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
  const count = await prisma.user.count()
  console.log(`Successfully connected! Found ${count} users in Supabase.`)
}
main().catch(console.error).finally(() => prisma.$disconnect())
