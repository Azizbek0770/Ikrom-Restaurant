const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

let supabaseService = null;
let supabaseAnon = null;

if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
  try {
    supabaseService = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  } catch (err) {
    console.warn('Failed to initialize Supabase service client:', err.message);
  }
} else {
  console.warn('Supabase service config missing: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY - upload features will use local storage');
}

if (SUPABASE_URL && SUPABASE_ANON_KEY) {
  try {
    supabaseAnon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  } catch (err) {
    console.warn('Failed to initialize Supabase anon client:', err.message);
  }
}

module.exports = { supabaseService, supabaseAnon };
