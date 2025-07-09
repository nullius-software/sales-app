import { pipeline } from '@xenova/transformers';
import type { FeatureExtractionPipeline } from '@xenova/transformers';

let extractor: FeatureExtractionPipeline | null = null;

export async function getExtractor(): Promise<FeatureExtractionPipeline> {
  if (!extractor) {
    extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  }
  return extractor;
}
