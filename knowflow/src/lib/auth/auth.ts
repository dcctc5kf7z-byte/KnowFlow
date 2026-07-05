import { supabase } from '@/lib/db/supabase';
import { User } from '@supabase/supabase-js';

export async function getCurrentUser(): Promise<User | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function signUp(email: string, password: string) {
  return supabase.auth.signUp({ email, password });
}

export async function signIn(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signOut() {
  return supabase.auth.signOut();
}

export function getUserIdOrAnonymous(user: User | null): string {
  return user?.id || 'anonymous';
}
