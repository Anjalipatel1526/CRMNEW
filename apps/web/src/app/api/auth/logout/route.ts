import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    await supabase.auth.signOut();
  } catch {}

  const response = NextResponse.json({ success: true, message: 'Logged out successfully' });

  response.cookies.delete('sb-access-token');
  response.cookies.delete('crm-token');
  response.cookies.delete('crm-role');
  response.cookies.delete('crm-tenant');

  return response;
}
