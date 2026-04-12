import type { Language } from '../../i18n/messages';
import { DEMO_SHOWCASE_DOCUMENTS, getDemoShowcaseDocument } from './demoScenario';

export type SampleDocument = (typeof DEMO_SHOWCASE_DOCUMENTS)[number];

export const SAMPLE_DOCUMENTS: SampleDocument[] = DEMO_SHOWCASE_DOCUMENTS;

export function getSampleDocuments(language: Language = 'th') {
  return DEMO_SHOWCASE_DOCUMENTS.map((document) => getDemoShowcaseDocument(document.id, language) ?? document);
}
