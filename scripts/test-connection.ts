import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testConnection() {
  try {
    console.log('Testing database connection...');
    console.log('Database URL:', process.env.DATABASE_URL?.replace(/:[^:]*@/, ':****@'));
    
    // Test basic connection
    await prisma.$connect();
    console.log('✅ Successfully connected to database!');
    
    // Test a simple query
    const userCount = await prisma.user.count();
    console.log(`✅ Database query successful! Current user count: ${userCount}`);
    
    // Test table existence by checking schema
    const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `;
    
    console.log('\n📊 Database tables found:');
    tables.forEach(table => {
      console.log(`  - ${table.tablename}`);
    });
    
    console.log(`\n✅ Connection test completed successfully!`);
    
  } catch (error: any) {
    console.error('❌ Connection test failed:');
    console.error('Error:', error.message);
    if (error.code) {
      console.error('Error code:', error.code);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();

