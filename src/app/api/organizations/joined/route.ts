import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { decodeAccessToken } from '@/lib/auth/decodeAccessToken';

export async function GET() {
  try {
    const decodedToken = await decodeAccessToken();
    const userEmail = decodedToken.email;

    if (!userEmail) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userResult = await db.query(`SELECT id FROM users WHERE email = $1`, [
      userEmail,
    ]);

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userId = userResult.rows[0].id;

    const result = await db.query(
      `SELECT * FROM organizations o
       WHERE o.creator = $1
       OR EXISTS (
         SELECT 1 FROM organization_members om
         WHERE om.organization_id = o.id AND om.user_id = $1
       )
       ORDER BY o.name ASC`,
      [userId]
    );

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching organizations:', error);
    return NextResponse.json(
      { error: 'An error occurred while fetching organizations' },
      { status: 500 }
    );
  }
}
