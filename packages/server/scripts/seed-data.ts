import { getDb, initDb } from '../src/db/index.js';

async function main() {
  await initDb();
  const db = getDb();

  const novel = db.prepare('SELECT * FROM novels WHERE id = 1').get() as any;
  if (!novel) {
    console.error('Novel id=1 not found. Please run the server first to initialize seed data.');
    process.exit(1);
  }

  console.log('Expanding preset data for novel:', novel.title);

  const oldWorldSetting = JSON.parse(novel.world_setting || '{}');
  const oldCharacters = JSON.parse(novel.characters || '[]');

  const expandedCharacters = oldCharacters.map((char: any) => {
    if (char.name === '叶凡') {
      return {
        ...char,
        personality_traits: ['坚韧不拔', '重情重义', '偶尔腹黑', '隐忍', '有主见'],
        speaking_style: '平时话不多，但关键时候一语中的；对朋友真诚，对敌人冷厉；偶尔会说些俏皮话',
        abilities: ['混沌圣体', '青云诀', '御剑术', '神识探查'],
      };
    }
    if (char.name === '凌雪') {
      return {
        ...char,
        personality_traits: ['清冷孤傲', '外冷内热', '自尊心强', '善良', '坚韧'],
        speaking_style: '说话简洁清冷，惜字如金；不轻易表露情感，但关心人时会用行动代替语言',
        abilities: ['冰灵根', '瑶池仙诀', '冰封千里', '冰心诀'],
      };
    }
    if (char.name === '墨尘') {
      return {
        ...char,
        personality_traits: ['阴险狡诈', '野心勃勃', '为达目的不择手段', '城府深', '善于伪装'],
        speaking_style: '表面温文尔雅，实则话里有话；常用反问和暗示来操控他人',
        abilities: ['天魔功', '幻术', '毒术', '噬魂大法'],
      };
    }
    return char;
  });

  const volumeOutline = `第一卷《青云初鸣》（第1-20章）
主线：叶凡从一介凡人踏入修仙界，在青云宗崭露头角，揭开身世之谜的一角。

核心剧情线：
1. 入门篇（1-5章）：叶凡通过考核进入青云宗，被掌门收为亲传弟子，初识同门。
2. 修炼篇（6-10章）：叶凡修炼速度惊人，引来了内门弟子的嫉妒与挑衅，初次展现混沌圣体的威力。
3. 秘境篇（11-15章）：宗门小秘境开启，叶凡与凌雪意外相遇，联手对抗墨尘的阴谋。
4. 身世篇（16-20章）：秘境深处发现上古遗迹，叶凡获得神秘玉佩，隐约得知父母并非凡人。

卷末高潮：叶凡在秘境最终试炼中击败墨尘，夺得第一，却被墨尘暗算身受重伤，危机时刻玉佩发光救主。`;

  const blockOutlines = [
    {
      block_id: 1,
      title: '入门篇',
      chapters: '第1-5章',
      summary: '叶凡通过青云宗入门考核，因混沌圣体被掌门收为亲传弟子，开始修仙生涯，初识同门师兄弟。',
      key_events: [
        '第1章：叶凡通过入门考核，测灵石爆发出七彩光芒',
        '第2章：清虚真人收叶凡为亲传弟子，传授青云诀',
        '第3章：叶凡初次修炼，速度震惊宗门长老',
        '第4章：内门弟子挑衅，叶凡初次展现实力',
        '第5章：结识好友林浩，得知宗门大比即将开始',
      ],
    },
    {
      block_id: 2,
      title: '修炼篇',
      chapters: '第6-10章',
      summary: '叶凡苦修青云诀，境界飞速提升，引来了大师兄的忌惮，双方矛盾升级。',
      key_events: [
        '第6章：叶凡突破炼气三层，引起宗门关注',
        '第7章：藏经阁偶遇，获得神秘残卷',
        '第8章：大师兄赵天设计陷害叶凡',
        '第9章：叶凡当众识破阴谋，赵天颜面尽失',
        '第10章：宗门宣布小秘境开启，众人摩拳擦掌',
      ],
    },
    {
      block_id: 3,
      title: '秘境篇上',
      chapters: '第11-15章',
      summary: '小秘境开启，叶凡进入其中历练，意外与凌雪相遇，二人联手对抗魔道弟子。',
      key_events: [
        '第11章：秘境开启，各宗弟子进入',
        '第12章：叶凡遭遇妖兽围攻，陷入险境',
        '第13章：凌雪出手相救，二人初次合作',
        '第14章：发现墨尘暗中残害正道弟子',
        '第15章：墨尘杀人夺宝，叶凡决定调查真相',
      ],
    },
  ];

  const writingRules = [
    '严格遵循世界观设定，不得出现设定矛盾',
    '保持角色性格一致，言行需符合人物设定',
    '每章必须有明确的核心冲突和推进',
    '章节结尾必须设置悬念或钩子',
    '对话要符合角色身份和性格',
    '场景描写要服务于情节和氛围',
    '避免大段背景介绍，采用穿插式叙事',
    '节奏张弛有度，战斗与日常交替',
    '善用伏笔，前后呼应',
    '避免上帝视角，采用第三人称限知',
    '感官描写要立体（视、听、嗅、味、触）',
    '情绪表达要通过动作和细节而非直接陈述',
    '关键情节需要铺垫，避免突兀',
    '配角也要有存在感和作用',
    '避免信息过载，每章聚焦1-2个核心事件',
    '打斗场面要有策略和战术，不是数值碾压',
    '感情发展要自然递进',
    '避免重复的句式和词汇',
    '合理使用成语和典故，提升文学性',
    '字数控制：每章3000-5000字',
  ];

  const styleTemplates = [
    {
      id: 'default',
      name: '默认风格',
      description: '第三人称限知视角，节奏明快，打斗场面精彩，情感描写细腻',
      template: '第三人称限知视角，节奏明快，打斗场面精彩，情感描写细腻，善于设置悬念和反转。',
    },
    {
      id: 'epic',
      name: '史诗风',
      description: '格局宏大，叙事磅礴，侧重世界观展现和群像描写',
      template: '史诗级叙事风格，格局宏大，注重世界观的深度展现，群像描写丰富，氛围庄严肃穆，语言古朴典雅。',
    },
    {
      id: 'relaxed',
      name: '轻松风',
      description: '语言诙谐幽默，节奏轻快，适合日常和轻松剧情',
      template: '轻松幽默风格，语言诙谐有趣，节奏轻快活泼，人物互动生动，适当加入吐槽和反差萌元素。',
    },
  ];

  const newWorldSetting = {
    ...oldWorldSetting,
    volume_outline: volumeOutline,
    block_outlines: blockOutlines,
    writing_rules: writingRules,
    style_templates: styleTemplates,
  };

  db.prepare(`
    UPDATE novels SET world_setting = ?, characters = ? WHERE id = 1
  `).run(
    JSON.stringify(newWorldSetting),
    JSON.stringify(expandedCharacters)
  );

  console.log('Updated novel world_setting and characters.');

  const foreshadowings = [
    {
      content: '叶凡身上佩戴的黑色玉佩，是父母留下的唯一遗物，看似普通却在危急时刻会微微发热。',
      significance: '身世伏笔',
    },
    {
      content: '青云宗后山禁地有一道古老的封印，传说封印着上古时期的大恐怖，每百年封印会波动一次。',
      significance: '世界观伏笔',
    },
    {
      content: '墨尘修习的天魔功并非完整版本，他一直在寻找失落的下半部功法，为此不惜一切代价。',
      significance: '反派动机伏笔',
    },
    {
      content: '凌雪自幼体弱，必须依靠瑶池仙宗的冰心莲才能续命，她下山历练另有目的。',
      significance: '女主秘密伏笔',
    },
    {
      content: '百年前曾有一位拥有混沌圣体的天骄横空出世，却在飞升前夕神秘失踪，此事成为修仙界最大悬案。',
      significance: '主线伏笔',
    },
    {
      content: '叶凡在藏经阁得到的那本残卷，据说记载着一门失传的上古功法，但后半部分不知所踪。',
      significance: '功法伏笔',
    },
    {
      content: '青云宗掌门清虚真人看似和蔼，但偶尔望向远方的眼神中，总藏着一丝深深的忧虑。',
      significance: '掌门秘密伏笔',
    },
  ];

  const insertMemory = db.prepare(`
    INSERT INTO memory_entries (novel_id, entry_type, content)
    VALUES (?, 'foreshadowing', ?)
  `);

  let insertedCount = 0;
  for (const item of foreshadowings) {
    const existing = db.prepare(
      'SELECT id FROM memory_entries WHERE novel_id = 1 AND entry_type = ? AND content = ?'
    ).get('foreshadowing', item.content);
    if (!existing) {
      insertMemory.run(1, JSON.stringify(item));
      insertedCount++;
    }
  }

  console.log(`Inserted ${insertedCount} foreshadowing entries.`);
  console.log('');
  console.log('=== Preset data expansion completed ===');
  console.log('Expanded characters:', expandedCharacters.length);
  console.log('Writing rules:', writingRules.length, '条');
  console.log('Style templates:', styleTemplates.length, '种');
  console.log('Block outlines:', blockOutlines.length, '个');
  console.log('Foreshadowings inserted:', insertedCount, '条');
}

main().catch((err) => {
  console.error('Seed data error:', err);
  process.exit(1);
});
