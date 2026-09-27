import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// URL dan Key dari projek dummy
const supabaseUrl = 'https://ndcbustcijgrfexnsdnk.supabase.co'; 
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kY2J1c3RjaWpncmZleG5zZG5rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA0NTEyNTIsImV4cCI6MjEwNjAyNzI1Mn0.xTsLkbYg-4A96t_lf20thtIteLrj7dG_oJvneGj0d50';

export const supabase = createClient(supabaseUrl, supabaseKey);
