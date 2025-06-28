import { NextResponse } from 'next/server';
import pool from '@/lib/db';

type SaleItem = {
  id: string;
  quantity: number;
  price: number;
};

export async function POST(request: Request) {
  const { items, organization_id } = await request.json();

  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: 'Items array is required and must not be empty' }, { status: 400 });
  }
  if (!organization_id || typeof organization_id !== 'number') {
    return NextResponse.json({ error: 'Valid organization_id is required' }, { status: 400 });
  }

  for (const item of items) {
    if (!item.id || typeof item.quantity !== 'number' || item.quantity <= 0) {
      return NextResponse.json({ error: 'Each item must have a valid id and quantity' }, { status: 400 });
    }
  }

  try {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      for (const item of items) {
        const productResult = await client.query(
          'SELECT stock, price FROM products WHERE id = $1 AND organization_id = $2 FOR UPDATE',
          [item.id, organization_id]
        );
        if (productResult.rows.length === 0) {
          throw new Error(`Product with id ${item.id} not found`);
        }
        const { stock, price } = productResult.rows[0];
        if (stock < item.quantity) {
          throw new Error(`Insufficient stock for product ${item.id}. Available: ${stock}, Requested: ${item.quantity}`);
        }
        if (parseFloat(price) !== item.price) {
          throw new Error(`Price mismatch for product ${item.id}`);
        }
      }

      const totalPrice = items.reduce((sum: number, item: SaleItem) => sum + item.price * item.quantity, 0);

      const saleResult = await client.query(
        'INSERT INTO sales (total_price, organization_id) VALUES ($1, $2) RETURNING id',
        [totalPrice, organization_id]
      );
      const saleId = saleResult.rows[0].id;

      for (const item of items) {
        await client.query(
          'INSERT INTO sales_products (sale_id, product_id, quantity, unit_price) VALUES ($1, $2, $3, $4)',
          [saleId, item.id, item.quantity, item.price]
        );
        await client.query(
          'UPDATE products SET stock = stock - $1, total_sold = total_sold + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          [item.quantity, item.id]
        );
      }

      await client.query('COMMIT');
      return NextResponse.json({ saleId, totalPrice }, { status: 201 });
    } catch (error) {
      await client.query('ROLLBACK');
      if (error instanceof Error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error registering sale:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const organizationId = searchParams.get('organizationId');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const offset = (page - 1) * limit;
  
  if (!organizationId) {
    return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
  }

  try {
    const client = await pool.connect();
    try {
      const countResult = await client.query(
        'SELECT COUNT(*) FROM sales WHERE organization_id = $1',
        [organizationId]
      );
      const totalCount = parseInt(countResult.rows[0].count);
      
      const salesResult = await client.query(
        `SELECT s.id, s.created_at, s.total_price, 
                COUNT(sp.id) as item_count
         FROM sales s
         LEFT JOIN sales_products sp ON s.id = sp.sale_id
         WHERE s.organization_id = $1
         GROUP BY s.id
         ORDER BY s.created_at DESC
         LIMIT $2 OFFSET $3`,
        [organizationId, limit, offset]
      );

      return NextResponse.json({
        sales: salesResult.rows,
        pagination: {
          total: totalCount,
          page,
          limit,
          totalPages: Math.ceil(totalCount / limit)
        }
      }, { status: 200 });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error fetching sales history:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}