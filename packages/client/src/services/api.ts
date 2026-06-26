// Pipeline 阶段类型（从前端本地定义，不再依赖 useSSE）
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
  scores: Record<string, number> | DeepAuditDimension[];
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

// ============ Pipeline API（普通 JSON，非 SSE）============

/** 启动 pipeline，返回 JSON 结果 */
export async function startPipeline(novelId: number): Promise<{
  pipeline_id: string;
  is_fallback: boolean;
  outline: any;
}> {
  const res = await fetch(`/api/novels/${novelId}/chapters/pipeline`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to start pipeline');
  return data;
}

/** 批准 pipeline，返回完整章节内容与审计结果 */
export async function approvePipeline(novelId: number, pipelineId: string): Promise<{
  content: string;
  fast_audit: FastAuditResult;
  deep_audit: DeepAuditResult;
  chapter_id: number;
  chapter_num: number;
  total_tokens: number;
}> {
  const res = await fetch(`/api/novels/${novelId}/chapters/pipeline/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pipeline_id: pipelineId, approved: true }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to approve pipeline');
  return data;
}
