import type { HomepageCopy } from '@shared/api.interface';

export interface JourneyEntry {
  year: number;
  text: string;
  category: string;
}

export function buildJourneyEntries(copy: HomepageCopy): JourneyEntry[] {
  const sources = [
    { category: '经历', value: copy.resumeExperience },
    { category: '荣誉', value: copy.resumeAwards },
    { category: '展览', value: copy.resumeExhibitions },
  ];
  const entries: JourneyEntry[] = [];

  for (const source of sources) {
    for (const line of source.value.split('\n')) {
      const match = line.trim().match(/^(\d{4})\s*[-—]\s*(.+)$/);
      if (!match) continue;
      entries.push({
        year: Number(match[1]),
        text: match[2].trim(),
        category: source.category,
      });
    }
  }

  return entries.sort((a, b) => a.year - b.year);
}
