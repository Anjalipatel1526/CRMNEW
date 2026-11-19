import { NextRequest, NextResponse } from 'next/server';
import {
  supabaseAdmin,
  createServerClient,
  isServerSupabaseConfigured,
} from '@/lib/server/supabase';
import { verifySession, extractToken } from '@/lib/server/auth';
import {
  ensureTenantAndBranch,
  fetchCompanyProfileWithModules,
} from '@/lib/server/tenant';
import { syncSupabaseAuthPassword } from '@/lib/server/auth-admin';
import { setSessionCookies } from '@/lib/server/session-cookies';
import { deriveTenantIdFromEmail, isUuid } from '@/lib/shared/tenant-slug';

// GET: Fetch company profile & modules for tenant or specific user email
export async function GET(req: NextRequest) {
  if (!isServerSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase is not configured', isOnboarded: false }, { status: 503 });
  }

  const { searchParams } = new URL(req.url);
  const queryEmail = searchParams.get('email')?.toLowerCase().trim();
  const rawTenantId = searchParams.get('tenantId');

  try {
    const authResult = await verifySession(req);
    const tenantId = authResult.success ? authResult.session.tenantId : rawTenantId;
    const authUserId = authResult.success ? authResult.session.user.id : undefined;
    const email = queryEmail || (authResult.success ? authResult.session.user.email.toLowerCase().trim() : undefined);

    const result = await fetchCompanyProfileWithModules({ tenantId, email, authUserId });
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error', isOnboarded: false }, { status: 500 });
  }
}

// POST: Save onboarding company profile, modules, and admin credentials into Supabase backend
export async function POST(req: NextRequest) {
  if (!isServerSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase is not configured' }, { status: 503 });
  }

  try {
    const body = await req.json();
    const { profile, modules, credentials } = body;

    if (!profile) {
      return NextResponse.json({ error: 'Missing profile payload' }, { status: 400 });
    }

    // Resolve authenticated Supabase Auth user once for profile ownership, memberships & session cookies
    const incomingToken = extractToken(req);
    let verifiedAuthUser: { id: string; email?: string } | null = null;
    if (incomingToken) {
      try {
        const serverClient = createServerClient(incomingToken);
        const { data: authData } = await serverClient.auth.getUser(incomingToken);
        if (authData?.user) {
          verifiedAuthUser = {
            id: authData.user.id,
            email: authData.user.email?.toLowerCase().trim(),
          };
        }
      } catch (err) {
        console.warn('[API/company-profile] Auth token lookup note:', err);
      }
    }

    let tenantId = profile.tenantId || profile.tenant_id;
    const emailForTenant = credentials?.email || profile.email;
    if (!tenantId || tenantId === 't_default') {
      if (emailForTenant) {
        tenantId = deriveTenantIdFromEmail(emailForTenant);
      } else {
        return NextResponse.json(
          { error: 'Cannot create a default company without dealership email and onboarding details.' },
          { status: 400 }
        );
      }
    }

    const profileId =
      profile.id && profile.id !== 'company_profile' && profile.id !== 'company-default-01'
        ? profile.id
        : (isUuid(tenantId) ? crypto.randomUUID() : `company_${tenantId}`);

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

    // Do NOT create any tenant/company rows in Supabase before the user actually completes the onboarding form
    if (!finalIsOnboarded) {
      return NextResponse.json(
        {
          success: false,
          skipped: true,
          message: 'Onboarding draft is kept locally until the onboarding form is completed.',
        },
        { status: 200 }
      );
    }

    const companyLegalName = String(profile.legalName || profile.legal_name || '').trim();
    const companyTradeName = String(profile.tradeName || profile.trade_name || '').trim();
    if (!companyLegalName && !companyTradeName) {
      return NextResponse.json(
        { error: 'Dealership legal name or trade name is required to complete onboarding.' },
        { status: 400 }
      );
    }

    // 1. Ensure ONLY the user's real tenant & branch exist
    await ensureTenantAndBranch(
      tenantId,
      {
        name: companyTradeName || companyLegalName,
        email: profile.email,
        phone: profile.phone,
        city: profile.city,
        state: profile.state,
        address: profile.address,
        dealerModel: profile.dealershipType,
        contactName: profile.authorizedSignatoryName,
        ownerUid: verifiedAuthUser?.id,
      },
      { throwOnTenantError: true }
    );

    // 2. Upsert Company Profile into Supabase company_profiles
    const logoCandidate = profile.logoUrl || profile.logo_url || '';
    const profilePayload = {
      id: profileId,
      tenant_id: tenantId,
      auth_user_id: verifiedAuthUser?.id || null,
      legal_name: companyLegalName,
      trade_name: companyTradeName,
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
      logo_url: logoCandidate && logoCandidate !== '/unai-logo.png' ? logoCandidate : '',
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

    // 4. Save User Credentials, App Users, Memberships
    // Note: profile.email is purely informational for company contact, invoices, and profile view.
    // It must NEVER create or register a user in Supabase Authentication (auth.users).
    const companyEmail = String(profile.email || '').toLowerCase().trim();
    const authenticAccountEmail = String(
      credentials?.accountEmail ||
      verifiedAuthUser?.email ||
      profile.email ||
      ''
    ).toLowerCase().trim();

    if (credentials?.userId || authenticAccountEmail) {
      const fullName = credentials?.fullName || profile.authorizedSignatoryName || 'Dealership Admin';
      const userId = credentials?.userId ? credentials.userId.trim() : (authenticAccountEmail ? authenticAccountEmail.split('@')[0] : 'admin');
      const rawPassword = credentials?.password || '';
      const primaryAccountEmail = authenticAccountEmail || companyEmail;
      let resolvedAuthUserId = verifiedAuthUser?.id;

      // Always synchronize admin user & password into Supabase Auth (auth.users)
      // This guarantees that login with this password works across ALL browsers (Chrome, Brave, Edge)
      if (primaryAccountEmail && rawPassword.length >= 6) {
        try {
          await syncSupabaseAuthPassword({
            email: primaryAccountEmail,
            password: rawPassword,
            fullName,
          });

          // Retrieve or verify the auth.users ID
          if (!resolvedAuthUserId) {
            const { data: usersList } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
            const matchedAuthUser = usersList?.users?.find(
              (u) => u.email?.toLowerCase().trim() === primaryAccountEmail
            );
            if (matchedAuthUser?.id) {
              resolvedAuthUserId = matchedAuthUser.id;
            }
          }
        } catch (authSyncErr) {
          console.warn('[API/company-profile] Supabase Auth password sync note:', authSyncErr);
        }
      }

      // If a phantom user was accidentally created from the company contact email, clean it up from auth.users
      if (companyEmail && companyEmail !== authenticAccountEmail) {
        try {
          const { data: usersList } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
          const phantomUser = usersList?.users?.find(
            (u) => u.email?.toLowerCase().trim() === companyEmail && u.id !== resolvedAuthUserId
          );
          if (phantomUser) {
            await supabaseAdmin.auth.admin.deleteUser(phantomUser.id);
            console.log('[API/company-profile] Cleaned up phantom auth user created from company email:', companyEmail);
          }
        } catch (cleanupErr) {
          console.warn('[API/company-profile] Phantom user cleanup note:', cleanupErr);
        }
      }

      // Store in user_credentials table safely without depending on a missing UNIQUE constraint on user_id
      const { data: existingCreds } = await supabaseAdmin
        .from('user_credentials')
        .select('id')
        .or(`user_id.ilike.${userId},email.ilike.${primaryAccountEmail}`)
        .limit(1);

      const credPayload = {
        tenant_id: tenantId,
        auth_user_id: resolvedAuthUserId || verifiedAuthUser?.id || null,
        user_id: userId,
        password_hash: rawPassword, // Stored so any browser login can cross-check, verify, or sync seamlessly
        full_name: fullName,
        email: primaryAccountEmail,
        created_at: new Date().toISOString(),
      };

      if (existingCreds && existingCreds.length > 0) {
        const { error: updateErr } = await supabaseAdmin
          .from('user_credentials')
          .update(credPayload)
          .eq('id', existingCreds[0].id);
        if (updateErr) {
          console.warn('[API/company-profile] user_credentials update warning:', updateErr.message);
        }
      } else {
        const { error: insertErr } = await supabaseAdmin
          .from('user_credentials')
          .insert({
            id: crypto.randomUUID(),
            ...credPayload,
          });
        if (insertErr) {
          console.warn('[API/company-profile] user_credentials insert warning:', insertErr.message);
        }
      }

      // Update company_profiles auth_user_id if it was resolved
      if (resolvedAuthUserId && !verifiedAuthUser?.id) {
        await supabaseAdmin
          .from('company_profiles')
          .update({ auth_user_id: resolvedAuthUserId })
          .eq('id', profilePayload.id);
      }

      const defaultAppUserId = resolvedAuthUserId || verifiedAuthUser?.id || `usr_${tenantId}_admin`;
      const { error: userErr } = await supabaseAdmin.from('app_users').upsert(
        {
          id: defaultAppUserId,
          email: primaryAccountEmail,
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

      const membershipUserIds = new Set<string>();
      if (primaryAccountEmail) {
        const { data: canonicalUser } = await supabaseAdmin
          .from('app_users')
          .select('id')
          .ilike('email', primaryAccountEmail)
          .limit(1);
        if (canonicalUser?.[0]?.id) {
          membershipUserIds.add(canonicalUser[0].id);
        }
      }

      if (verifiedAuthUser?.id) {
        if (verifiedAuthUser.email && verifiedAuthUser.email !== primaryAccountEmail) {
          await supabaseAdmin.from('app_users').upsert(
            {
              id: verifiedAuthUser.id,
              email: verifiedAuthUser.email,
              full_name: fullName,
              phone: profile.phone || '',
              is_active: true,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'email' }
          );
          const { data: googleAppUser } = await supabaseAdmin
            .from('app_users')
            .select('id')
            .ilike('email', verifiedAuthUser.email)
            .limit(1);
          if (googleAppUser?.[0]?.id) {
            membershipUserIds.add(googleAppUser[0].id);
          }
        } else {
          membershipUserIds.add(verifiedAuthUser.id);
        }
      }

      if (membershipUserIds.size === 0) {
        membershipUserIds.add(defaultAppUserId);
      }

      for (const mUid of Array.from(membershipUserIds)) {
        try {
          await supabaseAdmin.from('memberships').upsert(
            {
              tenant_id: tenantId,
              user_id: mUid,
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

    const response = NextResponse.json({
      success: true,
      tenantId,
      profile: savedProfile,
      isOnboarded: finalIsOnboarded,
      message: 'Company profile, branches, modules, and credentials successfully saved to Supabase backend database.',
    });

    if (incomingToken && verifiedAuthUser && finalIsOnboarded) {
      try {
        await setSessionCookies(response, {
          accessToken: incomingToken,
          userId: verifiedAuthUser.id,
          tenantId,
          role: 'tenant_admin',
          isOnboarded: true,
        });
      } catch (cookieErr) {
        console.warn('[API/company-profile] Session cookie refresh note:', cookieErr);
      }
    }

    return response;
  } catch (err: any) {
    console.error('[API/company-profile] Unexpected error:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
