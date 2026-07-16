import type { LearningItem } from "./learning";
import { TECHNICAL_PHRASES } from "./technical-phrases";
import { BACKEND_PHRASES } from "./expanded-phrases-backend";
import { DAILY_LIFE_PHRASES } from "./expanded-phrases-daily-life";
import { DATA_ENGINEERING_PHRASES } from "./expanded-phrases-data-engineering";
import { TRAVEL_PHRASES } from "./expanded-phrases-travel";

export const EXPANDED_PHRASES: LearningItem[] = [
  ...DAILY_LIFE_PHRASES,
  ...TRAVEL_PHRASES,
  ...DATA_ENGINEERING_PHRASES,
  ...BACKEND_PHRASES,
];

export function extendTechnicalPhraseCatalog(): void {
  const existingIds = new Set(TECHNICAL_PHRASES.map((item) => item.id));
  for (const phrase of EXPANDED_PHRASES) {
    if (!existingIds.has(phrase.id)) {
      TECHNICAL_PHRASES.push(phrase);
      existingIds.add(phrase.id);
    }
  }
}
