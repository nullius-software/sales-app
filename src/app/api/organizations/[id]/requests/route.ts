import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { decodeAccessToken } from '@/lib/auth/decodeAccessToken';

export async function GET(req: NextRequest) {
    const url = req.nextUrl.pathname;
    const segments = url.split('/');
    const orgIdParam = segments[segments.indexOf('organizations') + 1];
    const orgId = Number(orgIdParam);

    if (!orgIdParam || isNaN(orgId)) {
        return NextResponse.json({ error: 'orgId inválido' }, { status: 400 });
    }

    let decodedToken;
    try {
        decodedToken = await decodeAccessToken();
    } catch (error) {
        console.error('Falló decodeAccessToken:', error);
        return NextResponse.json({ error: 'No access token found' }, { status: 401 });
    }

    const userEmail = decodedToken.email;
    if (!userEmail) {
        return NextResponse.json({ error: 'Invalid token: no email' }, { status: 401 });
    }

    try {
        const userResult = await pool.query(
            'SELECT id FROM users WHERE email = $1',
            [userEmail]
        );

        if (userResult.rows.length === 0) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const userId = userResult.rows[0].id;

        const orgResult = await pool.query(
            'SELECT * FROM organizations WHERE id = $1 AND creator = $2',
            [orgId, userId]
        );

        if (orgResult.rows.length === 0) {
            return NextResponse.json({ error: 'Forbidden: organization not found or not owned' }, { status: 403 });
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

        return NextResponse.json(requestsResult.rows, { status: 200 });
    } catch (error) {
        console.error('Error en la consulta SQL:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}
