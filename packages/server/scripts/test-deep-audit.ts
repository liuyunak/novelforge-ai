import { initDb } from '../src/db/index.js';
import { deepAudit } from '../src/agents/deep-audit.js';
import { loadWorldSetting, loadCharacterProfiles, loadStyleTemplate } from '../src/memory/full-text.js';

async function main() {
  await initDb();

  const novelId = 1;
  const worldSetting = loadWorldSetting(novelId);
  const characters = loadCharacterProfiles(novelId);
  const styleTemplate = loadStyleTemplate(novelId);

  const testContent = `东域，青云山。

山脚下，少年叶凡望着高耸入云的山峰，眼中闪过一丝坚定。他从小在青阳城长大，父母早亡，靠着邻里接济才勉强活下来。三天前，青云宗招收弟子的消息传到青阳城，叶凡几乎没有犹豫就报了名。

"下一个，叶凡！"

测灵石前，负责考核的长老喊道。叶凡深吸一口气，走上前去，将手掌按在那块半透明的石头上。

轰——

刹那间，测灵石爆发出璀璨的七彩光芒，整个广场都被照亮了。

"这...这是..."长老激动得声音都在颤抖，"混沌圣体！竟然是混沌圣体！"

周围的弟子们纷纷围拢过来，眼中满是震惊和羡慕。叶凡茫然地看着眼前的一切，他不知道什么是混沌圣体，但他知道，自己的命运或许就要改变了。

不远处的人群中，一个白衣少女静静地看着这一幕，她的面容清冷如雪，眼神中却闪过一丝讶异。她是凌雪，来自中洲凌家，这次是来青云宗交流的。

"有意思..."凌雪轻声喃喃，转身消失在人群中。

长老深吸一口气，强压下心中的激动，对叶凡说道："孩子，你跟我来，掌门要见你。"

叶凡点点头，跟着长老向山峰上走去。一路上，他能感受到无数道目光落在自己身上，有好奇，有嫉妒，也有探究。但他毫不在意，他的心中只有一个念头——修仙，变强，找到父母去世的真相。

青云宗主峰，凌霄殿。

叶凡站在大殿中央，微微低着头，却能感受到几道目光落在自己身上。最上方的宝座上，坐着一位身着紫袍的中年男子，正是青云宗掌门——清虚真人。

"你就是叶凡？"清虚真人的声音不大，却带着一股威严。

"弟子叶凡，拜见掌门。"叶凡恭敬行礼。

"好，好啊。"清虚真人捋着胡须，眼中满是赞赏，"混沌圣体，我青云宗建宗千年，还是第一次遇到。从今日起，你便是我的亲传弟子。"

此言一出，殿中几位长老都露出了惊讶的神色，但很快便释然了——拥有混沌圣体的弟子，确实配得上亲传弟子的身份。

叶凡也是一怔，随即大喜过望，连忙跪下磕头："弟子谢过掌门！"

"起来吧。"清虚真人抬手虚扶，一股柔和的力量将叶凡托起，"从今往后，你便在主峰修炼，我会亲自传授你青云诀。"

"是，师父！"叶凡重重地点头，眼眶微微泛红。从今天起，他不再是那个无依无靠的孤儿了，他有了师父，有了宗门。

然而，没有人注意到，大殿的阴影处，一道身影悄悄退了出去。那人的脸上带着阴鸷的笑容，眼中闪过一丝寒光。

"混沌圣体...呵，有意思。"那人低声冷笑，身影很快消失在走廊尽头。

夜幕降临，月光洒在青云山上，给这座千年宗门增添了几分神秘色彩。叶凡站在自己的新房间里，望着窗外的月色，心中充满了对未来的憧憬。

他不知道的是，从他踏入青云宗的那一刻起，一场席卷整个修仙界的巨大风暴，已经悄然拉开了序幕。而他，正是这场风暴的中心。`;

  console.log('=== Deep Audit Test ===\n');
  console.log('Content length:', testContent.length, 'chars');
  console.log('Running deep audit...\n');

  const result = await deepAudit({
    content: testContent,
    worldSetting,
    characterProfiles: characters,
    styleTemplate,
  });

  console.log('=== Audit Result ===\n');
  console.log('Scores:');
  console.log('  角色一致性:', result.scores.character_consistency);
  console.log('  情节逻辑:', result.scores.plot_logic);
  console.log('  AI味:', result.scores.ai_taste);
  console.log('  叙事节奏:', result.scores.pacing);
  console.log('  风格匹配:', result.scores.style_match);
  console.log();
  console.log('综合评分:', result.overall_score);
  console.log();
  console.log('Suggestions:');
  result.suggestions.forEach((s, i) => {
    console.log(`  ${i + 1}. ${s}`);
  });

  if (result.parse_error) {
    console.log('\nParse error:', result.parse_error);
  }

  console.log('\n=== Test completed ===');
}

main().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
