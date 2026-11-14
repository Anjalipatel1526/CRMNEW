import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';

// Helper to ensure tenant and branch exist in Supabase so foreign key constraints always succeed
async function ensureTenantAndBranch(
  tenantId: string,
  details: {
    name?: string;
    email?: string;
    phone?: string;
    city?: string;
    state?: string;
    address?: string;
    dealerModel?: string;
    contactName?: string;
  }
) {
  // Map dealerModel to PostgreSQL check constraint values: 'new' | 'used' | 'mixed' | 'broker'
  let safeDealerModel = 'mixed';
  const rawModel = (details.dealerModel || '').toLowerCase();
  if (
    rawModel.includes('franchise') ||
    rawModel.includes('new') ||
    rawModel.includes('luxury') ||
    rawModel.includes('electric')
  ) {
    safeDealerModel = 'new';
  } else if (rawModel.includes('preowned') || rawModel.includes('used')) {
    safeDealerModel = 'used';
  } else if (['new', 'used', 'mixed', 'broker'].includes(rawModel)) {
    safeDealerModel = rawModel;
  }

  const safeSlug =
    (tenantId.replace(/^t_/, '').toLowerCase().replace(/[^a-z0-9_-]/g, '_') || 'dealership').slice(0, 48);

  // 1. Ensure tenant exists
  const { error: tenantErr } = await supabaseAdmin.from('tenants').upsert(
    {
      id: tenantId,
      name: details.name || 'Dealership Workspace',
      slug: safeSlug,
      status: 'active',
      dealer_model: safeDealerModel,
      primary_contact_name: details.contactName || 'Dealership Admin',
      primary_email: details.email || 'admin@dealership.com',
      primary_phone: details.phone || '+91 98000 00000',
      currency: 'INR',
      timezone: 'Asia/Kolkata',
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' }
  );

  if (tenantErr) {
    console.error('[API/company-profile] Tenant upsert error:', tenantErr.message);
    throw new Error(`Failed to create or update tenant: ${tenantErr.message}`);
  }

  // 2. Ensure primary branch exists for this tenant
  const primaryBranchId = `b_${tenantId}_main`;
  const { error: branchErr } = await supabaseAdmin.from('branches').upsert(
    {
      id: primaryBranchId,
      tenant_id: tenantId,
      code: 'MAIN',
      name: details.name || 'Main Showroom',
      address: {
        address: details.address || '',
        city: details.city || '',
        state: details.state || '',
      },
      phone: details.phone || '',
      email: details.email || '',
      is_active: true,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' }
  );

  if (branchErr) {
    console.warn('[API/company-profile] Branch upsert note:', branchErr.message);
  }

  return { primaryBranchId };
}

// GET: Fetch company profile for tenant or specific user email
export async function GET(req: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase is not configured', isOnboarded: false }, { status: 503 });
  }

  const { searchParams } = new URL(req.url);
  const email = searchParams.get('email')?.toLowerCase().trim();
  const tenantId = searchParams.get('tenantId');

  try {
    // 1. If email is provided, strictly search for this user's profile
    if (email) {
      const cleanSlug = `t_${email.replace(/[^a-z0-9_-]/g, '_').slice(0, 36)}`;
      const { data } = await supabaseAdmin
        .from('company_profiles')
        .select('*')
        .or(`email.ilike.${email},tenant_id.eq.${cleanSlug}`)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data && data.is_onboarded) {
        return NextResponse.json({ profile: data, isOnboarded: true });
      }

      // Check user_credentials as secondary verification
      const { data: cred } = await supabaseAdmin
        .from('user_credentials')
        .select('*')
        .eq('email', email)
        .limit(1)
        .maybeSingle();

      if (cred) {
        return NextResponse.json({ profile: null, isOnboarded: true });
      }

      // First time user or not yet onboarded
      return NextResponse.json({ profile: null, isOnboarded: false });
    }

    // 2. If tenantId is provided and NOT default
    if (tenantId && tenantId !== 't_default') {
      const { data } = await supabaseAdmin
        .from('company_profiles')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data && data.is_onboarded) {
        return NextResponse.json({ profile: data, isOnboarded: true });
      }

      return NextResponse.json({ profile: null, isOnboarded: false });
    }

    // 3. If neither email nor specific tenantId is provided, do NOT assume onboarded
    return NextResponse.json({ profile: null, isOnboarded: false });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error', isOnboarded: false }, { status: 500 });
  }
}

// POST: Save onboarding company profile, modules, and admin credentials into Supabase backend
export async function POST(req: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase is not configured' }, { status: 503 });
  }

  try {
    const body = await req.json();
    const { profile, modules, credentials } = body;

    if (!profile) {
      return NextResponse.json({ error: 'Missing profile payload' }, { status: 400 });
    }

    let tenantId = profile.tenantId || profile.tenant_id;
    if (!tenantId || tenantId === 't_default') {
      const email = credentials?.email || profile.email;
      if (email) {
        tenantId = `t_${email.toLowerCase().trim().replace(/[^a-z0-9_-]/g, '_').slice(0, 36)}`;
      } else {
        tenantId = 't_default';
      }
    }

    // 1. Ensure tenant & branch exist so foreign key constraints never fail
    await ensureTenantAndBranch(tenantId, {
      name: profile.tradeName || profile.legalName,
      email: profile.email,
      phone: profile.phone,
      city: profile.city,
      state: profile.state,
      address: profile.address,
      dealerModel: profile.dealershipType,
      contactName: profile.authorizedSignatoryName,
    });

    // If tenantId is not t_default, also ensure t_default exists as fallback
    if (tenantId !== 't_default') {
      await ensureTenantAndBranch('t_default', {
        name: profile.tradeName || profile.legalName,
        email: profile.email,
        phone: profile.phone,
      }).catch(() => {});
    }

    // 2. Upsert Company Profile into Supabase company_profiles
    const profileId = profile.id && profile.id !== 'company_profile' ? profile.id : `company_${tenantId}`;
    const profilePayload = {
      id: profileId,
      tenant_id: tenantId,
      legal_name: profile.legalName || profile.legal_name || '',
      trade_name: profile.tradeName || profile.trade_name || '',
      tagline: profile.tagline || '',
      dealership_type: profile.dealershipType || profile.dealership_type || 'authorized_franchise',
      email: profile.email || '',
      phone: profile.phone || '',
      support_phone: profile.supportPhone || profile.support_phone || '',
      website: profile.website || '',
      address: profile.address || '',
      city: profile.city || '',
      state: profile.state || '',
      pincode: profile.pincode || '',
      country: profile.country || 'India',
      gstin: profile.gstin || '',
      pan: profile.pan || '',
      cin: profile.cin || '',
      currency: profile.currency || 'INR (₹)',
      bank_name: profile.bankName || profile.bank_name || '',
      account_number: profile.accountNumber || profile.account_number || '',
      ifsc_code: profile.ifscCode || profile.ifsc_code || '',
      branch_name: profile.branchName || profile.branch_name || '',
      upi_id: profile.upiId || profile.upi_id || '',
      logo_url: profile.logoUrl || profile.logo_url || '',
      watermark_enabled: profile.watermarkEnabled ?? profile.watermark_enabled ?? true,
      watermark_opacity: Number(profile.watermarkOpacity ?? profile.watermark_opacity ?? 0.08),
      authorized_signatory_name: profile.authorizedSignatoryName || profile.authorized_signatory_name || '',
      authorized_signatory_designation: profile.authorizedSignatoryDesignation || profile.authorized_signatory_designation || '',
      signature_url: profile.signatureUrl || profile.signature_url || '',
      is_onboarded: true,
      updated_at: new Date().toISOString(),
    };

    const { data: savedProfile, error: profileErr } = await supabaseAdmin
      .from('company_profiles')
      .upsert(profilePayload, { onConflict: 'id' })
      .select()
      .single();

    if (profileErr) {
      console.error('[API/company-profile] Upsert error:', profileErr.message);
      return NextResponse.json({ error: profileErr.message }, { status: 400 });
    }

    // Also update default row 'company-default-01' so any generic lookup resolves immediately
    try {
      await supabaseAdmin
        .from('company_profiles')
        .upsert({ ...profilePayload, id: 'company-default-01', tenant_id: tenantId }, { onConflict: 'id' });
    } catch {}

    // 3. Upsert Modules into Supabase dealership_modules
    if (Array.isArray(modules) && modules.length > 0) {
      const moduleRows = modules.map((m: any, idx: number) => ({
        id: `mod_${tenantId}_${m.id}`,
        tenant_id: tenantId,
        label: m.label || m.name || '',
        href: m.href || '',
        icon: typeof m.icon === 'string' ? m.icon : 'LayoutDashboard',
        is_plugged_in: Boolean(m.isPluggedIn ?? m.is_plugged_in ?? true),
        description: m.description || '',
        order_index: idx,
        updated_at: new Date().toISOString(),
      }));

      const { error: modErr } = await supabaseAdmin
        .from('dealership_modules')
        .upsert(moduleRows, { onConflict: 'id' });
      if (modErr) {
        console.warn('[API/company-profile] Modules upsert warning:', modErr.message);
      }
    }

    // 4. Save User Credentials & App Users if provided
    if (credentials?.userId || credentials?.email) {
      const email = credentials.email || profile.email;
      const fullName = credentials.fullName || profile.authorizedSignatoryName || 'Dealership Admin';
      const userId = credentials.userId || email.split('@')[0];

      // Save to user_credentials
      const { error: credErr } = await supabaseAdmin.from('user_credentials').upsert(
        {
          tenant_id: tenantId,
          user_id: userId,
          password_hash: credentials.password || '',
          full_name: fullName,
          email: email,
          created_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );
      if (credErr) {
        console.warn('[API/company-profile] User credentials upsert warning:', credErr.message);
      }

      // Save to app_users
      const { error: userErr } = await supabaseAdmin.from('app_users').upsert(
        {
          id: `usr_${tenantId}_admin`,
          email: email,
          full_name: fullName,
          phone: profile.phone || '',
          is_active: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'email' }
      );
      if (userErr) {
        console.warn('[API/company-profile] App users upsert warning:', userErr.message);
      }
    }

    return NextResponse.json({
      success: true,
      profile: savedProfile,
      message: 'Company profile, branches, modules, and credentials successfully saved to Supabase backend database.',
    });
  } catch (err: any) {
    console.error('[API/company-profile] Unexpected error:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}

