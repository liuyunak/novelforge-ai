import { useState, useEffect, useRef, useCallback } from 'react';
import { useNovelStore } from '../stores/novelStore';
import { PipelineProgress } from './PipelineProgress';
import { OutlinePanel } from './OutlinePanel';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { startPipeline, approvePipeline } from '../services/api';
import type { PipelinePhase } from '../hooks/useSSE';

export function EditorPanel() {
  const {
    currentNovel,
    pipelinePhase,
    pipelineId,
    outline,
    content,
    isGenerating,
    isFallbackMode,
    error,
    setPipelinePhase,
    setPipelineId,
    setOutline,
    appendContent,
    setContent,
    setAuditFast,
    setAuditDeep,
    setIsGenerating,
    setIsFallbackMode,
    setError,
    resetPipeline,
    addChapter,
  } = useNovelStore();

  const contentRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<{ abort: () => void } | null>(null);
  const [isApproving, setIsApproving] = useState(false);
  const [displayContent, setDisplayContent] = useState('');
  const contentBufferRef = useRef('');
  const animationFrameRef = useRef<number | null>(null);

  const handleStartPipeline = useCallback(() => {
    if (!currentNovel || isGenerating) return;

    resetPipeline();
    setIsGenerating(true);

    abortRef.current = startPipeline(currentNovel.id, {
      onPhase: (phase: PipelinePhase, status: string) => {
        setPipelinePhase(phase);
      },
      onOutline: (data: any) => {
        setOutline(data);
      },
      onToken: (chunk: string) => {
        appendContent(chunk);
      },
      onAuditFast: (data: any) => {
        setAuditFast(data);
      },
      onAuditDeep: (data: any) => {
        setAuditDeep(data);
      },
      onError: (err: string) => {
        setError(err);
        setIsGenerating(false);
      },
      onPipelineId: (pid: string) => {
        setPipelineId(pid);
      },
      onFallback: () => {
        setIsFallbackMode(true);
      },
      onDone: (data: any) => {
        setIsGenerating(false);
      },
    });
  }, [
    currentNovel,
    isGenerating,
    resetPipeline,
    setIsGenerating,
    setPipelinePhase,
    setOutline,
    setError,
    setPipelineId,
    setIsFallbackMode,
  ]);

  const handleApprove = useCallback(() => {
    if (!currentNovel || !pipelineId || isApproving) return;

    setIsApproving(true);
    setContent('');
    setDisplayContent('');

    abortRef.current = approvePipeline(currentNovel.id, pipelineId, true, {
      onPhase: (phase: PipelinePhase, status: string) => {
        setPipelinePhase(phase);
      },
      onToken: (chunk: string) => {
        appendContent(chunk);
      },
      onAuditFast: (data: any) => {
        setAuditFast(data);
      },
      onAuditDeep: (data: any) => {
        setAuditDeep(data);
      },
      onError: (err: string) => {
        setError(err);
        setIsGenerating(false);
        setIsApproving(false);
      },
      onFallback: () => {
        setIsFallbackMode(true);
      },
      onDone: (data: any) => {
        setIsGenerating(false);
        setIsApproving(false);
        if (data.chapter_id && data.chapter_num) {
          addChapter({
            id: data.chapter_id,
            novel_id: currentNovel.id,
            chapter_num: data.chapter_num,
            title: outline?.chapter_outline?.title || `第${data.chapter_num}章`,
            status: 'draft',
            created_at: new Date().toISOString(),
          });
        }
      },
    });
  }, [
    currentNovel,
    pipelineId,
    isApproving,
    setContent,
    setPipelinePhase,
    appendContent,
    setAuditFast,
    setAuditDeep,
    setError,
    setIsGenerating,
    setIsFallbackMode,
    addChapter,
    outline,
  ]);

  const handleStop = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setIsGenerating(false);
    setIsApproving(false);
  }, [setIsGenerating]);

  useEffect(() => {
    if (pipelinePhase === 'writing' && contentBufferRef.current !== content) {
      contentBufferRef.current = content;
    }
  }, [content, pipelinePhase]);

  useEffect(() => {
    if (pipelinePhase === 'writing') {
      const updateDisplay = () => {
        setDisplayContent((prev) => {
          const remaining = content.slice(prev.length);
          if (remaining.length === 0) {
            animationFrameRef.current = requestAnimationFrame(updateDisplay);
            return prev;
          }
          const charsToAdd = Math.ceil(remaining.length / 3) + 1;
          const next = prev + remaining.slice(0, charsToAdd);
          if (next.length < content.length) {
            animationFrameRef.current = requestAnimationFrame(updateDisplay);
          }
          return next;
        });
      };
      animationFrameRef.current = requestAnimationFrame(updateDisplay);
      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    } else {
      setDisplayContent(content);
    }
  }, [content, pipelinePhase]);

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [displayContent]);

  useEffect(() => {
    const handleStartEvent = () => {
      handleStartPipeline();
    };
    window.addEventListener('start-pipeline', handleStartEvent);
    return () => {
      window.removeEventListener('start-pipeline', handleStartEvent);
      if (abortRef.current) {
        abortRef.current.abort();
      }
    };
  }, [handleStartPipeline]);

  const wordCount = displayContent.replace(/\s/g, '').length;

  const renderContent = () => {
    if (error) {
      return (
        <div className="text-danger text-center py-8">
          <p className="font-medium mb-2">生成出错</p>
          <p className="text-sm text-gray-400">{error}</p>
        </div>
      );
    }

    if (!pipelinePhase || pipelinePhase === 'pending') {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center">
          <div className="w-16 h-16 bg-dark-elevated rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </div>
          <p className="text-gray-400 mb-2">点击"生成下一章"开始创作</p>
          <p className="text-gray-600 text-sm">AI 将自动完成大纲、写作和审计</p>
        </div>
      );
    }

    if (pipelinePhase === 'planning') {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center">
          <div className="w-16 h-16 bg-accent-dim rounded-full flex items-center justify-center mb-4 animate-pulse">
            <svg className="w-8 h-8 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <p className="text-accent font-medium mb-1">正在生成大纲...</p>
          <p className="text-gray-500 text-sm">AI 正在规划本章情节和场景</p>
        </div>
      );
    }

    if (pipelinePhase === 'awaiting_approval' && outline) {
      return (
        <OutlinePanel
          outline={outline}
          onApprove={handleApprove}
          onModify={() => {}}
          isApproving={isApproving}
        />
      );
    }

    if (pipelinePhase === 'composing') {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center">
          <div className="w-16 h-16 bg-blue-dim rounded-full flex items-center justify-center mb-4 animate-pulse">
            <svg className="w-8 h-8 text-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <p className="text-blue font-medium mb-1">正在装配上下文...</p>
          <p className="text-gray-500 text-sm">加载角色、世界观和前文记忆</p>
        </div>
      );
    }

    if (pipelinePhase === 'writing' || (pipelinePhase === 'fast_audit' && displayContent)) {
      return (
        <div
          ref={contentRef}
          className="h-full overflow-y-auto text-gray-200 leading-relaxed whitespace-pre-wrap"
        >
          {displayContent}
          {pipelinePhase === 'writing' && (
            <span className="inline-block w-0.5 h-5 bg-accent ml-0.5 animate-pulse align-middle" />
          )}
        </div>
      );
    }

    if (pipelinePhase === 'fast_audit') {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center">
          <div className="w-16 h-16 bg-success-dim rounded-full flex items-center justify-center mb-4 animate-pulse">
            <svg className="w-8 h-8 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-success font-medium mb-1">正在快速检查...</p>
          <p className="text-gray-500 text-sm">验证内容规范和基础质量</p>
        </div>
      );
    }

    if (pipelinePhase === 'deep_audit') {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center">
          <div className="w-16 h-16 bg-accent-dim rounded-full flex items-center justify-center mb-4 animate-pulse">
            <svg className="w-8 h-8 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="text-accent font-medium mb-1">正在深度审计...</p>
          <p className="text-gray-500 text-sm">多维度评估章节质量</p>
        </div>
      );
    }

    if (pipelinePhase === 'done') {
      return (
        <div
          ref={contentRef}
          className="h-full overflow-y-auto text-gray-200 leading-relaxed whitespace-pre-wrap"
        >
          {displayContent}
        </div>
      );
    }

    return null;
  };

  const showProgress =
    pipelinePhase &&
    pipelinePhase !== 'pending' &&
    pipelinePhase !== 'awaiting_approval';

  return (
    <div className="h-full flex flex-col">
      {showProgress && (
        <div className="px-4 py-2 border-b border-dark-border">
          <PipelineProgress phase={pipelinePhase} />
        </div>
      )}

      <Card className="flex-1 m-4 overflow-hidden flex flex-col">
        <div className="flex-1 p-6 overflow-hidden">
          {renderContent()}
        </div>

        <div className="border-t border-dark-border px-4 py-3 flex items-center justify-between">
          <span className="text-sm text-gray-400">{wordCount} 字</span>
          <div className="flex gap-2">
            {isGenerating ? (
              <Button variant="danger" size="sm" onClick={handleStop}>
                停止生成
              </Button>
            ) : pipelinePhase === 'done' ? (
              <Button variant="secondary" size="sm" onClick={resetPipeline}>
                重新生成
              </Button>
            ) : !pipelinePhase || pipelinePhase === 'pending' || pipelinePhase === 'error' ? (
              <Button variant="primary" size="sm" onClick={handleStartPipeline}>
                生成下一章
              </Button>
            ) : null}
          </div>
        </div>
      </Card>
    </div>
  );
}
