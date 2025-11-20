import { createClient } from '@supabase/supabase-js';

// VERCEL DEBUGGING START
console.log('--- VERCEL ENVIRONMENT DEBUG START ---');
console.log('Checking for Supabase environment variables during build...');
console.log('Is NEXT_PUBLIC_SUPABASE_URL set?', !!process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('Is SUPABASE_SERVICE_KEY set?', !!process.env.SUPABASE_SERVICE_KEY);
console.log('--- VERCEL ENVIRONMENT DEBUG END ---');
// VERCEL DEBUGGING END

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('CRITICAL ERROR: Supabase environment variables are missing in the Vercel build environment.');
  throw new Error('Missing Supabase URL or service key. Please check your Environment Variables in your Vercel Project Settings.');
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
