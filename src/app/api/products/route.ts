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
    let countQuery = 'SELECT COUNT(*) FROM products WHERE organization_id = $1';
    let countParams: (string | number)[] = [parseInt(organization_id)];

    if (q) {
      countQuery = `
        SELECT COUNT(*) FROM products
        WHERE organization_id = $1
          AND similarity(LOWER(name), LOWER($2)) > 0.2
      `;
      countParams = [parseInt(organization_id), q];
    }

    const countResult = await pool.query(countQuery, countParams);
    const totalCount = parseInt(countResult.rows[0].count);

    let query: string;
    let params: (string | number)[];

    if (q) {
      query = `
        SELECT *, similarity(LOWER(name), LOWER($2)) AS score
        FROM products
        WHERE organization_id = $1 AND similarity(LOWER(name), LOWER($2)) > 0.2
        ORDER BY score DESC, total_sold DESC
        LIMIT $3 OFFSET $4
      `;
      params = [
        parseInt(organization_id),
        q,
        limit,
        offset
      ];
    } else {
      query = `
        SELECT *
        FROM products
        WHERE organization_id = $1
        ORDER BY total_sold DESC
        LIMIT $2 OFFSET $3
      `;
      params = [
        parseInt(organization_id),
        limit,
        offset
      ];
    }

    const result = await pool.query(query, params);
    const products = result.rows.map(row => ({
      id: row.id.toString(),
      name: row.name,
      price: parseFloat(row.price),
      stock: parseFloat(row.stock),
      barcode: row.barcode || null,
      unit: row.unit
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
  unit: z.enum(['unit', 'meter', 'kilogram'], {
    required_error: 'La unidad es obligatoria',
    invalid_type_error: 'Unidad inválida',
  }),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = createProductSchema.parse(body)

    const { name, stock, price, organization_id, unit } = data

    const checkQuery = `
      SELECT id FROM products 
      WHERE organization_id = $1 AND LOWER(name) = LOWER($2)
      LIMIT 1
    `
    const checkValues = [organization_id, name]
    const existing = await pool.query(checkQuery, checkValues)

    if (existing.rows.length > 0) {
      return NextResponse.json(
        { error: 'Ya existe un producto con ese nombre' },
        { status: 409 }
      )
    }

    const insertQuery = `
      INSERT INTO products (name, stock, price, organization_id, unit)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `
    const values = [name, stock, price, organization_id, unit]

    const result = await pool.query(insertQuery, values)
    const product = result.rows[0]

    return NextResponse.json({
      id: product.id.toString(),
      name: product.name,
      stock: parseFloat(product.stock),
      price: parseFloat(product.price),
      unit: product.unit,
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
