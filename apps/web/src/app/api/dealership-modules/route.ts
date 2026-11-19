import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, isServerSupabaseConfigured } from '@/lib/server/supabase';
import { verifySession } from '@/lib/server/auth';
import { ensureTenantAndBranch } from '@/lib/server/tenant';

// GET /api/dealership-modules - Fetch module configurations for authenticated tenant
export async function GET(req: NextRequest) {
  if (!isServerSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase not configured', modules: [] }, { status: 503 });
  }

  try {
    const authResult = await verifySession(req);
    const tenantId = authResult.success ? authResult.session.tenantId : req.nextUrl.searchParams.get('tenantId');

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required', modules: [] }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('dealership_modules')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('order_index', { ascending: true });

    if (error) {
      console.error('[API/dealership-modules] GET error:', error.message);
      return NextResponse.json({ error: error.message, modules: [] }, { status: 400 });
    }

    return NextResponse.json({ success: true, modules: data || [] });
  } catch (err: any) {
    console.error('[API/dealership-modules] Unexpected GET error:', err);
    return NextResponse.json({ error: err?.message || 'Server error', modules: [] }, { status: 500 });
  }
}

// POST /api/dealership-modules - Persist module configurations & plugin toggles to Supabase backend
export async function POST(req: NextRequest) {
  if (!isServerSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
  }

  try {
    const authResult = await verifySession(req);
    const body = await req.json().catch(() => ({}));
    const tenantId = authResult.success
      ? authResult.session.tenantId
      : body.tenantId || req.nextUrl.searchParams.get('tenantId');

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required to persist modules' }, { status: 400 });
    }

    const rawModules = body.modules;
    if (!Array.isArray(rawModules) || rawModules.length === 0) {
      return NextResponse.json({ error: 'Invalid modules payload' }, { status: 400 });
    }

    // Sanitize modules: eliminate empty labels/hrefs and deduplicate to avoid ghost/extra navbar pills
    const seenHrefs = new Set<string>();
    const validModules = rawModules.filter((m: any) => {
      const label = String(m?.label || m?.name || '').trim();
      const href = String(m?.href || '').trim();
      if (!label || !href || seenHrefs.has(href)) return false;
      seenHrefs.add(href);
      return true;
    });

    await ensureTenantAndBranch(tenantId);

    const moduleRows = validModules.map((m: any, idx: number) => {
      const cleanModId = String(m.id || `mod-${idx}`).replace(/^mod_[^_]+_/, '');
      return {
        id: `mod_${tenantId}_${cleanModId}`,
        tenant_id: tenantId,
        label: String(m.label || m.name).trim(),
        href: String(m.href).trim(),
        icon: typeof m.icon === 'string' ? m.icon : 'LayoutDashboard',
        is_plugged_in: Boolean(m.isPluggedIn ?? m.is_plugged_in ?? true),
        description: m.description || '',
        order_index: typeof m.orderIndex === 'number' ? m.orderIndex : idx,
        updated_at: new Date().toISOString(),
      };
    });

    const { error: upsertErr } = await supabaseAdmin
      .from('dealership_modules')
      .upsert(moduleRows, { onConflict: 'id' });

    if (upsertErr) {
      console.error('[API/dealership-modules] Upsert error:', upsertErr.message);
      return NextResponse.json({ error: upsertErr.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Dealership modules persisted successfully to Supabase backend.',
      count: moduleRows.length,
    });
  } catch (err: any) {
    console.error('[API/dealership-modules] Unexpected POST error:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}

