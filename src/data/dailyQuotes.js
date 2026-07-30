const DAY_MS = 24 * 60 * 60 * 1000;
const QUOTE_EPOCH_UTC = Date.UTC(2026, 6, 17);

const DAILY_QUOTES = [
  {
    content: "且视他人之疑目如盏盏鬼火，大胆地去走你的夜路。",
    author: "史铁生",
    source: "《病隙碎笔》",
  },
  {
    content: "其实地上本没有路，走的人多了，也便成了路。",
    author: "鲁迅",
    source: "《故乡》",
  },
  {
    content: "行到水穷处，坐看云起时。",
    author: "王维",
    source: "《终南别业》",
  },
  {
    content: "云无心以出岫，鸟倦飞而知还。",
    author: "陶渊明",
    source: "《归去来兮辞》",
  },
  {
    content: "我见青山多妩媚，料青山见我应如是。",
    author: "辛弃疾",
    source: "《贺新郎·甚矣吾衰矣》",
  },
  {
    content: "人生如逆旅，我亦是行人。",
    author: "苏轼",
    source: "《临江仙·送钱穆父》",
  },
  {
    content: "此心安处是吾乡。",
    author: "苏轼",
    source: "《定风波·南海归赠王定国侍人寓娘》",
  },
  {
    content: "寄蜉蝣于天地，渺沧海之一粟。",
    author: "苏轼",
    source: "《赤壁赋》",
  },
  {
    content: "小舟从此逝，江海寄余生。",
    author: "苏轼",
    source: "《临江仙·夜归临皋》",
  },
  {
    content: "相濡以沫，不如相忘于江湖。",
    author: "庄子",
    source: "《大宗师》",
  },
  {
    content: "人生天地之间，若白驹之过隙，忽然而已。",
    author: "庄子",
    source: "《知北游》",
  },
  {
    content: "人生代代无穷已，江月年年望相似。",
    author: "张若虚",
    source: "《春江花月夜》",
  },
  {
    content: "草木有本心，何求美人折。",
    author: "张九龄",
    source: "《感遇十二首·其一》",
  },
  {
    content: "浮云一别后，流水十年间。",
    author: "韦应物",
    source: "《淮上喜会梁州故人》",
  },
  {
    content: "世界微尘里，吾宁爱与憎。",
    author: "李商隐",
    source: "《北青萝》",
  },
  {
    content: "山中何事？松花酿酒，春水煎茶。",
    author: "张可久",
    source: "《人月圆·山中书事》",
  },
  {
    content: "从此无心爱良夜，任他明月下西楼。",
    author: "李益",
    source: "《写情》",
  },
  {
    content: "人生不相见，动如参与商。",
    author: "杜甫",
    source: "《赠卫八处士》",
  },
  {
    content: "水流心不竞，云在意俱迟。",
    author: "杜甫",
    source: "《江亭》",
  },
  {
    content: "人闲桂花落，夜静春山空。",
    author: "王维",
    source: "《鸟鸣涧》",
  },
  {
    content: "枕上诗书闲处好，门前风景雨来佳。",
    author: "李清照",
    source: "《摊破浣溪沙·病起萧萧两鬓华》",
  },
  {
    content: "醉后不知天在水，满船清梦压星河。",
    author: "唐珙",
    source: "《题龙阳县青草湖》",
  },
  {
    content: "晚来天欲雪，能饮一杯无。",
    author: "白居易",
    source: "《问刘十九》",
  },
  {
    content: "热闹是它们的，我什么也没有。",
    author: "朱自清",
    source: "《荷塘月色》",
  },
];

export function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getDailyQuote(date = new Date()) {
  const dayNumber = Math.floor(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / DAY_MS,
  );
  const epochDayNumber = Math.floor(QUOTE_EPOCH_UTC / DAY_MS);
  const quoteIndex =
    ((dayNumber - epochDayNumber) % DAILY_QUOTES.length +
      DAILY_QUOTES.length) %
    DAILY_QUOTES.length;
  const quote = DAILY_QUOTES[quoteIndex];

  return {
    ...quote,
    dateKey: getLocalDateKey(date),
  };
}

export function getMillisecondsUntilTomorrow(date = new Date()) {
  const tomorrow = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate() + 1,
  );
  return Math.max(1000, tomorrow.getTime() - date.getTime() + 100);
}

export { DAILY_QUOTES };
