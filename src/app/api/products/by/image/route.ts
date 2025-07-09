import type { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import { pipeline } from '@xenova/transformers';
import db from '@/lib/db';

export const config = {
  api: {
    bodyParser: false,
  },
};

const parseForm = (req: NextApiRequest): Promise<{ imagePath: string; organizationId: string }> => {
  const form = formidable({ multiples: false });

  return new Promise((resolve, reject) => {
    form.parse(req, async (err: any, fields: any, files: any) => {
      if (err) return reject(err);

      const organizationId = fields.organization_id?.toString();
      const file = files.image;

      if (!organizationId || !file || Array.isArray(file)) {
        return reject(new Error('Missing image or organization_id'));
      }

      const imagePath = file.filepath;
      resolve({ imagePath, organizationId });
    });
  });
};

export async function POST(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { imagePath, organizationId } = await parseForm(req);

    // 1. Generar embedding de la imagen con CLIP
    const extractor = await pipeline('feature-extraction', 'Xenova/clip-vit-base-patch32');
    const result = await extractor(imagePath, {
      pooling: 'mean',
      normalize: true,
    });

    const vector: number[] = Object.values(result.data).map(Number);

    // 2. Buscar el producto más cercano en la base de datos
    const dbResult = await db.query(
      `
      SELECT id, name, embedding <=> $1 AS distance
      FROM products
      WHERE organization_id = $2 AND embedding IS NOT NULL
      ORDER BY embedding <=> $1
      LIMIT 1;
      `,
      [vector, organizationId]
    );

    // 3. Retornar el producto más cercano
    if (dbResult.rows.length === 0) {
      return res.status(404).json({ error: 'No matching product found' });
    }

    return res.status(200).json({ product: dbResult.rows[0] });
  } catch (err: any) {
    console.error('Error:', err);
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}
