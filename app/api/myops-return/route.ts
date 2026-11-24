import { NextResponse } from 'next/server';
import { myopsReturnUrl } from '../../../lib/myops-return';
export const dynamic = 'force-dynamic';
export function GET() {
  return NextResponse.redirect(myopsReturnUrl(), { status: 303, headers: { 'Cache-Control': 'no-store' } });
}
