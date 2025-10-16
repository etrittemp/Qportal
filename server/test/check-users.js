import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function checkUsers() {
  console.log('🔍 Checking admin_users table...\n');

  // Get all users
  const { data: users, error } = await supabase
    .from('admin_users')
    .select('*');

  if (error) {
    console.error('❌ Error fetching users:', error);
    return;
  }

  if (!users || users.length === 0) {
    console.log('⚠️  No users found in database!');
    return;
  }

  console.log(`✅ Found ${users.length} user(s):\n`);

  for (const user of users) {
    console.log('---');
    console.log('ID:', user.id);
    console.log('Email:', user.email);
    console.log('Name:', user.name);
    console.log('Role:', user.role);
    console.log('Is Active:', user.is_active);
    console.log('Password Hash:', user.password_hash);
    console.log('Created At:', user.created_at);
    console.log('Last Login:', user.last_login);

    // Test password for this user
    if (user.email === 'ilir.bicja@hape-kosovo.eu') {
      const testPassword = 'Admin123!';
      const isMatch = await bcrypt.compare(testPassword, user.password_hash);
      console.log(`\n🔑 Testing password "${testPassword}":`, isMatch ? '✅ MATCH' : '❌ NO MATCH');
    }
    console.log('---\n');
  }
}

checkUsers().catch(console.error);
