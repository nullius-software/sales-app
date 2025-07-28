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
                WITH weeks AS (
                    SELECT
                        date_trunc('week', CURRENT_DATE - INTERVAL '3 weeks') + i * INTERVAL '1 week' AS week_start
                    FROM generate_series(0, 3) AS i
                )
                SELECT
                    to_char(week_start, 'WW') AS week,
                    COALESCE(SUM(s.total_price)::float, 0) AS total
                FROM weeks
                         LEFT JOIN sales s
                                   ON date_trunc('week', s.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Argentina/Buenos_Aires') = week_start
                                       AND s.organization_id = $1
                GROUP BY week_start
                ORDER BY week_start;
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
