import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://ybntfxirvkorzsdfmiuv.supabase.co";
const supabaseAnonKey = "sb_publishable_R1vKPv1VTgDdVO0Gr2uvYg_7uuGpwmR";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);