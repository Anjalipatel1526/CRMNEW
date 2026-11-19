import { supabaseAdmin } from '@/lib/server/supabase';

/**
 * Finds a Supabase Auth user by email and updates their password (or creates the user if absent).
 * Used by both onboarding account creation and legacy credential migration.
 */
export async function syncSupabaseAuthPassword(params: {
  email: string;
  password: string;
  fullName?: string;
}): Promise<boolean> {
  const normalizedEmail = params.email.toLowerCase().trim();
  if (!normalizedEmail || !params.password) return false;

  const { data: usersList } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
  const existingAuthUser = usersList?.users?.find(
    (u) => u.email?.toLowerCase().trim() === normalizedEmail
  );

  if (existingAuthUser) {
    const { error } = await supabaseAdmin.auth.admin.updateUserById(existingAuthUser.id, {
      password: params.password,
      email_confirm: true,
      ...(params.fullName
        ? {
            user_metadata: {
              ...(existingAuthUser.user_metadata || {}),
              full_name: params.fullName,
            },
          }
        : {}),
    });
    return !error;
  }

  const { error } = await supabaseAdmin.auth.admin.createUser({
    email: normalizedEmail,
    password: params.password,
    email_confirm: true,
    user_metadata: params.fullName ? { full_name: params.fullName } : undefined,
  });
  return !error;
}

