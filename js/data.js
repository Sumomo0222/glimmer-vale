/* ============ 微光谷物语 · 数据层 ============ */
window.G = window.G || {};
(function () {
  'use strict';
  G.TS = 16;                      // 瓦片像素
  G.SPRING = 0; G.SUMMER = 1; G.FALL = 2; G.WINTER = 3;
  G.SEASON_NAMES = ['春', '夏', '秋', '冬'];
  G.SEASON_COLORS = {
    grassA: ['#5f9e3e', '#4f9438', '#a5813c', '#cfd8dc'],
    grassB: ['#6fb04a', '#5aa243', '#b28e46', '#dde3e6'],
    leaf:   ['#71b04e', '#4f9438', '#d08a3a', null],
    water:  ['#3f76b5', '#3f76b5', '#3e6ea8', '#7fa7c9'],
  };
  G.WEATHER_NAMES = { sun: '☀️ 晴', cloud: '☁️ 多云', rain: '🌧️ 雨', storm: '⛈️ 暴雨', snow: '❄️ 雪' };

  /* ---------------- 作物 ---------------- */
  // stage 图: 0 种子 1 幼苗 2 生长 3 成熟
  G.CROPS = {
    turnip:  { name: '小萝卜', seasons: [0], days: 4, seed: 'turnip_seed',  sell: 35,  seedCost: 20, color: '#e86379' },
    potato:  { name: '土豆',   seasons: [0], days: 6, seed: 'potato_seed',  sell: 75,  seedCost: 50, color: '#cfa763' },
    tomato:  { name: '番茄',   seasons: [1], days: 5, seed: 'tomato_seed',  sell: 65,  seedCost: 42, color: '#e0453a' },
    melon:   { name: '西瓜',   seasons: [1], days: 7, seed: 'melon_seed',   sell: 140, seedCost: 85, color: '#3f9e4d' },
    pumpkin: { name: '南瓜',   seasons: [2], days: 7, seed: 'pumpkin_seed', sell: 175, seedCost: 105, color: '#e08a2d' },
    snowfl:  { name: '雪绒花', seasons: [3], days: 5, seed: 'snowfl_seed',  sell: 95,  seedCost: 58, color: '#bcd9ff' },
  };

  /* ---------------- 物品 ---------------- */
  const I = (id, name, cat, sell, desc) => ({ id, name, cat, sell, desc });
  G.ITEMS = {};
  [
    // 工具
    I('axe', '斧头', 'tool', 0, '砍伐树桩与树木，获得木头。'),
    I('pick', '十字镐', 'tool', 0, '敲碎石块，获得石头。'),
    I('hoe', '锄头', 'tool', 0, '清理杂草、开垦农田。'),
    I('can', '水壶', 'tool', 0, '给作物浇水，作物每天需要水。'),
    I('rod', '鱼竿', 'tool', 0, '在湖边或码头钓鱼。'),
    // 材料
    I('wood', '木头', 'mat', 3, '建造设施的基本材料。'),
    I('stone', '石头', 'mat', 3, '结实的建筑材料。'),
    I('fiber', '纤维', 'mat', 2, '搓绳子的好材料。'),
    // 种子（由作物表生成）
    // 农产品
    I('turnip', '小萝卜', 'crop', 35, '爽脆的春季萝卜。可食用 +15 体力。'),
    I('potato', '土豆', 'crop', 75, '沉甸甸的春季土豆。可食用 +22 体力。'),
    I('tomato', '番茄', 'crop', 65, '酸甜多汁的夏季番茄。可食用 +18 体力。'),
    I('melon', '西瓜', 'crop', 140, '盛夏的甜蜜巨果。可食用 +35 体力。'),
    I('pumpkin', '南瓜', 'crop', 175, '秋收之星，能做一整桌菜。可食用 +30 体力。'),
    I('snowfl', '雪绒花', 'crop', 95, '寒冬绽放的奇迹之花。可食用 +10 体力。'),
    // 觅食
    I('berry', '野莓', 'forage', 25, '森林灌木上的红果子。可食用 +10 体力。'),
    I('mushroom', '蘑菇', 'forage', 40, '秋雨后的林中珍品。可食用 +14 体力。'),
    I('winterroot', '雪参', 'forage', 45, '雪地里刨出的补品根茎。可食用 +25 体力。'),
    I('flower', '野花', 'forage', 15, '路边的小花，莉莉最喜欢。'),
    // 牧场
    I('egg', '鸡蛋', 'food', 45, '鸡舍每天产的新鲜蛋。可食用 +20 体力。'),
    // 鱼
    I('fish_sardine', '小银鱼', 'fish', 30, '湖里常见的小鱼。'),
    I('fish_carp', '鲫鱼', 'fish', 55, '沉稳的湖底住民。'),
    I('fish_perch', '河鲈', 'fish', 85, '条纹漂亮的猎手。'),
    I('fish_trout', '虹鳟', 'fish', 130, '桥那头深水区才有的珍品。'),
    I('fish_legend', '月影鱼', 'fish', 600, '传说月圆之夜才会浮现的幻之鱼。'),
  ].forEach(it => G.ITEMS[it.id] = it);
  Object.keys(G.CROPS).forEach(cid => {
    const c = G.CROPS[cid];
    G.ITEMS[c.seed] = I(c.seed, c.name + '种子', 'seed', Math.floor(c.seedCost / 2), c.name + '的种子（' + c.days + '天成熟）。');
    G.ITEMS[c.seed].seedCost = c.seedCost;
    G.ITEMS[c.seed].cropId = cid;
  });
  G.EAT_ENERGY = { turnip: 15, potato: 22, tomato: 18, melon: 35, pumpkin: 30, snowfl: 10, berry: 10, mushroom: 14, winterroot: 25, egg: 20 };
  G.EATABLE = Object.keys(G.EAT_ENERGY);

  /* ---------------- 建造设施 ---------------- */
  G.BUILDS = {
    sprinkler: { name: '洒水器', cost: { gold: 150, wood: 4 }, w: 1, h: 1,
      desc: '每天清晨自动浇灌上下左右四格作物。放在农田里。' },
    scarecrow: { name: '稻草人', cost: { gold: 80, wood: 3 }, w: 1, h: 1,
      desc: '守护周围 5 格内的作物，夜里乌鸦不敢来偷吃。' },
    coop: { name: '鸡舍', cost: { gold: 500, wood: 12 }, w: 2, h: 2,
      desc: '养一只母鸡，每天清晨产一枚鸡蛋。放在农场空地。' },
    bridge: { name: '小桥', cost: { gold: 200, wood: 20 }, special: true,
      desc: '修复湖边断掉的栈桥，通往深水区钓点（稀有鱼）。' },
  };

  /* ---------------- 村民 ---------------- */
  // 日程时段: [开始分钟, 结束分钟, 地图, 格x, 格y, 站姿表情/对话索引]
  G.NPCS = [
    {
      id: 'greg', name: '镇长 格雷戈里', hair: '#b8b8c0', shirt: '#3b5dc9', pants: '#4a3b2a',
      slots: [
        { f: 0, t: 510, map: null },
        { f: 510, t: 780, map: 'town', x: 17, y: 13, greet: '早上好！小镇就拜托你啦。' },
        { f: 780, t: 960, map: 'town', x: 26, y: 8, greet: '玛莎店里的种子很靠谱。' },
        { f: 960, t: 1230, map: 'town', x: 17, y: 15, greet: '广场的老井，是我爷爷那辈修的。' },
        { f: 1230, t: 1330, map: 'town', x: 27, y: 15, greet: '傍晚的湖风最舒服了。' },
        { f: 1330, t: 1440, map: null },
      ],
      lines: ['当年你爷爷把农场打理得漂漂亮亮的。', '把农场振兴起来，小镇就会重新热闹！', '有困难就去杂货店和锯木场问问。'],
    },
    {
      id: 'martha', name: '杂货商 玛莎', hair: '#a8642c', shirt: '#c94f7c', pants: '#5a4632',
      slots: [
        { f: 0, t: 540, map: null },
        { f: 540, t: 1020, map: 'town', x: 21, y: 8, greet: '欢迎光临！店里种子齐全~' },
        { f: 1020, t: 1230, map: 'town', x: 17, y: 12, greet: '下午出来透透气。' },
        { f: 1230, t: 1290, map: 'town', x: 26, y: 12, greet: '晚风里散步真惬意。' },
        { f: 1290, t: 1440, map: null },
      ],
      lines: ['每种作物只在特定季节生长哦。', '雨天不用浇水，大自然会帮忙~', '出货箱卖东西很方便，杂货店也收。'],
    },
    {
      id: 'zhou', name: '木匠 老周', hair: '#3a3a3a', shirt: '#c98a3b', pants: '#3e4a5a',
      slots: [
        { f: 0, t: 540, map: null },
        { f: 540, t: 960, map: 'forest', x: 14, y: 8, greet: '想建点什么？来我这儿看看图纸。' },
        { f: 960, t: 1230, map: 'town', x: 24, y: 15, greet: '下午来广场看看老朋友们。' },
        { f: 1230, t: 1440, map: null },
      ],
      lines: ['好木头要选纹理紧的。', '洒水器能帮你省下浇水的力气。', '修好湖边的栈桥，能钓到大家伙！'],
    },
    {
      id: 'hai', name: '渔夫 阿海', hair: '#2c4a8a', shirt: '#3f9e8a', pants: '#2a3a4a',
      slots: [
        { f: 0, t: 360, map: null },
        { f: 360, t: 720, map: 'lake', x: 22, y: 12, greet: '清晨的鱼最饿，咬钩最勤！' },
        { f: 720, t: 840, map: 'lake', x: 21, y: 10, greet: '换了个背风的位子。' },
        { f: 840, t: 900, map: null },
        { f: 900, t: 1200, map: 'lake', x: 22, y: 12, greet: '午后的鱼躲阴影里，要有耐心。' },
        { f: 1200, t: 1260, map: null },
        { f: 1260, t: 1320, map: 'lake', x: 20, y: 12, greet: '黄昏也是个不错的窗口。' },
        { f: 1320, t: 1440, map: null },
      ],
      lines: ['水深的地方鱼更金贵。', '浮标一沉就提竿，手要快！', '修好栈桥能去深水区，钓虹鳟。'],
    },
    {
      id: 'lily', name: '小女孩 莉莉', hair: '#e8c56a', shirt: '#7cc94f', pants: '#c9594f',
      slots: [
        { f: 0, t: 600, map: null },
        { f: 600, t: 840, map: 'town', x: 15, y: 14, greet: '哥哥姐姐早呀！' },
        { f: 840, t: 1080, map: 'forest', x: 20, y: 14, greet: '森林里有好多野花！' },
        { f: 1080, t: 1140, map: null },
        { f: 1140, t: 1260, map: 'town', x: 19, y: 16, greet: '广场喷泉会发光诶！' },
        { f: 1260, t: 1440, map: null },
      ],
      lines: ['等你农场丰收，给我吃最大南瓜！', '野花可以送人哦……比如送给我？', '昨晚我梦见会发光的大鱼！'],
    },
  ];

  /* ---------------- 任务 ---------------- */
  G.QUESTS = [
    { id: 'q1', name: '清理荒地', stat: 'cleared', goal: 12, reward: { gold: 120 },
      desc: '用锄头/斧头/镐清理农场的杂草、石块与树桩 ×12' },
    { id: 'q2', name: '播种希望', stat: 'planted', goal: 5, reward: { gold: 150, items: { turnip_seed: 3 } },
      desc: '开垦土地并播下 5 颗种子' },
    { id: 'q3', name: '初次收获', stat: 'harvested', goal: 3, reward: { gold: 200, items: { pumpkin_seed: 2 } },
      desc: '收获 3 份自己种的作物' },
    { id: 'q4', name: '邻里相认', stat: 'talked', goal: 4, reward: { gold: 150 },
      desc: '和 4 位不同的村民聊天（他们每天出现在不同地点）' },
    { id: 'q5', name: '垂钓入门', stat: 'fish', goal: 1, reward: { gold: 200 },
      desc: '在湖边钓上 1 条鱼' },
    { id: 'q6', name: '木料订单', type: 'deliver', item: 'wood', goal: 20, reward: { gold: 500 },
      desc: '老周需要木料：把 20 个木头交给锯木场（自动结算）' },
    { id: 'q7', name: '设施建设', stat: 'built', goal: 1, reward: { gold: 300 },
      desc: '在木匠处建造任意 1 个设施（洒水器/稻草人/鸡舍/小桥）' },
    { id: 'q8', name: '小镇商路', stat: 'earned', goal: 1500, reward: { gold: 400 },
      desc: '累计出售货物赚取 1500 金' },
    { id: 'q9', name: '渔获渐丰', stat: 'fish', goal: 5, reward: { gold: 350 },
      desc: '累计钓上 5 条鱼' },
    { id: 'q10', name: '丰收节', stat: 'harvested', goal: 20, reward: { gold: 800 },
      desc: '累计收获 20 份作物，让小镇重燃生机！' },
  ];

  /* ---------------- 鱼获权重 ---------------- */
  // pos: 0 浅水(岸/码头) 1 深水(桥后)
  G.FISH_TABLE = [
    { id: 'fish_sardine', w: [40, 10], min: 0 },
    { id: 'fish_carp', w: [30, 25], min: 0 },
    { id: 'fish_perch', w: [18, 30], min: 0 },
    { id: 'fish_trout', w: [6, 40], min: 1 },
    { id: 'fish_legend', w: [1, 8], min: 1 },
  ];
})();
