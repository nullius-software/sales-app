import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { decodeAccessToken } from '@/lib/auth/decodeAccessToken';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id: orgId } = await params;
  const decodedToken = await decodeAccessToken();
  const userEmail = decodedToken.email;

  if (!userEmail) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  const userResult = await pool.query('SELECT id FROM users WHERE email = $1', [
    userEmail,
  ]);

  if (userResult.rows.length === 0) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const userId = userResult.rows[0].id;

  const orgResult = await pool.query(
    'SELECT * FROM organizations WHERE id = $1 AND creator = $2',
    [orgId, userId]
  );

  if (orgResult.rows.length === 0) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const requestsResult = await pool.query(
    `SELECT
            ojr.id AS request_id,
            u.id AS user_id,
            u.email,
            ojr.created_at
        FROM organization_join_requests ojr
        JOIN users u ON u.id = ojr.user_id
        WHERE ojr.organization_id = $1 AND ojr.status = 'pending'
        ORDER BY ojr.created_at DESC`,
    [orgId]
  );

  return NextResponse.json(requestsResult.rows);
}
