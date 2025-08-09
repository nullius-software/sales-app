import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const orgId = searchParams.get('organizationId');
  const date = searchParams.get('date');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  if (!orgId) {
    return NextResponse.json(
      { error: 'Missing organizationId' },
      { status: 400 }
    );
  }

  const isValidDate = (d: string) => /^\d{4}-\d{2}-\d{2}$/.test(d);

  if (
    (date && !isValidDate(date)) ||
    (startDate && !isValidDate(startDate)) ||
    (endDate && !isValidDate(endDate))
  ) {
    return NextResponse.json(
      { error: 'Invalid date format (expected YYYY-MM-DD)' },
      { status: 400 }
    );
  }

  try {
    if (date) {
      const result = await pool.query(
        `
        SELECT COALESCE(AVG(total_price), 0) AS average_ticket
        FROM sales
        WHERE organization_id = $1
          AND (created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Argentina/Buenos_Aires')::date = $2
        `,
        [orgId, date]
      );

      return NextResponse.json({
        total: parseFloat(result.rows[0].average_ticket),
      });
    }

    if (startDate) {
      const finalEndDate = endDate || new Date().toISOString().slice(0, 10);

      const globalRes = await pool.query(
        `
        SELECT COALESCE(AVG(total_price), 0) AS average_ticket
        FROM sales
        WHERE organization_id = $1
          AND (created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Argentina/Buenos_Aires')::date BETWEEN $2 AND $3
        `,
        [orgId, startDate, finalEndDate]
      );

      const dailyRes = await pool.query(
        `
        WITH dates AS (
          SELECT generate_series($2::date, $3::date, interval '1 day') AS day
        )
        SELECT
          to_char(d.day, 'DD Mon') AS date,
          ROUND(
            COALESCE(AVG(s.total_price), 0)::numeric,
            2
          ) AS average_ticket
        FROM dates d
        LEFT JOIN sales s ON
          s.organization_id = $1
          AND (s.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Argentina/Buenos_Aires')::date = d.day
        GROUP BY d.day
        ORDER BY d.day
        `,
        [orgId, startDate, finalEndDate]
      );

      return NextResponse.json({
        total: parseFloat(globalRes.rows[0].average_ticket),
        daily: dailyRes.rows.map((row) => ({
          date: row.date,
          average_ticket: parseFloat(row.average_ticket),
        })),
      });
    }

    const result = await pool.query(
      `
      SELECT COALESCE(AVG(total_price), 0) AS average_ticket
      FROM sales
      WHERE organization_id = $1
      `,
      [orgId]
    );

    return NextResponse.json({
      total: parseFloat(result.rows[0].average_ticket),
    });
  } catch (error) {
    console.error('[AVERAGE_TICKET_ERROR]', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
