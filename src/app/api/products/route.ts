import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');
  const organization_id = searchParams.get('organization_id');

  if (!organization_id) {
    return NextResponse.json({ error: 'organization_id is required' }, { status: 400 });
  }

  try {
    let query = 'SELECT id, name, price, stock FROM products WHERE organization_id = $1';
    const params: (string | number)[] = [parseInt(organization_id)];

    if (q) {
      query += ' AND LOWER(name) LIKE LOWER($2)';
      params.push(`%${q}%`);
    }

    query += ' ORDER BY total_sold DESC';

    const result = await pool.query(query, params);
    console.log(`Query executed successfully, found ${result.rows.length} products`);

    const products = result.rows.map(row => ({
      id: row.id.toString(),
      name: row.name,
      price: parseFloat(row.price),
      stock: row.stock,
    }));

    return NextResponse.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}