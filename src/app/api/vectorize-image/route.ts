import { NextResponse } from "next/server";
import path from "path";
import os from "os";
import { vectorizeImage } from "@/lib/vectorize";
import { writeFile, unlink } from "fs/promises";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("image") as File;
    const organizationId = formData.get("organization_id")?.toString();

    if (!file || !organizationId) {
      return NextResponse.json(
        { error: "Missing image or organization_id" },
        { status: 400 }
      );
    }

    const tempDir = os.tmpdir();
    const filePath = path.join(tempDir, file.name);
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await writeFile(filePath, buffer);

    const vector = await vectorizeImage(filePath);

    await unlink(filePath);

    return NextResponse.json({ data: vector }, { status: 200 });
  } catch {
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
