import pool from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(
  _Request: Request,
  { params }: { params: { id: string } }
) {
  const { id: email } = await params;

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [
      email,
    ]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0], { status: 200 });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
