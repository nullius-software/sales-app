import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/getCurrentUser';
import pool from '@/lib/db';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const organizationId = params.id;
  const { newOwnerId } = await req.json();

  if (!newOwnerId) {
    return NextResponse.json({ error: 'Missing newOwnerId' }, { status: 400 });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const result = await client.query(
      `SELECT creator FROM organizations WHERE id = $1 FOR UPDATE`,
      [organizationId]
    );

    const org = result.rows[0];

    if (!org) {
      await client.query('ROLLBACK');
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    if (org.creator !== user.id) {
      await client.query('ROLLBACK');
      return NextResponse.json({ error: 'Forbidden: Not the organization owner' }, { status: 403 });
    }

    await client.query(
      `UPDATE organizations SET creator = $1 WHERE id = $2`,
      [newOwnerId, organizationId]
    );

    await client.query(
      `
      INSERT INTO organization_members (organization_id, user_id)
      SELECT $1, $2
      WHERE NOT EXISTS (
        SELECT 1 FROM organization_members WHERE organization_id = $1 AND user_id = $2
      )
      `,
      [organizationId, org.creator]
    );

    await client.query(
      `DELETE FROM organization_members WHERE organization_id = $1 AND user_id = $2`,
      [organizationId, newOwnerId]
    );

    await client.query('COMMIT');

    return NextResponse.json({ message: 'Organization transferred successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[TRANSFER_ORG_ERROR]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  } finally {
    client.release();
  }
}
