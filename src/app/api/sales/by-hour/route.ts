import pool from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const orgId = searchParams.get('organizationId');
  const startHour = parseInt(searchParams.get('startHour') || '0', 10);
  const endHour = parseInt(searchParams.get('endHour') || '23', 10);
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  if (!orgId) {
    return new NextResponse('Missing organization ID', { status: 400 });
  }

  if (
    isNaN(startHour) ||
    isNaN(endHour) ||
    startHour < 0 ||
    endHour > 23 ||
    startHour > endHour
  ) {
    return new NextResponse('Invalid hour range', { status: 400 });
  }

  try {
    const client = await pool.connect();

    // Construir filtros dinámicos
    const filters = [`s.organization_id = $1`];
    const params: (string | number)[] = [orgId, startHour, endHour];
    let paramIndex = 4;

    if (startDate) {
      filters.push(`s.created_at >= $${paramIndex++}`);
      params.push(startDate);
    }
    if (endDate) {
      filters.push(`s.created_at <= $${paramIndex++}`);
      params.push(endDate);
    }

    const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

    const result = await client.query(
      `
      WITH hours AS (
        SELECT generate_series($2::int, $3::int) AS hour
      )
      SELECT 
        h.hour,
        COALESCE(SUM(s.total_price)::float, 0) AS total
      FROM hours h
      LEFT JOIN sales s
        ON EXTRACT(HOUR FROM s.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Argentina/Buenos_Aires') = h.hour
        ${whereClause ? `AND ${whereClause.replace(/^WHERE /, '')}` : ''}
      GROUP BY h.hour
      ORDER BY h.hour
      `,
      params
    );

    client.release();

    const formatted = result.rows.map((row) => {
      const hour = Number(row.hour);
      const label = `${
        hour === 0
          ? '12 AM'
          : hour < 12
            ? `${hour} AM`
            : hour === 12
              ? '12 PM'
              : `${hour - 12} PM`
      }`;

      return { label, total: row.total };
    });

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('Error fetching sales by hour:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
