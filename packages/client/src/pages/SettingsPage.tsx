import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

type SettingsSection = 'general' | 'ai' | 'memory' | 'about';

export function SettingsPage() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<SettingsSection>('general');
  const [settings, setSettings] = useState({
    autoSave: true,
    darkMode: true,
    fontSize: 'medium' as 'small' | 'medium' | 'large',
    aiModel: 'default',
    temperature: 0.8,
    maxTokens: 4000,
    memoryChapters: 5,
    autoAudit: true,
    auditLevel: 'deep' as 'fast' | 'deep',
    notifications: true,
  });

  const sections: { key: SettingsSection; label: string; icon: string }[] = [
    { key: 'general', label: '通用设置', icon: '⚙️' },
    { key: 'ai', label: 'AI 配置', icon: '🤖' },
    { key: 'memory', label: '记忆设置', icon: '🧠' },
    { key: 'about', label: '关于', icon: 'ℹ️' },
  ];

  const updateSetting = <K extends keyof typeof settings>(key: K, value: typeof settings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="h-screen flex flex-col bg-dark-bg">
      <header className="h-14 bg-dark-surface border-b border-dark-border flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/workspace')}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center">
            <span className="text-dark-bg font-bold text-sm">N</span>
          </div>
          <div>
            <h1 className="text-white font-semibold text-sm leading-tight">设置</h1>
            <p className="text-gray-500 text-xs leading-tight">NovelForge 偏好配置</p>
          </div>
        </div>
        <Button variant="primary" size="sm" onClick={() => navigate('/workspace')}>
          返回工作台
        </Button>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <aside className="w-56 bg-dark-surface border-r border-dark-border flex-shrink-0 p-3">
          <nav className="space-y-1">
            {sections.map((section) => (
              <button
                key={section.key}
                onClick={() => setActiveSection(section.key)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  activeSection === section.key
                    ? 'bg-accent-dim text-accent'
                    : 'text-gray-400 hover:text-white hover:bg-dark-elevated'
                }`}
              >
                <span className="text-base">{section.icon}</span>
                <span>{section.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-2xl mx-auto space-y-6">
            {activeSection === 'general' && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-white">通用设置</h2>

                <Card className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-white">深色模式</p>
                      <p className="text-xs text-gray-500 mt-0.5">使用深色主题界面</p>
                    </div>
                    <ToggleSwitch
                      checked={settings.darkMode}
                      onChange={(v) => updateSetting('darkMode', v)}
                    />
                  </div>

                  <div className="border-t border-dark-border pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-white">自动保存</p>
                        <p className="text-xs text-gray-500 mt-0.5">编辑时自动保存草稿</p>
                      </div>
                      <ToggleSwitch
                        checked={settings.autoSave}
                        onChange={(v) => updateSetting('autoSave', v)}
                      />
                    </div>
                  </div>

                  <div className="border-t border-dark-border pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-white">桌面通知</p>
                        <p className="text-xs text-gray-500 mt-0.5">生成完成时发送通知</p>
                      </div>
                      <ToggleSwitch
                        checked={settings.notifications}
                        onChange={(v) => updateSetting('notifications', v)}
                      />
                    </div>
                  </div>

                  <div className="border-t border-dark-border pt-4">
                    <p className="text-sm font-medium text-white mb-3">字体大小</p>
                    <div className="flex gap-2">
                      {(['small', 'medium', 'large'] as const).map((size) => (
                        <button
                          key={size}
                          onClick={() => updateSetting('fontSize', size)}
                          className={`flex-1 py-2 rounded-lg text-sm transition-colors ${
                            settings.fontSize === size
                              ? 'bg-accent-dim text-accent border border-accent/30'
                              : 'bg-dark-elevated text-gray-400 hover:text-white border border-dark-border'
                          }`}
                        >
                          {size === 'small' ? '小' : size === 'medium' ? '中' : '大'}
                        </button>
                      ))}
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {activeSection === 'ai' && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-white">AI 配置</h2>

                <Card className="p-4 space-y-4">
                  <div>
                    <p className="text-sm font-medium text-white mb-2">AI 模型</p>
                    <select
                      value={settings.aiModel}
                      onChange={(e) => updateSetting('aiModel', e.target.value)}
                      className="w-full bg-dark-elevated border border-dark-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-accent"
                    >
                      <option value="default">默认模型（平衡质量与速度）</option>
                      <option value="fast">快速模型（优先速度）</option>
                      <option value="quality">高质量模型（优先质量）</option>
                    </select>
                  </div>

                  <div className="border-t border-dark-border pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-white">温度 (Temperature)</p>
                      <Badge variant="accent">{settings.temperature.toFixed(1)}</Badge>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="2"
                      step="0.1"
                      value={settings.temperature}
                      onChange={(e) => updateSetting('temperature', parseFloat(e.target.value))}
                      className="w-full accent-amber-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      较低值更确定，较高值更有创意
                    </p>
                  </div>

                  <div className="border-t border-dark-border pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-white">最大 Token 数</p>
                      <Badge variant="blue">{settings.maxTokens.toLocaleString()}</Badge>
                    </div>
                    <input
                      type="range"
                      min="1000"
                      max="8000"
                      step="500"
                      value={settings.maxTokens}
                      onChange={(e) => updateSetting('maxTokens', parseInt(e.target.value))}
                      className="w-full accent-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      单章生成的最大 Token 数量
                    </p>
                  </div>

                  <div className="border-t border-dark-border pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-white">自动审计</p>
                        <p className="text-xs text-gray-500 mt-0.5">生成后自动执行质量审计</p>
                      </div>
                      <ToggleSwitch
                        checked={settings.autoAudit}
                        onChange={(v) => updateSetting('autoAudit', v)}
                      />
                    </div>
                  </div>

                  {settings.autoAudit && (
                    <div className="bg-dark-elevated/50 rounded-lg p-3">
                      <p className="text-sm font-medium text-white mb-2">审计级别</p>
                      <div className="flex gap-2">
                        {(['fast', 'deep'] as const).map((level) => (
                          <button
                            key={level}
                            onClick={() => updateSetting('auditLevel', level)}
                            className={`flex-1 py-2 rounded-lg text-sm transition-colors ${
                              settings.auditLevel === level
                                ? 'bg-accent-dim text-accent border border-accent/30'
                                : 'bg-dark-surface text-gray-400 hover:text-white border border-dark-border'
                            }`}
                          >
                            {level === 'fast' ? '快速审计' : '深度审计'}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              </div>
            )}

            {activeSection === 'memory' && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-white">记忆设置</h2>

                <Card className="p-4 space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-white">注入章节数</p>
                      <Badge variant="accent">{settings.memoryChapters} 章</Badge>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      step="1"
                      value={settings.memoryChapters}
                      onChange={(e) => updateSetting('memoryChapters', parseInt(e.target.value))}
                      className="w-full accent-amber-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      生成新章节时，注入前文最近多少章的内容作为上下文
                    </p>
                  </div>

                  <div className="border-t border-dark-border pt-4">
                    <p className="text-sm font-medium text-white mb-2">记忆注入内容</p>
                    <div className="space-y-2">
                      {[
                        { key: 'characters', label: '角色设定', desc: '注入角色性格、能力、说话风格' },
                        { key: 'world', label: '世界观设定', desc: '注入修炼体系、势力、地理等' },
                        { key: 'foreshadowing', label: '伏笔追踪', desc: '注入未回收的伏笔提醒' },
                        { key: 'rules', label: '写作规则', desc: '注入写作风格和规则要求' },
                      ].map((item) => (
                        <div key={item.key} className="flex items-start justify-between">
                          <div>
                            <p className="text-sm text-white">{item.label}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                          </div>
                          <ToggleSwitch checked={true} onChange={() => {}} />
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium text-white">记忆统计</p>
                    <Badge variant="success">正常</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-dark-elevated rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-accent">2</p>
                      <p className="text-xs text-gray-500 mt-1">已生成章节</p>
                    </div>
                    <div className="bg-dark-elevated rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-blue">3</p>
                      <p className="text-xs text-gray-500 mt-1">角色数</p>
                    </div>
                    <div className="bg-dark-elevated rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-green">7</p>
                      <p className="text-xs text-gray-500 mt-1">伏笔数</p>
                    </div>
                    <div className="bg-dark-elevated rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-purple">20</p>
                      <p className="text-xs text-gray-500 mt-1">写作规则</p>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {activeSection === 'about' && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-white">关于 NovelForge</h2>

                <Card className="p-6 text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <span className="text-dark-bg font-bold text-2xl">N</span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-1">NovelForge</h3>
                  <p className="text-sm text-gray-400 mb-3">AI 辅助长篇网文创作平台</p>
                  <Badge variant="accent">v0.1.0 (Demo)</Badge>
                </Card>

                <Card className="p-4 space-y-3">
                  <p className="text-sm font-medium text-white">核心功能</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { icon: '📝', label: 'Pipeline 创作' },
                      { icon: '🧠', label: '全文记忆系统' },
                      { icon: '🔍', label: '质量审计' },
                      { icon: '🎭', label: '角色一致性' },
                      { icon: '📖', label: '世界观维护' },
                      { icon: '🌱', label: '伏笔追踪' },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center gap-2 bg-dark-elevated rounded-lg p-2">
                        <span>{item.icon}</span>
                        <span className="text-xs text-gray-300">{item.label}</span>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="p-4">
                  <p className="text-sm font-medium text-white mb-2">技术栈</p>
                  <div className="flex flex-wrap gap-1.5">
                    {['React', 'TypeScript', 'Hono', 'SQLite', 'Tailwind CSS', 'Zustand'].map((tech) => (
                      <Badge key={tech} variant="default">{tech}</Badge>
                    ))}
                  </div>
                </Card>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors ${
        checked ? 'bg-accent' : 'bg-dark-border'
      }`}
    >
      <span
        className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}
