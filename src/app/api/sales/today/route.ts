import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(req: NextRequest) {
  const orgId = req.nextUrl.searchParams.get('organizationId');

  if (!orgId) {
    return NextResponse.json({ error: 'Missing organizationId' }, { status: 400 });
  }

  try {
    const result = await pool.query(
      `
      SELECT COALESCE(SUM(total_price), 0) AS total
      FROM sales
      WHERE organization_id = $1
        AND created_at::date = CURRENT_DATE
      `,
      [orgId]
    );

    const total = result.rows[0].total;

    return NextResponse.json({ total: parseFloat(total) });
  } catch (error) {
    console.error('[SALES_TODAY_ERROR]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}