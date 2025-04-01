import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');
  const organization_id = searchParams.get('organization_id');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const offset = (page - 1) * limit;

  if (!organization_id) {
    return NextResponse.json({ error: 'organization_id is required' }, { status: 400 });
  }

  try {
    // Get total count first
    const countQuery = 'SELECT COUNT(*) FROM products WHERE organization_id = $1' + (q ? ' AND LOWER(name) LIKE LOWER($2)' : '');
    const countParams: (string | number)[] = [parseInt(organization_id)];
    if (q) countParams.push(`%${q}%`);
    
    const countResult = await pool.query(countQuery, countParams);
    const totalCount = parseInt(countResult.rows[0].count);
    
    // Get paginated products
    let query = 'SELECT id, name, price, stock FROM products WHERE organization_id = $1';
    const params: (string | number)[] = [parseInt(organization_id)];

    if (q) {
      query += ' AND LOWER(name) LIKE LOWER($2)';
      params.push(`%${q}%`);
    }

    query += ' ORDER BY total_sold DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit, offset);

    const result = await pool.query(query, params);
    const products = result.rows.map(row => ({
      id: row.id.toString(),
      name: row.name,
      price: parseFloat(row.price),
      stock: row.stock,
    }));

    return NextResponse.json({
      products,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}