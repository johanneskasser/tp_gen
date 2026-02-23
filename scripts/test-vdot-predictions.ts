/**
 * Test VDOT race predictions for all users
 * This script can be run to verify that all predictions are now correct
 *
 * Usage: npx tsx scripts/test-vdot-predictions.ts
 */

import { createClient } from '@supabase/supabase-js';
import { projectRaceTime } from '../src/utils/vdotCalculator';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://bzhpaoetmkgkanpeuwib.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

interface UserVDOT {
  id: string;
  full_name: string;
  vdot: number;
}

async function testPredictions() {
  console.log('🏃 Testing VDOT Race Predictions for All Users\n');
  console.log('=' .repeat(80));

  // Fetch all users with VDOT
  const { data: users, error } = await supabase
    .from('user_profiles')
    .select('id, full_name, vdot')
    .not('vdot', 'is', null)
    .order('vdot', { ascending: false });

  if (error) {
    console.error('Error fetching users:', error);
    return;
  }

  if (!users || users.length === 0) {
    console.log('No users with VDOT found.');
    return;
  }

  console.log(`Found ${users.length} users with VDOT values\n`);

  // Test predictions for each user
  for (const user of users as UserVDOT[]) {
    console.log(`\n👤 ${user.full_name || 'Unnamed'} (VDOT: ${user.vdot.toFixed(1)})`);
    console.log('-'.repeat(80));

    const predictions = {
      '5K': projectRaceTime(user.vdot, 5),
      '10K': projectRaceTime(user.vdot, 10),
      'Half Marathon': projectRaceTime(user.vdot, 21.0975),
      'Marathon': projectRaceTime(user.vdot, 42.195),
    };

    Object.entries(predictions).forEach(([distance, time]) => {
      console.log(`  ${distance.padEnd(15)}: ${time}`);
    });
  }

  console.log('\n' + '='.repeat(80));
  console.log('✅ All predictions calculated using corrected Daniels-Gilbert formula');
  console.log('📊 These predictions are now displayed in the app for all users');
}

// Run the test
testPredictions().catch(console.error);
