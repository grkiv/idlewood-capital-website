#!/usr/bin/env ts-node

/**
 * Database seeding script
 * Creates initial admin user and sample data for the investor portal
 */

import { config } from 'dotenv';
import { 
  applyMigrations, 
  createUser, 
  createDocument,
  createDataRoom,
  addDocumentToDataRoom,
  generateUniqueAccessCode,
  validateDatabase 
} from '../src/lib/database';
import { UserRole } from '../src/lib/types/database';

// Load environment variables
config();

async function seedDatabase() {
  console.log('🌱 Starting database seeding...');

  try {
    // Validate database connection
    console.log('📡 Validating database connection...');
    const validation = await validateDatabase();
    
    if (!validation.connected) {
      throw new Error('Cannot connect to database. Please check your POSTGRES_URL environment variable.');
    }

    console.log(`✓ Database connected. Found ${validation.tables.length} tables.`);

    // Apply migrations
    console.log('🔄 Applying database migrations...');
    await applyMigrations();
    console.log('✓ Migrations applied successfully');

    // Create admin user
    console.log('👤 Creating admin user...');
    
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@idlewood-capital.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123!';
    
    try {
      const adminUser = await createUser({
        email: adminEmail,
        password: adminPassword,
        role: UserRole.ADMIN,
        company_name: 'Idlewood Capital',
        is_active: true
      });
      
      console.log(`✓ Admin user created: ${adminUser.email}`);
      console.log(`  User ID: ${adminUser.id}`);
      console.log(`  Role: ${adminUser.role}`);
    } catch (error: any) {
      if (error.message?.includes('duplicate key') || error.code === '23505') {
        console.log(`ℹ Admin user already exists: ${adminEmail}`);
      } else {
        throw error;
      }
    }

    // Create sample investor user
    console.log('💼 Creating sample investor user...');
    
    try {
      const investorUser = await createUser({
        email: 'investor@example.com',
        password: 'investor123!',
        role: UserRole.INVESTOR,
        company_name: 'Example Investment Group',
        is_active: true
      });
      
      console.log(`✓ Sample investor created: ${investorUser.email}`);
    } catch (error: any) {
      if (error.message?.includes('duplicate key') || error.code === '23505') {
        console.log('ℹ Sample investor user already exists');
      } else {
        throw error;
      }
    }

    // Create sample data room
    console.log('🏠 Creating sample data room...');
    
    try {
      const accessCode = await generateUniqueAccessCode();
      
      // Get admin user for data room creation
      const { getUserByEmail } = await import('../src/lib/database/users');
      const adminUser = await getUserByEmail(adminEmail);
      
      if (!adminUser) {
        throw new Error('Admin user not found for data room creation');
      }

      const dataRoom = await createDataRoom({
        name: 'Q4 2024 Investment Opportunity',
        access_code: accessCode,
        created_by: adminUser.id,
        expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
        is_active: true
      });

      console.log(`✓ Sample data room created: ${dataRoom.name}`);
      console.log(`  Access Code: ${dataRoom.access_code}`);
      console.log(`  Expires: ${dataRoom.expires_at}`);
    } catch (error: any) {
      console.log(`ℹ Sample data room creation skipped: ${error.message}`);
    }

    console.log('');
    console.log('🎉 Database seeding completed successfully!');
    console.log('');
    console.log('📋 Summary:');
    console.log(`   • Admin user: ${adminEmail}`);
    console.log(`   • Admin password: ${adminPassword}`);
    console.log('   • Sample investor: investor@example.com');
    console.log('   • Sample investor password: investor123!');
    console.log('');
    console.log('⚠️  IMPORTANT: Change the default passwords in production!');
    console.log('');

  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    process.exit(1);
  }
}

// Run the seeding script
if (require.main === module) {
  seedDatabase().catch((error) => {
    console.error('Fatal error during seeding:', error);
    process.exit(1);
  });
}

export { seedDatabase };