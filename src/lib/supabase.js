import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

function getClient() {
  if (!supabase) {
    throw new Error("Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable Supabase.");
  }
  return supabase;
}

export async function signUp(email, password) {
  return getClient().auth.signUp({ email, password });
}

export async function signIn(email, password) {
  return getClient().auth.signInWithPassword({ email, password });
}

export async function signOut() {
  return getClient().auth.signOut();
}

export async function getCurrentUser() {
  const { data, error } = await getClient().auth.getUser();
  if (error) throw error;
  return data.user;
}

export function onAuthStateChange(callback) {
  const { data } = getClient().auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null);
  });
  return () => data.subscription.unsubscribe();
}