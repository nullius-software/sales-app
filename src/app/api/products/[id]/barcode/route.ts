import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const productId = parseInt(params.id);
  if (isNaN(productId)) {
    return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
  }

  const body = await req.json();
  const { barcode } = body;

  if (typeof barcode !== 'string' && barcode !== null) {
    return NextResponse.json({ error: 'barcode must be a string or null' }, { status: 400 });
  }

  try {
    const result = await pool.query(
      'UPDATE products SET barcode = $1 WHERE id = $2 RETURNING id, name, barcode',
      [barcode, productId]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ product: result.rows[0] });
  } catch (error) {
    console.error('Error updating barcode:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
