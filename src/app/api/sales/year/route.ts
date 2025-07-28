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
                WITH months AS (
                    SELECT
                        date_trunc('month', CURRENT_DATE) - INTERVAL '11 months' + i * INTERVAL '1 month' AS month_start
                    FROM generate_series(0, 11) AS i
                )
                SELECT
                    to_char(month_start, 'Mon YY') AS month,
                    COALESCE(SUM(s.total_price)::float, 0) AS total
                FROM months
                         LEFT JOIN sales s
                                   ON date_trunc('month', s.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Argentina/Buenos_Aires') = month_start
                                       AND s.organization_id = $1
                GROUP BY month_start
                ORDER BY month_start;
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
