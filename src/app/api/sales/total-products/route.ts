import pool from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const orgId = searchParams.get('organizationId');
  const date = searchParams.get('date');

  if (!orgId) {
    return NextResponse.json(
      { error: 'Missing organizationId' },
      { status: 400 }
    );
  }

  if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json(
      { error: 'Invalid date format (expected YYYY-MM-DD)' },
      { status: 400 }
    );
  }

  try {
    let result;

    if (date) {
      result = await pool.query(
        `
        SELECT COALESCE(SUM(sp.quantity), 0) AS total_products
        FROM sales_products sp
        JOIN sales s ON sp.sale_id = s.id
        WHERE s.organization_id = $1
          AND s.created_at::date = $2
        `,
        [orgId, date]
      );
    } else {
      result = await pool.query(
        `
        SELECT COALESCE(SUM(sp.quantity), 0) AS total_products
        FROM sales_products sp
        JOIN sales s ON sp.sale_id = s.id
        WHERE s.organization_id = $1
        `,
        [orgId]
      );
    }

    const total = parseFloat(result.rows[0].total_products);

    return NextResponse.json({ total });
  } catch (error) {
    console.error('[TOTAL_PRODUCTS_ERROR]', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
