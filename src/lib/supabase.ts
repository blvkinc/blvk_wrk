import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vjvwfccsgudvrsrdpjch.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqdndmY2NzZ3VkdnJzcmRwamNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEzNjk1NTksImV4cCI6MjA1Njk0NTU1OX0.3_H4NyKIqrNxzKVWnVGm6l26Qro6b-hiL2cY77dVdRE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey); 