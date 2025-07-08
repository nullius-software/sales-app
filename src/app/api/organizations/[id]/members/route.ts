import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(request: Request, { params }: { params: { id: string } }) {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const offset = (page - 1) * limit;


    try {
        const orgExistsResult = await pool.query("SELECT id FROM organizations WHERE id = $1", [id]);

        if (orgExistsResult.rowCount === 0) {
            return NextResponse.json({ error: "Organización no encontrada" }, { status: 404 });
        }

        const result = await pool.query(
            `SELECT u.id, u.email
             FROM users u
             JOIN organization_members om ON u.id = om.user_id
             WHERE om.organization_id = $1
             ORDER BY u.email
             LIMIT $2 OFFSET $3`,
            [id, limit, offset]
        );

        const totalMembersResult = await pool.query(
            `SELECT COUNT(*) FROM organization_members WHERE organization_id = $1`,
            [id]
        );
        const totalMembers = parseInt(totalMembersResult.rows[0].count, 10);

        return NextResponse.json({
            data: result.rows,
            total: totalMembers,
            page,
            limit,
            totalPages: Math.ceil(totalMembers / limit)
        });
    } catch (error) {
        console.error("Error al obtener los miembros de la organización:", error);
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}