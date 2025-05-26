import { NextResponse } from "next/server"
import db from "@/lib/db"
import { decodeJWT } from "@/lib/utils"

export async function GET(req: Request) {
    const authHeader = req.headers.get('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decodedToken = decodeJWT(token);
    const userEmail = decodedToken.email;

    if (!userEmail) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userResult = await db.query(
        `SELECT id FROM users WHERE email = $1`,
        [userEmail]
    );

    if (userResult.rows.length === 0) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userId = userResult.rows[0].id;

    try {
        const result = await db.query(`
            SELECT 
                o.id, 
                o.name,
                EXISTS (
                    SELECT 1
                    FROM organization_join_requests r
                    WHERE r.organization_id = o.id
                    AND r.user_id = $1
                    AND r.status = 'pending'
                ) AS requested
            FROM organizations o
            WHERE o.creator != $1
            AND NOT EXISTS (
                SELECT 1 FROM organization_members om
                WHERE om.organization_id = o.id AND om.user_id = $1
            )
            ORDER BY o.name ASC
        `, [userId]);

        return NextResponse.json(result.rows);
    } catch (err) {
        console.error("GET organizations error:", err);
        return new NextResponse("Error al obtener organizaciones", { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const authHeader = req.headers.get('Authorization');

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.split(' ')[1];
        const decodedToken = decodeJWT(token);
        const userEmail = decodedToken.email;

        if (!userEmail) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        const userResult = await db.query(
            `SELECT id FROM users WHERE email = $1`,
            [userEmail]
        );

        if (userResult.rows.length === 0) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const userId = userResult.rows[0].id;

        const result = await db.query(
            `INSERT INTO organizations (name, creator) VALUES ($1, $2) RETURNING *`,
            [body.name, userId]
        )

        return NextResponse.json(result.rows[0])
    } catch {
        return new NextResponse("Error al crear organización", { status: 500 })
    }
}
