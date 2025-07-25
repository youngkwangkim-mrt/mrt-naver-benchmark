import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = 'https://vhrilrcpuhdwbtopmmrz.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseKey) {
  throw new Error('SUPABASE_KEY environment variable is required');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Test connection function
export async function testConnection() {
  try {
    const { data, error } = await supabase
      .from('naver_flight_monitoring')
      .select('count')
      .limit(1);
    
    if (error) throw error;
    console.log('✅ Supabase connection successful');
    return true;
  } catch (error) {
    console.error('❌ Supabase connection failed:', error.message);
    return false;
  }
} 