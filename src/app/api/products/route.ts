import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { z } from "zod";
import { vectorizeText } from "@/lib/vectorize";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");
  const vector = searchParams.get("vector");
  const organization_id = searchParams.get("organization_id");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const offset = (page - 1) * limit;

  if (!organization_id) {
    return NextResponse.json(
      { error: "organization_id is required" },
      { status: 400 }
    );
  }

  try {
    let parsedVector: number[] | null = null;
    if (vector) {
      try {
        const parsed = JSON.parse(vector);
        const vectorArray =
          parsed.data && Array.isArray(parsed.data) ? parsed.data : parsed;
        if (!Array.isArray(vectorArray)) {
          return NextResponse.json(
            {
              error:
                "Invalid vector format. Must be a JSON array or an object with a 'data' array.",
            },
            { status: 400 }
          );
        }
        parsedVector = vectorArray.map((v: string | number) =>
          parseFloat(v.toString())
        );
        if (parsedVector.some((v) => isNaN(v))) {
          return NextResponse.json(
            {
              error:
                "Invalid vector format. All elements must be valid numbers.",
            },
            { status: 400 }
          );
        }
        if (parsedVector.length !== 512) {
          return NextResponse.json(
            {
              error: `Vector must have 512 dimensions, got ${parsedVector.length}`,
            },
            { status: 400 }
          );
        }
      } catch (err) {
        console.error("Error parsing vector:", err);
        return NextResponse.json(
          {
            error:
              "Failed to parse vector parameter. Must be a valid JSON array.",
          },
          { status: 400 }
        );
      }
    }

    let countQuery = "SELECT COUNT(*) FROM products WHERE organization_id = $1";
    let countParams: (string | number)[] = [parseInt(organization_id)];

    if (q && !parsedVector) {
      countQuery = `
        SELECT COUNT(*) FROM products
        WHERE organization_id = $1
          AND similarity(LOWER(name), LOWER($2)) > 0.2
      `;
      countParams = [parseInt(organization_id), q];
    } else if (parsedVector) {
      countQuery = `
        SELECT COUNT(*) FROM products
        WHERE organization_id = $1 AND embedding IS NOT NULL
      `;
    }

    const countResult = await pool.query(countQuery, countParams);
    const totalCount = parseInt(countResult.rows[0].count);

    let query: string;
    let params: (string | number | string)[];

    if (parsedVector) {
      const vectorString = `[${parsedVector.join(",")}]`;
      query = `
        SELECT * FROM products
        WHERE organization_id = $1 AND embedding IS NOT NULL
        ORDER BY embedding <=> $2::vector ASC
        LIMIT $3 OFFSET $4
      `;
      params = [parseInt(organization_id), vectorString, limit, offset];
    } else if (q) {
      query = `
        SELECT * FROM products
        WHERE organization_id = $1 AND similarity(LOWER(name), LOWER($2)) > 0.2
        ORDER BY similarity(LOWER(name), LOWER($2)) DESC, total_sold DESC
        LIMIT $3 OFFSET $4
      `;
      params = [parseInt(organization_id), q, limit, offset];
    } else {
      query = `
        SELECT * FROM products
        WHERE organization_id = $1
        ORDER BY total_sold DESC
        LIMIT $2 OFFSET $3
      `;
      params = [parseInt(organization_id), limit, offset];
    }

    const result = await pool.query(query, params);
    const products = result.rows;

    return NextResponse.json({
      products,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (err) {
    console.log(err);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

const createProductSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  stock: z.number().nonnegative("El stock no puede ser negativo"),
  price: z.number().nonnegative("El precio no puede ser negativo"),
  organization_id: z.number().int().positive("organization_id es obligatorio"),
  unit: z.enum(["unit", "meter", "kilogram"], {
    required_error: "La unidad es obligatoria",
    invalid_type_error: "Unidad inválida",
  }),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = createProductSchema.parse(body);

    const { name, stock, price, organization_id, unit } = data;

    const checkQuery = `
      SELECT id FROM products 
      WHERE organization_id = $1 AND LOWER(name) = LOWER($2)
      LIMIT 1
    `;
    const checkValues = [organization_id, name];
    const existing = await pool.query(checkQuery, checkValues);

    if (existing.rows.length > 0) {
      return NextResponse.json(
        { error: "Ya existe un producto con ese nombre" },
        { status: 409 }
      );
    }

    const vector = await vectorizeText(name);

    const insertQuery = `
  INSERT INTO products (name, stock, price, organization_id, unit, embedding)
  VALUES ($1, $2, $3, $4, $5, $6)
  RETURNING *
`;
    const values = [name, stock, price, organization_id, unit, vector];

    const resultInsert = await pool.query(insertQuery, values);

    const product = resultInsert.rows[0];

    return NextResponse.json(
      {
        id: product.id.toString(),
        name: product.name,
        stock: parseFloat(product.stock),
        price: parseFloat(product.price),
        unit: product.unit,
        barcode: product.barcode || null,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", issues: error.errors },
        { status: 400 }
      );
    }

    console.error("Error creating product:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
