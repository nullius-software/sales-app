import { NextResponse } from "next/server"
import db from "@/lib/db"
import { decodeAccessToken } from "@/lib/auth/decodeAccessToken"

export async function GET(req: Request) {
  const decodedToken = await decodeAccessToken()
  const userEmail = decodedToken.email

  if (!userEmail) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }

  const userResult = await db.query(
    `SELECT id FROM users WHERE email = $1`,
    [userEmail]
  )

  if (userResult.rows.length === 0) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const userId = userResult.rows[0].id

  const { searchParams } = new URL(req.url)
  const name = searchParams.get('name')?.toLowerCase()
  const limit = parseInt(searchParams.get('limit') || '20', 10)

  let query = `
    SELECT 
      *,
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
  `
  const values = [userId]

  if (name) {
    query += ` AND LOWER(o.name) LIKE $${values.length + 1}`
    values.push(`%${name}%`)
  }

  query += ` ORDER BY o.name ASC`
  if (limit && !isNaN(limit)) {
    query += ` LIMIT ${limit}`
  }

  try {
    const result = await db.query(query, values)
    return NextResponse.json(result.rows)
  } catch (err) {
    console.error("GET organizations error:", err)
    return new NextResponse("Error al obtener organizaciones", { status: 500 })
  }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const decodedToken = await decodeAccessToken();
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

        const businessType = body.business_type ?? 'almacen';

        const result = await db.query(
            `INSERT INTO organizations (name, creator, business_type) VALUES ($1, $2, $3) RETURNING *`,
            [body.name, userId, businessType]
        );

        return NextResponse.json(result.rows[0]);
    } catch (err) {
        console.error('Error creando organización', err);
        return new NextResponse("Error al crear organización", { status: 500 });
    }
}
