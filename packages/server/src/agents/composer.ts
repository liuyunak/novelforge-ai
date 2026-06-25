import {
  loadRecentChapters,
  loadCharacterProfiles,
  loadWorldSetting,
  loadStyleTemplate,
  type ChapterSummary,
  type CharacterProfile,
  type WorldSetting,
} from '../memory/full-text.js';
import type { ChapterOutline, SceneCard } from './planner.js';

const WRITING_RULES = `【写作铁律二十条】
1. 严格遵循世界观设定，不得出现设定矛盾
2. 保持角色性格一致，言行需符合人物设定
3. 每章必须有明确的核心冲突和推进
4. 章节结尾必须设置悬念或钩子
5. 对话要符合角色身份和性格
6. 场景描写要服务于情节和氛围
7. 避免大段背景介绍，采用穿插式叙事
8. 节奏张弛有度，战斗与日常交替
9. 善用伏笔，前后呼应
10. 避免上帝视角，采用第三人称限知
11. 感官描写要立体（视、听、嗅、味、触）
12. 情绪表达要通过动作和细节而非直接陈述
13. 关键情节需要铺垫，避免突兀
14. 配角也要有存在感和作用
15. 避免信息过载，每章聚焦1-2个核心事件
16. 打斗场面要有策略和战术，不是数值碾压
17. 感情发展要自然递进
18. 避免重复的句式和词汇
19. 合理使用成语和典故，提升文学性
20. 字数控制：每章3000-5000字`;

export interface ComposerInput {
  novel_id: number;
  chapter_outline: ChapterOutline;
  scene_cards: SceneCard[];
  recent_chapter_count?: number;
}

export interface ComposedPrompt {
  fullPrompt: string;
  staticPrefix: string;
  dynamicPart: string;
}

export function composeWritingPrompt(input: ComposerInput): ComposedPrompt {
  const { novel_id, chapter_outline, scene_cards } = input;
  const recentCount = input.recent_chapter_count || 3;

  const worldSetting = loadWorldSetting(novel_id);
  const characters = loadCharacterProfiles(novel_id);
  const styleTemplate = loadStyleTemplate(novel_id);
  const recentChapters = loadRecentChapters(novel_id, recentCount);

  const staticPrefix = buildStaticPrefix(worldSetting, characters, styleTemplate);
  const dynamicPart = buildDynamicPart(recentChapters, chapter_outline, scene_cards);

  const fullPrompt = `${staticPrefix}\n\n${dynamicPart}`;

  return {
    fullPrompt,
    staticPrefix,
    dynamicPart,
  };
}

function buildStaticPrefix(
  worldSetting: WorldSetting,
  characters: CharacterProfile[],
  styleTemplate: string
): string {
  let prefix = `${WRITING_RULES}\n\n`;

  prefix += `【风格指令】\n${styleTemplate || '无特殊风格要求'}\n\n`;

  prefix += `【世界观设定】\n`;
  for (const [key, value] of Object.entries(worldSetting)) {
    const label = formatKeyLabel(key);
    prefix += `${label}：${value}\n`;
  }
  prefix += '\n';

  prefix += `【角色档案】\n`;
  for (const char of characters) {
    prefix += `\n◆ ${char.name}（${char.role}）\n`;
    prefix += `  性格：${char.personality}\n`;
    prefix += `  背景：${char.background}\n`;
    prefix += `  外貌：${char.appearance}\n`;
    prefix += `  能力：${char.ability}\n`;
  }

  return prefix;
}

function buildDynamicPart(
  recentChapters: ChapterSummary[],
  chapterOutline: ChapterOutline,
  sceneCards: SceneCard[]
): string {
  let dynamic = `【最近章节摘要】\n`;
  if (recentChapters.length === 0) {
    dynamic += `（尚无已完成章节）\n`;
  } else {
    for (const chapter of recentChapters) {
      dynamic += `第${chapter.chapter_num}章 ${chapter.title}：${chapter.summary}\n`;
    }
  }
  dynamic += '\n';

  dynamic += `【当前章纲】\n`;
  dynamic += `标题：${chapterOutline.title}\n`;
  dynamic += `摘要：${chapterOutline.summary}\n`;
  dynamic += `关键点：\n`;
  for (const point of chapterOutline.key_points) {
    dynamic += `  - ${point}\n`;
  }
  dynamic += `结尾悬念：${chapterOutline.cliffhanger}\n\n`;

  dynamic += `【场景卡】\n`;
  for (const card of sceneCards) {
    dynamic += `\n场景 ${card.scene_id}：\n`;
    dynamic += `  地点：${card.location}\n`;
    dynamic += `  时间：${card.time}\n`;
    dynamic += `  出场角色：${card.characters.join('、')}\n`;
    dynamic += `  摘要：${card.summary}\n`;
    dynamic += `  核心冲突：${card.conflict}\n`;
    dynamic += `  情绪节奏：${card.emotion_beat}\n`;
  }

  dynamic += `\n【写作要求】\n请根据以上信息，撰写完整的一章正文内容。要求：\n1. 严格按照章纲和场景卡展开\n2. 保持角色性格一致\n3. 注意细节描写和氛围营造\n4. 字数不少于3000字\n5. 直接输出正文内容，不要有任何解释或说明`;

  return dynamic;
}

function formatKeyLabel(key: string): string {
  const labelMap: Record<string, string> = {
    world_name: '世界名称',
    era: '时代背景',
    power_system: '力量体系',
    geography: '地理格局',
    background: '整体背景',
  };
  return labelMap[key] || key;
}
