import { useState } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Modal } from './ui/Modal';

interface SceneCard {
  scene_id?: number;
  location?: string;
  time?: string;
  characters?: string[];
  summary?: string;
  conflict?: string;
  emotion_beat?: string;
}

interface ChapterOutline {
  title?: string;
  summary?: string;
  key_points?: string[];
  cliffhanger?: string;
}

interface OutlinePanelProps {
  outline: {
    chapter_outline: ChapterOutline;
    scene_cards: SceneCard[];
  };
  onApprove: () => void;
  onModify: () => void;
  isApproving?: boolean;
}

export function OutlinePanel({ outline, onApprove, onModify, isApproving }: OutlinePanelProps) {
  const [showModifyModal, setShowModifyModal] = useState(false);
  const chapterOutline = outline.chapter_outline || {};
  const sceneCards = outline.scene_cards || [];

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-lg font-semibold text-white">
            {chapterOutline.title || '新章节'}
          </h3>
          <Badge variant="accent">待审批</Badge>
        </div>
        <p className="text-sm text-gray-400 leading-relaxed">
          {chapterOutline.summary || '暂无摘要'}
        </p>
        {chapterOutline.key_points && chapterOutline.key_points.length > 0 && (
          <div className="mt-3 pt-3 border-t border-dark-border">
            <h4 className="text-xs font-medium text-gray-500 mb-2">关键点</h4>
            <ul className="text-sm text-gray-400 space-y-1">
              {chapterOutline.key_points.map((point, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-accent">•</span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {chapterOutline.cliffhanger && (
          <div className="mt-3 pt-3 border-t border-dark-border">
            <h4 className="text-xs font-medium text-gray-500 mb-1">悬念收尾</h4>
            <p className="text-sm text-gray-400">{chapterOutline.cliffhanger}</p>
          </div>
        )}
      </Card>

      <div>
        <h4 className="text-sm font-medium text-white mb-3">场景卡 ({sceneCards.length})</h4>
        <div className="space-y-3">
          {sceneCards.map((scene, index) => (
            <Card key={index} className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-white">
                  场景 {index + 1}
                </span>
                <div className="flex items-center gap-2">
                  {scene.location && (
                    <Badge variant="blue">{scene.location}</Badge>
                  )}
                  {scene.time && (
                    <Badge variant="default">{scene.time}</Badge>
                  )}
                </div>
              </div>
              {scene.characters && scene.characters.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {scene.characters.map((char, i) => (
                    <Badge key={i} variant="accent">{char}</Badge>
                  ))}
                </div>
              )}
              {scene.summary && (
                <p className="text-sm text-gray-400 leading-relaxed">{scene.summary}</p>
              )}
              <div className="flex gap-4 mt-2 pt-2 border-t border-dark-border text-xs">
                {scene.conflict && (
                  <div>
                    <span className="text-gray-500">冲突：</span>
                    <span className="text-gray-300">{scene.conflict}</span>
                  </div>
                )}
                {scene.emotion_beat && (
                  <div>
                    <span className="text-gray-500">情绪：</span>
                    <span className="text-gray-300">{scene.emotion_beat}</span>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button
          variant="success"
          className="flex-1"
          onClick={onApprove}
          disabled={isApproving}
        >
          {isApproving ? '批准中...' : '批准大纲'}
        </Button>
        <Button
          variant="secondary"
          onClick={() => setShowModifyModal(true)}
          disabled={isApproving}
        >
          修改
        </Button>
        <Button variant="ghost" disabled={isApproving}>
          跳过
        </Button>
      </div>

      <Modal
        isOpen={showModifyModal}
        onClose={() => setShowModifyModal(false)}
        title="修改大纲"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowModifyModal(false)}>
              取消
            </Button>
            <Button variant="primary" onClick={onModify}>
              确认修改
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-400">
            修改功能将在后续版本中支持。您可以先批准大纲，章节生成后再进行调整。
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              章节标题
            </label>
            <input
              type="text"
              defaultValue={chapterOutline.title}
              className="w-full px-3 py-2 bg-dark-elevated border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-accent"
              readOnly
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              摘要
            </label>
            <textarea
              defaultValue={chapterOutline.summary}
              rows={4}
              className="w-full px-3 py-2 bg-dark-elevated border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-accent resize-none"
              readOnly
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
