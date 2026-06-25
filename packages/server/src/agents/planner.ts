import { deepSeekClient } from '../ai/client.js';
import { plannerSystemPrompt } from './prompts/planner.js';
import { getDb } from '../db/index.js';

export interface ChapterOutline {
  title: string;
  summary: string;
  key_points: string[];
  cliffhanger: string;
}

export interface SceneCard {
  scene_id: number;
  location: string;
  time: string;
  characters: string[];
  summary: string;
  conflict: string;
  emotion_beat: string;
}

export interface PlannerResult {
  chapter_outline: ChapterOutline;
  scene_cards: SceneCard[];
}

export interface PlannerInput {
  novel_id: number;
  current_volume_outline?: string;
  current_block_outline?: string;
}

export async function planChapter(input: PlannerInput): Promise<PlannerResult> {
  const db = getDb();
  const novel = db.prepare('SELECT * FROM novels WHERE id = ?').get(input.novel_id) as any;

  if (!novel) {
    throw new Error(`Novel with id ${input.novel_id} not found`);
  }

  const worldSetting = JSON.parse(novel.world_setting);
  const characters = JSON.parse(novel.characters);

  const lastChapter = db.prepare(
    'SELECT * FROM chapters WHERE novel_id = ? ORDER BY chapter_num DESC LIMIT 1'
  ).get(input.novel_id) as any;

  const nextChapterNum = lastChapter ? lastChapter.chapter_num + 1 : 1;

  let userPrompt = `请为小说《${novel.title}》规划第 ${nextChapterNum} 章。

【小说类型】${novel.genre}

【世界观设定】
${JSON.stringify(worldSetting, null, 2)}

【主要角色】
${JSON.stringify(characters, null, 2)}

【风格要求】${novel.style_template || '无特殊要求'}

`;

  if (lastChapter) {
    const lastOutline = JSON.parse(lastChapter.outline || '{}');
    userPrompt += `【上一章信息】
章节：第${lastChapter.chapter_num}章 ${lastChapter.title}
章纲：${lastOutline.summary || '无'}
当前内容摘要：${lastChapter.content ? lastChapter.content.substring(0, 500) + '...' : '无'}

`;
  }

  if (input.current_volume_outline) {
    userPrompt += `【当前卷大纲】
${input.current_volume_outline}

`;
  }

  if (input.current_block_outline) {
    userPrompt += `【当前情节块大纲】
${input.current_block_outline}

`;
  }

  userPrompt += `请生成第 ${nextChapterNum} 章的详细大纲和场景卡。`;

  const result = await deepSeekClient.chat(
    [
      { role: 'system', content: plannerSystemPrompt },
      { role: 'user', content: userPrompt },
    ],
    'planner'
  );

  let parsed: PlannerResult;
  try {
    const jsonMatch = result.content.match(/```json\s*([\s\S]*?)\s*```/) || result.content.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[1] || jsonMatch[0] : result.content;
    parsed = JSON.parse(jsonStr);
  } catch (error) {
    console.error('Failed to parse planner response:', error);
    console.error('Raw response:', result.content);
    throw new Error('Failed to parse planner response');
  }

  return parsed;
}
