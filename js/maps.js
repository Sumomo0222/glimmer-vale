/* ============ 微光谷物语 · 地图 ============ */
window.G = window.G || {};
(function () {
  'use strict';
  function M(w, h, fill) {
    const g = [];
    for (let y = 0; y < h; y++) g.push(new Array(w).fill(fill || '.'));
    return g;
  }
  function rect(g, x0, y0, x1, y1, ch) {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++)
      if (g[y] && x >= 0 && x < g[y].length) g[y][x] = ch;
  }
  function border(g, x0, y0, x1, y1, ch) { rect(g, x0, y0, x1, y0, ch); rect(g, x0, y1, x1, y1, ch); rect(g, x0, y0, x0, y1, ch); rect(g, x1, y0, x1, y1, ch); }

  /* ---------------- 农场 40x28 ---------------- */
  function buildFarm() {
    const g = M(40, 28);
    rect(g, 0, 0, 39, 27, '.');
    // 边界树林带
    rect(g, 0, 0, 39, 1, ','); rect(g, 0, 26, 39, 27, ',');
    rect(g, 0, 0, 1, 27, ','); rect(g, 38, 0, 39, 27, ',');
    // 池塘（早期钓鱼点）
    rect(g, 2, 20, 7, 25, 'w');
    // 通往各出口的小路
    rect(g, 36, 13, 37, 14, 'p');            // 东→镇
    rect(g, 5, 1, 6, 2, 'p');                // 北→森林
    rect(g, 31, 25, 32, 26, 'p');            // 南→湖
    rect(g, 6, 2, 6, 8, 'p'); rect(g, 6, 8, 9, 8, 'p');  // 家门口小路
    return {
      id: 'farm', name: '微风农场', w: 40, h: 28, terrain: g,
      buildings: [
        { type: 'home', x: 4, y: 3, w: 4, h: 4, door: { x: 5, y: 6 } },
      ],
      props: [
        { type: 'bin', x: 10, y: 6 },
        { type: 'sign', x: 8, y: 8, text: '爷爷的农场：用锄头清理杂草，开垦土地，开始新生活吧！' },
        { type: 'flowerbed', x: 3, y: 8 }, { type: 'flowerbed', x: 8, y: 3 },
        { type: 'stump', x: 33, y: 3, static: true }, { type: 'tree', x: 2, y: 5, static: true },
        { type: 'tree', x: 36, y: 20, static: true }, { type: 'tree', x: 2, y: 17, static: true },
        { type: 'fence', x: 3, y: 7 }, { type: 'fence', x: 4, y: 7 }, { type: 'fence', x: 6, y: 7 },
        { type: 'fence', x: 7, y: 7 }, { type: 'fence', x: 3, y: 2 }, { type: 'fence', x: 3, y: 3 },
        { type: 'fence', x: 3, y: 4 }, { type: 'fence', x: 3, y: 5 }, { type: 'fence', x: 3, y: 6 },
        { type: 'lamp', x: 11, y: 4 },
      ],
      exits: [
        { x: 38, y: 12, w: 1, h: 4, to: 'town', tx: 1, ty: 13 },
        { x: 4, y: 0, w: 3, h: 1, to: 'forest', tx: 6, ty: 24 },
        { x: 30, y: 27, w: 3, h: 1, to: 'lake', tx: 18, ty: 2 },
      ],
      spawn: { x: 6, y: 7 },
      dynamic: true, // 杂物/树/农田由存档管理
    };
  }

  /* ---------------- 小镇 36x26 ---------------- */
  function buildTown() {
    const g = M(36, 26);
    rect(g, 0, 0, 35, 25, '.');
    rect(g, 0, 0, 35, 1, ','); rect(g, 0, 25, 35, 25, ',');
    rect(g, 0, 0, 0, 25, ','); rect(g, 35, 0, 35, 25, ',');
    // 主路：西入口 → 广场 → 南出口 / 北出口
    rect(g, 1, 13, 34, 14, 'p');
    rect(g, 17, 15, 19, 24, 'p');
    rect(g, 16, 1, 19, 2, 'p');
    rect(g, 14, 9, 22, 17, 'p'); // 广场
    return {
      id: 'town', name: '微光镇', w: 36, h: 26, terrain: g,
      buildings: [
        { type: 'shop', x: 20, y: 4, w: 4, h: 4, door: { x: 22, y: 7 }, label: '玛莎杂货店' },
        { type: 'mayor', x: 8, y: 4, w: 4, h: 4, label: '镇长家' },
        { type: 'cottage', x: 28, y: 4, w: 4, h: 4, label: '民居' },
      ],
      props: [
        { type: 'well', x: 18, y: 11 },
        { type: 'lamp', x: 14, y: 10 }, { type: 'lamp', x: 21, y: 10 },
        { type: 'lamp', x: 14, y: 16 }, { type: 'lamp', x: 21, y: 16 },
        { type: 'flowerbed', x: 15, y: 9 }, { type: 'flowerbed', x: 20, y: 9 },
        { type: 'flowerbed', x: 25, y: 17 }, { type: 'flowerbed', x: 10, y: 17 },
        { type: 'sign', x: 2, y: 12, text: '欢迎来到微光镇 ← 农场在西边' },
        { type: 'sign', x: 17, y: 3, text: '北：林间小路 · 南：湖畔步道' },
        { type: 'bench', x: 24, y: 13 }, { type: 'bench', x: 11, y: 13 },
        { type: 'tree', x: 26, y: 20, static: true }, { type: 'tree', x: 6, y: 20, static: true },
        { type: 'tree', x: 32, y: 12, static: true },
      ],
      exits: [
        { x: 0, y: 12, w: 1, h: 3, to: 'farm', tx: 37, ty: 13 },
        { x: 16, y: 25, w: 4, h: 1, to: 'lake', tx: 18, ty: 2 },
        { x: 16, y: 0, w: 4, h: 1, to: 'forest', tx: 34, ty: 22 },
      ],
      spawn: { x: 2, y: 13 },
    };
  }

  /* ---------------- 森林 36x26 ---------------- */
  function buildForest() {
    const g = M(36, 26);
    rect(g, 0, 0, 35, 25, ',');
    // 林间空地
    rect(g, 3, 8, 33, 23, '.');
    rect(g, 5, 1, 7, 2, 'p'); rect(g, 6, 2, 6, 8, 'p');
    rect(g, 6, 8, 15, 8, 'p'); // 锯木场前
    rect(g, 30, 21, 34, 22, 'p'); // 东→镇
    rect(g, 4, 23, 6, 24, 'p');  // 南→农场
    rect(g, 6, 23, 6, 20, 'p'); rect(g, 6, 20, 10, 20, 'p');
    return {
      id: 'forest', name: '月影森林', w: 36, h: 26, terrain: g,
      buildings: [
        { type: 'sawmill', x: 13, y: 4, w: 4, h: 4, door: { x: 14, y: 7 }, label: '老周锯木场' },
      ],
      props: [
        { type: 'sign', x: 5, y: 24, text: '南：微风农场 · 东：微光镇' },
        { type: 'sign', x: 31, y: 20, text: '东：微光镇' },
        { type: 'logpile', x: 18, y: 8 },
        { type: 'flowerbed', x: 22, y: 12 },
        { type: 'tree', x: 4, y: 9, static: true }, { type: 'tree', x: 10, y: 9, static: true },
        { type: 'tree', x: 20, y: 9, static: true }, { type: 'tree', x: 28, y: 8, static: true },
        { type: 'tree', x: 33, y: 10, static: true }, { type: 'tree', x: 3, y: 15, static: true },
        { type: 'tree', x: 33, y: 16, static: true }, { type: 'tree', x: 12, y: 22, static: true },
        { type: 'tree', x: 17, y: 23, static: true },
      ],
      // 觅食点（季节产物）
      forageSpots: [
        { x: 8, y: 12 }, { x: 22, y: 16 }, { x: 28, y: 20 }, { x: 12, y: 18 },
        { x: 25, y: 10 }, { x: 16, y: 13 }, { x: 31, y: 14 }, { x: 9, y: 21 },
      ],
      exits: [
        { x: 4, y: 25, w: 3, h: 1, to: 'farm', tx: 6, ty: 2 },
        { x: 35, y: 20, w: 1, h: 3, to: 'town', tx: 18, ty: 2 },
      ],
      spawn: { x: 6, y: 23 },
    };
  }

  /* ---------------- 湖边 32x24 ---------------- */
  function buildLake() {
    const g = M(32, 24);
    rect(g, 0, 0, 31, 23, '.');
    rect(g, 0, 0, 31, 1, ','); rect(g, 0, 0, 0, 23, ',');
    // 大湖
    rect(g, 13, 7, 31, 23, 'w');
    rect(g, 10, 10, 31, 23, 'w');
    // 码头
    rect(g, 20, 10, 24, 13, 'P');
    // 断桥缺口（可建造小桥）
    rect(g, 24, 14, 25, 15, 'P');
    // 缺口下的小岛
    rect(g, 23, 18, 27, 21, '.');
    rect(g, 24, 19, 26, 20, ',');
    rect(g, 16, 1, 19, 6, 'p'); // 北→镇
    return {
      id: 'lake', name: '月影湖', w: 32, h: 24, terrain: g,
      buildings: [],
      props: [
        { type: 'sign', x: 17, y: 2, text: '北：微光镇 · 码头尽头栈桥断裂，找老周修复吧' },
        { type: 'sign', x: 26, y: 18, text: '深水钓点：虹鳟与传说中的月影鱼' },
        { type: 'reed', x: 12, y: 12 }, { type: 'reed', x: 11, y: 16 }, { type: 'reed', x: 14, y: 8 },
        { type: 'reed', x: 22, y: 22 }, { type: 'reed', x: 9, y: 9 },
        { type: 'rock', x: 8, y: 14, static: true }, { type: 'rock', x: 5, y: 18, static: true },
        { type: 'tree', x: 3, y: 4, static: true }, { type: 'tree', x: 7, y: 3, static: true },
        { type: 'rock', x: 27, y: 18, static: true }, { type: 'reed', x: 28, y: 21 },
      ],
      // 断桥缺口瓦片（建桥后可通行，纵向连接码头与小岛）
      bridgeTiles: [{ x: 24, y: 16 }, { x: 24, y: 17 }],
      islandRect: { x: 23, y: 18, w: 5, h: 4 },
      exits: [
        { x: 16, y: 0, w: 4, h: 1, to: 'town', tx: 18, ty: 23 },
      ],
      spawn: { x: 18, y: 2 },
    };
  }

  /* ---------------- 家（室内） ---------------- */
  function buildHome() {
    const g = M(10, 8);
    rect(g, 0, 0, 9, 0, 'W');
    rect(g, 0, 1, 9, 7, 'f');
    rect(g, 0, 7, 9, 7, 'f');
    return {
      id: 'home', name: '家', w: 10, h: 8, terrain: g, indoor: true,
      buildings: [], props: [
        { type: 'bed', x: 2, y: 2, w: 1, h: 2 },
        { type: 'rug', x: 4, y: 4, w: 3, h: 2 },
        { type: 'table', x: 7, y: 2 },
        { type: 'plant', x: 8, y: 5 },
      ],
      exits: [{ x: 4, y: 7, w: 2, h: 1, to: 'farm', tx: 5, ty: 7 }],
      spawn: { x: 5, y: 6 },
    };
  }

  G.MAP_BUILDERS = { farm: buildFarm, town: buildTown, forest: buildForest, lake: buildLake, home: buildHome };
  G.MAPS = {};
  Object.keys(G.MAP_BUILDERS).forEach(k => { G.MAPS[k] = G.MAP_BUILDERS[k](); });

  // 建筑类型贴图配置（sprites.js 使用）
  G.BUILDING_STYLE = {
    home:    { roof: '#b5533c', roofDark: '#8c3d2e', wall: '#d9b98a', wallLine: '#c4a273', door: '#7c4a2a', label: '爷爷的家' },
    shop:    { roof: '#4f8a3d', roofDark: '#3a6a2c', wall: '#e8d9b0', wallLine: '#cbbb8e', door: '#5a3a20', label: '杂货店', sign: 'seed' },
    mayor:   { roof: '#5a6a9e', roofDark: '#43507a', wall: '#e0d5c0', wallLine: '#c4b7a0', door: '#5a3a20', label: '镇长家', sign: 'star' },
    cottage: { roof: '#c98a3b', roofDark: '#9c6a2a', wall: '#e8d0a8', wallLine: '#d0b488', door: '#5a3a20', label: '民居', sign: 'flower' },
    sawmill: { roof: '#7a5a3a', roofDark: '#5c4227', wall: '#b09468', wallLine: '#9a7f56', door: '#4a3018', label: '锯木场', sign: 'axe' },
  };

  // 农场动态物初始散布参数
  G.FARM_SCATTER = {
    field: { x0: 10, y0: 10, x1: 30, y1: 20 },
    weeds: 26, rocks: 10, stumps: 6, trees: 8,
    avoid: [ // 矩形禁区（建筑/路/出口/池塘周边）
      { x: 2, y: 1, w: 12, h: 10 }, { x: 30, y: 24, w: 9, h: 3 },
      { x: 35, y: 10, w: 5, h: 6 }, { x: 3, y: 19, w: 6, h: 8 },
      { x: 4, y: 0, w: 4, h: 9 }, { x: 28, y: 24, w: 6, h: 4 },
    ],
  };
})();
