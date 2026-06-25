import type { Database } from './index.js';

export function initSchema(db: Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS novels (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      genre TEXT NOT NULL,
      world_setting TEXT NOT NULL DEFAULT '{}',
      characters TEXT NOT NULL DEFAULT '[]',
      style_template TEXT NOT NULL DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS chapters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      novel_id INTEGER NOT NULL,
      chapter_num INTEGER NOT NULL,
      title TEXT NOT NULL DEFAULT '',
      outline TEXT NOT NULL DEFAULT '{}',
      content TEXT NOT NULL DEFAULT '',
      audit_report TEXT NOT NULL DEFAULT '{}',
      status TEXT NOT NULL DEFAULT 'draft',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (novel_id) REFERENCES novels(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS memory_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      novel_id INTEGER NOT NULL,
      chapter_id INTEGER,
      entry_type TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (novel_id) REFERENCES novels(id) ON DELETE CASCADE,
      FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS idx_chapters_novel_id ON chapters(novel_id);
    CREATE INDEX IF NOT EXISTS idx_memory_entries_novel_id ON memory_entries(novel_id);
    CREATE INDEX IF NOT EXISTS idx_memory_entries_entry_type ON memory_entries(entry_type);
  `);

  insertSeedData(db);
}

function insertSeedData(db: Database) {
  const novelCount = db.prepare('SELECT COUNT(*) as count FROM novels').get() as { count: number };
  if (novelCount.count > 0) return;

  const insertNovel = db.prepare(`
    INSERT INTO novels (title, genre, world_setting, characters, style_template)
    VALUES (?, ?, ?, ?, ?)
  `);

  const worldSetting = JSON.stringify({
    world_name: '玄天界',
    era: '上古纪元末期',
    power_system: '修炼体系：炼气、筑基、金丹、元婴、化神',
    geography: '东域、西域、南域、北域、中洲五大区域',
    background: '天地灵气复苏，上古遗迹纷纷现世，各大宗门争锋'
  });

  const characters = JSON.stringify([
    {
      id: 1,
      name: '叶凡',
      role: '主角',
      personality: '坚韧不拔、重情重义、偶尔腹黑',
      background: '出身于东域一个小家族，自幼父母双亡，被宗门长老收养',
      appearance: '身材挺拔，剑眉星目，常着青色长袍',
      ability: '拥有混沌圣体，修炼速度远超常人'
    },
    {
      id: 2,
      name: '凌雪',
      role: '女主角',
      personality: '清冷孤傲、外冷内热、天赋极高',
      background: '中洲凌家千金，自幼拜入瑶池仙宗',
      appearance: '白衣胜雪，容颜绝世，气质清冷',
      ability: '冰灵根，精通冰系法术'
    },
    {
      id: 3,
      name: '墨尘',
      role: '反派',
      personality: '阴险狡诈、野心勃勃、为达目的不择手段',
      background: '魔道大宗天魔宗少主',
      appearance: '黑衣黑袍，面容俊美但带着邪气',
      ability: '修炼魔功，擅长幻术和毒术'
    }
  ]);

  const styleTemplate = '第三人称限知视角，节奏明快，打斗场面精彩，情感描写细腻，善于设置悬念和反转。';

  const result = insertNovel.run(
    '逆天仙途',
    '玄幻修仙',
    worldSetting,
    characters,
    styleTemplate
  );

  const novelId = result.lastInsertRowid;

  const insertChapter = db.prepare(`
    INSERT INTO chapters (novel_id, chapter_num, title, outline, content, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertChapter.run(
    novelId,
    1,
    '青云宗入门',
    JSON.stringify({
      summary: '叶凡初入青云宗，展现惊人天赋',
      key_points: [
        '叶凡通过宗门入门考核',
        '测试时展现出罕见的混沌圣体',
        '被掌门收为亲传弟子',
        '结识了几位同门师兄师姐'
      ]
    }),
    '东域，青云山。\n\n山脚下，少年叶凡望着高耸入云的山峰，眼中闪过一丝坚定。他从小在青阳城长大，父母早亡，靠着邻里接济才勉强活下来。三天前，青云宗招收弟子的消息传到青阳城，叶凡几乎没有犹豫就报了名。\n\n"下一个，叶凡！"\n\n测灵石前，负责考核的长老喊道。叶凡深吸一口气，走上前去，将手掌按在那块半透明的石头上。\n\n轰——\n\n刹那间，测灵石爆发出璀璨的七彩光芒，整个广场都被照亮了。\n\n"这...这是..."长老激动得声音都在颤抖，"混沌圣体！竟然是混沌圣体！"',
    'completed'
  );

  insertChapter.run(
    novelId,
    2,
    '亲传弟子',
    JSON.stringify({
      summary: '叶凡被掌门收为亲传弟子，开始正式修炼',
      key_points: [
        '掌门亲自接见叶凡',
        '传授基础功法《青云诀》',
        '叶凡修炼速度惊人',
        '遇到内门弟子挑衅'
      ]
    }),
    '青云宗主峰，凌霄殿。\n\n叶凡站在大殿中央，微微低着头，却能感受到几道目光落在自己身上。最上方的宝座上，坐着一位身着紫袍的中年男子，正是青云宗掌门——清虚真人。\n\n"你就是叶凡？"清虚真人的声音不大，却带着一股威严。\n\n"弟子叶凡，拜见掌门。"叶凡恭敬行礼。\n\n"好，好啊。"清虚真人捋着胡须，眼中满是赞赏，"混沌圣体，我青云宗建宗千年，还是第一次遇到。从今日起，你便是我的亲传弟子。"\n\n此言一出，殿中几位长老都露出了惊讶的神色，但很快便释然了——拥有混沌圣体的弟子，确实配得上亲传弟子的身份。',
    'completed'
  );

  console.log('Seed data inserted successfully');
}
