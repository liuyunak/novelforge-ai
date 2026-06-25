import { useState, useEffect } from 'react';
import { useNovelStore } from '../stores/novelStore';
import { fetchChapters, fetchMemoryDetail } from '../services/api';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import type { MemoryCharacter, MemoryForeshadowing, MemoryWorldSetting } from '../services/api';

type TabType = 'chapters' | 'characters' | 'world' | 'foreshadowing';

export function MemoryPanel() {
  const [activeTab, setActiveTab] = useState<TabType>('chapters');
  const [loading, setLoading] = useState(false);
  const { currentNovel, chapters, setChapters, memoryDetail, setMemoryDetail, pipelinePhase } = useNovelStore();

  useEffect(() => {
    if (currentNovel) {
      setLoading(true);
      Promise.all([
        fetchChapters(currentNovel.id),
        fetchMemoryDetail(currentNovel.id),
      ])
        .then(([chaptersData, memoryData]) => {
          setChapters(chaptersData);
          setMemoryDetail(memoryData);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [currentNovel, setChapters, setMemoryDetail]);

  const totalWords = memoryDetail?.recentChapters.reduce((sum, ch) => sum + ch.wordCount, 0) || 0;
  const estimatedTokens = Math.ceil(totalWords * 1.5);

  const tabs: { key: TabType; label: string; count?: number }[] = [
    { key: 'chapters', label: '章节记忆', count: chapters.length },
    { key: 'characters', label: '角色', count: memoryDetail?.characters.length },
    { key: 'world', label: '世界观' },
    { key: 'foreshadowing', label: '伏笔', count: memoryDetail?.foreshadowing.length },
  ];

  const statusLabels: Record<string, { label: string; variant: any }> = {
    draft: { label: '草稿', variant: 'default' },
    planned: { label: '已规划', variant: 'blue' },
    completed: { label: '已完成', variant: 'success' },
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex border-b border-dark-border">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-2 text-xs font-medium transition-colors relative ${
              activeTab === tab.key
                ? 'text-accent border-b-2 border-accent'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className="ml-1 text-[10px] opacity-70">({tab.count})</span>
            )}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {loading && (
          <div className="text-center py-8">
            <div className="animate-pulse text-gray-500 text-sm">加载中...</div>
          </div>
        )}

        {!loading && activeTab === 'chapters' && (
          <ChaptersTab chapters={chapters} pipelinePhase={pipelinePhase} statusLabels={statusLabels} />
        )}

        {!loading && activeTab === 'characters' && (
          <CharactersTab characters={memoryDetail?.characters || []} />
        )}

        {!loading && activeTab === 'world' && (
          <WorldTab worldSetting={memoryDetail?.worldSetting} />
        )}

        {!loading && activeTab === 'foreshadowing' && (
          <ForeshadowingTab foreshadowing={memoryDetail?.foreshadowing || []} />
        )}
      </div>

      <div className="border-t border-dark-border p-3 space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500">已生成章节</span>
          <span className="text-white font-medium">{chapters.length} 章</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500">总字数</span>
          <span className="text-white font-medium">{totalWords.toLocaleString()} 字</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500">预估上下文</span>
          <span className="text-accent font-medium">
            ~{estimatedTokens.toLocaleString()} Token
          </span>
        </div>
      </div>
    </div>
  );
}

function ChaptersTab({
  chapters,
  pipelinePhase,
  statusLabels,
}: {
  chapters: any[];
  pipelinePhase: string | null;
  statusLabels: Record<string, { label: string; variant: any }>;
}) {
  if (chapters.length === 0) {
    return <p className="text-gray-500 text-sm text-center py-8">暂无章节</p>;
  }

  return (
    <>
      {chapters.map((chapter) => {
        const isCurrent =
          pipelinePhase &&
          pipelinePhase !== 'pending' &&
          pipelinePhase !== 'done' &&
          pipelinePhase !== 'error' &&
          chapter.chapter_num === chapters.length;

        return (
          <Card
            key={chapter.id}
            className={`p-3 cursor-pointer transition-colors hover:bg-dark-elevated ${
              isCurrent ? 'ring-1 ring-accent bg-accent-dim' : ''
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h4 className="text-sm font-medium text-white truncate">
                  第{chapter.chapter_num}章 {chapter.title}
                </h4>
                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                  {chapter.status === 'planned' ? '已规划，待生成' : '已生成章节内容'}
                </p>
              </div>
              <Badge variant={statusLabels[chapter.status]?.variant || 'default'}>
                {statusLabels[chapter.status]?.label || chapter.status}
              </Badge>
            </div>
          </Card>
        );
      })}
    </>
  );
}

function CharactersTab({ characters }: { characters: MemoryCharacter[] }) {
  const [selectedChar, setSelectedChar] = useState<number | null>(null);

  // Generate consistent color from character name hash
  const getAvatarGradient = (name: string): string => {
    const gradients = [
      'from-amber-400 to-orange-500',   // 叶凡 - 暖色系
      'from-blue-400 to-cyan-500',       // 凌雪 - 冷色系
      'from-purple-400 to-pink-500',     // 墨尘 - 暗色系
      'from-emerald-400 to-teal-500',    // 林浩 - 自然色
      'from-red-400 to-rose-500',       // 热血角色
      'from-indigo-400 to-violet-500',  // 神秘角色
      'from-yellow-400 to-amber-500',   // 光明角色
      'from-gray-500 to-slate-600',     // 中性角色
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return gradients[Math.abs(hash) % gradients.length];
  };

  if (characters.length === 0) {
    return <p className="text-gray-500 text-sm text-center py-8">暂无角色数据</p>;
  }

  return (
    <div className="space-y-2">
      {characters.map((char, idx) => (
        <div key={idx}>
          <Card
            className={`p-3 cursor-pointer transition-colors ${
              selectedChar === idx ? 'bg-dark-elevated ring-1 ring-accent' : 'hover:bg-dark-elevated'
            }`}
            onClick={() => setSelectedChar(selectedChar === idx ? null : idx)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${getAvatarGradient(char.name)} flex items-center justify-center text-dark-bg text-xs font-bold shadow-lg`}>
                  {char.name.charAt(0)}
                </div>
                <div>
                  <h4 className="text-sm font-medium text-white">{char.name}</h4>
                  <p className="text-xs text-gray-500">{char.role}</p>
                </div>
              </div>
              <svg
                className={`w-4 h-4 text-gray-500 transition-transform ${selectedChar === idx ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </Card>

          {selectedChar === idx && (
            <div className="mt-2 ml-2 space-y-2 border-l-2 border-dark-border pl-3">
              {char.description && (
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">简介</p>
                  <p className="text-xs text-gray-400 leading-relaxed">{char.description}</p>
                </div>
              )}
              {char.personality_traits && char.personality_traits.length > 0 && (
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">性格特点</p>
                  <div className="flex flex-wrap gap-1">
                    {char.personality_traits.map((trait, i) => (
                      <Badge key={i} variant="default" className="text-[10px]">
                        {trait}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {char.speaking_style && (
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">说话风格</p>
                  <p className="text-xs text-gray-400 leading-relaxed">{char.speaking_style}</p>
                </div>
              )}
              {char.abilities && char.abilities.length > 0 && (
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">能力</p>
                  <div className="flex flex-wrap gap-1">
                    {char.abilities.map((ability, i) => (
                      <Badge key={i} variant="blue" className="text-[10px]">
                        {ability}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function WorldTab({ worldSetting }: { worldSetting?: MemoryWorldSetting }) {
  const [activeSection, setActiveSection] = useState<string>('cultivation');

  if (!worldSetting) {
    return <p className="text-gray-500 text-sm text-center py-8">暂无世界观数据</p>;
  }

  const sections = [
    { key: 'cultivation', label: '修炼体系' },
    { key: 'factions', label: '势力' },
    { key: 'geography', label: '地理' },
    { key: 'volume', label: '卷纲' },
    { key: 'rules', label: '写作规则' },
    { key: 'styles', label: '风格模板' },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1">
        {sections.map((s) => (
          <button
            key={s.key}
            onClick={() => setActiveSection(s.key)}
            className={`px-2 py-1 text-[10px] rounded-md transition-colors ${
              activeSection === s.key
                ? 'bg-accent-dim text-accent'
                : 'bg-dark-elevated text-gray-400 hover:text-gray-300'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {activeSection === 'cultivation' && (
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-2">修炼境界</p>
            <div className="flex flex-wrap gap-1.5">
              {worldSetting.cultivationSystem.map((level, i) => {
                const totalLevels = worldSetting.cultivationSystem.length;
                const progress = i / (totalLevels - 1);
                // Low level = gray, mid = blue, high = accent
                const getGradient = () => {
                  if (progress < 0.33) return 'from-gray-500 to-gray-600';
                  if (progress < 0.66) return 'from-blue-500 to-blue-600';
                  return 'from-amber-400 to-orange-500';
                };
                return (
                  <div key={i} className="relative">
                    <span className={`inline-flex items-center px-2 py-1 rounded-md bg-gradient-to-r ${getGradient()} text-white text-[11px] font-medium shadow-md`}>
                      {level}
                    </span>
                    {i < worldSetting.cultivationSystem.length - 1 && (
                      <span className="absolute -right-1.5 top-1/2 -translate-y-1/2 text-gray-600 text-xs">
                        →
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeSection === 'factions' && (
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-2">主要势力</p>
            <div className="space-y-1.5">
              {worldSetting.factions.map((faction, i) => (
                <Card key={i} className="p-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-accent" />
                    <span className="text-sm text-white">{faction}</span>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeSection === 'geography' && (
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-2">地理设定</p>
            <Card className="p-3">
              <p className="text-xs text-gray-300 leading-relaxed">{worldSetting.geography}</p>
            </Card>
          </div>
        )}

        {activeSection === 'volume' && (
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-2">卷纲设定</p>
            <Card className="p-3">
              <p className="text-xs text-gray-300 leading-relaxed whitespace-pre-line">
                {worldSetting.volumeOutline || '暂无卷纲'}
              </p>
            </Card>
            {worldSetting.blockOutlines && worldSetting.blockOutlines.length > 0 && (
              <div className="mt-3 space-y-2">
                <p className="text-[10px] text-gray-500 uppercase tracking-wide">情节块</p>
                {worldSetting.blockOutlines.map((block: any, i) => (
                  <Card key={i} className="p-2.5">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-white">{block.title}</span>
                      <Badge variant="blue" className="text-[10px]">
                        {block.chapters}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-gray-400 line-clamp-2">{block.summary}</p>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {activeSection === 'rules' && (
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-2">
              写作规则 ({worldSetting.writingRules.length} 条)
            </p>
            <div className="space-y-1.5">
              {worldSetting.writingRules.map((rule, i) => (
                <Card key={i} className="p-2.5">
                  <div className="flex gap-2">
                    <span className="text-[10px] text-accent font-mono flex-shrink-0">{i + 1}.</span>
                    <span className="text-xs text-gray-300">{rule}</span>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeSection === 'styles' && (
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-2">风格模板</p>
            <div className="space-y-2">
              {worldSetting.styleTemplates.map((style: any, i) => (
                <Card key={i} className="p-2.5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-white">{style.name}</span>
                    {style.id === 'default' && (
                      <Badge variant="success" className="text-[10px]">
                        默认
                      </Badge>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-400 mb-1">{style.description}</p>
                  <p className="text-[10px] text-gray-500 line-clamp-2">{style.template}</p>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ForeshadowingTab({ foreshadowing }: { foreshadowing: MemoryForeshadowing[] }) {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [revealedIds, setRevealedIds] = useState<Set<number>>(new Set());

  const toggleReveal = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setRevealedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  if (foreshadowing.length === 0) {
    return <p className="text-gray-500 text-sm text-center py-8">暂无伏笔数据</p>;
  }

  return (
    <div className="space-y-2">
      {foreshadowing.map((item) => {
        const isRevealed = revealedIds.has(item.id);
        return (
          <Card
            key={item.id}
            className={`cursor-pointer transition-colors ${
              expandedId === item.id ? 'bg-dark-elevated' : 'hover:bg-dark-elevated'
            }`}
            onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
          >
            <div className="p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Badge variant="accent" className="text-[10px]">
                      {item.significance}
                    </Badge>
                    <span className="text-[10px] text-gray-500">
                      第{item.plantedChapter}章
                    </span>
                    {item.status === 'revealed' && (
                      <Badge variant="success" className="text-[10px]">已揭示</Badge>
                    )}
                  </div>
                  <p className={`text-xs text-gray-300 ${expandedId === item.id ? '' : 'line-clamp-2'}`}>
                    {item.content}
                  </p>
                  {isRevealed && expandedId === item.id && (
                    <div className="mt-2 p-2 bg-accent-dim rounded-md border border-accent/20">
                      <p className="text-[10px] text-accent font-medium mb-1">💡 揭示提示</p>
                      <p className="text-[11px] text-gray-400">此伏笔已在后续章节中揭示，建议检查是否前后呼应。</p>
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <button
                    onClick={(e) => toggleReveal(e, item.id)}
                    className={`p-1.5 rounded-md transition-colors ${
                      isRevealed
                        ? 'bg-accent-dim text-accent hover:bg-accent/20'
                        : 'bg-dark-bg text-gray-400 hover:text-accent hover:bg-accent-dim'
                    }`}
                    title={isRevealed ? '取消揭示' : '标记为已揭示'}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                  <svg
                    className={`w-4 h-4 text-gray-500 flex-shrink-0 transition-transform ${expandedId === item.id ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
      </Card>
    )})}
    </div>
  );
}
