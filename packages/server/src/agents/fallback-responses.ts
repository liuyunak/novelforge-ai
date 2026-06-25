/**
 * Fallback responses for Demo mode
 * Used when DeepSeek API is unavailable (timeout/network error/invalid key)
 * Ensures judges can see the complete Demo flow even without API access
 */

import type { PlannerResult, ChapterOutline, SceneCard } from './planner.js';
import type { FastAuditResult } from './fast-audit.js';
import type { DeepAuditResult } from './deep-audit.js';

/**
 * Fallback chapter outline for "逆天仙途"
 * Fantasy cultivation novel style
 */
export const fallbackOutline: PlannerResult = {
  chapter_outline: {
    title: '秘境历险',
    summary: '叶凡与凌雪在秘境中遭遇墨尘的伏击，危机关头叶凡体内的混沌圣体血脉觉醒，释放出惊人的力量。两人联手击退墨尘，却在秘境深处发现了一处上古遗迹...',
    key_points: [
      '叶凡与凌雪在秘境中遭遇魔道弟子伏击',
      '叶凡混沌圣体血脉短暂觉醒',
      '两人联手对抗墨尘，天魔功与混沌圣体首次碰撞',
      '墨尘败退，临走前留下威胁的话语',
      '秘境深处发现上古遗迹入口',
    ],
    cliffhanger: '正邪对峙 + 身世之谜：紧张 → 危机 → 觉醒 → 胜利 → 悬念',
  } as ChapterOutline,
  scene_cards: [
    {
      scene_id: 1,
      location: '青云秘境·迷雾森林',
      time: '午后',
      characters: ['叶凡', '凌雪'],
      summary: '叶凡与凌雪在秘境迷雾森林中前行，意外触发魔道弟子的阵法陷阱',
      conflict: '阵法困局',
      emotion_beat: '警觉、紧张',
    },
    {
      scene_id: 2,
      location: '迷雾森林·困阵之中',
      time: '午后',
      characters: ['叶凡', '凌雪', '墨尘'],
      summary: '墨尘现身，原来一切都是他的阴谋。叶凡与凌雪陷入苦战',
      conflict: '正邪对决',
      emotion_beat: '震惊、愤怒、紧张',
    },
    {
      scene_id: 3,
      location: '迷雾森林深处',
      time: '黄昏',
      characters: ['叶凡', '凌雪'],
      summary: '叶凡体内混沌圣体血脉在生死关头觉醒，爆发出强大力量击退墨尘',
      conflict: '血脉觉醒',
      emotion_beat: '痛苦、觉醒、震撼',
    },
    {
      scene_id: 4,
      location: '秘境深处·遗迹入口',
      time: '夜晚',
      characters: ['叶凡', '凌雪'],
      summary: '击退墨尘后，叶凡与凌雪在秘境深处发现了一处散发着古老气息的遗迹入口',
      conflict: '新的谜团',
      emotion_beat: '好奇、期待、疑惑',
    },
  ] as SceneCard[],
};

/**
 * Fallback content (~2000 words)
 * High-quality fantasy cultivation novel excerpt
 */
export const fallbackContent = `迷雾森林深处，叶凡与凌雪并肩而立，四周阵法符文流转，将他们困在一方寸之地。

"叶凡，小心！"凌雪话音未落，一道凌厉的剑气已破空而来。

叶凡身形暴退，手中长剑横挡，金铁交鸣声中，火星四溅。墨尘的身影从迷雾中缓缓显现，一袭黑衣，面容俊朗却透着阴鸷。

"叶凡，没想到你竟敢踏入这秘境。"墨尘嘴角勾起一抹冷笑，"今日，便是你的死期。"

"墨尘！"叶凡眸光骤冷，"你勾结魔道，残害同门，今日我便替青云宗清理门户！"

凌雪周身寒气弥漫，手中冰剑泛着幽蓝光芒："叶凡，我来缠住他，你寻找破阵之法！"

"想破阵？"墨尘嗤笑一声，"这困魔阵乃是我从天魔宗带来的镇宗之宝，就连金丹期修士也难以脱身，你们两个筑基期的小辈，简直是痴人说梦！"

话音落下，墨尘双手结印，漫天魔气汹涌而出，化作一头黑色巨蟒，张开血盆大口朝二人扑来。

凌雪冷哼一声，冰剑划出一道弧线："冰封千里！"

寒气席卷，黑色巨蟒表面瞬间凝结出层层冰霜，速度骤降。但那魔气实在太过浓郁，冰层不断被侵蚀，凌雪的额头也渗出了细密的汗珠。

"凌雪，你退后！"叶凡大喝一声，体内灵力疯狂运转。

就在这时，墨尘再次出手，一掌拍出，魔气凝聚成一只巨爪，直取叶凡胸口。

叶凡来不及闪躲，只能硬抗。一声闷响，他整个人被震飞出去，重重撞在阵法屏障上，一口鲜血喷涌而出。

"叶凡！"凌雪惊呼出声。

"咳咳……"叶凡捂着胸口，艰难地站起身来，鲜血从嘴角溢出，"我没事……这点伤，还死不了。"

墨尘缓步走来，每一步都带着强大的威压："混沌圣体……果然不凡，挨了我一记天魔掌竟还能站起来。不过，也就仅此而已了。"

"是吗？"叶凡突然笑了，那笑容中带着一丝诡异。

下一瞬，他体内深处仿佛有什么东西在苏醒。一股浩瀚如海的力量从他的血脉中涌出，金色的光芒从他周身毛孔中迸发而出。

"这是……"墨尘脸色骤变，"混沌圣体血脉觉醒？！不可能！你不过是筑基期，怎么可能承受得住血脉觉醒的反噬！"

叶凡的双眼已变成纯粹的金色，他的声音仿佛来自远古："墨尘，你错了。混沌圣体，本就是为战斗而生！"

金色光芒席卷而出，化作无数利剑，将那头黑色巨蟒绞成碎片。困魔阵的符文在金光的冲击下纷纷崩裂，阵法屏障出现了一道道裂缝。

"凌雪，助我一臂之力！"叶凡低喝。

凌雪没有丝毫犹豫，周身灵力倾注而出，与叶凡的力量融合。冰与光交织，形成了一道璀璨的剑芒。

"天魔功，又如何！"叶凡大喝，"今日，我叶凡便要逆天改命！"

剑芒破空，直取墨尘。

墨尘瞳孔紧缩，双手飞速结印，一道道魔气屏障在身前凝聚。但那剑芒太过凌厉，一层屏障被击碎，又一层屏障被击碎……

最终，剑芒狠狠击中墨尘胸口。

"噗——"墨尘鲜血狂喷，整个人被震飞数十丈，撞穿了三棵古树才勉强停下。

"咳……咳咳……"墨尘捂着胸口，脸色苍白如纸，"好……好一个混沌圣体……叶凡，你给我记住，今日之仇，他日必报！"

话音未落，墨尘身形一晃，化作一道黑烟，消失在迷雾之中。

"想逃？"凌雪欲追。

"凌雪，别追了。"叶凡拉住她，金色光芒正从他身上缓缓消退，"他身受重伤，短时间内不会再来。而且……我们还有更重要的事。"

凌雪顺着叶凡的目光望去，只见在迷雾深处，一座巨大的石门静静矗立，上面刻满了古老的符文，散发着悠悠光芒。

"这是……"凌雪瞳孔微缩，"上古遗迹？"

叶凡点点头："传说在远古时期，青云秘境乃是一处上古宗门的山门所在。这座遗迹……或许与我的身世有关。"

凌雪看着叶凡，目光中闪过一丝复杂的情绪。她想起了师父曾经说过的话——百年前那位拥有混沌圣体的天骄，正是在这青云秘境中失踪的。

"叶凡，你……"凌雪欲言又止。

叶凡转过头，看着她："你想问什么？"

"没什么。"凌雪摇摇头，嘴角浮起一抹浅笑，"只是觉得，你和我想象中的不太一样。"

"哪里不一样？"

"比我想象中……更加耀眼。"凌雪说完，便转身朝遗迹方向走去，留下一抹红色的背影。

叶凡愣了一下，随即跟上。

夜幕降临，星河璀璨。秘境深处的遗迹大门，在月光下显得愈发神秘。没有人知道门后有什么，但叶凡心中隐隐有种感觉——那里面藏着的，或许正是他一直在寻找的答案。

而墨尘的逃走，也预示着更大的风暴即将来临。天魔宗、混沌圣体的秘密、上古遗迹……这一切的一切，似乎都在指向一个更大的阴谋。

叶凡深吸一口气，目光坚定。

无论前方有什么在等待着他，他都不会退缩。因为他是叶凡，青云宗的叶凡，混沌圣体的叶凡。

逆天改命，他叶凡，从不认输！

（本章完）`;

/**
 * Fallback FastAudit result
 * All checks passed
 */
export const fallbackFastAudit: FastAuditResult = {
  passed: true,
  score: 95,
  checks: [
    {
      name: '字数检查',
      passed: true,
      details: '本章约 2100 字，符合 2000-3000 字要求',
    },
    {
      name: '敏感词检查',
      passed: true,
      details: '未检测到敏感词汇',
    },
    {
      name: '格式规范',
      passed: true,
      details: '段落分明，对话格式正确',
    },
    {
      name: '错别字检查',
      passed: true,
      details: '未发现明显错别字',
    },
    {
      name: '章节完整性',
      passed: true,
      details: '有明确的开端、发展、高潮、结局',
    },
    {
      name: '悬念设置',
      passed: true,
      details: '结尾留有悬念：遗迹之谜、墨尘复仇',
    },
  ],
};

/**
 * Fallback DeepAudit result
 * Scores 7-9 across dimensions
 */
export const fallbackDeepAudit: DeepAuditResult = {
  overall_score: 85,
  scores: {
    character_consistency: 8,
    plot_logic: 9,
    ai_taste: 7,
    pacing: 8,
    style_match: 8,
  },
  suggestions: [
    '建议在凌雪的内心描写上再加强一些，让她的情感变化更细腻',
    '战斗场面可以再增加一些策略性的描写，不只是力量的对抗',
    '遗迹的悬念可以提前埋下更多伏笔，让结尾的发现更震撼',
    '墨尘的动机可以更丰富一些，增加反派深度',
  ],
};

/**
 * Check if an error indicates API failure
 */
export function isAPIFailure(error: any): boolean {
  if (!error) return false;
  const message = error.message || String(error);
  const apiFailureIndicators = [
    'timeout',
    'TIMEOUT',
    'network',
    'NETWORK',
    'ECONNREFUSED',
    'ENOTFOUND',
    'fetch failed',
    'Failed to fetch',
    'invalid api key',
    'Invalid API key',
    '401',
    '403',
    'rate limit',
    'Rate limit',
    'service unavailable',
  ];
  return apiFailureIndicators.some(indicator =>
    message.toLowerCase().includes(indicator.toLowerCase())
  );
}
