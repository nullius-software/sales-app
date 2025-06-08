import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { z } from 'zod'

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
    const countQuery = 'SELECT COUNT(*) FROM products WHERE organization_id = $1' + (q ? ' AND LOWER(name) LIKE LOWER($2)' : '');
    const countParams: (string | number)[] = [parseInt(organization_id)];
    if (q) countParams.push(`%${q}%`);
    
    const countResult = await pool.query(countQuery, countParams);
    const totalCount = parseInt(countResult.rows[0].count);
    
    let query = 'SELECT id, name, price, stock, barcode FROM products WHERE organization_id = $1';
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
      stock: parseFloat(row.stock),
      barcode: row.barcode || null,
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


const createProductSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  stock: z.number().nonnegative('El stock no puede ser negativo'),
  price: z.number().nonnegative('El precio no puede ser negativo'),
  organization_id: z.number().int().positive('organization_id es obligatorio'),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = createProductSchema.parse(body)

    const { name, stock, price, organization_id } = data

    const insertQuery = `
      INSERT INTO products (name, stock, price, organization_id)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `
    const values = [name, stock, price, organization_id]

    const result = await pool.query(insertQuery, values)
    const product = result.rows[0]

    return NextResponse.json({
      id: product.id.toString(),
      name: product.name,
      stock: parseFloat(product.stock),
      price: parseFloat(product.price),
      barcode: product.barcode || null,
    }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Datos inválidos', issues: error.errors }, { status: 400 })
    }

    console.error('Error creating product:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
