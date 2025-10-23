// ملف مركزي لتصدير إعدادات Supabase
export * from './supabaseService';
export { mcp1_execute_sql, mcp1_get_project_url, calculateTimeRemaining, formatLatinDate } from './supabaseService';

// إعادة تصدير من supabaseClient المركزي
export { supabase, supabaseUrl, supabaseKey } from '../config/supabaseClient';
export { default } from '../config/supabaseClient';
