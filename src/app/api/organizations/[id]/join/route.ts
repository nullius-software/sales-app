// app/api/join-request/route.ts
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { user_id } = await req.json();
    const { id: organization_id } = await params;

    if (!user_id || !organization_id) {
      return NextResponse.json({ error: 'user_id y organization_id son requeridos' }, { status: 400 });
    }

    const result = await pool.query(
      `
      INSERT INTO organization_join_requests (user_id, organization_id, status)
      VALUES ($1, $2, 'pending')
      ON CONFLICT (user_id, organization_id) DO NOTHING
      RETURNING *;
      `,
      [user_id, organization_id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ message: 'Ya existe una solicitud pendiente o aprobada' }, { status: 409 });
    }

    return NextResponse.json(result.rows[0], { status: 201 });

  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
