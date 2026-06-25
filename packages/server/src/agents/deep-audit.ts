import { deepSeekClient } from '../ai/client.js';
import { deepAuditSystemPrompt } from './prompts/deep-audit.js';

export interface DeepAuditScores {
  character_consistency: number;
  plot_logic: number;
  ai_taste: number;
  pacing: number;
  style_match: number;
}

export interface DeepAuditResult {
  scores: DeepAuditScores;
  overall_score: number;
  suggestions: string[];
  parse_error?: string;
}

export interface DeepAuditInput {
  content: string;
  worldSetting: any;
  characterProfiles: any[];
  styleTemplate: string;
}

export async function deepAudit(input: DeepAuditInput): Promise<DeepAuditResult> {
  const { content, worldSetting, characterProfiles, styleTemplate } = input;

  const userPrompt = buildUserPrompt(content, worldSetting, characterProfiles, styleTemplate);

  try {
    const result = await deepSeekClient.chat(
      [
        { role: 'system', content: deepAuditSystemPrompt },
        { role: 'user', content: userPrompt },
      ],
      'auditor',
      {
        temperature: 0.3,
        maxTokens: 2000,
        timeout: 60000,
      }
    );

    return parseAuditResult(result.content);
  } catch (error: any) {
    console.error('Deep audit error:', error);
    return {
      scores: {
        character_consistency: 5,
        plot_logic: 5,
        ai_taste: 5,
        pacing: 5,
        style_match: 5,
      },
      overall_score: 5.0,
      suggestions: [`审计调用失败：${error.message || '未知错误'}`],
      parse_error: error.message || 'Deep audit call failed',
    };
  }
}

function buildUserPrompt(
  content: string,
  worldSetting: any,
  characterProfiles: any[],
  styleTemplate: string
): string {
  let prompt = `请对以下小说章节内容进行深度审计。\n\n`;

  prompt += `【世界观设定】\n${JSON.stringify(worldSetting, null, 2)}\n\n`;

  prompt += `【角色档案】\n`;
  for (const char of characterProfiles) {
    prompt += `\n◆ ${char.name}（${char.role}）\n`;
    prompt += `  性格：${char.personality}\n`;
    prompt += `  背景：${char.background}\n`;
    if (char.personality_traits) {
      prompt += `  性格关键词：${char.personality_traits.join('、')}\n`;
    }
    if (char.speaking_style) {
      prompt += `  说话风格：${char.speaking_style}\n`;
    }
    if (char.abilities) {
      prompt += `  能力：${Array.isArray(char.abilities) ? char.abilities.join('、') : char.abilities}\n`;
    }
  }
  prompt += '\n';

  prompt += `【风格模板】\n${styleTemplate || '无特殊风格要求'}\n\n`;

  prompt += `【待审计内容】\n${content}\n\n`;

  prompt += `请从角色一致性、情节逻辑、AI味、叙事节奏、风格匹配5个维度进行评分，并给出具体建议。直接输出JSON。`;

  return prompt;
}

function parseAuditResult(rawContent: string): DeepAuditResult {
  const defaultResult: DeepAuditResult = {
    scores: {
      character_consistency: 5,
      plot_logic: 5,
      ai_taste: 5,
      pacing: 5,
      style_match: 5,
    },
    overall_score: 5.0,
    suggestions: ['解析审计结果失败，请人工检查'],
    parse_error: 'Failed to parse JSON from audit response',
  };

  try {
    const jsonMatch = rawContent.match(/```json\s*([\s\S]*?)\s*```/) || rawContent.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[1] || jsonMatch[0] : rawContent;

    const parsed = JSON.parse(jsonStr.trim());

    const scores: DeepAuditScores = {
      character_consistency: clampScore(parsed.scores?.character_consistency),
      plot_logic: clampScore(parsed.scores?.plot_logic),
      ai_taste: clampScore(parsed.scores?.ai_taste),
      pacing: clampScore(parsed.scores?.pacing),
      style_match: clampScore(parsed.scores?.style_match),
    };

    const overall_score = typeof parsed.overall_score === 'number'
      ? Math.round(parsed.overall_score * 10) / 10
      : Math.round(
          (scores.character_consistency + scores.plot_logic + scores.ai_taste +
           scores.pacing + scores.style_match) / 5 * 10
        ) / 10;

    const suggestions = Array.isArray(parsed.suggestions)
      ? parsed.suggestions.filter((s: any) => typeof s === 'string')
      : [];

    return {
      scores,
      overall_score,
      suggestions: suggestions.length > 0 ? suggestions : ['暂无具体建议'],
    };
  } catch (error: any) {
    console.error('Parse deep audit result error:', error);
    console.error('Raw content:', rawContent);
    return {
      ...defaultResult,
      parse_error: error.message || 'Unknown parse error',
    };
  }
}

function clampScore(value: any): number {
  const num = Number(value);
  if (isNaN(num)) return 5;
  return Math.max(1, Math.min(10, Math.round(num)));
}
