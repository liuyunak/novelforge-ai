import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNovelStore } from '../stores/novelStore';
import { fetchNovels, checkHealth } from '../services/api';
import { EditorPanel } from '../components/EditorPanel';
import { MemoryPanel } from '../components/MemoryPanel';
import { AuditReportPanel } from '../components/AuditReportPanel';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import type { Novel } from '../services/api';

export function WorkspacePage() {
  const navigate = useNavigate();
  const [novels, setNovels] = useState<Novel[]>([]);
  const [healthStatus, setHealthStatus] = useState<string>('检查中...');
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const {
    currentNovel,
    selectNovel,
    auditFast,
    auditDeep,
    pipelinePhase,
    isStreaming,
    isFallbackMode,
  } = useNovelStore();

  useEffect(() => {
    checkHealth().then((ok) => {
      setHealthStatus(ok ? '后端服务正常' : '后端服务未连接');
    });
    fetchNovels()
      .then((data) => {
        setNovels(data);
        if (data.length > 0) {
          selectNovel(data[0]);
        }
      })
      .catch(console.error);
  }, [selectNovel]);

  const handleGenerateNext = () => {
    setIsGenerating(true);
    const event = new CustomEvent('start-pipeline');
    window.dispatchEvent(event);
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return `${date.getMonth() + 1}/${date.getDate()}`;
    } catch {
      return '';
    }
  };

  return (
    <div className="h-screen flex flex-col bg-dark-bg">
      <header className="h-14 bg-dark-surface border-b border-dark-border flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="text-gray-400 hover:text-white transition-colors"
            title="返回首页"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center">
            <span className="text-dark-bg font-bold text-sm">N</span>
          </div>
          <div>
            <h1 className="text-white font-semibold text-sm leading-tight">NovelForge</h1>
            <p className="text-gray-500 text-xs leading-tight">AI 辅助长篇网文创作</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isFallbackMode && (
            <Badge variant="accent">演示模式</Badge>
          )}
          <Badge variant={healthStatus === '后端服务正常' ? 'success' : 'danger'}>
            {healthStatus}
          </Badge>
          <button
            onClick={() => navigate('/settings')}
            className="text-gray-400 hover:text-white transition-colors"
            title="设置"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <aside className="w-60 bg-dark-surface border-r border-dark-border flex flex-col flex-shrink-0">
          <div className="p-3 border-b border-dark-border">
            <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wide">我的作品</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {novels.map((novel) => (
              <div
                key={novel.id}
                onClick={() => selectNovel(novel)}
                className={`p-3 rounded-lg cursor-pointer transition-colors relative ${
                  currentNovel?.id === novel.id
                    ? 'bg-dark-elevated border-l-2 border-accent'
                    : 'hover:bg-dark-elevated/50'
                }`}
              >
                <h3 className="text-sm font-medium text-white mb-1 truncate">
                  {novel.title}
                </h3>
                <div className="flex items-center justify-between">
                  <Badge variant="accent" className="text-xs">
                    {novel.genre}
                  </Badge>
                  <span className="text-xs text-gray-500">
                    {formatDate(novel.created_at)}
                  </span>
                </div>
              </div>
            ))}
            {novels.length === 0 && (
              <p className="text-gray-500 text-sm text-center py-4">暂无作品</p>
            )}
          </div>
        </aside>

        <main className="flex-1 flex flex-col overflow-hidden">
          {currentNovel ? (
            <>
              <div className="h-14 border-b border-dark-border flex items-center justify-between px-4 flex-shrink-0">
                <h2 className="text-lg font-semibold text-white">{currentNovel.title}</h2>
                <div className="flex items-center gap-3">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleGenerateNext}
                    disabled={isStreaming || isGenerating}
                  >
                    {isStreaming ? '生成中...' : '生成下一章'}
                  </Button>
                </div>
              </div>

              <div className="flex-1 flex overflow-hidden">
                <div
                  className={`border-r border-dark-border transition-all duration-300 flex-shrink-0 ${
                    leftCollapsed ? 'w-0 overflow-hidden' : 'w-72'
                  }`}
                >
                  <MemoryPanel />
                </div>

                <button
                  onClick={() => setLeftCollapsed(!leftCollapsed)}
                  className="w-5 bg-dark-surface border-r border-dark-border flex items-center justify-center text-gray-500 hover:text-gray-300 flex-shrink-0 transition-colors"
                  title={leftCollapsed ? '展开记忆面板' : '折叠记忆面板'}
                >
                  <svg
                    className={`w-4 h-4 transition-transform ${leftCollapsed ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                <div className="flex-1 overflow-hidden">
                  <EditorPanel />
                </div>

                <button
                  onClick={() => setRightCollapsed(!rightCollapsed)}
                  className="w-5 bg-dark-surface border-l border-dark-border flex items-center justify-center text-gray-500 hover:text-gray-300 flex-shrink-0 transition-colors"
                  title={rightCollapsed ? '展开审计面板' : '折叠审计面板'}
                >
                  <svg
                    className={`w-4 h-4 transition-transform ${rightCollapsed ? '' : 'rotate-180'}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                <div
                  className={`border-l border-dark-border transition-all duration-300 flex-shrink-0 ${
                    rightCollapsed ? 'w-0 overflow-hidden' : 'w-80'
                  }`}
                >
                  <div className="h-full p-4">
                    <AuditReportPanel fastAudit={auditFast} deepAudit={auditDeep} />
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-dark-surface rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className="text-white font-medium mb-1">选择一部作品开始创作</h3>
                <p className="text-gray-500 text-sm">从左侧列表中选择作品</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
