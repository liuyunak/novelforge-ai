import { planChapter, type PlannerResult, type ChapterOutline, type SceneCard } from './agents/planner.js';
import { composeWritingPrompt } from './agents/composer.js';
import { streamWrite } from './agents/writer.js';
import { fastAudit, type FastAuditResult } from './agents/fast-audit.js';
import { deepAudit, type DeepAuditResult } from './agents/deep-audit.js';
import { loadWorldSetting, loadCharacterProfiles, loadStyleTemplate } from './memory/full-text.js';
import { getDb } from './db/index.js';
import {
  fallbackOutline,
  fallbackContent,
  fallbackFastAudit,
  fallbackDeepAudit,
  isAPIFailure,
} from './agents/fallback-responses.js';

export type PipelinePhase =
  | 'pending'
  | 'planning'
  | 'awaiting_approval'
  | 'composing'
  | 'writing'
  | 'fast_audit'
  | 'deep_audit'
  | 'done'
  | 'error';

export interface PipelineState {
  id: string;
  phase: PipelinePhase;
  novelId: number;
  outline?: PlannerResult;
  content?: string;
  fastAuditResult?: FastAuditResult;
  deepAuditResult?: DeepAuditResult;
  error?: string;
  totalTokens?: number;
  chapterId?: number;
  chapterNum?: number;
  createdAt: number;
}

export type SSEvent =
  | { type: 'phase'; phase: PipelinePhase; status?: string }
  | { type: 'outline'; data: PlannerResult }
  | { type: 'token'; data: string }
  | { type: 'audit_fast'; data: FastAuditResult }
  | { type: 'audit_deep'; data: DeepAuditResult }
  | { type: 'done'; data: any }
  | { type: 'fallback'; message: string }
  | { type: 'error'; message: string };

const pipelineStates = new Map<string, PipelineState>();

export function createPipeline(novelId: number): string {
  const pipelineId = `novel_${novelId}_${Date.now()}`;
  const state: PipelineState = {
    id: pipelineId,
    phase: 'pending',
    novelId,
    createdAt: Date.now(),
  };
  pipelineStates.set(pipelineId, state);
  return pipelineId;
}

export function getPipelineState(pipelineId: string): PipelineState | undefined {
  return pipelineStates.get(pipelineId);
}

export function updatePipelineState(pipelineId: string, updates: Partial<PipelineState>): void {
  const state = pipelineStates.get(pipelineId);
  if (state) {
    Object.assign(state, updates);
  }
}

export interface SSEWriter {
  sendEvent: (event: SSEvent) => void;
  close: () => void;
}

export function createSSEWriter(controller: ReadableStreamDefaultController<Uint8Array>): SSEWriter {
  const encoder = new TextEncoder();

  const sendEvent = (event: SSEvent) => {
    let dataStr: string;
    let eventName: string;

    switch (event.type) {
      case 'phase':
        eventName = 'phase';
        dataStr = JSON.stringify({ phase: event.phase, status: event.status || 'running' });
        break;
      case 'outline':
        eventName = 'outline';
        dataStr = JSON.stringify(event.data);
        break;
      case 'token':
        eventName = 'token';
        dataStr = JSON.stringify(event.data);
        break;
      case 'audit_fast':
        eventName = 'audit_fast';
        dataStr = JSON.stringify(event.data);
        break;
      case 'audit_deep':
        eventName = 'audit_deep';
        dataStr = JSON.stringify(event.data);
        break;
      case 'done':
        eventName = 'done';
        dataStr = JSON.stringify(event.data);
        break;
      case 'fallback':
        eventName = 'fallback';
        dataStr = JSON.stringify({ message: event.message });
        break;
      case 'error':
        eventName = 'error';
        dataStr = JSON.stringify({ message: event.message });
        break;
      default:
        return;
    }

    controller.enqueue(encoder.encode(`event: ${eventName}\n`));
    controller.enqueue(encoder.encode(`data: ${dataStr}\n\n`));
  };

  const close = () => {
    controller.close();
  };

  return { sendEvent, close };
}

export async function runPlanningPhase(
  pipelineId: string,
  writer: SSEWriter
): Promise<void> {
  const state = getPipelineState(pipelineId);
  if (!state) return;

  // Fast check: skip API call entirely if no API key or placeholder
  const apiKey = process.env.DEEPSEEK_API_KEY || '';
  if (!apiKey || apiKey === 'your-api-key-here' || apiKey === 'sk-xxx') {
    console.log('No valid API key configured, using fallback outline for demo');
    writer.sendEvent({ type: 'fallback', message: '使用演示数据（未配置 API Key）' });
    updatePipelineState(pipelineId, { outline: fallbackOutline, phase: 'awaiting_approval' });
    writer.sendEvent({ type: 'outline', data: fallbackOutline });
    writer.sendEvent({ type: 'phase', phase: 'awaiting_approval', status: 'waiting' });
    return;
  }

  try {
    updatePipelineState(pipelineId, { phase: 'planning' });
    writer.sendEvent({ type: 'phase', phase: 'planning', status: 'running' });

    const outline = await planChapter({ novel_id: state.novelId });

    updatePipelineState(pipelineId, { outline, phase: 'awaiting_approval' });
    writer.sendEvent({ type: 'outline', data: outline });
    writer.sendEvent({ type: 'phase', phase: 'awaiting_approval', status: 'waiting' });

  } catch (error: any) {
    console.error('Planning phase error:', error);
    // Use fallback outline for demo mode
    if (isAPIFailure(error)) {
      console.log('API failed, using fallback outline for demo');
      writer.sendEvent({ type: 'fallback', message: '使用演示数据' });
      updatePipelineState(pipelineId, { outline: fallbackOutline, phase: 'awaiting_approval' });
      writer.sendEvent({ type: 'outline', data: fallbackOutline });
      writer.sendEvent({ type: 'phase', phase: 'awaiting_approval', status: 'waiting' });
    } else {
      // Also use fallback for parse errors and other issues in demo mode
      console.log('Non-API error, using fallback outline for demo');
      writer.sendEvent({ type: 'fallback', message: '使用演示数据' });
      updatePipelineState(pipelineId, { outline: fallbackOutline, phase: 'awaiting_approval' });
      writer.sendEvent({ type: 'outline', data: fallbackOutline });
      writer.sendEvent({ type: 'phase', phase: 'awaiting_approval', status: 'waiting' });
    }
  }
}

export async function runPostApprovalPhases(
  pipelineId: string,
  writer: SSEWriter,
  approved: boolean
): Promise<void> {
  const state = getPipelineState(pipelineId);
  if (!state) {
    writer.sendEvent({ type: 'error', message: 'Pipeline not found' });
    return;
  }

  if (!approved) {
    updatePipelineState(pipelineId, { phase: 'error', error: 'User rejected outline' });
    writer.sendEvent({ type: 'phase', phase: 'error', status: 'rejected' });
    writer.sendEvent({ type: 'error', message: '用户拒绝了大纲' });
    return;
  }

  if (!state.outline) {
    updatePipelineState(pipelineId, { phase: 'error', error: 'No outline available' });
    writer.sendEvent({ type: 'error', message: '没有可用的大纲' });
    return;
  }

  const useFallback = state.outline === fallbackOutline;

  if (useFallback) {
    // Use fallback data for demo mode
    await runFallbackMode(pipelineId, writer, state);
  } else {
    // Use real API
    await runRealMode(pipelineId, writer, state);
  }
}

async function runFallbackMode(
  pipelineId: string,
  writer: SSEWriter,
  state: PipelineState
): Promise<void> {
  if (!state.outline) {
    writer.sendEvent({ type: 'error', message: '没有可用的大纲' });
    return;
  }
  const chapterOutline = state.outline.chapter_outline as ChapterOutline;
  const sceneCards = state.outline.scene_cards as SceneCard[];

  // Phase: composing
  updatePipelineState(pipelineId, { phase: 'composing' });
  writer.sendEvent({ type: 'phase', phase: 'composing', status: 'running' });

  // Phase: writing (stream fallback content with delay to simulate API)
  updatePipelineState(pipelineId, { phase: 'writing' });
  writer.sendEvent({ type: 'phase', phase: 'writing', status: 'running' });

  const db = getDb();
  const lastChapter = db.prepare(
    'SELECT chapter_num FROM chapters WHERE novel_id = ? ORDER BY chapter_num DESC LIMIT 1'
  ).get(state.novelId) as any;
  const nextChapterNum = lastChapter ? lastChapter.chapter_num + 1 : 1;

  // Simulate streaming content
  const content = fallbackContent;
  const chunkSize = 50;
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  for (let i = 0; i < content.length; i += chunkSize) {
    const chunk = content.slice(i, i + chunkSize);
    writer.sendEvent({ type: 'token', data: chunk });
    await delay(20); // Simulate network latency
  }

  const tokenCount = Math.ceil(content.length / 2);
  updatePipelineState(pipelineId, { content, totalTokens: tokenCount });

  const insertResult = db.prepare(`
    INSERT INTO chapters (novel_id, chapter_num, title, outline, content, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    state.novelId,
    nextChapterNum,
    chapterOutline.title || `第${nextChapterNum}章`,
    JSON.stringify({
      ...chapterOutline,
      scene_cards: sceneCards,
    }),
    content,
    'draft'
  );

  const chapterId = Number(insertResult.lastInsertRowid);
  updatePipelineState(pipelineId, { chapterId, chapterNum: nextChapterNum });

  // Phase: fast_audit
  updatePipelineState(pipelineId, { phase: 'fast_audit' });
  writer.sendEvent({ type: 'phase', phase: 'fast_audit', status: 'running' });

  const fastResult = fallbackFastAudit;
  db.prepare(`UPDATE chapters SET audit_report = ? WHERE id = ?`).run(JSON.stringify(fastResult), chapterId);
  updatePipelineState(pipelineId, { fastAuditResult: fastResult });
  writer.sendEvent({ type: 'audit_fast', data: fastResult });

  // Phase: deep_audit
  updatePipelineState(pipelineId, { phase: 'deep_audit' });
  writer.sendEvent({ type: 'phase', phase: 'deep_audit', status: 'running' });

  const deepResult = fallbackDeepAudit;
  updatePipelineState(pipelineId, { deepAuditResult: deepResult });
  writer.sendEvent({ type: 'audit_deep', data: deepResult });

  // Done
  updatePipelineState(pipelineId, { phase: 'done' });
  writer.sendEvent({
    type: 'done',
    data: {
      pipeline_id: pipelineId,
      chapter_id: chapterId,
      chapter_num: nextChapterNum,
      total_tokens: tokenCount,
      fast_audit_score: fastResult.score,
      deep_audit_score: deepResult.overall_score,
    },
  });
}

async function runRealMode(
  pipelineId: string,
  writer: SSEWriter,
  state: PipelineState
): Promise<void> {
  if (!state.outline) {
    writer.sendEvent({ type: 'error', message: '没有可用的大纲' });
    return;
  }

  try {
    updatePipelineState(pipelineId, { phase: 'composing' });
    writer.sendEvent({ type: 'phase', phase: 'composing', status: 'running' });

    const chapterOutline = state.outline.chapter_outline as ChapterOutline;
    const sceneCards = state.outline.scene_cards as SceneCard[];

    const composed = composeWritingPrompt({
      novel_id: state.novelId,
      chapter_outline: chapterOutline,
      scene_cards: sceneCards,
      recent_chapter_count: 3,
    });

    updatePipelineState(pipelineId, { phase: 'writing' });
    writer.sendEvent({ type: 'phase', phase: 'writing', status: 'running' });

    const stream = await streamWrite({
      assembledPrompt: composed.fullPrompt,
      temperature: 0.8,
      maxTokens: 4000,
      topP: 0.9,
    });

    let fullContent = '';
    let tokenCount = 0;
    const reader = stream.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = typeof value === 'string' ? value : decoder.decode(value);
      fullContent += chunk;
      tokenCount += Math.ceil(chunk.length / 2);

      writer.sendEvent({ type: 'token', data: chunk });
    }

    updatePipelineState(pipelineId, { content: fullContent, totalTokens: tokenCount });

    const db = getDb();
    const lastChapter = db.prepare(
      'SELECT chapter_num FROM chapters WHERE novel_id = ? ORDER BY chapter_num DESC LIMIT 1'
    ).get(state.novelId) as any;
    const nextChapterNum = lastChapter ? lastChapter.chapter_num + 1 : 1;

    const insertResult = db.prepare(`
      INSERT INTO chapters (novel_id, chapter_num, title, outline, content, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      state.novelId,
      nextChapterNum,
      chapterOutline.title || `第${nextChapterNum}章`,
      JSON.stringify({
        ...chapterOutline,
        scene_cards: sceneCards,
      }),
      fullContent,
      'draft'
    );

    const chapterId = Number(insertResult.lastInsertRowid);
    updatePipelineState(pipelineId, { chapterId, chapterNum: nextChapterNum });

    updatePipelineState(pipelineId, { phase: 'fast_audit' });
    writer.sendEvent({ type: 'phase', phase: 'fast_audit', status: 'running' });

    const fastResult = fastAudit({
      content: fullContent,
      novel_id: state.novelId,
    });

    db.prepare(`
      UPDATE chapters SET audit_report = ? WHERE id = ?
    `).run(JSON.stringify(fastResult), chapterId);

    updatePipelineState(pipelineId, { fastAuditResult: fastResult });
    writer.sendEvent({ type: 'audit_fast', data: fastResult });

    updatePipelineState(pipelineId, { phase: 'deep_audit' });
    writer.sendEvent({ type: 'phase', phase: 'deep_audit', status: 'running' });

    const worldSetting = loadWorldSetting(state.novelId);
    const characters = loadCharacterProfiles(state.novelId);
    const styleTemplate = loadStyleTemplate(state.novelId);

    const deepResult = await deepAudit({
      content: fullContent,
      worldSetting,
      characterProfiles: characters,
      styleTemplate,
    });

    updatePipelineState(pipelineId, { deepAuditResult: deepResult });
    writer.sendEvent({ type: 'audit_deep', data: deepResult });

    updatePipelineState(pipelineId, { phase: 'done' });
    writer.sendEvent({
      type: 'done',
      data: {
        pipeline_id: pipelineId,
        chapter_id: chapterId,
        chapter_num: nextChapterNum,
        total_tokens: tokenCount,
        fast_audit_score: fastResult.score,
        deep_audit_score: deepResult.overall_score,
      },
    });

  } catch (error: any) {
    console.error('Post-approval pipeline error:', error);
    updatePipelineState(pipelineId, { phase: 'error', error: error.message });
    writer.sendEvent({ type: 'error', message: error.message || 'Pipeline failed' });
  }
}
