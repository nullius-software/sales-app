import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function PUT(
  req: Request,
  { params }: { params: { id: string } },
) {
  const productId = parseInt(params.id);
  if (isNaN(productId)) {
    return NextResponse.json({ error: "Invalid product ID" }, { status: 400 });
  }

  const body = await req.json();
  const { barcode } = body;

  // Validate barcode input
  if (typeof barcode !== "string" && barcode !== null) {
    return NextResponse.json(
      { error: "barcode must be a string or null" },
      { status: 400 },
    );
  }

  try {
    // Fetch the product's organization_id
    const productResult = await pool.query(
      "SELECT organization_id FROM products WHERE id = $1",
      [productId],
    );

    if (productResult.rowCount === 0) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const { organization_id } = productResult.rows[0];

    // Check for duplicate barcode within the same organization
    if (barcode !== null) {
      const duplicateCheck = await pool.query(
        "SELECT id, name FROM products WHERE barcode = $1 AND organization_id = $2 AND id != $3",
        [barcode, organization_id, productId],
      );

      if (duplicateCheck.rowCount && duplicateCheck.rowCount > 0) {
        const conflictingProductName = duplicateCheck.rows[0].name;
        return NextResponse.json(
          {
            error: `El código de barra ya es utilizado por el producto "${conflictingProductName}"`,
          },
          { status: 409 },
        );
      }
    }

    const updateResult = await pool.query(
      "UPDATE products SET barcode = $1 WHERE id = $2 RETURNING id, name, barcode",
      [barcode, productId],
    );

    if (updateResult.rowCount === 0) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ product: updateResult.rows[0] });
  } catch (error) {
    console.error("Error updating barcode:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
