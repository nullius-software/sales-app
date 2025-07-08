import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function DELETE(
    _request: Request,
    { params }: { params: { id: string; memberId: string } }
) {
    const { id: organization_id, memberId: user_id } = params;

    try {
        const result = await pool.query(
            "DELETE FROM organization_members WHERE organization_id = $1 AND user_id = $2 RETURNING *",
            [organization_id, user_id]
        );

        if (result.rowCount === 0) {
            return NextResponse.json(
                { error: "Miembro no encontrado en la organización" },
                { status: 404 }
            );
        }

        return NextResponse.json({ message: "Miembro eliminado de la organización" });
    } catch (error) {
        console.error("Error al eliminar miembro de la organización:", error);
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}