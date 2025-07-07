import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('organizationId');

    if (!orgId) {
        return new NextResponse('Missing organization ID', { status: 400 });
    }

    try {
        const client = await pool.connect();

        const result = await client.query(
            `
    WITH dates AS (
      SELECT generate_series(
        current_date - interval '6 days',
        current_date,
        interval '1 day'
      )::date AS day
    )
    SELECT 
      to_char(d.day, 'DD Mon') AS date,
      COALESCE(SUM(s.total_price)::float, 0) AS total
    FROM dates d
    LEFT JOIN sales s
      ON (s.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Argentina/Buenos_Aires')::date = d.day
      AND s.organization_id = $1
    GROUP BY d.day
    ORDER BY d.day
  `,
            [orgId]
        );

        client.release();

        return NextResponse.json(result.rows);
    } catch (error) {
        console.error('Error fetching sales data:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
