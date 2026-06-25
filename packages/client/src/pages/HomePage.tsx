import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchNovels, checkHealth } from '../services/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import type { Novel } from '../services/api';

export function HomePage() {
  const navigate = useNavigate();
  const [novels, setNovels] = useState<Novel[]>([]);
  const [healthStatus, setHealthStatus] = useState<string>('检查中...');
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    checkHealth().then((ok) => {
      setHealthStatus(ok ? '后端服务正常' : '后端服务未连接');
    });
    fetchNovels()
      .then((data) => setNovels(data))
      .catch(console.error);
  }, []);

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
    } catch {
      return '';
    }
  };

  const features = [
    {
      icon: '📝',
      title: 'Pipeline 智能创作',
      desc: '规划 → 撰写 → 审计 三阶段流水线，AI 全程辅助创作',
    },
    {
      icon: '🧠',
      title: '全文记忆系统',
      desc: '自动维护角色、世界观、伏笔，确保长篇一致性',
    },
    {
      icon: '🔍',
      title: '双轨质量审计',
      desc: '快速审计 + 深度审计，多维度把控小说质量',
    },
    {
      icon: '⚡',
      title: '流式实时生成',
      desc: 'SSE 流式输出，边写边看，即时调整方向',
    },
  ];

  return (
    <div className="min-h-screen bg-dark-bg">
      <header className="sticky top-0 z-50 bg-dark-surface/80 backdrop-blur-md border-b border-dark-border">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center">
              <span className="text-dark-bg font-bold text-lg">N</span>
            </div>
            <div>
              <h1 className="text-white font-bold text-lg leading-tight">NovelForge</h1>
              <p className="text-gray-500 text-xs leading-tight">AI 辅助长篇网文创作</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={healthStatus === '后端服务正常' ? 'success' : 'danger'}>
              {healthStatus}
            </Badge>
            <Button variant="ghost" size="sm" onClick={() => navigate('/settings')}>
              设置
            </Button>
          </div>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-6 py-16 text-center">
        <div className="inline-flex items-center gap-2 bg-accent-dim border border-accent/30 rounded-full px-4 py-1.5 mb-6">
          <span className="text-accent text-xs font-medium">✨ 全新 AI 创作体验</span>
        </div>
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
          让 AI 成为你的
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">
            {' '}网文创作搭子
          </span>
        </h2>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-8">
          基于 Pipeline 流水线的智能创作系统，自动维护全文记忆，
          确保长篇小说角色一致、世界观稳定、伏笔有回收。
        </p>
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="primary"
            size="lg"
            onClick={() => {
              if (novels.length > 0) {
                navigate('/workspace');
              } else {
                setShowCreateModal(true);
              }
            }}
          >
            开始创作
          </Button>
          <Button variant="secondary" size="lg" onClick={() => navigate('/settings')}>
            了解更多
          </Button>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((feature) => (
            <Card key={feature.title} className="p-5 hover:bg-dark-elevated transition-colors">
              <div className="text-3xl mb-3">{feature.icon}</div>
              <h3 className="text-white font-semibold mb-1.5">{feature.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{feature.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-white">我的作品</h3>
            <p className="text-gray-500 text-sm mt-1">共 {novels.length} 部作品</p>
          </div>
          <Button variant="primary" size="sm" onClick={() => setShowCreateModal(true)}>
            + 新建作品
          </Button>
        </div>

        {novels.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="w-16 h-16 bg-dark-elevated rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h4 className="text-white font-medium mb-1">还没有作品</h4>
            <p className="text-gray-500 text-sm mb-4">创建你的第一部小说，开启 AI 创作之旅</p>
            <Button variant="primary" onClick={() => setShowCreateModal(true)}>
              新建作品
            </Button>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {novels.map((novel) => (
              <Card
                key={novel.id}
                className="p-5 cursor-pointer hover:bg-dark-elevated transition-all hover:ring-1 hover:ring-accent/50 group"
                onClick={() => navigate('/workspace')}
              >
                <div className="w-full h-32 bg-gradient-to-br from-amber-500/20 to-orange-600/20 rounded-lg mb-4 flex items-center justify-center">
                  <span className="text-5xl font-bold text-amber-400/30">
                    {novel.title.charAt(0)}
                  </span>
                </div>
                <div className="flex items-start justify-between mb-2">
                  <h4 className="text-white font-semibold truncate group-hover:text-accent transition-colors">
                    {novel.title}
                  </h4>
                </div>
                <div className="flex items-center justify-between">
                  <Badge variant="accent">{novel.genre}</Badge>
                  <span className="text-xs text-gray-500">{formatDate(novel.created_at)}</span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="max-w-6xl mx-auto px-6 py-8">
        <Card className="p-6 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-white mb-1">💡 使用提示</h3>
              <p className="text-gray-400 text-sm">
                点击"开始创作"进入工作台，体验完整的 Pipeline 创作流程。
                预设作品《逆天仙途》已配置好所有数据，可直接体验。
              </p>
            </div>
            <Button
              variant="primary"
              onClick={() => navigate('/workspace')}
            >
              立即体验 →
            </Button>
          </div>
        </Card>
      </section>

      <footer className="max-w-6xl mx-auto px-6 py-8 border-t border-dark-border mt-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-amber-400 to-orange-500 rounded-md flex items-center justify-center">
              <span className="text-dark-bg font-bold text-[10px]">N</span>
            </div>
            <span className="text-gray-500 text-sm">NovelForge v0.1.0 Demo</span>
          </div>
          <p className="text-gray-600 text-xs">
            基于 AI 的长篇网文智能创作系统
          </p>
        </div>
      </footer>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <Card className="w-full max-w-md p-6 mx-4">
            <h3 className="text-lg font-bold text-white mb-4">新建作品</h3>
            <p className="text-gray-400 text-sm mb-6">
              Demo 版本已内置《逆天仙途》作为示例作品，点击下方按钮直接体验。
              自定义创建功能将在后续版本中开放。
            </p>
            <div className="bg-dark-elevated rounded-lg p-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center">
                  <span className="text-dark-bg font-bold">逆</span>
                </div>
                <div>
                  <p className="text-white font-medium">逆天仙途</p>
                  <p className="text-gray-500 text-xs">玄幻修仙 · 预设作品</p>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => setShowCreateModal(false)}
              >
                取消
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                onClick={() => {
                  setShowCreateModal(false);
                  navigate('/workspace');
                }}
              >
                使用预设作品
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
