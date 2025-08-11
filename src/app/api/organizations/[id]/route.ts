import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/getCurrentUser';

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  try {
    const orgResult = await pool.query(
      'SELECT * FROM organizations WHERE id = $1',
      [id]
    );

    if (orgResult.rowCount === 0) {
      return NextResponse.json(
        { error: 'Organización no encontrada' },
        { status: 404 }
      );
    }

    const organization = orgResult.rows[0];

    if (organization.creator !== user.id) {
      return NextResponse.json(
        { error: 'No tienes permisos para eliminar esta organización' },
        { status: 403 }
      );
    }

    const deleteResult = await pool.query(
      'DELETE FROM organizations WHERE id = $1 RETURNING *',
      [id]
    );

    return NextResponse.json({
      message: 'Organización eliminada',
      organization: deleteResult.rows[0],
    });
  } catch (error) {
    console.error('Error al eliminar organización:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
