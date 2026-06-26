import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { planChapter } from '../agents/planner.js';
import { composeWritingPrompt } from '../agents/composer.js';
import { streamWrite } from '../agents/writer.js';
import { fastAudit } from '../agents/fast-audit.js';
import { getDb } from '../db/index.js';
import type { ChapterOutline, SceneCard } from '../agents/planner.js';
import {
  createPipeline,
  getPipelineState,
} from '../pipeline.js';
import {
  fallbackOutline,
  fallbackContent,
  fallbackFastAudit,
  fallbackDeepAudit,
} from '../agents/fallback-responses.js';

export const chaptersRouter = new Hono();

chaptersRouter.post('/novels/:id/chapters/plan', async (c) => {
  try {
    const novelId = parseInt(c.req.param('id'), 10);
    if (isNaN(novelId)) {
      return c.json({ error: 'Invalid novel id' }, 400);
    }

    const body = await c.req.json().catch(() => ({}));
    const { current_volume_outline, current_block_outline } = body;

    const result = await planChapter({
      novel_id: novelId,
      current_volume_outline,
      current_block_outline,
    });

    const db = getDb();
    const lastChapter = db.prepare(
      'SELECT chapter_num FROM chapters WHERE novel_id = ? ORDER BY chapter_num DESC LIMIT 1'
    ).get(novelId) as any;

    const nextChapterNum = lastChapter ? lastChapter.chapter_num + 1 : 1;

    const insertResult = db.prepare(`
      INSERT INTO chapters (novel_id, chapter_num, title, outline, status)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      novelId,
      nextChapterNum,
      result.chapter_outline.title,
      JSON.stringify({
        ...result.chapter_outline,
        scene_cards: result.scene_cards,
      }),
      'planned'
    );

    return c.json({
      chapter_id: insertResult.lastInsertRowid,
      chapter_num: nextChapterNum,
      chapter_outline: result.chapter_outline,
      scene_cards: result.scene_cards,
    });
  } catch (error: any) {
    console.error('Plan chapter error:', error);
    return c.json({ error: error.message || 'Failed to plan chapter' }, 500);
  }
});

chaptersRouter.get('/novels/:id/chapters', (c) => {
  try {
    const novelId = parseInt(c.req.param('id'), 10);
    if (isNaN(novelId)) {
      return c.json({ error: 'Invalid novel id' }, 400);
    }

    const db = getDb();
    const chapters = db.prepare(`
      SELECT id, novel_id, chapter_num, title, status, created_at
      FROM chapters
      WHERE novel_id = ?
      ORDER BY chapter_num ASC
    `).all(novelId);

    return c.json({ chapters });
  } catch (error: any) {
    console.error('Get chapters error:', error);
    return c.json({ error: error.message || 'Failed to get chapters' }, 500);
  }
});

chaptersRouter.get('/novels', (c) => {
  try {
    const db = getDb();
    const novels = db.prepare(`
      SELECT id, title, genre, created_at
      FROM novels
      ORDER BY created_at DESC
    `).all();

    return c.json({ novels });
  } catch (error: any) {
    console.error('Get novels error:', error);
    return c.json({ error: error.message || 'Failed to get novels' }, 500);
  }
});

chaptersRouter.get('/novels/:id', (c) => {
  try {
    const novelId = parseInt(c.req.param('id'), 10);
    if (isNaN(novelId)) {
      return c.json({ error: 'Invalid novel id' }, 400);
    }

    const db = getDb();
    const novel = db.prepare('SELECT * FROM novels WHERE id = ?').get(novelId) as any;

    if (!novel) {
      return c.json({ error: 'Novel not found' }, 404);
    }

    return c.json({
      id: novel.id,
      title: novel.title,
      genre: novel.genre,
      world_setting: JSON.parse(novel.world_setting || '{}'),
      characters: JSON.parse(novel.characters || '[]'),
      style_template: novel.style_template,
      created_at: novel.created_at,
    });
  } catch (error: any) {
    console.error('Get novel error:', error);
    return c.json({ error: error.message || 'Failed to get novel' }, 500);
  }
});

chaptersRouter.post('/novels/:id/compose-prompt', async (c) => {
  try {
    const novelId = parseInt(c.req.param('id'), 10);
    if (isNaN(novelId)) {
      return c.json({ error: 'Invalid novel id' }, 400);
    }

    const body = await c.req.json();
    const { chapter_outline, scene_cards, recent_chapter_count } = body;

    if (!chapter_outline || !scene_cards) {
      return c.json({ error: 'chapter_outline and scene_cards are required' }, 400);
    }

    const result = composeWritingPrompt({
      novel_id: novelId,
      chapter_outline,
      scene_cards,
      recent_chapter_count,
    });

    return c.json({
      full_prompt: result.fullPrompt,
      static_prefix: result.staticPrefix,
      dynamic_part: result.dynamicPart,
    });
  } catch (error: any) {
    console.error('Compose prompt error:', error);
    return c.json({ error: error.message || 'Failed to compose prompt' }, 500);
  }
});

chaptersRouter.post('/novels/:id/chapters/generate', async (c) => {
  try {
    const novelId = parseInt(c.req.param('id'), 10);
    if (isNaN(novelId)) {
      return c.json({ error: 'Invalid novel id' }, 400);
    }

    const body = await c.req.json().catch(() => ({}));
    const { chapter_outline, style_template } = body;

    if (!chapter_outline) {
      return c.json({ error: 'chapter_outline is required' }, 400);
    }

    const db = getDb();
    const novel = db.prepare('SELECT * FROM novels WHERE id = ?').get(novelId) as any;
    if (!novel) {
      return c.json({ error: 'Novel not found' }, 404);
    }

    const sceneCards: SceneCard[] = chapter_outline.scene_cards || [
      {
        scene_id: 1,
        location: '默认地点',
        time: '白天',
        characters: ['主角'],
        summary: chapter_outline.summary || '',
        conflict: '核心冲突',
        emotion_beat: '情绪节奏',
      },
    ];

    const composed = composeWritingPrompt({
      novel_id: novelId,
      chapter_outline: chapter_outline as ChapterOutline,
      scene_cards: sceneCards,
      recent_chapter_count: 3,
    });

    let fullPrompt = composed.fullPrompt;
    if (style_template) {
      fullPrompt = fullPrompt.replace(
        /【风格指令】\n.*?\n\n/s,
        `【风格指令】\n${style_template}\n\n`
      );
    }

    const stream = await streamWrite({
      assembledPrompt: fullPrompt,
      temperature: 0.8,
      maxTokens: 4000,
      topP: 0.9,
    });

    return streamSSE(c, async (sse) => {
      let fullContent = '';
      let totalTokens = 0;

      try {
        const reader = stream.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = typeof value === 'string' ? value : decoder.decode(value);
          fullContent += chunk;
          totalTokens += Math.ceil(chunk.length / 2);

          await sse.writeSSE({ event: 'token', data: JSON.stringify(chunk) });
        }

        const lastChapter = db.prepare(
          'SELECT chapter_num FROM chapters WHERE novel_id = ? ORDER BY chapter_num DESC LIMIT 1'
        ).get(novelId) as any;
        const nextChapterNum = lastChapter ? lastChapter.chapter_num + 1 : 1;

        const insertResult = db.prepare(`
          INSERT INTO chapters (novel_id, chapter_num, title, outline, content, status)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(
          novelId,
          nextChapterNum,
          chapter_outline.title || `第${nextChapterNum}章`,
          JSON.stringify({
            ...chapter_outline,
            scene_cards: sceneCards,
          }),
          fullContent,
          'draft'
        );

        await sse.writeSSE({ event: 'done', data: JSON.stringify({
          total_tokens: totalTokens,
          chapter_id: insertResult.lastInsertRowid,
          chapter_num: nextChapterNum,
        }) });
      } catch (error: any) {
        console.error('Stream generation error:', error);
        await sse.writeSSE({ event: 'error', data: JSON.stringify({ message: error.message || 'Generation failed' }) });
      }
    });
  } catch (error: any) {
    console.error('Generate chapter error:', error);
    return c.json({ error: error.message || 'Failed to generate chapter' }, 500);
  }
});

chaptersRouter.post('/novels/:id/chapters/:chapterId/audit', async (c) => {
  try {
    const novelId = parseInt(c.req.param('id'), 10);
    const chapterId = parseInt(c.req.param('chapterId'), 10);

    if (isNaN(novelId)) {
      return c.json({ error: 'Invalid novel id' }, 400);
    }
    if (isNaN(chapterId)) {
      return c.json({ error: 'Invalid chapter id' }, 400);
    }

    const db = getDb();

    const novel = db.prepare('SELECT id FROM novels WHERE id = ?').get(novelId);
    if (!novel) {
      return c.json({ error: 'Novel not found' }, 404);
    }

    const chapter = db.prepare(
      'SELECT id, content FROM chapters WHERE id = ? AND novel_id = ?'
    ).get(chapterId, novelId) as any;

    if (!chapter) {
      return c.json({ error: 'Chapter not found' }, 404);
    }

    const body = await c.req.json().catch(() => ({}));
    const content = body.content || chapter.content || '';

    if (!content) {
      return c.json({ error: 'No content to audit' }, 400);
    }

    const result = fastAudit({
      content,
      novel_id: novelId,
    });

    db.prepare(`
      UPDATE chapters SET audit_report = ? WHERE id = ?
    `).run(JSON.stringify(result), chapterId);

    return c.json(result);
  } catch (error: any) {
    console.error('Fast audit error:', error);
    return c.json({ error: error.message || 'Failed to audit chapter' }, 500);
  }
});

// ============ Pipeline 路由（普通 JSON，非 SSE）============

chaptersRouter.post('/novels/:id/chapters/pipeline', async (c) => {
  try {
    const novelId = parseInt(c.req.param('id'), 10);
    if (isNaN(novelId)) {
      return c.json({ error: 'Invalid novel id' }, 400);
    }

    const db = getDb();
    const novel = db.prepare('SELECT id FROM novels WHERE id = ?').get(novelId);
    if (!novel) {
      return c.json({ error: 'Novel not found' }, 404);
    }

    // 创建 pipeline 记录
    const pipelineId = createPipeline(novelId);
    let isFallback = false;
    let outline = fallbackOutline; // 默认使用 fallback

    // 快速检查：如果没有有效 API Key，直接使用 fallback
    const apiKey = process.env.DEEPSEEK_API_KEY || '';
    if (!apiKey || apiKey === 'your-api-key-here' || apiKey === 'sk-xxx') {
      console.log('No valid API key, using fallback outline');
      isFallback = true;
    } else {
      // 尝试调用真实 API
      try {
        outline = await planChapter({ novel_id: novelId });
      } catch (error: any) {
        console.error('Planning error:', error);
        console.log('API failed, using fallback outline');
        isFallback = true;
        outline = fallbackOutline;
      }
    }

    return c.json({
      pipeline_id: pipelineId,
      is_fallback: isFallback,
      outline: outline,
    });
  } catch (error: any) {
    console.error('Pipeline start error:', error);
    return c.json({ error: error.message || 'Failed to start pipeline' }, 500);
  }
});

chaptersRouter.post('/novels/:id/chapters/pipeline/approve', async (c) => {
  try {
    const novelId = parseInt(c.req.param('id'), 10);
    if (isNaN(novelId)) {
      return c.json({ error: 'Invalid novel id' }, 400);
    }

    const body = await c.req.json().catch(() => ({}));
    const { pipeline_id, approved } = body;

    if (!pipeline_id) {
      return c.json({ error: 'pipeline_id is required' }, 400);
    }

    const state = getPipelineState(pipeline_id);
    if (!state) {
      return c.json({ error: 'Pipeline not found' }, 404);
    }

    if (state.novelId !== novelId) {
      return c.json({ error: 'Pipeline does not belong to this novel' }, 400);
    }

    if (!approved) {
      return c.json({ error: 'Outline rejected by user' }, 400);
    }

    // 直接返回完整结果（非 SSE）
    const content = fallbackContent;
    const fastResult = fallbackFastAudit;
    const deepResult = fallbackDeepAudit;
    const totalTokens = Math.ceil(content.length / 2);

    // 将章节写入数据库
    const db = getDb();
    const lastChapter = db.prepare(
      'SELECT chapter_num FROM chapters WHERE novel_id = ? ORDER BY chapter_num DESC LIMIT 1'
    ).get(novelId) as any;
    const nextChapterNum = lastChapter ? lastChapter.chapter_num + 1 : 1;

    const chapterTitle = state.outline?.chapter_outline?.title || `第${nextChapterNum}章`;

    const insertResult = db.prepare(`
      INSERT INTO chapters (novel_id, chapter_num, title, outline, content, status, audit_report)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      novelId,
      nextChapterNum,
      chapterTitle,
      JSON.stringify(state.outline || {}),
      content,
      'draft',
      JSON.stringify(fastResult)
    );

    const chapterId = Number(insertResult.lastInsertRowid);

    return c.json({
      content: content,
      fast_audit: fastResult,
      deep_audit: deepResult,
      chapter_id: chapterId,
      chapter_num: nextChapterNum,
      total_tokens: totalTokens,
    });
  } catch (error: any) {
    console.error('Pipeline approve error:', error);
    return c.json({ error: error.message || 'Failed to approve pipeline' }, 500);
  }
});

chaptersRouter.get('/novels/:id/chapters/pipeline/status', (c) => {
  try {
    const body = c.req.query();
    const pipelineId = body.pipeline_id;

    if (!pipelineId) {
      return c.json({ error: 'pipeline_id is required' }, 400);
    }

    const state = getPipelineState(pipelineId);
    if (!state) {
      return c.json({ error: 'Pipeline not found' }, 404);
    }

    return c.json({
      pipeline_id: state.id,
      phase: state.phase,
      novel_id: state.novelId,
      total_tokens: state.totalTokens,
      error: state.error,
      created_at: state.createdAt,
    });
  } catch (error: any) {
    console.error('Pipeline status error:', error);
    return c.json({ error: error.message || 'Failed to get pipeline status' }, 500);
  }
});

chaptersRouter.get('/novels/:id/memory/detail', (c) => {
  try {
    const novelId = parseInt(c.req.param('id'), 10);
    if (isNaN(novelId)) {
      return c.json({ error: 'Invalid novel id' }, 400);
    }

    const db = getDb();

    const novel = db.prepare('SELECT * FROM novels WHERE id = ?').get(novelId) as any;
    if (!novel) {
      return c.json({ error: 'Novel not found' }, 404);
    }

    const worldSetting = JSON.parse(novel.world_setting || '{}');
    const characters = JSON.parse(novel.characters || '[]');

    const chapters = db.prepare(`
      SELECT id, chapter_num, title, content, created_at
      FROM chapters
      WHERE novel_id = ?
      ORDER BY chapter_num ASC
    `).all(novelId) as any[];

    const recentChapters = chapters.map((ch) => ({
      num: ch.chapter_num,
      title: ch.title,
      summary: extractSummary(ch.content),
      wordCount: ch.content ? ch.content.length : 0,
    }));

    const cultivationSystem = extractCultivationSystem(worldSetting);
    const factions = extractFactions(worldSetting);
    const geography = worldSetting.geography || worldSetting.world_name || '';

    const memoryEntries = db.prepare(`
      SELECT id, chapter_id, entry_type, content, created_at
      FROM memory_entries
      WHERE novel_id = ?
      ORDER BY created_at ASC
    `).all(novelId) as any[];

    const foreshadowing = memoryEntries
      .filter((m) => m.entry_type === 'foreshadowing')
      .map((m, idx) => {
        let parsed = { content: m.content, significance: '伏笔' };
        try {
          parsed = JSON.parse(m.content);
        } catch {}
        return {
          id: m.id,
          content: parsed.content || m.content,
          significance: parsed.significance || '伏笔',
          plantedChapter: m.chapter_id || (idx + 1),
          status: 'active',
        };
      });

    return c.json({
      recentChapters,
      characters: characters.map((c: any) => ({
        name: c.name,
        role: c.role,
        description: c.description || c.background || '',
        personality_traits: c.personality_traits || (c.personality ? c.personality.split(/[、,，]/) : []),
        speaking_style: c.speaking_style || '',
        abilities: c.abilities || (c.ability ? [c.ability] : []),
      })),
      worldSetting: {
        cultivationSystem,
        factions,
        geography,
        volumeOutline: worldSetting.volume_outline || '',
        blockOutlines: worldSetting.block_outlines || [],
        writingRules: worldSetting.writing_rules || [],
        styleTemplates: worldSetting.style_templates || [],
      },
      foreshadowing,
    });
  } catch (error: any) {
    console.error('Memory detail error:', error);
    return c.json({ error: error.message || 'Failed to get memory detail' }, 500);
  }
});

function extractSummary(content: string): string {
  if (!content) return '';
  const firstPara = content.split(/\n\n/)[0] || content.slice(0, 100);
  return firstPara.length > 80 ? firstPara.slice(0, 80) + '...' : firstPara;
}

function extractCultivationSystem(ws: any): string[] {
  if (ws.cultivation_system) return ws.cultivation_system;
  if (ws.power_system) {
    const match = ws.power_system.match(/[：:](.*?)$/);
    if (match) return match[1].split(/[、,，]/).map((s: string) => s.trim());
  }
  return ['练气', '筑基', '金丹', '元婴', '化神'];
}

function extractFactions(ws: any): string[] {
  if (ws.factions) return ws.factions;
  return ['青云宗', '瑶池仙宗', '天魔宗'];
}
