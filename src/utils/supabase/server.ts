/**
 * 🛰️ SUPABASE SERVER BRIDGE
 * 
 * This file maintains backward compatibility with the existing codebase
 * while redirecting to the improved /lib/supabase architecture.
 */

export { createClient } from '@/lib/supabase/client'
export { createAdminClient, requireAdminClient } from '@/lib/supabase/admin'
