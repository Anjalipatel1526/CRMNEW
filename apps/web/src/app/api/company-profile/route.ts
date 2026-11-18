import { NextRequest, NextResponse } from 'next/server';
import { isSupabaseConfigured } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase-server';
import { verifySession } from '@/lib/server-auth';

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
  const queryEmail = searchParams.get('email')?.toLowerCase().trim();
  const rawTenantId = searchParams.get('tenantId');

  try {
    // Check if request is authenticated
    const authResult = await verifySession(req);
    const tenantId = authResult.success ? authResult.session.tenantId : rawTenantId;
    const email = queryEmail || (authResult.success ? authResult.session.user.email.toLowerCase().trim() : undefined);

    // 1. Check by verified tenantId first (covers users whose login email != dealership contact email, staff, and memberships)
    if (tenantId && tenantId !== 't_default') {
      const { data: tenantProfiles } = await supabaseAdmin
        .from('company_profiles')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('updated_at', { ascending: false })
        .limit(5);

      const onboardedTenantProfile = tenantProfiles?.find((p) => Boolean(p.is_onboarded));
      if (onboardedTenantProfile) {
        return NextResponse.json({ profile: onboardedTenantProfile, isOnboarded: true });
      }
      if (!email) {
        return NextResponse.json({ profile: tenantProfiles?.[0] || null, isOnboarded: false });
      }
    }

    // 2. If email is provided, search by email, derived tenant slug, or user_credentials.tenant_id
    if (email) {
      const cleanSlug = `t_${email.replace(/[^a-z0-9_-]/g, '_').slice(0, 36)}`;
      const { data: emailProfiles } = await supabaseAdmin
        .from('company_profiles')
        .select('*')
        .or(`email.ilike.${email},tenant_id.eq.${cleanSlug}`)
        .order('updated_at', { ascending: false })
        .limit(5);

      const onboardedEmailProfile = emailProfiles?.find((p) => Boolean(p.is_onboarded));
      if (onboardedEmailProfile) {
        return NextResponse.json({ profile: onboardedEmailProfile, isOnboarded: true });
      }

      // Check user_credentials to see if this email belongs to a tenant that is already onboarded
      const { data: credRows } = await supabaseAdmin
        .from('user_credentials')
        .select('tenant_id')
        .ilike('email', email)
        .limit(1);

      const credTenantId = credRows?.[0]?.tenant_id;
      if (credTenantId) {
        const { data: credProfiles } = await supabaseAdmin
          .from('company_profiles')
          .select('*')
          .eq('tenant_id', credTenantId)
          .order('updated_at', { ascending: false })
          .limit(5);

        const onboardedCredProfile = credProfiles?.find((p) => Boolean(p.is_onboarded));
        if (onboardedCredProfile) {
          return NextResponse.json({ profile: onboardedCredProfile, isOnboarded: true });
        }
      }

      // If no completed profile exists for this email, they are NOT onboarded yet
      return NextResponse.json({ profile: emailProfiles?.[0] || null, isOnboarded: false });
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
    // Preserve existing is_onboarded=true so draft autosaves or settings edits never downgrade an onboarded dealership
    const profileId = profile.id && profile.id !== 'company_profile' ? profile.id : `company_${tenantId}`;
    let alreadyOnboarded = false;
    if (!body.explicitReset) {
      const { data: existingRows } = await supabaseAdmin
        .from('company_profiles')
        .select('is_onboarded')
        .eq('tenant_id', tenantId)
        .limit(5);
      alreadyOnboarded = Boolean(existingRows?.some((r) => Boolean(r.is_onboarded)));
    }
    const finalIsOnboarded = alreadyOnboarded || Boolean(profile.isOnboarded ?? profile.is_onboarded ?? false);

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
      is_onboarded: finalIsOnboarded,
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

    // 4. Save User Credentials, App Users, Memberships & sync password to Supabase Auth
    if (credentials?.userId || credentials?.email) {
      const email = String(credentials.email || profile.email || '').toLowerCase().trim();
      const fullName = credentials.fullName || profile.authorizedSignatoryName || 'Dealership Admin';
      const userId = credentials.userId || email.split('@')[0];
      const rawPassword = credentials.password || '';

      // Sync password directly into Supabase Auth (bcrypt-hashed by GoTrue)
      if (email && rawPassword.length >= 6) {
        try {
          const { data: listed } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
          const existingAuth = listed?.users?.find(
            (u) => u.email?.toLowerCase().trim() === email
          );
          if (existingAuth) {
            await supabaseAdmin.auth.admin.updateUserById(existingAuth.id, {
              password: rawPassword,
              email_confirm: true,
              user_metadata: { ...(existingAuth.user_metadata || {}), full_name: fullName },
            });
          } else {
            await supabaseAdmin.auth.admin.createUser({
              email,
              password: rawPassword,
              email_confirm: true,
              user_metadata: { full_name: fullName },
            });
          }
        } catch (authSyncErr) {
          console.warn('[API/company-profile] Supabase Auth password sync warning:', authSyncErr);
        }
      }

      // Save metadata to user_credentials (never persist raw plaintext password)
      const { error: credErr } = await supabaseAdmin.from('user_credentials').upsert(
        {
          tenant_id: tenantId,
          user_id: userId,
          password_hash: '[SUPABASE_AUTH_MANAGED]',
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
      const defaultAppUserId = `usr_${tenantId}_admin`;
      const { error: userErr } = await supabaseAdmin.from('app_users').upsert(
        {
          id: defaultAppUserId,
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

      // Ensure canonical tenant_admin membership exists for RLS & API access
      if (email) {
        try {
          const { data: canonicalUser } = await supabaseAdmin
            .from('app_users')
            .select('id')
            .ilike('email', email)
            .limit(1);

          const membershipUserId = canonicalUser?.[0]?.id || defaultAppUserId;
          await supabaseAdmin.from('memberships').upsert(
            {
              tenant_id: tenantId,
              user_id: membershipUserId,
              role_key: 'tenant_admin',
              branch_ids: [],
              branch_scope: 'all',
              is_active: true,
            },
            { onConflict: 'tenant_id,user_id' }
          );
        } catch (memErr) {
          console.warn('[API/company-profile] Membership upsert warning:', memErr);
        }
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

