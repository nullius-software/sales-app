import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
    const { id } = await params;

    try {
        const result = await pool.query("DELETE FROM organizations WHERE id = $1 RETURNING *", [id]);

        if (result.rowCount === 0) {
            return NextResponse.json({ error: "Organización no encontrada" }, { status: 404 });
        }

        return NextResponse.json({ message: "Organización eliminada", organization: result.rows[0] });
    } catch (error) {
        console.error("Error al eliminar organización:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
