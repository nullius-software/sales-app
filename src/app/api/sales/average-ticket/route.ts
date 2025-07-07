import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const orgId = searchParams.get('organizationId');
  const date = searchParams.get('date');

  if (!orgId) {
    return NextResponse.json({ error: 'Missing organizationId' }, { status: 400 });
  }

  if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: 'Invalid date format (expected YYYY-MM-DD)' }, { status: 400 });
  }

  try {
    let result;

    if (date) {
      result = await pool.query(
        `
        SELECT COALESCE(AVG(total_price), 0) AS average_ticket
        FROM sales
        WHERE organization_id = $1
          AND created_at::date = $2
        `,
        [orgId, date]
      );
    } else {
      result = await pool.query(
        `
        SELECT COALESCE(AVG(total_price), 0) AS average_ticket
        FROM sales
        WHERE organization_id = $1
        `,
        [orgId]
      );
    }

    const averageTicket = parseFloat(result.rows[0].average_ticket);

    return NextResponse.json({ total: averageTicket });
  } catch (error) {
    console.error('[AVERAGE_TICKET_ERROR]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
