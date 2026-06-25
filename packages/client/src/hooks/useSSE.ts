import { useState, useRef, useCallback } from 'react';
import { fetchEventSource } from '@microsoft/fetch-event-source';

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

interface PhaseEvent {
  phase: PipelinePhase;
  status: string;
}

interface SSEOptions {
  onPhase?: (phase: PipelinePhase, status: string) => void;
  onOutline?: (data: any) => void;
  onToken?: (chunk: string) => void;
  onAuditFast?: (data: any) => void;
  onAuditDeep?: (data: any) => void;
  onDone?: (data: any) => void;
  onError?: (error: string) => void;
  onPipelineId?: (pipelineId: string) => void;
}

function parseEventData(data: string): any {
  try {
    return JSON.parse(data);
  } catch {
    return data;
  }
}

export function useSSE(options: SSEOptions = {}) {
  const [content, setContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phases, setPhases] = useState<PhaseEvent[]>([]);
  const [outline, setOutline] = useState<any | null>(null);
  const [auditFast, setAuditFast] = useState<any | null>(null);
  const [auditDeep, setAuditDeep] = useState<any | null>(null);
  const [pipelineId, setPipelineId] = useState<string | null>(null);
  const [isFallbackMode, setIsFallbackMode] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const accumulatedRef = useRef('');

  const start = useCallback(async (url: string, body: any) => {
    setContent('');
    setError(null);
    setIsStreaming(true);
    setPhases([]);
    setOutline(null);
    setAuditFast(null);
    setAuditDeep(null);
    setPipelineId(null);
    setIsFallbackMode(false);
    accumulatedRef.current = '';

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      await fetchEventSource(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
        onopen: async (response) => {
          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
          }
          const pid = response.headers.get('X-Pipeline-Id');
          if (pid) {
            setPipelineId(pid);
            options.onPipelineId?.(pid);
          }
        },
        onmessage: ({ event, data }) => {
          const parsed = parseEventData(data);

          if (event === 'phase') {
            const phaseEvent = parsed as PhaseEvent;
            setPhases((prev) => [...prev, phaseEvent]);
            options.onPhase?.(phaseEvent.phase, phaseEvent.status);
          } else if (event === 'outline') {
            setOutline(parsed);
            options.onOutline?.(parsed);
          } else if (event === 'token') {
            const chunk = typeof parsed === 'string' ? parsed : JSON.parse(data);
            accumulatedRef.current += chunk;
            setContent(accumulatedRef.current);
            options.onToken?.(chunk);
          } else if (event === 'audit_fast') {
            setAuditFast(parsed);
            options.onAuditFast?.(parsed);
          } else if (event === 'audit_deep') {
            setAuditDeep(parsed);
            options.onAuditDeep?.(parsed);
          } else if (event === 'done') {
            setIsStreaming(false);
            options.onDone?.(parsed);
          } else if (event === 'fallback') {
            setIsFallbackMode(true);
          } else if (event === 'error') {
            const msg = parsed?.message || 'Unknown error';
            setError(msg);
            setIsStreaming(false);
            options.onError?.(msg);
          }
        },
        onerror: (err) => {
          if (err.name !== 'AbortError') {
            setError(err.message || 'SSE connection failed');
            setIsStreaming(false);
            options.onError?.(err.message || 'SSE connection failed');
          }
        },
        onclose: () => {
          setIsStreaming(false);
        },
      });
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'SSE connection failed');
        setIsStreaming(false);
        options.onError?.(err.message || 'SSE connection failed');
      }
    } finally {
      abortControllerRef.current = null;
    }
  }, [options]);

  const stop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  const reset = useCallback(() => {
    stop();
    setContent('');
    setError(null);
    setPhases([]);
    setOutline(null);
    setAuditFast(null);
    setAuditDeep(null);
    setPipelineId(null);
    setIsFallbackMode(false);
    accumulatedRef.current = '';
  }, [stop]);

  return {
    content,
    isStreaming,
    error,
    phases,
    outline,
    auditFast,
    auditDeep,
    pipelineId,
    isFallbackMode,
    start,
    stop,
    reset,
  };
}
