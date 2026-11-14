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
  // 1. Ensure tenant exists
  await supabaseAdmin.from('tenants').upsert(
    {
      id: tenantId,
      name: details.name || 'Dealership Workspace',
      slug: tenantId.replace(/^t_/, ''),
      status: 'active',
      dealer_model: details.dealerModel || 'mixed',
      primary_contact_name: details.contactName || 'Dealership Admin',
      primary_email: details.email || 'admin@dealership.com',
      primary_phone: details.phone || '+91 98000 00000',
      currency: 'INR',
      timezone: 'Asia/Kolkata',
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' }
  );

  // 2. Ensure primary branch exists for this tenant
  const primaryBranchId = `b_${tenantId}_main`;
  await supabaseAdmin.from('branches').upsert(
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

  return { primaryBranchId };
}

// GET: Fetch company profile for tenant
export async function GET(req: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase is not configured' }, { status: 503 });
  }

  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get('tenantId') || 't_default';

  try {
    const { data, error } = await supabaseAdmin
      .from('company_profiles')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ profile: data });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
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

    const tenantId = profile.tenantId || profile.tenant_id || 't_default';

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

    // 2. Upsert Company Profile into Supabase company_profiles
    const profileId = profile.id && profile.id !== 'company-default-01' ? profile.id : `company_${tenantId}`;
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

    // 3. Upsert Modules into Supabase dealership_modules
    if (Array.isArray(modules) && modules.length > 0) {
      const moduleRows = modules.map((m: any, idx: number) => ({
        id: `mod_${tenantId}_${m.id}`,
        tenant_id: tenantId,
        label: m.label || m.name || '',
        href: m.href || '',
        icon: m.icon || 'LayoutDashboard',
        is_plugged_in: Boolean(m.isPluggedIn ?? m.is_plugged_in ?? true),
        description: m.description || '',
        order_index: idx,
        updated_at: new Date().toISOString(),
      }));

      await supabaseAdmin.from('dealership_modules').upsert(moduleRows, { onConflict: 'id' });
    }

    // 4. Save User Credentials & App Users if provided
    if (credentials?.userId || credentials?.email) {
      const email = credentials.email || profile.email;
      const fullName = credentials.fullName || profile.authorizedSignatoryName || 'Dealership Admin';
      const userId = credentials.userId || email.split('@')[0];

      // Save to user_credentials
      await supabaseAdmin.from('user_credentials').upsert(
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

      // Save to app_users
      await supabaseAdmin.from('app_users').upsert(
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

