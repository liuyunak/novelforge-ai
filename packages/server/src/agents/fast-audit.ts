import { BANNED_WORDS } from './rules/banned-words.js';
import { loadCharacterProfiles } from '../memory/full-text.js';

export interface AuditCheck {
  name: string;
  passed: boolean;
  details: string;
  positions?: number[];
  word?: string;
  count?: number;
}

export interface FastAuditResult {
  passed: boolean;
  checks: AuditCheck[];
  score: number;
}

export interface FastAuditInput {
  content: string;
  novel_id: number;
}

export function fastAudit(input: FastAuditInput): FastAuditResult {
  const { content, novel_id } = input;

  const checks: AuditCheck[] = [
    checkBannedWords(content),
    checkSentenceRepetition(content),
    checkWordCount(content),
    checkCharacterConsistency(content, novel_id),
    checkParagraphStructure(content),
  ];

  const passedCount = checks.filter((c) => c.passed).length;
  const totalChecks = checks.length;
  const score = Math.round((passedCount / totalChecks) * 100);

  const allPassed = checks.every((c) => c.passed);

  return {
    passed: allPassed,
    checks,
    score,
  };
}

function checkBannedWords(content: string): AuditCheck {
  const found: { word: string; count: number }[] = [];

  for (const word of BANNED_WORDS) {
    const regex = new RegExp(escapeRegExp(word), 'g');
    const matches = content.match(regex);
    if (matches) {
      found.push({ word, count: matches.length });
    }
  }

  if (found.length === 0) {
    return {
      name: '禁用词检测',
      passed: true,
      details: '未发现禁用词',
    };
  }

  const totalCount = found.reduce((sum, f) => sum + f.count, 0);
  const topWords = found.slice(0, 5).map((f) => `${f.word}(${f.count}次)`).join('、');

  return {
    name: '禁用词检测',
    passed: false,
    details: `发现 ${found.length} 个禁用词，共 ${totalCount} 次。高频词：${topWords}`,
    count: totalCount,
  };
}

function checkSentenceRepetition(content: string): AuditCheck {
  const sentences = content
    .split(/[。！？!?\n]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const repeatedPositions: number[] = [];
  let maxRepeatLength = 0;
  let repeatStart = -1;

  for (let i = 0; i < sentences.length - 2; i++) {
    const firstChar = sentences[i].charAt(0);
    if (!firstChar || firstChar.length === 0) continue;

    let j = i + 1;
    while (j < sentences.length && sentences[j].charAt(0) === firstChar) {
      j++;
    }

    const repeatLength = j - i;
    if (repeatLength >= 3 && repeatLength > maxRepeatLength) {
      maxRepeatLength = repeatLength;
      repeatStart = i;
    }
  }

  if (maxRepeatLength < 3) {
    return {
      name: '句式重复检测',
      passed: true,
      details: '未发现连续3句以上相同开头的句式',
    };
  }

  const positions: number[] = [];
  for (let i = repeatStart; i < repeatStart + maxRepeatLength; i++) {
    positions.push(i + 1);
  }

  const firstChar = sentences[repeatStart].charAt(0);

  return {
    name: '句式重复检测',
    passed: false,
    details: `第${repeatStart + 1}-${repeatStart + maxRepeatLength}句均以'${firstChar}'开头，连续重复${maxRepeatLength}句`,
    positions,
  };
}

function checkWordCount(content: string): AuditCheck {
  const charCount = content.replace(/\s/g, '').length;
  const minCount = 2000;
  const maxCount = 4000;

  if (charCount >= minCount && charCount <= maxCount) {
    return {
      name: '字数范围检查',
      passed: true,
      details: `字数 ${charCount}，在 ${minCount}-${maxCount} 字范围内`,
      count: charCount,
    };
  }

  if (charCount < minCount) {
    return {
      name: '字数范围检查',
      passed: false,
      details: `字数不足：当前 ${charCount} 字，建议不少于 ${minCount} 字`,
      count: charCount,
    };
  }

  return {
    name: '字数范围检查',
    passed: false,
    details: `字数超标：当前 ${charCount} 字，建议不超过 ${maxCount} 字`,
    count: charCount,
  };
}

function checkCharacterConsistency(content: string, novelId: number): AuditCheck {
  const characters = loadCharacterProfiles(novelId);
  const characterNames = characters.map((c) => c.name);

  if (characterNames.length === 0) {
    return {
      name: '角色名一致性',
      passed: true,
      details: '未配置角色档案，跳过检查',
    };
  }

  const knownNames = new Set(characterNames);
  const unknownNames = new Set<string>();

  const commonWords = buildCommonWordSet();
  const honorifics = new Set([
    '长老', '掌门', '公子', '姑娘', '夫人', '老爷', '少爷', '小姐',
    '大人', '前辈', '晚辈', '师兄', '师弟', '师姐', '师妹', '师父',
    '师傅', '弟子', '门徒', '徒弟', '先生', '真人', '真君', '大帝',
    '圣人', '仙子', '道姑', '师太', '方丈', '住持', '师叔', '师伯',
    '师祖', '师公', '长老', '堂主', '舵主', '帮主', '教主', '宫主',
  ]);

  const nameRegex = /[\u4e00-\u9fa5]{2,3}(?=[，。！？、；：\s""])|\b[\u4e00-\u9fa5]{2,3}(?=[说讲喊叫问道回答])/g;
  const potentialNames = content.match(nameRegex) || [];

  for (const name of potentialNames) {
    if (knownNames.has(name)) continue;
    if (commonWords.has(name)) continue;
    if (honorifics.has(name)) continue;
    if (name.length < 2 || name.length > 3) continue;

    const contextRegex = new RegExp(`.{0,8}${escapeRegExp(name)}.{0,8}`, 'g');
    const contexts = content.match(contextRegex) || [];

    let properNameScore = 0;

    for (const ctx of contexts) {
      for (const hon of honorifics) {
        if (ctx.includes(name + hon) || ctx.includes(hon + name)) {
          properNameScore += 3;
        }
      }
      if (ctx.includes(name + '说') || ctx.includes(name + '道') ||
          ctx.includes(name + '喊') || ctx.includes(name + '叫') ||
          ctx.includes(name + '问') || ctx.includes(name + '答')) {
        properNameScore += 2;
      }
      if (ctx.match(new RegExp(`["']${escapeRegExp(name)}["']`))) {
        properNameScore += 1;
      }
      if (ctx.match(new RegExp(`见${escapeRegExp(name)}`))) {
        properNameScore += 1;
      }
    }

    if (properNameScore >= 3) {
      if (name.includes('的') || name.includes('了') || name.includes('着') ||
          name.includes('是') || name.includes('在') || name.includes('有') ||
          name.includes('要') || name.includes('会') || name.includes('能')) {
        continue;
      }
      unknownNames.add(name);
    }
  }

  if (unknownNames.size === 0) {
    return {
      name: '角色名一致性',
      passed: true,
      details: `所有角色名均在档案中，已配置 ${characterNames.length} 个角色`,
    };
  }

  const unknownList = Array.from(unknownNames).slice(0, 10).join('、');

  return {
    name: '角色名一致性',
    passed: false,
    details: `发现 ${unknownNames.size} 个疑似未登记的角色名：${unknownList}`,
    count: unknownNames.size,
  };
}

function buildCommonWordSet(): Set<string> {
  const words = [
    '我们', '你们', '他们', '她们', '它们', '自己', '大家', '众人',
    '师父', '师傅', '师兄', '师弟', '师姐', '师妹', '长老', '掌门',
    '弟子', '门徒', '徒弟', '先生', '小姐', '公子', '姑娘', '夫人',
    '老爷', '少爷', '大人', '小人', '在下', '晚辈', '前辈',
    '东域', '西域', '南域', '北域', '中洲', '青云', '山门', '山峰',
    '山脚', '广场', '大殿', '长老', '弟子', '宗门', '修仙', '修炼',
    '灵气', '功法', '法术', '法宝', '丹药', '妖兽', '魔物', '正道',
    '魔道', '正邪', '生死', '乾坤', '天地', '日月', '星辰', '风云',
    '山水', '江湖', '武林', '世家', '家族', '门派', '宗派', '道场',
    '洞府', '秘境', '遗迹', '宝藏', '传承', '机缘', '造化', '气运',
    '命格', '神魂', '元神', '金丹', '元婴', '化神', '炼气', '筑基',
    '渡劫', '飞升', '成仙', '成神', '圣人', '大帝', '真君', '真人',
    '上古', '远古', '洪荒', '混沌', '阴阳', '五行', '八卦', '九宫',
    '十天', '百族', '万众', '一人', '两人', '三人', '众人', '群雄',
    '高手', '强者', '弱者', '天才', '废柴', '妖孽', '怪物', '奇迹',
    '传说', '神话', '历史', '故事', '传奇', '史诗', '篇章', '序幕',
    '高潮', '结局', '开始', '结束', '未来', '过去', '现在', '此刻',
    '此时', '彼时', '方才', '刚才', '转眼', '瞬间', '刹那', '顷刻',
    '须臾', '半晌', '许久', '不久', '很快', '慢慢', '缓缓', '渐渐',
    '突然', '忽然', '猛然', '骤然', '陡然', '倏忽', '倏地', '霍然',
  ];
  return new Set(words);
}

function checkParagraphStructure(content: string): AuditCheck {
  const paragraphs = content
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  const longParagraphs: { index: number; length: number }[] = [];
  const maxParagraphLength = 500;

  for (let i = 0; i < paragraphs.length; i++) {
    const len = paragraphs[i].replace(/\s/g, '').length;
    if (len > maxParagraphLength) {
      longParagraphs.push({ index: i + 1, length: len });
    }
  }

  if (longParagraphs.length === 0) {
    return {
      name: '段落结构检查',
      passed: true,
      details: `共 ${paragraphs.length} 段，无超过 ${maxParagraphLength} 字的超长段落`,
    };
  }

  const topLong = longParagraphs.slice(0, 3).map((p) => `第${p.index}段(${p.length}字)`).join('、');

  return {
    name: '段落结构检查',
    passed: false,
    details: `发现 ${longParagraphs.length} 个超过 ${maxParagraphLength} 字的超长段落：${topLong}`,
    count: longParagraphs.length,
  };
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
