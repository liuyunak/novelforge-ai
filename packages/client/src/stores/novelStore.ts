import { create } from 'zustand';
import type { PipelinePhase } from '../services/api';
import type { Novel, Chapter, FastAuditResult, DeepAuditResult, MemoryDetail } from '../services/api';

interface NovelState {
  currentNovel: Novel | null;
  chapters: Chapter[];
  memoryDetail: MemoryDetail | null;
  pipelinePhase: PipelinePhase | null;
  pipelineId: string | null;
  outline: any | null;
  content: string;
  auditFast: FastAuditResult | null;
  auditDeep: DeepAuditResult | null;
  isStreaming: boolean;
  isFallbackMode: boolean;
  error: string | null;
  isGenerating: boolean;

  selectNovel: (novel: Novel | null) => void;
  setChapters: (chapters: Chapter[]) => void;
  addChapter: (chapter: Chapter) => void;
  setMemoryDetail: (detail: MemoryDetail | null) => void;
  setPipelinePhase: (phase: PipelinePhase | null) => void;
  setPipelineId: (id: string | null) => void;
  setOutline: (outline: any | null) => void;
  appendContent: (chunk: string) => void;
  setContent: (content: string) => void;
  setAuditFast: (result: FastAuditResult | null) => void;
  setAuditDeep: (result: DeepAuditResult | null) => void;
  setIsStreaming: (streaming: boolean) => void;
  setIsFallbackMode: (fallback: boolean) => void;
  setError: (error: string | null) => void;
  setIsGenerating: (generating: boolean) => void;
  resetPipeline: () => void;
}

export const useNovelStore = create<NovelState>((set) => ({
  currentNovel: null,
  chapters: [],
  memoryDetail: null,
  pipelinePhase: null,
  pipelineId: null,
  outline: null,
  content: '',
  auditFast: null,
  auditDeep: null,
  isStreaming: false,
  isFallbackMode: false,
  error: null,
  isGenerating: false,

  selectNovel: (novel) =>
    set({
      currentNovel: novel,
      chapters: [],
      memoryDetail: null,
      pipelinePhase: null,
      pipelineId: null,
      outline: null,
      content: '',
      auditFast: null,
      auditDeep: null,
      error: null,
    }),

  setChapters: (chapters) => set({ chapters }),

  addChapter: (chapter) =>
    set((state) => ({
      chapters: [...state.chapters, chapter],
    })),

  setMemoryDetail: (detail) => set({ memoryDetail: detail }),

  setPipelinePhase: (phase) => set({ pipelinePhase: phase }),

  setPipelineId: (id) => set({ pipelineId: id }),

  setOutline: (outline) => set({ outline: outline }),

  appendContent: (chunk) =>
    set((state) => ({ content: state.content + chunk })),

  setContent: (content) => set({ content }),

  setAuditFast: (result) => set({ auditFast: result }),

  setAuditDeep: (result) => set({ auditDeep: result }),

  setIsStreaming: (streaming) => set({ isStreaming: streaming }),

  setIsFallbackMode: (fallback) => set({ isFallbackMode: fallback }),

  setError: (error) => set({ error: error }),

  setIsGenerating: (generating) => set({ isGenerating: generating }),

  resetPipeline: () =>
    set({
      pipelinePhase: null,
      pipelineId: null,
      outline: null,
      content: '',
      auditFast: null,
      auditDeep: null,
      isStreaming: false,
      isFallbackMode: false,
      error: null,
      isGenerating: false,
    }),
}));
