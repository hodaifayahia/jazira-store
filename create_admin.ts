import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabasePublishableKey =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  '';

const supabase = createClient(supabaseUrl, supabasePublishableKey);

async function createAdmin() {
  try {
    // Create admin user via manage-admin function
    const { data, error } = await supabase.functions.invoke('manage-admin', {
      body: {
        action: 'create',
        email: 'admin@solutionshub.com',
        password: 'Admin@2026',
      },
    });

    if (error) {
      console.error('Error creating admin:', error);
    } else {
      console.log('Admin user created successfully!');
      console.log('Email: admin@solutionshub.com');
      console.log('Password: Admin@2026');
      console.log('Dashboard: http://localhost:5173/admin');
    }
  } catch (err) {
    console.error('Exception:', err);
  }
}

createAdmin();
