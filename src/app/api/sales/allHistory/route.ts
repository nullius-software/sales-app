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
                SELECT
                    EXTRACT(YEAR FROM s.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Argentina/Buenos_Aires')::int AS year,
                    SUM(s.total_price)::float AS total
                FROM sales s
                WHERE s.organization_id = $1
                GROUP BY year
                ORDER BY year;
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
