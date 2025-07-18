import { AutoTokenizer, AutoProcessor, CLIPTextModelWithProjection, CLIPVisionModelWithProjection, RawImage, PreTrainedTokenizer, PreTrainedModel, Processor } from "@xenova/transformers"

let tokenizer: PreTrainedTokenizer | null = null;
let processor: Processor | null = null;
let textModel: PreTrainedModel | null = null;
let visionModel: PreTrainedModel | null = null;

async function initialize() {
  if (!tokenizer) {
    tokenizer = await AutoTokenizer.from_pretrained('Xenova/clip-vit-base-patch32');
  }
  if (!processor) {
    processor = await AutoProcessor.from_pretrained('Xenova/clip-vit-base-patch32');
  }
  if (!textModel) {
    textModel = await CLIPTextModelWithProjection.from_pretrained('Xenova/clip-vit-base-patch32', {
      quantized: true,
    });
  }
  if (!visionModel) {
    visionModel = await CLIPVisionModelWithProjection.from_pretrained('Xenova/clip-vit-base-patch32', {
      quantized: true,
    });
  }
}

export async function vectorizeText(text: string) {
  try {
    await initialize();

    if(!tokenizer || !textModel) throw new Error('Tokenizer o textModel no inicializados');

    const inputs = tokenizer(text, { padding: true, truncation: true, return_tensors: 'pt' });

    const output = await textModel(inputs);

    const embedding = output.text_embeds.data;
    const norm = Math.sqrt(embedding.reduce((sum: number, val: number) => sum + val * val, 0));
    const normalizedEmbedding = Array.from(embedding, (val: number) => Number(val / norm).toFixed(8));

    return `[${normalizedEmbedding.join(',')}]`;
  } catch (error) {
    console.error('Error al vectorizar el texto:', error);
    throw new Error('No se pudo generar el embedding del texto');
  }
}

export async function vectorizeImage(tempFilePath: string) {
  try {
    await initialize();

    if(!processor || !visionModel) throw new Error('Processor o visionModel no inicializados');

    const image = await RawImage.read(tempFilePath);
    const inputs = await processor(image);

    const output = await visionModel(inputs);

    const embedding = output.image_embeds.data;

    const norm = Math.sqrt(embedding.reduce((sum: number, val: number) => sum + val * val, 0));
    if (norm === 0) {
      throw new Error('La norma del embedding es cero, posible imagen inválida');
    }
    return Array.from(embedding, (val: number) => Number(val / norm).toFixed(8));
  } catch (error) {
    console.error('Error al vectorizar la imagen:', error);
    throw new Error('No se pudo vectorizar la imagen');
  }
}