import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/server/auth';

export async function GET(req: NextRequest) {
  const result = await verifySession(req);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error, authenticated: false },
      { status: result.status }
    );
  }

  return NextResponse.json({
    authenticated: true,
    user: result.session.user,
    tenantId: result.session.tenantId,
    role: result.session.role,
    branchIds: result.session.branchIds,
  });
}
