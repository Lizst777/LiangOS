import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const TARGET_QUOTE_COUNT = 366;
const VERIFIED_AT = "2026-08-18";
const DATASET_REVISION = "b8594f81a89752241442f2ce267d6f66f96704ee";
const OUTPUT_PATH = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../src/data/dailyQuotes.generated.json",
);

const SOURCES = {
  tang: {
    dataUrl: `https://raw.githubusercontent.com/chinese-poetry/chinese-poetry/${DATASET_REVISION}/%E6%B0%B4%E5%A2%A8%E5%94%90%E8%AF%97/shuimotangshi.json`,
    pageUrl: `https://github.com/chinese-poetry/chinese-poetry/blob/${DATASET_REVISION}/%E6%B0%B4%E5%A2%A8%E5%94%90%E8%AF%97/shuimotangshi.json`,
  },
  youmengying: {
    dataUrl: `https://raw.githubusercontent.com/chinese-poetry/chinese-poetry/${DATASET_REVISION}/%E5%B9%BD%E6%A2%A6%E5%BD%B1/youmengying.json`,
    pageUrl: `https://github.com/chinese-poetry/chinese-poetry/blob/${DATASET_REVISION}/%E5%B9%BD%E6%A2%A6%E5%BD%B1/youmengying.json`,
  },
};

const FEATURED_QUOTES = [
  ["且视他人之疑目如盏盏鬼火，大胆地去走你的夜路。", "史铁生", "《病隙碎笔》"],
  ["其实地上本没有路，走的人多了，也便成了路。", "鲁迅", "《故乡》"],
  ["行到水穷处，坐看云起时。", "王维", "《终南别业》"],
  ["云无心以出岫，鸟倦飞而知还。", "陶渊明", "《归去来兮辞》"],
  ["我见青山多妩媚，料青山见我应如是。", "辛弃疾", "《贺新郎·甚矣吾衰矣》"],
  ["人生如逆旅，我亦是行人。", "苏轼", "《临江仙·送钱穆父》"],
  ["此心安处是吾乡。", "苏轼", "《定风波·南海归赠王定国侍人寓娘》"],
  ["寄蜉蝣于天地，渺沧海之一粟。", "苏轼", "《赤壁赋》"],
  ["小舟从此逝，江海寄余生。", "苏轼", "《临江仙·夜归临皋》"],
  ["相濡以沫，不如相忘于江湖。", "庄子", "《大宗师》"],
  ["人生天地之间，若白驹之过隙，忽然而已。", "庄子", "《知北游》"],
  ["人生代代无穷已，江月年年望相似。", "张若虚", "《春江花月夜》"],
  ["草木有本心，何求美人折。", "张九龄", "《感遇十二首·其一》"],
  ["浮云一别后，流水十年间。", "韦应物", "《淮上喜会梁州故人》"],
  ["世界微尘里，吾宁爱与憎。", "李商隐", "《北青萝》"],
  ["山中何事？松花酿酒，春水煎茶。", "张可久", "《人月圆·山中书事》"],
  ["从此无心爱良夜，任他明月下西楼。", "李益", "《写情》"],
  ["人生不相见，动如参与商。", "杜甫", "《赠卫八处士》"],
  ["水流心不竞，云在意俱迟。", "杜甫", "《江亭》"],
  ["人闲桂花落，夜静春山空。", "王维", "《鸟鸣涧》"],
  ["枕上诗书闲处好，门前风景雨来佳。", "李清照", "《摊破浣溪沙·病起萧萧两鬓华》"],
  ["醉后不知天在水，满船清梦压星河。", "唐珙", "《题龙阳县青草湖》"],
  ["晚来天欲雪，能饮一杯无。", "白居易", "《问刘十九》"],
  ["热闹是它们的，我什么也没有。", "朱自清", "《荷塘月色》"],
].map(([content, author, source], index) => ({
  id: `featured-${String(index + 1).padStart(3, "0")}`,
  content,
  author,
  source,
  sourceUrl: null,
  verifiedAt: VERIFIED_AT,
}));

const KNOWN_TANG_AUTHORS = new Set(
  "王维 李白 杜甫 白居易 李商隐 杜牧 孟浩然 刘禹锡 韦应物 柳宗元 张九龄 孟郊 贾岛 元稹 李益 温庭筠 韩愈 李贺 王昌龄 高适 岑参 张籍 刘长卿 陈子昂 王勃 骆宾王 王建 崔颢 钱起 卢纶 戴叔伦 张继 许浑 皮日休 陆龟蒙 司空图 罗隐 王绩 王之涣".split(
    " ",
  ),
);
const CALM_CHARACTERS = new Set([
  ..."山水云月风雨雪花草春秋夜江舟松竹梅茶酒书梦闲静心归远明天地人生光影鸟泉石",
]);
const UNSUITABLE_CONTENT =
  /杀|死|尸|血|兵|军|战|戍|征|虏|胡|帝|王宫|妓|妾|娼|青楼|楚腰|商女|赌|刑|狱|奸|盗|贼|瘟疫|疾病|饥|贫|丧|葬|棺|墓|亡国|后庭花|卖炭|衣裳口中食|轻生|折戟|铜雀|辕门|红旗|弓刀|烽火|单于|可怜|泪|哭|恨|怨/;
const UNSUITABLE_TITLES =
  /卖炭翁|兵车行|塞下曲|燕歌行|征人怨|出塞|从军|凉州词|长恨歌|遣怀|赤壁|泊秦淮|金谷园|闺怨/;
const UNSUITABLE_APHORISM =
  /杀|死|尸|血|兵|军|战|戍|征|虏|胡|帝|王宫|妓|妾|娼|赌|刑|狱|奸|盗|贼|瘟疫|疾病|饥|贫|丧|葬|棺|墓|小人|君子|圣人|仙佛|和尚|妻妾|妇女|美人|佳人|神童|名臣|富贵|金瓶梅/;
const APHORISM_INDICES = new Set([
  0, 1, 2, 4, 5, 7, 9, 11, 13, 14, 15, 17, 18, 19, 20, 21, 23, 27, 28, 29, 30, 31, 32,
  33, 34, 35, 36, 38, 39, 43, 44, 46, 48, 49, 50, 52, 55, 56, 57, 59, 60, 65, 67, 69,
  74, 75, 78, 84,
]);
const SOURCE_CORRECTIONS = new Map([
  ["远目寒山石径斜，白云生处有人家。", "远上寒山石径斜，白云生处有人家。"],
]);

function scoreContent(content) {
  return [...content].reduce(
    (score, character) => score + Number(CALM_CHARACTERS.has(character)),
    0,
  );
}

function normalizeContent(content) {
  const normalized = String(content ?? "")
    .replace(/\s+/g, "")
    .replace(/([？！])。$/u, "$1")
    .trim();
  return SOURCE_CORRECTIONS.get(normalized) ?? normalized;
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: { "User-Agent": "LiangOS quote corpus builder" },
  });
  if (!response.ok) throw new Error(`Quote source request failed: ${response.status}`);
  return response.json();
}

function getTangCandidates(poems, usedContents) {
  const candidates = [];

  poems.forEach((poem, poemIndex) => {
    poem.paragraphs.forEach((paragraph, paragraphIndex) => {
      const content = normalizeContent(paragraph);
      if (
        content.length < 10 ||
        content.length > 34 ||
        UNSUITABLE_CONTENT.test(content) ||
        UNSUITABLE_TITLES.test(poem.title) ||
        usedContents.has(content)
      ) {
        return;
      }

      candidates.push({
        content,
        author: poem.author,
        source: `《${poem.title}》`,
        sourceUrl: SOURCES.tang.pageUrl,
        score: scoreContent(content) + Number(KNOWN_TANG_AUTHORS.has(poem.author)) * 4,
        order: poemIndex * 10 + paragraphIndex,
      });
    });
  });

  return candidates.sort((a, b) => b.score - a.score || a.order - b.order);
}

function getAphorismCandidates(entries, usedContents) {
  return entries
    .map((entry, index) => {
      const content = normalizeContent(entry.content);
      return {
        content,
        author: "张潮",
        source: "《幽梦影》",
        sourceUrl: SOURCES.youmengying.pageUrl,
        score: scoreContent(content),
        order: index,
      };
    })
    .filter(
      ({ content, order }) =>
        APHORISM_INDICES.has(order) &&
        content.length >= 8 &&
        content.length <= 42 &&
        !/[()（）[\]「」“”]/.test(content) &&
        !UNSUITABLE_APHORISM.test(content) &&
        !usedContents.has(content),
    )
    .sort((a, b) => b.score - a.score || a.order - b.order);
}

function appendUnique(target, candidates, count, usedContents, prefix) {
  for (const candidate of candidates) {
    if (target.length >= count || usedContents.has(candidate.content)) continue;
    usedContents.add(candidate.content);
    target.push({
      id: `${prefix}-${String(target.length + 1).padStart(3, "0")}`,
      content: candidate.content,
      author: candidate.author,
      source: candidate.source,
      sourceUrl: candidate.sourceUrl,
      verifiedAt: VERIFIED_AT,
    });
  }
}

async function main() {
  const [tangPoems, aphorisms] = await Promise.all([
    fetchJson(SOURCES.tang.dataUrl),
    fetchJson(SOURCES.youmengying.dataUrl),
  ]);
  const quotes = [...FEATURED_QUOTES];
  const usedContents = new Set(quotes.map(({ content }) => content));
  const aphorismTarget = Math.min(
    TARGET_QUOTE_COUNT,
    quotes.length + APHORISM_INDICES.size,
  );

  appendUnique(
    quotes,
    getAphorismCandidates(aphorisms, usedContents),
    aphorismTarget,
    usedContents,
    "aphorism",
  );
  appendUnique(
    quotes,
    getTangCandidates(tangPoems, usedContents),
    TARGET_QUOTE_COUNT,
    usedContents,
    "tang",
  );

  if (quotes.length !== TARGET_QUOTE_COUNT) {
    throw new Error(
      `Expected ${TARGET_QUOTE_COUNT} quotes, generated ${quotes.length}.`,
    );
  }

  await mkdir(dirname(OUTPUT_PATH), { recursive: true });
  await writeFile(OUTPUT_PATH, `${JSON.stringify(quotes, null, 2)}\n`, "utf8");
  console.log(`Wrote ${quotes.length} daily quotes to ${OUTPUT_PATH}`);
}

await main();
