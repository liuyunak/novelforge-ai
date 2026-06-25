import { getDb } from '../db/index.js';

export interface ChapterSummary {
  id: number;
  chapter_num: number;
  title: string;
  summary: string;
}

export interface CharacterProfile {
  id: number;
  name: string;
  role: string;
  personality: string;
  background: string;
  appearance: string;
  ability: string;
}

export interface WorldSetting {
  world_name?: string;
  era?: string;
  power_system?: string;
  geography?: string;
  background?: string;
  [key: string]: any;
}

export function loadRecentChapters(novelId: number, count: number = 5): ChapterSummary[] {
  const db = getDb();
  const chapters = db.prepare(`
    SELECT id, chapter_num, title, outline
    FROM chapters
    WHERE novel_id = ? AND status != 'draft'
    ORDER BY chapter_num DESC
    LIMIT ?
  `).all(novelId, count) as any[];

  return chapters.map(chapter => {
    let summary = '';
    try {
      const outline = JSON.parse(chapter.outline || '{}');
      summary = outline.summary || '';
    } catch {
      summary = '';
    }
    return {
      id: chapter.id,
      chapter_num: chapter.chapter_num,
      title: chapter.title,
      summary,
    };
  }).reverse();
}

export function loadCharacterProfiles(novelId: number): CharacterProfile[] {
  const db = getDb();
  const novel = db.prepare('SELECT characters FROM novels WHERE id = ?').get(novelId) as any;

  if (!novel) {
    return [];
  }

  try {
    return JSON.parse(novel.characters || '[]');
  } catch {
    return [];
  }
}

export function loadWorldSetting(novelId: number): WorldSetting {
  const db = getDb();
  const novel = db.prepare('SELECT world_setting FROM novels WHERE id = ?').get(novelId) as any;

  if (!novel) {
    return {};
  }

  try {
    return JSON.parse(novel.world_setting || '{}');
  } catch {
    return {};
  }
}

export function loadStyleTemplate(novelId: number): string {
  const db = getDb();
  const novel = db.prepare('SELECT style_template FROM novels WHERE id = ?').get(novelId) as any;
  return novel?.style_template || '';
}
