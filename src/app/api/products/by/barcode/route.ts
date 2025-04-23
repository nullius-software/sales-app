import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const barcode = searchParams.get('barcode');
  const organization_id = searchParams.get('organization_id');

  if (!barcode) {
    return NextResponse.json({ error: 'barcode is required' }, { status: 400 });
  }

  if (!organization_id) {
    return NextResponse.json({ error: 'organization_id is required' }, { status: 400 });
  }

  try {
    const query = 'SELECT id, name, price, stock, barcode FROM products WHERE barcode = $1 AND organization_id = $2';
    const params = [barcode, parseInt(organization_id)];

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const product = result.rows[0];

    return NextResponse.json({
      id: product.id.toString(),
      name: product.name,
      price: parseFloat(product.price),
      stock: product.stock,
      barcode: product.barcode || null,
    });
  } catch (error) {
    console.error('Error fetching product by barcode:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}