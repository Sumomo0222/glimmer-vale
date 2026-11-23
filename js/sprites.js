/* ============ 微光谷物语 · 像素美术（全程序化生成，无外部素材） ============ */
window.G = window.G || {};
(function () {
  'use strict';
  const TS = G.TS;

  function cv(w, h) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const x = c.getContext('2d');
    x.imageSmoothingEnabled = false;
    return { c, x };
  }
  G._cv = cv;

  // 字符画 → canvas
  G.makeSprite = function (rows, pal, scale) {
    scale = scale || 1;
    const { c, x } = cv(rows[0].length * scale, rows.length * scale);
    for (let y = 0; y < rows.length; y++) {
      const row = rows[y];
      for (let i = 0; i < row.length; i++) {
        const col = pal[row[i]];
        if (col) { x.fillStyle = col; x.fillRect(i * scale, y * scale, scale, scale); }
      }
    }
    return c;
  };
  function px(x, i, j, col, w, h) { x.fillStyle = col; x.fillRect(i, j, w || 1, h || 1); }
  function disc(x, cx, cy, r, col) {
    x.fillStyle = col;
    for (let j = -r; j <= r; j++) {
      const w = Math.floor(Math.sqrt(r * r - j * j) + 0.35);
      x.fillRect(cx - w, cy + j, w * 2 + 1, 1);
    }
  }
  function hash(a, b) { let h = (a * 374761393 + b * 668265263) | 0; h = (h ^ (h >> 13)) * 1274126177; return ((h ^ (h >> 16)) >>> 0) / 4294967295; }

  /* ---------------- 角色帧 ---------------- */
  const CHAR_PAL = (p) => ({
    '.': null, k: '#262018', s: '#f2c896', a: p.hat || p.hair, A: p.hatDark || p.hairDark || '#00000033',
    h: p.hair, c: p.shirt, C: p.shirtDark || p.shirt, p: p.pants, b: '#5a4028',
  });
  const F = {
    down0: [
      '................',
      '......aaaa......',
      '....aaaaaaaa....',
      '...aaaaaaaaaa...',
      '..aaaaaaaaaaaa..',
      '....ssssssss....',
      '....skssssks....',
      '.....ssssss.....',
      '....cccccccc....',
      '...cCccccccCc...',
      '..sccccccccccs..',
      '...CCCCCCCCCC...',
      '....pppppppp....',
      '....ppp..ppp....',
      '...bbb....bbb...',
      '................',
    ],
    down1: [
      '................',
      '......aaaa......',
      '....aaaaaaaa....',
      '...aaaaaaaaaa...',
      '..aaaaaaaaaaaa..',
      '....ssssssss....',
      '....skssssks....',
      '.....ssssss.....',
      '....cccccccc....',
      '...cCccccccCc...',
      '..sccccccccccs..',
      '...CCCCCCCCCC...',
      '....pppppppp....',
      '...pppp..pppp...',
      '..bbb......bbb..',
      '................',
    ],
    down2: [
      '................',
      '......aaaa......',
      '....aaaaaaaa....',
      '...aaaaaaaaaa...',
      '..aaaaaaaaaaaa..',
      '....ssssssss....',
      '....skssssks....',
      '.....ssssss.....',
      '....cccccccc....',
      '...cCccccccCc...',
      '..sccccccccccs..',
      '...CCCCCCCCCC...',
      '....pppppppp....',
      '....pppppppp....',
      '....bbb..bbb....',
      '................',
    ],
    up0: [
      '................',
      '......aaaa......',
      '....aaaaaaaa....',
      '...aaaaaaaaaa...',
      '..aaaaaaaaaaaa..',
      '....hhhhhhhh....',
      '....hhhhhhhh....',
      '.....hhhhhh.....',
      '....cccccccc....',
      '...cccccccccc...',
      '..sccccccccccs..',
      '...CCCCCCCCCC...',
      '....pppppppp....',
      '....ppp..ppp....',
      '...bbb....bbb...',
      '................',
    ],
    up1: [
      '................',
      '......aaaa......',
      '....aaaaaaaa....',
      '...aaaaaaaaaa...',
      '..aaaaaaaaaaaa..',
      '....hhhhhhhh....',
      '....hhhhhhhh....',
      '.....hhhhhh.....',
      '....cccccccc....',
      '...cccccccccc...',
      '..sccccccccccs..',
      '...CCCCCCCCCC...',
      '....pppppppp....',
      '...pppp..pppp...',
      '..bbb......bbb..',
      '................',
    ],
    up2: [
      '................',
      '......aaaa......',
      '....aaaaaaaa....',
      '...aaaaaaaaaa...',
      '..aaaaaaaaaaaa..',
      '....hhhhhhhh....',
      '....hhhhhhhh....',
      '.....hhhhhh.....',
      '....cccccccc....',
      '...cccccccccc...',
      '..sccccccccccs..',
      '...CCCCCCCCCC...',
      '....pppppppp....',
      '....pppppppp....',
      '....bbb..bbb....',
      '................',
    ],
    side0: [
      '................',
      '......aaaa......',
      '....aaaaaaaa....',
      '...aaaaaaaaaaa..',
      '..aaaaaaaaaaaa..',
      '....ssssssss....',
      '....ssssksss....',
      '.....ssssss.....',
      '....cccccccc....',
      '....cccccccc....',
      '...ccccccccs....',
      '...cCcccccccc...',
      '....pppppppp....',
      '....pppppppp....',
      '.....bbbbbb.....',
      '................',
    ],
    side1: [
      '................',
      '......aaaa......',
      '....aaaaaaaa....',
      '...aaaaaaaaaaa..',
      '..aaaaaaaaaaaa..',
      '....ssssssss....',
      '....ssssksss....',
      '.....ssssss.....',
      '....cccccccc....',
      '....cccccccc....',
      '...ccccccccs....',
      '...cCcccccccc...',
      '....pppppppp....',
      '...ppp....ppp...',
      '..bbb......bbb..',
      '................',
    ],
    side2: [
      '................',
      '......aaaa......',
      '....aaaaaaaa....',
      '...aaaaaaaaaaa..',
      '..aaaaaaaaaaaa..',
      '....ssssssss....',
      '....ssssksss....',
      '.....ssssss.....',
      '....cccccccc....',
      '....cccccccc....',
      '...ccccccccs....',
      '...cCcccccccc...',
      '....pppppppp....',
      '....pppppppp....',
      '......bbbb......',
      '................',
    ],
  };
  function charSet(p) {
    const pal = CHAR_PAL(p);
    const s = (rows) => G.makeSprite(rows, pal);
    const flip = (c) => {
      const { c: o, x } = cv(c.width, c.height);
      x.save(); x.translate(c.width, 0); x.scale(-1, 1); x.drawImage(c, 0, 0); x.restore();
      return o;
    };
    return {
      down: [s(F.down0), s(F.down1), s(F.down2)],
      up: [s(F.up0), s(F.up1), s(F.up2)],
      side: [s(F.side0), s(F.side1), s(F.side2)],
      left: [flip(s(F.side0)), flip(s(F.side1)), flip(s(F.side2))],
    };
  }

  /* ---------------- 场景道具（手绘字符画） ---------------- */
  const P = { '.': null, k: '#2a2018', d: '#3a2c1a' };
  const PROP_DEFS = {
    weed: [
      '................',
      '................',
      '................',
      '................',
      '......g.........',
      '..g...gg...g....',
      '..gg..gg..gg....',
      '..gg.ggg..gg.g..',
      '...ggggg.ggg.gg.',
      '...ggggggggggg..',
      '..gggggggggggg..',
      '..GgggggggGggg..',
      '...GggggggGg....',
      '....GGggGG......',
      '................',
      '................',
    ],
    rock: [
      '................',
      '................',
      '................',
      '................',
      '.....kkkkk......',
      '....krrrrrk.....',
      '...krrWrrrrk....',
      '..krrrrrrrrrk...',
      '..krWrrrrrrrk...',
      '..krrrrrWrrrk...',
      '.krrrrrrrrrrrk..',
      '.krWrrrrrrrrik..',
      '.kriirrrrriiik..',
      '..kiiiiiiiiik...',
      '...kkkkkkkkk....',
      '................',
    ],
    stump: [
      '................',
      '................',
      '................',
      '................',
      '...kkkkkkkkk....',
      '..ktttttttttk...',
      '..ktWttttrttk...',
      '..ktrrtttrrtk...',
      '..ktttttrtttk...',
      '.kTttttttttTtk..',
      '.kTTttttttTTtk..',
      '.ktttttttttttk..',
      '..ktttttttttk...',
      '..ktTTTTTTTtk...',
      '...kkkkkkkkk....',
      '................',
    ],
    log: [
      '................',
      '................',
      '................',
      '................',
      '................',
      '..kkkkkkkkkkkk..',
      '.kttttttttttttk.',
      'ktttttttttttttTk',
      'ktWttttttttttTk.',
      'kttttttttttttttk',
      'kTttttttttttttk.',
      '.kttttttttttttk.',
      '..kkkkkkkkkkkk..',
      '................',
      '................',
      '................',
    ],
    sign: [
      '................',
      '.kkkkkkkkkkkkk..',
      '.kwwwwwwwwwwwk..',
      '.kwWWWWWWWWWwk..',
      '.kwwwwwwwwwwwk..',
      '.kwWWWwwWWWWwk..',
      '.kwwwwwwwwwwwk..',
      '.kkkkkkkkkkkkk..',
      '......kTk.......',
      '......kTk.......',
      '......kTk.......',
      '......kTk.......',
      '......kTk.......',
      '.....kTTTk......',
      '....kkkkkkk.....',
      '................',
    ],
    lamp: [
      '................',
      '.....kkkkk......',
      '....kyyyyyk.....',
      '....kyYyyyyk....',
      '....kyyyyyk.....',
      '.....kkkkk......',
      '.......k........',
      '.......k........',
      '.......k........',
      '.......k........',
      '.......k........',
      '.......k........',
      '.......k........',
      '......kkk.......',
      '.....kkkkk......',
      '................',
    ],
    fence: [
      '................',
      '................',
      '.kk..........kk.',
      '.kwwkkkkkkkkwwk.',
      '.kwwwwwwwwwwwwk.',
      '.kwwwwwwwwwwwwk.',
      '.kkkkkkkkkkkkkk.',
      '................',
      '.kk..........kk.',
      '.kwwkkkkkkkkwwk.',
      '.kwwwwwwwwwwwwk.',
      '.kwwwwwwwwwwwwk.',
      '.kkkkkkkkkkkkkk.',
      '................',
      '................',
      '................',
    ],
    reed: [
      '................',
      '................',
      '.....g..g.......',
      '..g..g..g..g....',
      '..g.ggg.g..g....',
      '...ggg.ggg.g....',
      '...ggggggggg....',
      '....ggggggg.....',
      '....gggggg......',
      '.....gggg.......',
      '.....Ggg........',
      '.....Gg.........',
      '................',
      '................',
      '................',
      '................',
    ],
    bench: [
      '................',
      '................',
      '................',
      '................',
      '.kkkkkkkkkkkkkk.',
      '.kwwwwwwwwwwwwk.',
      '.kwwwwwwwwwwwwk.',
      '.kkkkkkkkkkkkkk.',
      '..kk........kk..',
      '..kwk......kwk..',
      '..kwk......kwk..',
      '..kwk......kwk..',
      '..kkk......kkk..',
      '................',
      '................',
      '................',
    ],
    flowerbed: [
      '................',
      '................',
      '................',
      '................',
      '................',
      '...f...f....f...',
      '..fff.ff..fff...',
      '...f...f....f...',
      '..kkkkkkkkkkkk..',
      '.kmmmmmmmmmmmmk.',
      '.kmMmmMMmmmMMmk.',
      '.kmmmmmmmmmmmmk.',
      '.kMMmmmMMmmMMmk.',
      '.kkkkkkkkkkkkkk.',
      '................',
      '................',
    ],
    well: [
      '................',
      '....rrrrrrrr....',
      '...rrrrrrrrrr...',
      '..rrrrRRRRrrrr..',
      '..rrrR....Rrrr..',
      '..rrR......Rrr..',
      '..rrR......Rrr..',
      '..rrrR....Rrrr..',
      '..rrrrRRRRrrrr..',
      '...rrrrrrrrrr...',
      '....rrrrrrrr....',
      '.....rrrrrr.....',
      '.....rrrrrr.....',
      '....rrrrrrrr....',
      '...rrrrrrrrrr...',
      '................',
    ],
    bin: [
      '................',
      '................',
      '..kkkkkkkkkkkk..',
      '.kwwwwwwwwwwwwk.',
      '.kwWwwwwwwwwWwk.',
      '.kkkkkkkkkkkkkk.',
      '.kwwwwwwwwwwwwk.',
      '.kwwwwGGGGwwwwk.',
      '.kwwwwGggGwwwwk.',
      '.kwWwwGGGGwwwwk.',
      '.kwwwwwwwwwwwwk.',
      '.kwwwwwwwwwwwwk.',
      '.kwWwwwwwwwwWwk.',
      '.kkkkkkkkkkkkkk.',
      '................',
      '................',
    ],
    sprinkler: [
      '................',
      '................',
      '................',
      '................',
      '................',
      '.......k........',
      '......kgk.......',
      '.....kgggk......',
      '....kkoggkk.....',
      '....kooooo k....',
      '...kkooooookk...',
      '...kmoooooomk...',
      '...kkkkkkkkkk...',
      '................',
      '................',
      '................',
    ],
    scarecrow: [
      '.....AAAAAA.....',
      '....AAAAAAAA....',
      '.....AssssA.....',
      '......ssss......',
      '......kkkk......',
      '....cccccccc....',
      '...cccccccccc...',
      'ww-cccccccc-ww..',
      '....cccccccc....',
      '....cccccccc....',
      '.....cccccc.....',
      '......kkkk......',
      '......kTk.......',
      '......kTk.......',
      '.....kTTTk......',
      '....kkkkkkk.....',
    ],
    bed: [
      '................',
      '..kkkkkkkkkkkk..',
      '.krrrrrrrrrrrrk.',
      '.krrrrrrrrrrrrk.',
      '.kwwwwwwwwwwwwk.',
      '.kwwwwwwwwwwwwk.',
      '.kqqqqqqqqqqqqk.',
      '.kqqqqqqqqqqqqk.',
      '.kqqqqqqqqqqqqk.',
      '.kqqqqqqqqqqqqk.',
      '.kqqqqqqqqqqqqk.',
      '.kqqqqqqqqqqqqk.',
      '.kTTTTTTTTTTTTk.',
      '.kTTTTTTTTTTTTk.',
      '.kkkkkkkkkkkkkk.',
      '................',
    ],
    table: [
      '................',
      '................',
      '................',
      '................',
      '..kkkkkkkkkkkk..',
      '..kwwwwwwwwwwk..',
      '..kwWWwwwwWWwk..',
      '..kkkkkkkkkkkk..',
      '....k......k....',
      '....kTk....kTk..',
      '....kTk....kTk..',
      '....kTk....kTk..',
      '...kkkkk..kkkkk.',
      '................',
      '................',
      '................',
    ],
    plant: [
      '................',
      '................',
      '......gg........',
      '...gg.gg..gg....',
      '..gggggggggg....',
      '..ggGggggGgg....',
      '...gggggggg.....',
      '....GggggG......',
      '.....gggg.......',
      '....kkkkkk......',
      '....kttttk......',
      '....kttttk......',
      '....kkkkkk......',
      '................',
      '................',
      '................',
    ],
  };
  PROP_DEFS.weed = PROP_DEFS.weed.map(r => r);

  // 树（16x28，季节换色）与冬季秃树
  function treeSprite(leaf, leafDark, trunk) {
    const pal = { '.': null, k: '#2a2018', L: leaf, l: leafDark, t: trunk, T: '#4a3520', W: '#ffffff44' };
    const rows = [
      '................',
      '.....LLLLLL.....',
      '...LLLLLLLLLL...',
      '..LLlLLLLLLlLL..',
      '.LLLLLLWWLLLLLL.',
      '.LLlLLLLLLLLlLL.',
      'LLLLLLlWWlLLLLLL',
      'LLlLLLLLLLLLLlLL',
      'LLLLLLlLLLLLLLLL',
      '.LLlLLLLLLlLLL..',
      '.LLLLLLlLLLLLL..',
      '..LLLlLLLLLLl...',
      '...LLLLLLLLLL...',
      '....LLLLLLLL....',
      '.....llllll.....',
      '......ktk.......',
      '......ktk.......',
      '......kTk.......',
      '.....kkTkk......',
      '....kkTTTkk.....',
      '....kTTTTTk.....',
      '.....kkkkk......',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
    ];
    return G.makeSprite(rows, pal);
  }
  const TREE_ROWS_WINTER = [
    '................',
    '................',
    '...k........k...',
    '....k......k....',
    '.....k....k.....',
    '..k...k..k...k..',
    '...k..k..k..k...',
    '....k.kk.kk.k...',
    '.....kkkkkk.....',
    '......k..k......',
    '......kTTk......',
    '.....kkTTkk.....',
    '....kkTTTTkk....',
    '....kTTTTTTk....',
    '.....kkkkkk.....',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
  ];

  const PROP_EXTRA_PAL = {
    g: '#5f9e3e', G: '#4a7d2e', r: '#8a8f96', R: '#6e737a', W: '#c8ccd2', i: '#5a5f66',
    w: '#d9b98a', Ww: '#c4a273', t: '#b08a5a', T: '#8a6a42', m: '#7a5a38', M: '#5f4529',
    y: '#ffe98a', Y: '#d9a521', f: '#e86379', o: '#d97f2a', q: '#e8e4d8', A: '#e8c56a',
    k: '#2a2018', c: '#c9764f', '-': null,
  };
  // 修正 weed 里不存在字符
  PROP_DEFS.weed = [
    '................',
    '................',
    '................',
    '................',
    '......g.........',
    '..g...gg...g....',
    '..gg..gg..gg....',
    '..gg.ggg..gg.g..',
    '...ggggg.ggg.gg.',
    '...ggggggggggg..',
    '..gggggggggggg..',
    '..GgggggggGggg..',
    '...GggggggGg....',
    '....GGggGG......',
    '................',
    '................',
  ];

  /* ---------------- 觅食物 ---------------- */
  function bushSprite(berry) {
    const pal = { '.': null, k: '#2a2018', g: '#4f8a3d', G: '#3a6a2c', b: berry ? '#e0453a' : null, B: berry ? '#a83228' : null };
    const rows = [
      '................',
      '................',
      '................',
      '................',
      '................',
      '.....kkkkk......',
      '...kkgggggkk....',
      '..kggbgggbggk...',
      '..kggggggggggk..',
      '.kggbgggbgggbgk.',
      '.kggggggggggggk.',
      '.kGggggggbgggGk.',
      '..kGggggggggGk..',
      '...kGGggggGGk...',
      '....kkkkkkkk....',
      '................',
    ];
    return G.makeSprite(rows, pal);
  }
  function mushroomSprite() {
    return G.makeSprite([
      '................',
      '................',
      '................',
      '................',
      '................',
      '.....kkkkk......',
      '...kkrrrrrkk....',
      '..krrWWrrrrrk...',
      '..krrrrrWWrrk...',
      '.krrrrrrrrrrrk..',
      '.kkkkkkkkkkkkk..',
      '....kqwwwwqk....',
      '....kqwwwwqk....',
      '....kqqqqqqk....',
      '.....kkkkkk.....',
      '................',
    ], { '.': null, k: '#2a2018', r: '#c9453a', W: '#f0e8e0', q: '#f0e8d8', w: '#d8d0c0' });
  }
  function rootSprite() {
    return G.makeSprite([
      '................',
      '................',
      '................',
      '................',
      '......gg.g......',
      '.......gg.......',
      '....kkkggkkk....',
      '...kWWWWWWWWk...',
      '..kWWWWWWWWWWk..',
      '..kWWWWWWWWWk...',
      '..kkWWWWWWWkk...',
      '...kkWWWWWkk....',
      '....kkWWWkk.....',
      '......kWk.......',
      '.......k........',
      '................',
    ], { '.': null, k: '#5a6a7a', W: '#e8eef2', g: '#7a9a5a' });
  }
  function flowerSprite(col) {
    return G.makeSprite([
      '................',
      '................',
      '................',
      '................',
      '......fff.......',
      '.....fWfff......',
      '....ffWffff.....',
      '.....ffff.f.....',
      '......fFF.......',
      '.......g........',
      '......gg........',
      '....g.gg........',
      '.....ggg........',
      '......Gg........',
      '................',
      '................',
    ], { '.': null, f: col, W: '#ffffffcc', F: '#d9a521', g: '#5f9e3e', G: '#4a7d2e' });
  }

  /* ---------------- 鸡舍（生成式） ---------------- */
  function coopSprite() {
    const { c, x } = cv(34, 30);
    // 屋顶
    x.fillStyle = '#8c3d2e';
    x.fillRect(0, 6, 34, 4);
    x.fillStyle = '#b5533c';
    for (let j = 0; j < 6; j++) {
      const inset = Math.max(0, 4 - j);
      x.fillRect(inset + 2, j, 30 - inset * 2, 1);
    }
    // 墙体
    x.fillStyle = '#d9b98a'; x.fillRect(2, 10, 30, 18);
    x.fillStyle = '#c4a273';
    for (let j = 12; j < 28; j += 5) x.fillRect(2, j, 30, 1);
    x.fillStyle = '#8a6a42'; x.fillRect(2, 28, 30, 2);
    // 门洞 + 坡道
    x.fillStyle = '#3a2c1a'; x.fillRect(13, 17, 8, 11);
    x.fillStyle = '#5a4028'; x.fillRect(15, 19, 4, 2);
    x.fillStyle = '#a5793c'; x.fillRect(12, 27, 10, 3);
    x.fillStyle = '#7c5a2e';
    for (let i = 12; i < 22; i += 3) x.fillRect(i, 27, 1, 3);
    // 窗
    x.fillStyle = '#2a2018'; x.fillRect(5, 13, 6, 6); x.fillRect(23, 13, 6, 6);
    x.fillStyle = '#ffe98a'; x.fillRect(6, 14, 4, 4); x.fillRect(24, 14, 4, 4);
    // 描边
    x.strokeStyle = '#2a2018'; x.strokeRect(2.5, 10.5, 29, 18); x.strokeRect(1.5, 5.5, 31, 5);
    return c;
  }

  /* ---------------- 建筑（生成式） ---------------- */
  function buildingSprite(style, w, h) {
    const W = w * TS, H = h * TS;
    const roofH = Math.floor(H * 0.42);
    const { c, x } = cv(W, H + roofH + 2);
    // 墙
    x.fillStyle = style.wall; x.fillRect(0, roofH, W, H);
    x.fillStyle = style.wallLine;
    for (let j = roofH + 7; j < roofH + H; j += 8) x.fillRect(2, j, W - 4, 1);
    x.fillStyle = '#00000022';
    x.fillRect(0, roofH, W, 2);
    x.fillStyle = '#8a8a8a'; // 石基
    for (let i = 0; i < W; i += 8) { x.fillStyle = i % 16 ? '#9a948a' : '#8a857c'; x.fillRect(i, roofH + H - 5, 7, 5); }
    x.fillStyle = '#2a2018'; x.fillRect(0, roofH + H - 6, W, 1);
    // 屋顶（梯形）
    for (let j = 0; j < roofH; j++) {
      const t = j / roofH;
      const inset = Math.floor((1 - t) * (W * 0.18));
      x.fillStyle = j < 2 ? style.roofDark : style.roof;
      x.fillRect(inset - 2, j, W - inset * 2 + 4, 1);
      if (j > roofH - 6) { x.fillStyle = style.roofDark; x.fillRect(inset - 4, j, W - inset * 2 + 8, 1); }
    }
    x.fillStyle = '#00000033';
    x.fillRect(0, roofH - 1, W, 3);
    // 脊线
    x.fillStyle = style.roofDark; x.fillRect(W * 0.32, 0, W * 0.36, 2);
    // 烟囱
    if (style.chimney) { x.fillStyle = '#7a5a48'; x.fillRect(W - 14, 2, 7, 12); x.fillStyle = '#5a4034'; x.fillRect(W - 15, 1, 9, 3); }
    // 门
    const doorX = Math.floor(W * 0.28), doorY = roofH + H - 24;
    x.fillStyle = '#2a2018'; x.fillRect(doorX - 1, doorY - 1, 16, 25);
    x.fillStyle = style.door; x.fillRect(doorX, doorY, 14, 24);
    x.fillStyle = '#00000033'; x.fillRect(doorX + 9, doorY, 5, 24);
    x.fillStyle = '#e8c56a'; x.fillRect(doorX + 10, doorY + 12, 2, 2);
    // 窗（两个）
    const wins = [[Math.floor(W * 0.08), roofH + 10], [Math.floor(W * 0.74), roofH + 10]];
    wins.forEach(([wx, wy]) => {
      x.fillStyle = '#2a2018'; x.fillRect(wx - 1, wy - 1, 13, 13);
      x.fillStyle = '#8a6a42'; x.fillRect(wx, wy, 11, 11);
      x.fillStyle = '#bfe3ff'; x.fillRect(wx + 1, wy + 1, 9, 9);
      x.fillStyle = '#8a6a42'; x.fillRect(wx + 5, wy, 1, 11); x.fillRect(wx, wy + 5, 11, 1);
    });
    // 门牌小图标
    if (style.signIcon) {
      const sx = Math.floor(W * 0.52), sy = roofH + 12;
      x.fillStyle = '#5a4028'; x.fillRect(sx, sy, 12, 14);
      x.fillStyle = '#e8d9b0'; x.fillRect(sx + 1, sy + 1, 10, 10);
      x.fillStyle = style.signIcon;
      disc(x, sx + 5, sy + 6, 3, style.signIcon);
    }
    return { cv: c, glow: wins.map(([wx, wy]) => ({ x: wx, y: wy, w: 11, h: 11 })), doorY: roofH };
  }

  /* ---------------- 作物阶段 ---------------- */
  function cropStages(color) {
    const stages = [];
    // 0 播种
    let { c, x } = cv(TS, TS);
    x.fillStyle = '#3a2a18';
    x.fillRect(5, 10, 2, 1); x.fillRect(9, 11, 2, 1); x.fillRect(7, 8, 2, 1);
    x.fillStyle = '#6b4a2a'; x.fillRect(6, 9, 4, 2);
    stages.push(c);
    // 1 发芽
    ({ c, x } = cv(TS, TS));
    x.fillStyle = '#5f9e3e';
    x.fillRect(7, 9, 2, 4);
    x.fillStyle = '#71b04e';
    x.fillRect(5, 8, 2, 2); x.fillRect(9, 8, 2, 2);
    x.fillStyle = '#8fd45a'; x.fillRect(7, 7, 2, 2);
    stages.push(c);
    // 2 生长
    ({ c, x } = cv(TS, TS));
    x.fillStyle = '#4a7d2e';
    x.fillRect(7, 5, 2, 8);
    x.fillStyle = '#5f9e3e';
    x.fillRect(3, 6, 4, 2); x.fillRect(9, 6, 4, 2);
    x.fillRect(2, 9, 3, 2); x.fillRect(11, 9, 3, 2);
    x.fillStyle = '#71b04e'; x.fillRect(6, 4, 4, 2);
    stages.push(c);
    // 3 成熟（带果实）
    ({ c, x } = cv(TS, TS));
    x.fillStyle = '#4a7d2e';
    x.fillRect(7, 3, 2, 6);
    x.fillStyle = '#5f9e3e';
    x.fillRect(2, 4, 4, 2); x.fillRect(10, 4, 4, 2);
    disc(x, 7, 9, 4, color);
    x.fillStyle = '#00000044'; x.fillRect(4, 11, 8, 1);
    x.fillStyle = '#ffffffaa'; x.fillRect(5, 7, 2, 2);
    stages.push(c);
    // 枯萎
    ({ c, x } = cv(TS, TS));
    x.fillStyle = '#8a7a5a';
    x.fillRect(7, 8, 2, 5);
    x.fillStyle = '#6a5a3a';
    x.fillRect(4, 8, 3, 1); x.fillRect(9, 7, 3, 1);
    x.fillRect(5, 6, 2, 1); x.fillRect(10, 5, 2, 1);
    x.fillStyle = '#4a4030'; x.fillRect(6, 12, 4, 1);
    stages.push(c);
    return stages;
  }

  /* ---------------- 瓦片 ---------------- */
  function tileGrass(season, variant) {
    const A = G.SEASON_COLORS.grassA[season], B = G.SEASON_COLORS.grassB[season];
    const dark = ['#4a7d2e', '#3f6d28', '#8a6a2e', '#a8b4ba'][season];
    const { c, x } = cv(TS, TS);
    x.fillStyle = variant ? A : B; x.fillRect(0, 0, TS, TS);
    for (let i = 0; i < 7; i++) {
      const rx = Math.floor(hash(i * 13 + variant, season * 7 + i) * TS);
      const ry = Math.floor(hash(i * 7 + variant * 3, i * 17 + season) * TS);
      x.fillStyle = dark; x.fillRect(rx, ry, 1, 2);
    }
    if (season === 0 && variant === 2) { x.fillStyle = '#f0d0e0'; x.fillRect(4, 5, 1, 1); x.fillRect(10, 10, 1, 1); x.fillStyle = '#ffe98a'; x.fillRect(11, 4, 1, 1); }
    if (season === 2 && variant === 1) { x.fillStyle = '#d97f2a'; x.fillRect(5, 8, 1, 1); x.fillRect(12, 3, 1, 1); }
    if (season === 3 && variant === 3) { x.fillStyle = '#ffffff'; x.fillRect(6, 6, 2, 1); x.fillRect(2, 12, 2, 1); }
    return c;
  }
  function tilePath(season) {
    const { c, x } = cv(TS, TS);
    x.fillStyle = '#d8c08a'; x.fillRect(0, 0, TS, TS);
    for (let i = 0; i < 6; i++) {
      const rx = Math.floor(hash(i * 3, i * 11) * TS), ry = Math.floor(hash(i * 5, i * 2) * TS);
      x.fillStyle = i % 2 ? '#c4a878' : '#e5d2a5'; x.fillRect(rx, ry, 2, 1);
    }
    x.fillStyle = '#b89a68'; x.fillRect(3, 7, 2, 2); x.fillRect(11, 12, 2, 1);
    return c;
  }
  function tileWater(frame, season) {
    const base = G.SEASON_COLORS.water[season];
    const { c, x } = cv(TS, TS);
    x.fillStyle = base; x.fillRect(0, 0, TS, TS);
    x.fillStyle = '#00000022';
    for (let i = 0; i < 4; i++) {
      const rx = Math.floor(hash(i * 7, i) * TS), ry = Math.floor(hash(i, i * 5) * TS);
      x.fillRect(rx, ry, 3, 1);
    }
    x.fillStyle = '#ffffff55';
    const off = frame * 4;
    x.fillRect((2 + off) % TS, 3, 4, 1); x.fillRect((9 + off) % TS, 9, 5, 1); x.fillRect((5 + off) % TS, 14, 3, 1);
    return c;
  }
  function tileSoil(wet) {
    const { c, x } = cv(TS, TS);
    x.fillStyle = wet ? '#5a3f28' : '#8a6a42'; x.fillRect(0, 0, TS, TS);
    x.fillStyle = wet ? '#4a3320' : '#77573a';
    x.fillRect(0, 3, TS, 1); x.fillRect(0, 8, TS, 1); x.fillRect(0, 13, TS, 1);
    x.fillStyle = wet ? '#6b4d30' : '#9a7a50';
    x.fillRect(0, 1, TS, 1); x.fillRect(0, 6, TS, 1); x.fillRect(0, 11, TS, 1);
    return c;
  }
  function tilePier() {
    const { c, x } = cv(TS, TS);
    x.fillStyle = '#b08a5a'; x.fillRect(0, 0, TS, TS);
    x.fillStyle = '#8a6a42'; x.fillRect(0, 4, TS, 1); x.fillRect(0, 10, TS, 1);
    x.fillStyle = '#9a7a50'; x.fillRect(0, 1, TS, 1); x.fillRect(0, 7, TS, 1); x.fillRect(0, 13, TS, 1);
    x.fillStyle = '#2a2018'; x.fillRect(2, 0, 1, TS); x.fillRect(12, 0, 1, TS);
    return c;
  }
  function tileFloor() {
    const { c, x } = cv(TS, TS);
    x.fillStyle = '#c9a878'; x.fillRect(0, 0, TS, TS);
    x.fillStyle = '#b08a5a'; x.fillRect(0, 7, TS, 1);
    x.fillStyle = '#d8bc90'; x.fillRect(0, 2, TS, 1); x.fillRect(0, 11, TS, 1);
    x.fillStyle = '#a5793c'; x.fillRect(5, 0, 1, 7); x.fillRect(11, 8, 1, 8);
    return c;
  }
  function tileWall() {
    const { c, x } = cv(TS, TS);
    x.fillStyle = '#e8dcc0'; x.fillRect(0, 0, TS, TS);
    x.fillStyle = '#d0c0a0'; x.fillRect(0, 12, TS, 4);
    x.fillStyle = '#bfa878'; x.fillRect(0, 12, TS, 1);
    x.fillStyle = '#00000011'; x.fillRect(0, 5, TS, 1);
    return c;
  }
  function tileRug() {
    const { c, x } = cv(TS, TS);
    x.fillStyle = '#b5533c'; x.fillRect(0, 0, TS, TS);
    x.fillStyle = '#e0a04a'; x.fillRect(1, 1, TS - 2, TS - 2);
    x.fillStyle = '#b5533c'; x.fillRect(3, 3, TS - 6, TS - 6);
    x.fillStyle = '#e0a04a'; x.fillRect(6, 6, 4, 4);
    return c;
  }

  /* ---------------- 物品图标 ---------------- */
  function iconSeed(color) {
    const { c, x } = cv(TS, TS);
    x.fillStyle = '#d8c08a'; x.fillRect(3, 3, 10, 11);
    x.fillStyle = '#b89a68'; x.fillRect(3, 3, 10, 2); x.fillRect(3, 12, 10, 2);
    x.fillStyle = '#2a2018'; x.strokeStyle = '#2a2018'; x.strokeRect(3.5, 3.5, 9, 10);
    x.fillStyle = color; x.fillRect(6, 7, 4, 4);
    x.fillStyle = '#ffffff88'; x.fillRect(6, 7, 2, 2);
    return c;
  }
  function iconCircle(color, dark, leafy) {
    const { c, x } = cv(TS, TS);
    disc(x, 8, 9, 5, color);
    x.fillStyle = dark; x.fillRect(4, 12, 9, 1);
    x.fillStyle = '#ffffffaa'; x.fillRect(6, 6, 2, 2);
    if (leafy) { x.fillStyle = '#4a7d2e'; x.fillRect(7, 3, 2, 3); x.fillRect(5, 2, 3, 2); }
    return c;
  }
  function iconFish(color, fin) {
    const { c, x } = cv(TS, TS);
    x.fillStyle = color;
    x.fillRect(4, 8, 8, 3); x.fillRect(5, 7, 6, 5); x.fillRect(6, 6, 4, 7);
    x.fillStyle = fin; x.fillRect(12, 7, 3, 5); x.fillRect(6, 4, 3, 2); x.fillRect(6, 12, 3, 2);
    x.fillStyle = '#2a2018'; x.fillRect(5, 8, 1, 1);
    x.fillStyle = '#ffffff99'; x.fillRect(6, 7, 3, 1);
    return c;
  }
  function iconTool(kind) {
    const { c, x } = cv(TS, TS);
    const wood = '#a5793c', iron = '#b8bcc4', ironD = '#8a8f96';
    if (kind === 'axe') {
      x.fillStyle = wood; x.fillRect(7, 4, 2, 10);
      x.fillStyle = iron; x.fillRect(5, 3, 6, 4); x.fillRect(4, 4, 2, 2);
      x.fillStyle = ironD; x.fillRect(9, 4, 2, 3);
    } else if (kind === 'pick') {
      x.fillStyle = wood; x.fillRect(7, 4, 2, 10);
      x.fillStyle = iron; x.fillRect(3, 3, 10, 2); x.fillRect(2, 4, 3, 2); x.fillRect(11, 4, 3, 2);
    } else if (kind === 'hoe') {
      x.fillStyle = wood; x.fillRect(7, 3, 2, 11);
      x.fillStyle = iron; x.fillRect(4, 2, 5, 2); x.fillRect(4, 3, 2, 3);
    } else if (kind === 'can') {
      x.fillStyle = '#4f9ea0'; x.fillRect(4, 6, 8, 7); x.fillRect(2, 7, 2, 2);
      x.fillStyle = '#3a7a7c'; x.fillRect(4, 12, 8, 1); x.fillRect(12, 5, 1, 4);
      x.fillStyle = '#7cc4c6'; x.fillRect(5, 7, 3, 1);
      x.fillStyle = '#4f9ea0'; x.fillRect(11, 10, 3, 1); x.fillRect(13, 9, 1, 2);
    } else if (kind === 'rod') {
      x.fillStyle = wood; x.fillRect(8, 4, 2, 10);
      x.fillStyle = '#b8bcc4'; x.fillRect(9, 2, 1, 3);
      x.fillStyle = '#e8e8e8'; x.fillRect(11, 5, 2, 2);
      x.fillStyle = '#d9453a'; x.fillRect(11, 7, 1, 3);
    }
    return c;
  }
  function iconSimple(id) {
    const { c, x } = cv(TS, TS);
    if (id === 'wood') {
      x.fillStyle = '#b08a5a'; x.fillRect(2, 5, 12, 6);
      x.fillStyle = '#8a6a42'; x.fillRect(2, 5, 12, 1); x.fillRect(2, 10, 12, 1);
      x.fillStyle = '#d9b98a'; x.fillRect(2, 6, 3, 4); x.fillStyle = '#a5793c'; disc(x, 3, 8, 1, '#c9a06a');
    } else if (id === 'stone') {
      disc(x, 8, 9, 5, '#9aa0a8'); disc(x, 6, 7, 2, '#c8ccd2'); x.fillStyle = '#6e737a'; x.fillRect(4, 12, 9, 1);
    } else if (id === 'fiber') {
      x.fillStyle = '#c9b45a';
      for (let i = 0; i < 5; i++) { x.fillRect(4 + i, 4 + i, 1, 8 - (i > 2 ? 2 : 0)); x.fillRect(10 - i, 4 + i, 1, 8 - (i > 2 ? 2 : 0)); }
      x.fillStyle = '#e0d080'; x.fillRect(7, 4, 2, 8);
    } else if (id === 'berry') {
      disc(x, 6, 9, 3, '#e0453a'); disc(x, 10, 8, 3, '#c93830'); disc(x, 8, 11, 2, '#e0453a');
      x.fillStyle = '#4a7d2e'; x.fillRect(7, 4, 2, 3); x.fillStyle = '#ffffffaa'; x.fillRect(5, 8, 1, 1); x.fillRect(9, 7, 1, 1);
    } else if (id === 'egg') {
      disc(x, 8, 9, 4, '#f5f0e0'); x.fillStyle = '#d8d0b8'; x.fillRect(5, 12, 7, 1);
      x.fillStyle = '#ffffff'; x.fillRect(6, 6, 2, 2);
    } else if (id === 'flower') {
      x.fillStyle = '#e88aa0'; disc(x, 8, 7, 3, '#e88aa0'); disc(x, 8, 7, 1, '#ffe98a');
      x.fillStyle = '#5f9e3e'; x.fillRect(8, 10, 1, 4); x.fillRect(6, 11, 2, 1);
    } else if (id === 'winterroot') {
      x.fillStyle = '#e8eef2'; x.fillRect(7, 5, 3, 8); x.fillRect(5, 10, 2, 3); x.fillRect(10, 11, 2, 2);
      x.fillStyle = '#7a9a5a'; x.fillRect(8, 3, 2, 2);
    } else if (id === 'mushroom') {
      disc(x, 8, 7, 4, '#c9453a'); x.fillStyle = '#f0e8e0'; x.fillRect(7, 8, 3, 6); x.fillStyle = '#ffffff'; x.fillRect(6, 5, 2, 2); x.fillRect(10, 6, 1, 1);
    } else if (id === 'sprinkler') {
      x.fillStyle = '#8a8f96'; x.fillRect(6, 9, 5, 4); x.fillStyle = '#b8bcc4'; x.fillRect(7, 5, 3, 4);
      x.fillStyle = '#5fb8e8'; x.fillRect(4, 3, 2, 1); x.fillRect(11, 3, 2, 1); x.fillRect(8, 2, 1, 2);
    } else if (id === 'scarecrow') {
      x.fillStyle = '#a5793c'; x.fillRect(7, 8, 2, 7);
      x.fillStyle = '#c9764f'; x.fillRect(4, 6, 8, 4); x.fillRect(2, 6, 2, 2); x.fillRect(12, 6, 2, 2);
      x.fillStyle = '#e8c56a'; x.fillRect(5, 2, 6, 3); disc(x, 8, 7, 2, '#f2c896');
    } else if (id === 'coop') {
      x.fillStyle = '#b5533c'; x.fillRect(3, 4, 11, 3);
      x.fillStyle = '#d9b98a'; x.fillRect(4, 7, 9, 7);
      x.fillStyle = '#3a2c1a'; x.fillRect(7, 10, 3, 4);
      x.fillStyle = '#2a2018'; x.strokeRect(3.5, 3.5, 10, 11);
    } else if (id === 'bridge') {
      x.fillStyle = '#b08a5a'; x.fillRect(2, 6, 12, 5);
      x.fillStyle = '#8a6a42'; x.fillRect(2, 8, 12, 1);
      x.fillStyle = '#5a4028'; x.fillRect(3, 4, 1, 2); x.fillRect(12, 4, 1, 2);
    }
    return c;
  }

  /* ---------------- 汇总 ---------------- */
  G.buildSprites = function () {
    const S = G.SPR = {};
    // 季节瓦片
    S.tilesBySeason = [];
    for (let s = 0; s < 4; s++) {
      S.tilesBySeason[s] = {
        grass: [tileGrass(s, 0), tileGrass(s, 1), tileGrass(s, 2), tileGrass(s, 3)],
        path: tilePath(s),
        water: [tileWater(0, s), tileWater(1, s)],
      };
    }
    S.tilled = tileSoil(false);
    S.watered = tileSoil(true);
    S.pier = tilePier();
    S.bridge = tilePier();
    S.floor = tileFloor();
    S.wall = tileWall();
    S.rug = tileRug();
    // 树
    S.trees = [
      treeSprite('#71b04e', '#4a7d2e', '#b08a5a'),
      treeSprite('#4f9438', '#3a6a2c', '#a5793c'),
      treeSprite('#d08a3a', '#a8601f', '#9a7448'),
      G.makeSprite(TREE_ROWS_WINTER, { '.': null, k: '#5a4a3a', t: '#a5793c', T: '#7c5a2e' }),
    ];
    // 道具
    const weed = G.makeSprite(PROP_DEFS.weed, { '.': null, g: '#6aa84f', G: '#4a7d2e' });
    const weedFall = G.makeSprite(PROP_DEFS.weed, { '.': null, g: '#b09a4a', G: '#8a7432' });
    S.props = {
      weed: [weed, weedFall],
      rock: G.makeSprite(PROP_DEFS.rock, { '.': null, k: '#2a2018', r: '#8a8f96', W: '#c8ccd2', i: '#5a5f66' }),
      stump: G.makeSprite(PROP_DEFS.stump, { '.': null, k: '#2a2018', t: '#b08a5a', T: '#8a6a42', r: '#c9a06a', W: '#d9b98a' }),
      log: G.makeSprite(PROP_DEFS.log, { '.': null, k: '#2a2018', t: '#b08a5a', T: '#8a6a42', W: '#d9b98a' }),
      sign: G.makeSprite(PROP_DEFS.sign, { '.': null, k: '#5a4028', w: '#d8c08a', W: '#8a6a42', T: '#a5793c' }),
      lamp: G.makeSprite(PROP_DEFS.lamp, { '.': null, k: '#3a3a44', y: '#ffe98a', Y: '#fff' }),
      fence: G.makeSprite(PROP_DEFS.fence, { '.': null, k: '#5a4028', w: '#b08a5a' }),
      reed: G.makeSprite(PROP_DEFS.reed, { '.': null, g: '#6a9a4a', G: '#4a7d2e' }),
      bench: G.makeSprite(PROP_DEFS.bench, { '.': null, k: '#5a4028', w: '#c9a06a' }),
      flowerbed: G.makeSprite(PROP_DEFS.flowerbed, { '.': null, k: '#5a4028', f: '#e86379', m: '#7a5a38', M: '#5f4529' }),
      well: G.makeSprite(PROP_DEFS.well, { '.': null, r: '#9aa0a8', R: '#6e737a' }),
      bin: G.makeSprite(PROP_DEFS.bin, { '.': null, k: '#5a4028', w: '#c9a06a', W: '#a5793c', G: '#5a4028', g: '#8a6a42' }),
      sprinkler: G.makeSprite(PROP_DEFS.sprinkler, { '.': null, k: '#3a3a44', g: '#b8bcc4', o: '#5fb8e8', m: '#6e737a' }),
      scarecrow: G.makeSprite(PROP_DEFS.scarecrow, { '.': null, A: '#e8c56a', s: '#f2c896', c: '#c9764f', k: '#2a2018', T: '#a5793c', w: '#c9a06a', '-': null }),
      bed: G.makeSprite(PROP_DEFS.bed, { '.': null, k: '#5a4028', r: '#d97f7a', w: '#f5f0e0', q: '#8fd0e8', T: '#a5793c' }),
      table: G.makeSprite(PROP_DEFS.table, { '.': null, k: '#5a4028', w: '#c9a06a', W: '#a5793c', T: '#8a6a42' }),
      plant: G.makeSprite(PROP_DEFS.plant, { '.': null, g: '#5f9e3e', G: '#4a7d2e', k: '#8c5a3a', t: '#c9764f' }),
      bush: bushSprite(false), bushBerry: bushSprite(true),
      mushroom: mushroomSprite(), winterroot: rootSprite(),
      flower: flowerSprite('#e88aa0'), flowerSun: flowerSprite('#ffd964'),
      coop: coopSprite(),
    };
    // 角色
    S.player = charSet({
      hair: '#6b4a2a', hat: '#e8c56a', hatDark: '#c9a545',
      shirt: '#4f8a3d', shirtDark: '#3a6a2c', pants: '#6b5342',
    });
    S.npcs = {};
    G.NPCS.forEach(n => {
      S.npcs[n.id] = charSet({
        hair: n.hair, hat: n.hair, hatDark: '#00000022',
        shirt: n.shirt, shirtDark: n.shirt, pants: n.pants,
      });
    });
    // 作物
    S.crops = {};
    Object.keys(G.CROPS).forEach(id => { S.crops[id] = cropStages(G.CROPS[id].color); });
    // 建筑
    S.buildings = {};
    Object.keys(G.BUILDING_STYLE).forEach(t => {
      const st = Object.assign({}, G.BUILDING_STYLE[t]);
      st.chimney = (t === 'home');
      st.signIcon = { shop: '#e86379', sawmill: '#a5793c', mayor: '#ffd964', cottage: '#e88aa0', home: null }[t] || null;
      S.buildings[t] = buildingSprite(st, 4, 4);
    });
    // 图标
    S.icons = {};
    const ic = S.icons;
    ic.axe = iconTool('axe'); ic.pick = iconTool('pick'); ic.hoe = iconTool('hoe');
    ic.can = iconTool('can'); ic.rod = iconTool('rod');
    ic.wood = iconSimple('wood'); ic.stone = iconSimple('stone'); ic.fiber = iconSimple('fiber');
    ic.berry = iconSimple('berry'); ic.egg = iconSimple('egg'); ic.flower = iconSimple('flower');
    ic.winterroot = iconSimple('winterroot'); ic.mushroom = iconSimple('mushroom');
    ic.turnip = iconCircle('#f0e8f0', '#c9a5c9', true); ic.potato = iconCircle('#cfa763', '#9a7a42', false);
    ic.tomato = iconCircle('#e0453a', '#a82820', true); ic.melon = iconCircle('#4f9e3d', '#2f7a28', true);
    ic.pumpkin = iconCircle('#e08a2d', '#a8601f', true); ic.snowfl = iconCircle('#bcd9ff', '#8ab0d9', false);
    ic.fish_sardine = iconFish('#c8d8e8', '#8aa0b8'); ic.fish_carp = iconFish('#8a9a5a', '#5a7a3a');
    ic.fish_perch = iconFish('#5a9a8a', '#3a7a6a'); ic.fish_trout = iconFish('#d97f9a', '#a8506a');
    ic.fish_legend = iconFish('#e8d05a', '#a8892a');
    Object.keys(G.CROPS).forEach(id => { ic[G.CROPS[id].seed] = iconSeed(G.CROPS[id].color); });
    ic.sprinkler = iconSimple('sprinkler'); ic.scarecrow = iconSimple('scarecrow');
    ic.coop = iconSimple('coop'); ic.bridge = iconSimple('bridge');
    // 觅食物与产出映射（bush→berry 等）
    S.forageSprite = { berry: 'bushBerry', mushroom: 'mushroom', winterroot: 'winterroot', flower: 'flower' };
  };

  // 把图标等canvas画到目标ctx
  G.drawSpr = function (x, spr, dx, dy, dw, dh) {
    if (!spr) return;
    x.drawImage(spr, Math.round(dx), Math.round(dy), dw || spr.width, dh || spr.height);
  };
})();
