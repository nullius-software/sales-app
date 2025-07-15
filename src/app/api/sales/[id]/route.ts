import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const saleId = (await params).id;
  const { searchParams } = new URL(request.url);
  const organizationId = searchParams.get('organizationId');

  if (!organizationId) {
    return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
  }

  try {
    const client = await pool.connect();
    try {
      const saleResult = await client.query(
        `SELECT id, created_at, total_price 
          FROM sales 
          WHERE id = $1 AND organization_id = $2`,
        [saleId, organizationId]
      );

      if (saleResult.rows.length === 0) {
        return NextResponse.json({ error: 'Sale not found' }, { status: 404 });
      }

      const sale = saleResult.rows[0];

      const productsResult = await client.query(
        `SELECT sp.quantity, sp.unit_price, sp.product_id AS id, sp.product_name AS name
   FROM sales_products sp
   WHERE sp.sale_id = $1`,
        [saleId]
      );

      return NextResponse.json({
        sale: sale,
        products: productsResult.rows
      }, { status: 200 });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error fetching sale details:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const saleId = (await params).id;

  try {
    const client = await pool.connect();
    try {
      await client.query(
        `DELETE FROM sales 
          WHERE id = $1`,
        [saleId]
      );

      return NextResponse.json({message: 'Sale deleted successfully'}, { status: 200 });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error fetching sale details:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}