import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import path from 'path';
import os from 'os';
import { writeFile } from 'fs/promises';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const POST = async (req: NextRequest) => {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const tempDir = os.tmpdir();
    const filePath = path.join(tempDir, file.name);
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await writeFile(filePath, buffer);
    const base64Image = `data:${file.type};base64,${buffer.toString('base64')}`;

    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: `
             Eres un experto textil profesional. A partir de una imagen de una tela, debes identificar sus características con el mayor nivel de precisión posible.\n\nTu tarea es detectar:\n\n- Fibra base (ejemplos: Algodón, Seda, Lino, Lana, Poliéster, Viscosa, Sintético, Mezcla)\n- Tipo de tejido o estructura (ejemplos: Liso, Satén, Tafetán, Jersey, Rib, Crepé, Tweed, Denim, Terciopelo, Pana, Encaje)\n- Color dominante (en español)\n- Brillo o textura superficial (ejemplos: Mate, Brillante, Suave, Rugoso, Aterciopelado)\n- Patrón o diseño superficial (ejemplos: Liso, Rayado, A cuadros, Floral, Animal Print, Abstracto, Geométrico, Puntitos)\n\nGenera un nombre unificado de la tela utilizando los datos identificados.\n\n- El nombre debe tener el siguiente formato:\n\n[Fibra base] - [Tipo de tejido] - [Color] - [Brillo o textura] - [Patrón]\n\n- Solo incluye los campos que logres identificar.\n- No incluyas campos vacíos ni coloques la palabra \"Desconocido\" en los campos individuales.\n- Usa mayúscula inicial en cada palabra.\n- Si no logras identificar absolutamente ninguno de los datos, responde únicamente: Desconocido\n\nNo agregues ninguna explicación ni texto adicional.
          `.trim(),
            },
            {
              type: "input_image",
              detail: "auto",
              image_url: base64Image,
            },
          ],
        },
      ],
    });


    const result = response.output_text?.trim() ?? 'No se registró el tipo de tela';

    return NextResponse.json({ result });
  } catch (error: any) {
    console.error('Error processing image:', error);
    return NextResponse.json(
      { error: 'Error al procesar la imagen', details: error?.message },
      { status: 500 }
    );
  }
};
