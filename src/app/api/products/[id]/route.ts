import { NextResponse } from 'next/server';
import { getProductSchema } from '@/lib/validations/productSchema';
import { z } from 'zod';
import pool from '@/lib/db';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const id = parseInt(params.id);

  if (isNaN(id)) {
    return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
  }

  try {
    const productRes = await pool.query(
      'SELECT id, organization_id FROM products WHERE id = $1',
      [id]
    );

    if (productRes.rowCount === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const { organization_id } = productRes.rows[0];

    const orgRes = await pool.query(
      'SELECT business_type FROM organizations WHERE id = $1',
      [organization_id]
    );

    if (orgRes.rowCount === 0) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const isTextil = orgRes.rows[0].business_type === 'textil';

    const body = await request.json();
    const schema = getProductSchema(isTextil);
    const data = schema.parse(body);

    const { name, price, stock } = data;

    const updateRes = await pool.query(
      'UPDATE products SET name = $1, price = $2, stock = $3 WHERE id = $4 RETURNING id, name, price, stock, barcode',
      [name, price, stock, id]
    );

    const updated = updateRes.rows[0];

    return NextResponse.json({
      product: {
        id: updated.id.toString(),
        name: updated.name,
        price: parseFloat(updated.price),
        stock: parseFloat(updated.stock),
        barcode: updated.barcode || null,
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', issues: error.format() }, { status: 400 });
    }

    console.error('Error updating product:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
    }

    const result = await pool.query('DELETE FROM products WHERE id = $1', [id]);

    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Product deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { error: 'Error deleting product' },
      { status: 500 }
    );
  }
}
