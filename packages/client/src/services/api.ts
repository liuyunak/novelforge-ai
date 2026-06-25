import type { PipelinePhase } from '../hooks/useSSE';

export interface Novel {
  id: number;
  title: string;
  genre: string;
  created_at: string;
}

export interface Chapter {
  id: number;
  novel_id: number;
  chapter_num: number;
  title: string;
  status: string;
  created_at: string;
  outline?: string;
  content?: string;
}

export interface FastAuditCheck {
  name: string;
  passed: boolean;
  details?: string;
}

export interface FastAuditResult {
  passed: boolean;
  score: number;
  checks: FastAuditCheck[];
}

export interface DeepAuditDimension {
  name: string;
  score: number;
  comment?: string;
}

export interface DeepAuditResult {
  overall_score: number;
  scores: DeepAuditDimension[];
  suggestions: string[];
}

export interface MemoryCharacter {
  name: string;
  role: string;
  description: string;
  personality_traits: string[];
  speaking_style: string;
  abilities: string[];
}

export interface MemoryChapter {
  num: number;
  title: string;
  summary: string;
  wordCount: number;
}

export interface MemoryForeshadowing {
  id: number;
  content: string;
  significance: string;
  plantedChapter: number;
  status: string;
}

export interface MemoryWorldSetting {
  cultivationSystem: string[];
  factions: string[];
  geography: string;
  volumeOutline: string;
  blockOutlines: any[];
  writingRules: string[];
  styleTemplates: any[];
}

export interface MemoryDetail {
  recentChapters: MemoryChapter[];
  characters: MemoryCharacter[];
  worldSetting: MemoryWorldSetting;
  foreshadowing: MemoryForeshadowing[];
}

export async function fetchNovels(): Promise<Novel[]> {
  const res = await fetch('/api/novels');
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch novels');
  return data.novels || [];
}

export async function fetchNovel(id: number): Promise<any> {
  const res = await fetch(`/api/novels/${id}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch novel');
  return data;
}

export async function fetchChapters(novelId: number): Promise<Chapter[]> {
  const res = await fetch(`/api/novels/${novelId}/chapters`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch chapters');
  return data.chapters || [];
}

export async function fetchMemoryDetail(novelId: number): Promise<MemoryDetail> {
  const res = await fetch(`/api/novels/${novelId}/memory/detail`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch memory detail');
  return data;
}

export async function checkHealth(): Promise<boolean> {
  try {
    const res = await fetch('/health');
    const text = await res.text();
    return text === 'OK';
  } catch {
    return false;
  }
}

export interface PipelineCallbacks {
  onPhase?: (phase: PipelinePhase, status: string) => void;
  onOutline?: (data: any) => void;
  onToken?: (chunk: string) => void;
  onAuditFast?: (data: FastAuditResult) => void;
  onAuditDeep?: (data: DeepAuditResult) => void;
  onDone?: (data: any) => void;
  onError?: (error: string) => void;
  onPipelineId?: (pipelineId: string) => void;
  onFallback?: () => void;
}

function parseEventData(data: string): any {
  try {
    return JSON.parse(data);
  } catch {
    return data;
  }
}

export function startPipeline(
  novelId: number,
  callbacks: PipelineCallbacks = {}
): { abort: () => void } {
  const controller = new AbortController();
  let buffer = '';

  fetch(`/api/novels/${novelId}/chapters/pipeline`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
    signal: controller.signal,
  })
    .then(async (response) => {
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const pid = response.headers.get('X-Pipeline-Id');
      if (pid) {
        callbacks.onPipelineId?.(pid);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('\n\n');
        buffer = events.pop() || '';

        for (const event of events) {
          const lines = event.split('\n');
          let eventName = 'message';
          let eventData = '';

          for (const line of lines) {
            if (line.startsWith('event: ')) {
              eventName = line.slice(7).trim();
            } else if (line.startsWith('data: ')) {
              eventData = line.slice(6).trim();
            }
          }

          if (!eventData) continue;

          const parsed = parseEventData(eventData);

          if (eventName === 'phase') {
            callbacks.onPhase?.(parsed.phase, parsed.status);
          } else if (eventName === 'outline') {
            callbacks.onOutline?.(parsed);
          } else if (eventName === 'token') {
            const chunk = typeof parsed === 'string' ? parsed : JSON.parse(eventData);
            callbacks.onToken?.(chunk);
          } else if (eventName === 'audit_fast') {
            callbacks.onAuditFast?.(parsed);
          } else if (eventName === 'audit_deep') {
            callbacks.onAuditDeep?.(parsed);
          } else if (eventName === 'done') {
            callbacks.onDone?.(parsed);
          } else if (eventName === 'fallback') {
            callbacks.onFallback?.();
          } else if (eventName === 'error') {
            callbacks.onError?.(parsed?.message || 'Unknown error');
          }
        }
      }
    })
    .catch((err) => {
      if (err.name !== 'AbortError') {
        callbacks.onError?.(err.message || 'Pipeline failed');
      }
    });

  return {
    abort: () => controller.abort(),
  };
}

export function approvePipeline(
  novelId: number,
  pipelineId: string,
  approved: boolean,
  callbacks: PipelineCallbacks = {}
): { abort: () => void } {
  const controller = new AbortController();
  let buffer = '';

  fetch(`/api/novels/${novelId}/chapters/pipeline/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pipeline_id: pipelineId, approved }),
    signal: controller.signal,
  })
    .then(async (response) => {
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const pid = response.headers.get('X-Pipeline-Id');
      if (pid) {
        callbacks.onPipelineId?.(pid);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('\n\n');
        buffer = events.pop() || '';

        for (const event of events) {
          const lines = event.split('\n');
          let eventName = 'message';
          let eventData = '';

          for (const line of lines) {
            if (line.startsWith('event: ')) {
              eventName = line.slice(7).trim();
            } else if (line.startsWith('data: ')) {
              eventData = line.slice(6).trim();
            }
          }

          if (!eventData) continue;

          const parsed = parseEventData(eventData);

          if (eventName === 'phase') {
            callbacks.onPhase?.(parsed.phase, parsed.status);
          } else if (eventName === 'token') {
            const chunk = typeof parsed === 'string' ? parsed : JSON.parse(eventData);
            callbacks.onToken?.(chunk);
          } else if (eventName === 'audit_fast') {
            callbacks.onAuditFast?.(parsed);
          } else if (eventName === 'audit_deep') {
            callbacks.onAuditDeep?.(parsed);
          } else if (eventName === 'done') {
            callbacks.onDone?.(parsed);
          } else if (eventName === 'fallback') {
            callbacks.onFallback?.();
          } else if (eventName === 'error') {
            callbacks.onError?.(parsed?.message || 'Unknown error');
          }
        }
      }
    })
    .catch((err) => {
      if (err.name !== 'AbortError') {
        callbacks.onError?.(err.message || 'Pipeline approve failed');
      }
    });

  return {
    abort: () => controller.abort(),
  };
}
