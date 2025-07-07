import pool from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { id: requestId } = await params;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { rows: requestRows } = await client.query(
      "SELECT * FROM organization_join_requests WHERE id = $1 FOR UPDATE",
      [requestId],
    );

    if (requestRows.length === 0) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    const request = requestRows[0];
    const { user_id, organization_id } = request;

    await client.query(
      "UPDATE organization_join_requests SET status = $1 WHERE id = $2",
      ["approved", requestId],
    );

    const { rows: existingMembership } = await client.query(
      "SELECT * FROM organization_members WHERE organization_id = $1 AND user_id = $2",
      [organization_id, user_id],
    );

    if (existingMembership.length === 0) {
      await client.query(
        "INSERT INTO organization_members (organization_id, user_id) VALUES ($1, $2)",
        [organization_id, user_id],
      );
    }

    await client.query("COMMIT");

    return NextResponse.json({ message: "Request approved and user added." });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error approving request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  } finally {
    client.release();
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const requestId = parseInt(params.id);

  if (isNaN(requestId)) {
    return NextResponse.json({ error: "Invalid request ID" }, { status: 400 });
  }

  const client = await pool.connect();

  try {
    const { rowCount } = await client.query(
      "UPDATE organization_join_requests SET status = $1 WHERE id = $2",
      ["rejected", requestId],
    );

    if (rowCount === 0) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Request rejected successfully." });
  } catch (error) {
    console.error("Error rejecting request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  } finally {
    client.release();
  }
}
