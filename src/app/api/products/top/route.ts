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
      SELECT name, total_sold
      FROM products
      WHERE organization_id = $1
      ORDER BY total_sold DESC
      LIMIT 10
      `,
      [orgId]
    );

    client.release();

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching top products:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
