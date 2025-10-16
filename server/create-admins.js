import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const newAdmins = [
  {
    email: 'ilir.bicja@hape-kosovo.eu',
    password_hash: '$2a$10$POBg4aRhy2kWgPSwTbNlVOJ4cIehCVlgI0ACRLvPKpFH1yuV8V.kO',
    name: 'Ilir Bicja',
    role: 'admin',
    is_active: true
  },
  {
    email: 'albert.avdiu@hape-kosovo.eu',
    password_hash: '$2a$10$JxDTCHCB2XMGxqi.39uDluQoQb/R6xsEUNlJ4Syd2fEhpAdGt5ROe',
    name: 'Albert Avdiu',
    role: 'admin',
    is_active: true
  },
  {
    email: 'rreze.hoxha@hape-kosovo.eu',
    password_hash: '$2a$10$La7siGNvQ/RZBVDpPFq81OYsEqX4m9Xp2i/PjtOMUwaY8eafnzF.q',
    name: 'Rreze Hoxha',
    role: 'admin',
    is_active: true
  }
];

async function createAdmins() {
  console.log('Creating admin users...\n');

  for (const admin of newAdmins) {
    console.log(`Creating user: ${admin.email}`);

    // Check if user already exists
    const { data: existing, error: checkError } = await supabase
      .from('admin_users')
      .select('email')
      .eq('email', admin.email)
      .single();

    if (existing) {
      console.log(`  ⚠️  User ${admin.email} already exists, skipping...\n`);
      continue;
    }

    // Insert new user
    const { data, error } = await supabase
      .from('admin_users')
      .insert([admin])
      .select();

    if (error) {
      console.error(`  ❌ Error creating ${admin.email}:`, error.message);
    } else {
      console.log(`  ✅ Successfully created ${admin.email}`);
      console.log(`     ID: ${data[0].id}`);
      console.log(`     Role: ${data[0].role}`);
      console.log(`     Active: ${data[0].is_active}\n`);
    }
  }

  // Verify all users
  console.log('\n=== Verifying all admin users ===\n');
  const { data: allAdmins, error: verifyError } = await supabase
    .from('admin_users')
    .select('id, email, name, role, is_active, created_at')
    .order('created_at', { ascending: true });

  if (verifyError) {
    console.error('Error fetching users:', verifyError);
  } else {
    console.log('All admin users in database:');
    allAdmins.forEach((admin, index) => {
      console.log(`${index + 1}. ${admin.name} (${admin.email})`);
      console.log(`   Role: ${admin.role} | Active: ${admin.is_active}`);
      console.log(`   Created: ${admin.created_at}\n`);
    });
  }

  console.log('\n=== Login Credentials ===');
  console.log('Email: ilir.bicja@hape-kosovo.eu | Password: Admin123!');
  console.log('Email: albert.avdiu@hape-kosovo.eu | Password: Admin123!');
  console.log('Email: rreze.hoxha@hape-kosovo.eu | Password: Admin123!');
}

createAdmins().catch(console.error);
