import { NextResponse } from 'next/server';
import { getSignedURL } from '@/lib/s3';
import { z } from 'zod';

const uploadSchema = z.object({
  fileType: z.string().min(1),
  fileSize: z.number().int().positive(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { fileType, fileSize } = uploadSchema.parse(body);

    const { signedUrl, fileUrl } = await getSignedURL(fileType, fileSize);

    return NextResponse.json({ signedUrl, fileUrl });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error('Error creating signed URL:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
