
import { createClient } from '@supabase/supabase-js';

// Credentials provided by the user
const SUPABASE_URL = 'https://kcwmgexdqkmuxcgqsgmg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtjd21nZXhkcWttdXhjZ3FzZ21nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MzU1ODMsImV4cCI6MjA3OTQxMTU4M30.3t95f-ezQ_9EHwyYjlLyxE2VTaIL_bHrwd26c1ISVHA';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
