import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { z } from 'zod';
import { vectorizeImage } from '@/lib/vectorize';
import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

const imageSchema = z.object({
  productId: z.string().min(1),
  imageUrl: z.string().url(),
});

export async function POST(request: Request) {
  let tempFilePath: string | null = null;

  try {
    const body = await request.json();
    const { productId, imageUrl } = imageSchema.parse(body);

    // 1. Download image to a temporary file
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const imageBuffer = Buffer.from(response.data);
    const tempDir = os.tmpdir();
    tempFilePath = path.join(
      tempDir,
      `product-image-${productId}-${Date.now()}`
    );
    await fs.writeFile(tempFilePath, imageBuffer);

    // 2. Generate vector embedding
    const embedding = await vectorizeImage(tempFilePath);
    const embeddingString = `[${embedding.join(',')}]`;

    // 3. Insert or update the database record
    const query = `
      INSERT INTO product_images (product_id, image_url, embedding)
      VALUES ($1, $2, $3)
      ON CONFLICT (product_id)
      DO UPDATE SET
        image_url = EXCLUDED.image_url,
        embedding = EXCLUDED.embedding,
        updated_at = CURRENT_TIMESTAMP;
    `;
    await pool.query(query, [productId, imageUrl, embeddingString]);

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error('Error processing product image:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    // 4. Clean up the temporary file
    if (tempFilePath) {
      try {
        await fs.unlink(tempFilePath);
      } catch (cleanupError) {
        console.error('Error cleaning up temporary file:', cleanupError);
      }
    }
  }
}
