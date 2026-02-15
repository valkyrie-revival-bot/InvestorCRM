/**
 * Dynamic Supabase client loaders
 * Prevents build-time execution by lazy-loading clients
 */

let _createClient: any = null;
let _createAdminClient: any = null;

export async function getSupabaseClient() {
  if (!_createClient) {
    const module = await import('./server');
    _createClient = module.createClient;
  }
  return _createClient();
}

export async function getSupabaseAdminClient() {
  if (!_createAdminClient) {
    const module = await import('./server');
    _createAdminClient = module.createAdminClient;
  }
  return _createAdminClient();
}
