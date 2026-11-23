/* ============ 微光谷物语 · 核心引擎 ============ */
window.G = window.G || {};
(function () {
  'use strict';
  const TS = G.TS;
  const SAVE_KEY = 'glimmerVale.save.v1';
  const MIN_PER_SEC = 2;           // 1现实秒 = 2游戏分钟
  const DAY_START = 360, DAY_END = 1560; // 6:00 → 次日2:00

  /* ================= 状态 ================= */
  G.state = null;
  G.running = false;
  G.paused = false;                // 面板/对话框/钓鱼时暂停
  G.view = { w: 480, h: 270, scale: 2 };

  function rng() { return Math.random(); }

  G.newGame = function () {
    const st = {
      ver: 1,
      map: 'farm', px: 6 * TS + 8, py: 7 * TS + 12, dir: 'down', frame: 0,
      gold: 500, energy: 100, maxEnergy: 100,
      day: 1, season: 0, year: 1, minute: DAY_START,
      weather: 'sun', tomorrowWeather: 'sun',
      inv: { turnip_seed: 8, potato_seed: 2, wood: 4, berry: 2 },
      handTool: 'hoe', handItem: null,
      farmTiles: {}, placed: [],
      built: { bridge: false },
      foragePicked: {},
      quests: {}, questsDoneToday: [],
      stats: { cleared: 0, planted: 0, harvested: 0, fish: 0, earned: 0, built: 0 },
      talkedUnique: {}, npcGreeted: {},
      dayLog: [], daySnap: null,
      flags: { intro: 0, ending: 0 },
    };
    G.QUESTS.forEach(q => st.quests[q.id] = { done: false });
    scatterFarm(st);
    st.daySnap = snapDay(st);
    G.state = st;
    return st;
  };

  function scatterFarm(st) {
    const F = G.FARM_SCATTER, f = F.field;
    let tries = 0, placedN = { weed: 0, rock: 0, stump: 0, tree: 0 };
    const target = { weed: F.weeds, rock: F.rocks, stump: F.stumps, tree: F.trees };
    while (tries < 800 && (placedN.weed < target.weed || placedN.rock < target.rock ||
      placedN.stump < target.stump || placedN.tree < target.tree)) {
      tries++;
      const x = f.x0 + Math.floor(rng() * (f.x1 - f.x0 + 1));
      const y = f.y0 + Math.floor(rng() * (f.y1 - f.y0 + 1));
      if (st.farmTiles[x + ',' + y]) continue;
      if (F.avoid.some(r => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h)) continue;
      const m = G.MAPS.farm;
      if (m.terrain[y][x] !== '.' && m.terrain[y][x] !== ',') continue;
      const roll = rng();
      let t = 'weed';
      if (roll > 0.88) t = 'rock'; else if (roll > 0.80) t = 'stump'; else if (roll > 0.70) t = 'tree';
      if (placedN[t] >= target[t]) continue;
      st.farmTiles[x + ',' + y] = { o: t, hp: t === 'rock' ? 2 : t === 'tree' ? 3 : 1 };
      placedN[t]++;
    }
  }

  function snapDay(st) {
    const s = st.stats;
    return { gold: st.gold, cleared: s.cleared, planted: s.planted, harvested: s.harvested, fish: s.fish, earned: s.earned, built: s.built, quests: G.QUESTS.filter(q => st.quests[q.id].done).length };
  }

  /* ================= 存档 ================= */
  G.hasSave = () => !!localStorage.getItem(SAVE_KEY);
  G.save = function (silent) {
    if (!G.state) return;
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(G.state));
      if (!silent) G.UI.toast('游戏已保存 💾', 'good');
    } catch (e) { if (!silent) G.UI.toast('保存失败：' + e.message, 'bad'); }
  };
  G.load = function () {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return false;
      const st = JSON.parse(raw);
      if (!st || st.ver !== 1) return false;
      G.state = st;
      return true;
    } catch (e) { return false; }
  };
  G.eraseSave = () => localStorage.removeItem(SAVE_KEY);

  /* ================= 地图工具 ================= */
  const SOLID_PROPS = { tree: 1, rock: 1, stump: 1, logpile: 1, sign: 1, lamp: 1, fence: 1, well: 1, bench: 1, bin: 1, bed: 1, table: 1 };
  function propFootprint(p) { return { w: p.w || 1, h: p.h || 1 }; }
  G.walkable = function (mapId, tx, ty) {
    const m = G.MAPS[mapId];
    if (tx < 0 || ty < 0 || tx >= m.w || ty >= m.h) return false;
    const t = m.terrain[ty][tx];
    if (t === 'w') {
      if (mapId === 'lake' && G.state && G.state.built.bridge &&
        G.MAPS.lake.bridgeTiles.some(b => b.x === tx && b.y === ty)) return true;
      return false;
    }
    if (t === 'W') return false;
    if (m.buildings && m.buildings.some(b => tx >= b.x && tx < b.x + b.w && ty >= b.y && ty < b.y + b.h)) return false;
    if (m.props && m.props.some(p => {
      if (!(p.type in SOLID_PROPS)) return false;
      const { w, h } = propFootprint(p);
      return tx >= p.x && tx < p.x + w && ty >= p.y && ty < p.y + h;
    })) return false;
    if (mapId === 'farm' && G.state) {
      const ft = G.state.farmTiles[tx + ',' + ty];
      if (ft && (ft.o === 'rock' || ft.o === 'stump' || ft.o === 'tree')) return false;
      if (G.state.placed.some(p => {
        const def = G.BUILDS[p.type];
        return tx >= p.x && tx < p.x + (def.w || 1) && ty >= p.y && ty < p.y + (def.h || 1);
      })) return false;
    }
    return true;
  };

  /* ================= 时间与天气 ================= */
  function fmtClock(min) {
    const h24 = Math.floor(min / 60) % 24, mm = Math.floor(min % 60 / 10) * 10;
    return (h24 < 10 ? '0' + h24 : h24) + ':' + (mm === 0 ? '00' : mm);
  }
  G.fmtClock = fmtClock;
  G.seasonName = () => G.SEASON_NAMES[G.state.season];

  function rollWeather() {
    const s = G.state.season, r = rng();
    if (s === 0) return r < .60 ? 'sun' : r < .82 ? 'cloud' : 'rain';
    if (s === 1) return r < .55 ? 'sun' : r < .75 ? 'cloud' : r < .92 ? 'rain' : 'storm';
    if (s === 2) return r < .45 ? 'sun' : r < .70 ? 'cloud' : 'rain';
    return r < .55 ? 'snow' : r < .75 ? 'sun' : 'cloud';
  }

  /* ================= 新的一天 ================= */
  G.newDay = function (penalty) {
    const st = G.state;
    st.day++;
    if (st.day > 28) { st.day = 1; st.season = (st.season + 1) % 4; if (st.season === 0) st.year++; }
    // 季节交替：不合季节的作物枯萎
    Object.keys(st.farmTiles).forEach(k => {
      const ft = st.farmTiles[k];
      if (ft.crop && !ft.crop.dead && !G.CROPS[ft.crop.id].seasons.includes(st.season)) {
        ft.crop.dead = 1; G.UI.dayLogLine('季节变换，[' + G.CROPS[ft.crop.id].name + '] 枯萎了…');
      }
    });
    // 生长
    Object.keys(st.farmTiles).forEach(k => {
      const ft = st.farmTiles[k];
      if (ft.crop && !ft.crop.dead) {
        const c = G.CROPS[ft.crop.id];
        if (c.seasons.includes(st.season) && ft.wet) {
          ft.crop.prog = Math.min(c.days, ft.crop.prog + 1);
          if (ft.crop.prog >= c.days) G.UI.dayLogLine(c.name + '成熟啦！');
        }
      }
      ft.wet = 0;
    });
    st.weather = st.tomorrowWeather || rollWeather();
    st.tomorrowWeather = rollWeather();
    if (st.weather === 'rain' || st.weather === 'storm' || st.weather === 'snow') {
      Object.keys(st.farmTiles).forEach(k => { if (st.farmTiles[k].tilled) st.farmTiles[k].wet = 1; });
      G.UI.dayLogLine({ rain: '下雨了，作物都被浇好了。', storm: '暴雨倾盆…作物被浇透了。', snow: '下雪了，银装素裹。' }[st.weather]);
    }
    // 洒水器
    st.placed.filter(p => p.type === 'sprinkler').forEach(p => {
      [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => {
        const ft = st.farmTiles[(p.x + dx) + ',' + (p.y + dy)];
        if (ft && ft.tilled) ft.wet = 1;
      });
    });
    // 乌鸦
    const crops = Object.keys(st.farmTiles).filter(k => st.farmTiles[k].crop && !st.farmTiles[k].crop.dead);
    if (crops.length && rng() < 0.28) {
      const unsafe = crops.filter(k => {
        const [x, y] = k.split(',').map(Number);
        return !st.placed.some(p => p.type === 'scarecrow' && Math.abs(p.x - x) <= 4 && Math.abs(p.y - y) <= 4);
      });
      if (unsafe.length) {
        const k = unsafe[Math.floor(rng() * unsafe.length)];
        st.farmTiles[k].crop.dead = 1;
        G.UI.dayLogLine('一只乌鸦偷吃了作物…（建稻草人可防御）');
      }
    }
    // 鸡舍
    if (st.placed.some(p => p.type === 'coop')) { addItem('egg', 1); G.UI.dayLogLine('鸡舍产出了一枚鸡蛋 🥚'); }
    // 杂草再生
    let grew = 0;
    for (let i = 0; i < 24 && grew < 4; i++) {
      const x = 10 + Math.floor(rng() * 21), y = 10 + Math.floor(rng() * 11);
      const k = x + ',' + y;
      if (!st.farmTiles[k] && G.MAPS.farm.terrain[y][x] === '.' && rng() < 0.4) {
        st.farmTiles[k] = { o: 'weed', hp: 1 }; grew++;
      }
    }
    // 重置状态
    st.minute = DAY_START;
    st.energy = penalty ? Math.round(st.maxEnergy * 0.6) : st.maxEnergy;
    st.dayLog = [];
    st.questsDoneToday = [];
    st.daySnap = snapDay(st);
    checkQuests();
    G.save(true);
    G.UI.refreshHUD();
  };

  function sleepNow(penalty) {
    G.UI.showSettle(() => { G.newDay(penalty); });
  }

  /* ================= 背包 ================= */
  function addItem(id, n) {
    const st = G.state;
    st.inv[id] = (st.inv[id] || 0) + n;
    if (st.inv[id] <= 0) delete st.inv[id];
    G.UI.refreshHotbar();
  }
  G.addItem = addItem;
  function hasItem(id, n) { return (G.state.inv[id] || 0) >= (n || 1); }
  function takeItem(id, n) { addItem(id, -(n || 1)); }

  function sellItem(id, n) {
    const st = G.state, it = G.ITEMS[id];
    n = Math.min(n, st.inv[id] || 0);
    if (n <= 0) return;
    const got = it.sell * n;
    takeItem(id, n);
    st.gold += got;
    st.stats.earned += got;
    G.UI.dayLogLine('售出 ' + it.name + ' ×' + n + '（+' + got + '金）');
    G.UI.toast(it.name + ' ×' + n + ' 卖出 +' + got + '金', 'good');
    G.sfx('coin');
    checkQuests(); G.UI.refreshHUD(); G.UI.refreshHotbar();
  }
  G.sellItem = sellItem;

  function useEnergy(n) {
    const st = G.state;
    if (st.energy < n) { G.UI.toast('太累了，先吃点东西或回家睡觉吧…', 'bad'); G.sfx('error'); return false; }
    st.energy -= n;
    G.UI.refreshHUD();
    return true;
  }
  G.useEnergy = useEnergy;
  G.gainEnergy = (n) => { G.state.energy = Math.min(G.state.maxEnergy, G.state.energy + n); G.UI.refreshHUD(); };

  /* ================= 任务 ================= */
  function questProgress(q) {
    const st = G.state;
    if (q.type === 'deliver') return Math.min(q.goal, st.inv[q.item] || 0);
    if (q.stat === 'talked') return Math.min(q.goal, Object.keys(st.talkedUnique).length);
    return Math.min(q.goal, st.stats[q.stat] || 0);
  }
  G.questProgress = questProgress;
  G.recovery = function () {
    const st = G.state;
    const done = G.QUESTS.filter(q => st.quests[q.id].done).length;
    return Math.min(100, Math.round(done / G.QUESTS.length * 70 + Math.min(4, st.stats.built) * 5 + (st.built.bridge ? 10 : 0)));
  };

  function grantReward(q) {
    const st = G.state, r = q.reward || {};
    let txt = '';
    if (q.type === 'deliver') { takeItem(q.item, q.goal); txt += '已交付 ' + G.ITEMS[q.item].name + '×' + q.goal + ' '; }
    if (r.gold) { st.gold += r.gold; txt += '+' + r.gold + '金 '; }
    if (r.items) Object.keys(r.items).forEach(id => { if (r.items[id] > 0) { addItem(id, r.items[id]); txt += G.ITEMS[id].name + '×' + r.items[id] + ' '; } });
    st.questsDoneToday.push(q.name);
    G.UI.dayLogLine('完成任务「' + q.name + '」！');
    G.UI.toast('✅ 任务完成：' + q.name + '　奖励 ' + txt, 'good');
    G.sfx('coin');
    if (G.QUESTS.every(x => st.quests[x.id].done) && !st.flags.ending) {
      st.flags.ending = 1;
      setTimeout(() => G.UI.showEnding(), 1200);
    }
  }

  function checkQuests() {
    const st = G.state;
    G.QUESTS.forEach(q => {
      const qs = st.quests[q.id];
      if (qs.done) return;
      if (questProgress(q) >= q.goal) { qs.done = true; grantReward(q); }
    });
    G.UI.refreshHUD();
  }
  G.checkQuests = checkQuests;

  /* ================= 玩家与NPC ================= */
  const input = G.input = { up: 0, down: 0, left: 0, right: 0, jx: 0, jy: 0 };
  let animT = 0;

  function tryMove(dx, dy, dt) {
    const st = G.state, sp = 62 * dt;
    const hitbox = (x, y) => {
      const pts = [[x - 5, y - 2], [x + 5, y - 2], [x - 5, y + 4], [x + 5, y + 4]];
      return pts.some(([ax, ay]) => !G.walkable(st.map, Math.floor(ax / TS), Math.floor(ay / TS)));
    };
    let moved = false;
    if (dx) {
      const nx = st.px + dx * sp;
      if (!hitbox(nx, st.py)) { st.px = nx; moved = true; }
    }
    if (dy) {
      const ny = st.py + dy * sp;
      if (!hitbox(st.px, ny)) { st.py = ny; moved = true; }
    }
    return moved;
  }

  function updatePlayer(dt) {
    const st = G.state;
    let dx = (input.right - input.left) + input.jx, dy = (input.down - input.up) + input.jy;
    const mag = Math.hypot(dx, dy);
    if (mag > 1) { dx /= mag; dy /= mag; }
    if (Math.abs(dx) > Math.abs(dy) * 1.2 && Math.abs(dx) > 0.15) st.dir = dx > 0 ? 'right' : 'left';
    else if (Math.abs(dy) > 0.15) st.dir = dy > 0 ? 'down' : 'up';
    if (mag > 0.15) {
      if (tryMove(dx, dy, dt)) {
        animT += dt * 8;
        const f = Math.floor(animT) % 4;
        st.frame = f === 1 ? 1 : f === 3 ? 2 : 0;
        checkExit();
      } else st.frame = 0;
    } else { st.frame = 0; animT = 0; }
  }

  function checkExit() {
    const st = G.state, m = G.MAPS[st.map];
    const tx = Math.floor(st.px / TS), ty = Math.floor(st.py / TS);
    for (const e of m.exits || []) {
      if (tx >= e.x && tx < e.x + e.w && ty >= e.y && ty < e.y + e.h) {
        G.UI.transition(() => { st.map = e.to; st.px = e.tx * TS + 8; st.py = e.ty * TS + 12; G.save(true); G.UI.refreshHUD(); });
        return true;
      }
    }
    return false;
  }

  G.npcSlot = function (npc, minute) {
    for (const s of npc.slots) if (minute >= s.f && minute < s.t) return s;
    return npc.slots[npc.slots.length - 1];
  };
  G.npcLocText = function (npc) {
    const s = G.npcSlot(npc, G.state.minute);
    if (!s.map) return '休息中';
    const m = G.MAPS[s.map];
    return (m.indoor ? '' : '') + m.name + ' (' + s.x + ',' + s.y + ')';
  };

  // NPC实时位置缓存
  const npcPos = {};
  function updateNPCs(dt) {
    const st = G.state;
    G.NPCS.forEach(n => {
      const s = G.npcSlot(n, st.minute);
      if (!s.map) return;
      let p = npcPos[n.id];
      if (!p || p.map !== s.map) { p = npcPos[n.id] = { map: s.map, x: s.x * TS + 8, y: s.y * TS + 12, dir: 'down', frame: 0, t: 0 }; }
      const tx = s.x * TS + 8, ty = s.y * TS + 12;
      const dx = tx - p.x, dy = ty - p.y, d = Math.hypot(dx, dy);
      if (d > 2) {
        const sp = Math.min(40 * dt, d);
        p.x += dx / d * sp; p.y += dy / d * sp;
        p.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
        p.t += dt * 8; p.frame = Math.floor(p.t) % 2 ? (Math.floor(p.t / 2) % 2 ? 1 : 2) : 0;
      } else { p.dir = 'down'; p.frame = 0; }
    });
  }
  G.npcPos = npcPos;

  /* ================= 面向瓦片与交互 ================= */
  G.facingTile = function () {
    const st = G.state;
    const fx = st.dir === 'left' ? -1 : st.dir === 'right' ? 1 : 0;
    const fy = st.dir === 'up' ? -1 : st.dir === 'down' ? 1 : 0;
    return {
      x: Math.floor((st.px + fx * TS * 0.9) / TS),
      y: Math.floor((st.py + fy * TS * 0.9 + 2) / TS),
    };
  };
  G.facingNPC = function () {
    const st = G.state, t = G.facingTile();
    for (const n of G.NPCS) {
      const p = npcPos[n.id];
      if (!p || p.map !== st.map) continue;
      const nx = Math.floor(p.x / TS), ny = Math.floor(p.y / TS);
      if (nx === t.x && ny === t.y) return n;
      // 也允许玩家与NPC重叠时交互
      if (nx === Math.floor(st.px / TS) && ny === Math.floor(st.py / TS)) return n;
    }
    return null;
  };

  function talk(npc) {
    const st = G.state;
    st.talkedUnique[npc.id] = 1;
    const s = G.npcSlot(npc, st.minute);
    const greeted = st.npcGreeted[npc.id] === st.day + st.year * 1000;
    let text;
    if (s.greet && !greeted) { text = s.greet; st.npcGreeted[npc.id] = st.day + st.year * 1000; }
    else text = npc.lines[Math.floor(rng() * npc.lines.length)];
    // 任务相关提示
    const hints = {
      greg: ['清理农场杂物、种下作物，任务都在日志里 (J)。', '恢复小镇的每一步都算数！'],
      martha: ['店里营业时间 8:00-20:00 哦。', '下雨天不用浇水~'],
      zhou: ['带着木头来找我，能建不少好东西。', '栈桥修好后能去深水区钓鱼。'],
      hai: ['鱼上钩时浮标会闪，手要快！', '深水区的鱼更值钱。'],
      lily: ['野花…可以送给我吗？嘿嘿。', '听说月圆夜有金色的鱼！'],
    };
    if (rng() < 0.35 && hints[npc.id]) text = hints[npc.id][Math.floor(rng() * hints[npc.id].length)];
    G.UI.dialog(npc.name, text);
    G.sfx('talk');
    checkQuests();
  }

  function facingIsLogpile(t) {
    return (G.MAPS.forest.props || []).some(p => p.type === 'logpile' && p.x === t.x && p.y === t.y);
  }

  function interactBuilding(b) {
    const st = G.state;
    if (b.type === 'home') { G.UI.transition(() => { st.map = 'home'; st.px = 5 * TS + 8; st.py = 6 * TS + 12; }); return true; }
    if (b.type === 'shop') {
      if (st.minute >= 480 && st.minute < 1200) G.UI.openPanel('shop');
      else G.UI.dialog('玛莎杂货店', '打烊了～营业时间是 8:00-20:00。');
      return true;
    }
    if (b.type === 'sawmill') { G.UI.openPanel('build'); return true; }
    if (b.type === 'mayor') { G.UI.dialog('镇长家', '门锁着。格雷戈里一般上午在广场。'); return true; }
    if (b.type === 'cottage') { G.UI.dialog('民居', '主人出远门了，门口的风信子开得正好。'); return true; }
    return false;
  }

  /* ================= 工具行为 ================= */
  function farmTileAt(t) {
    const st = G.state;
    if (st.map !== 'farm') return null;
    return st.farmTiles[t.x + ',' + t.y] || null;
  }

  function clearObject(t, ft) {
    const st = G.state, k = t.x + ',' + t.y;
    delete st.farmTiles[k];
    st.stats.cleared++;
    checkQuests();
  }

  function doTool() {
    const st = G.state;
    if (G.placing) { cancelPlace(); return; }
    const t = G.facingTile();
    const m = G.MAPS[st.map];
    if (t.x < 0 || t.y < 0 || t.x >= m.w || t.y >= m.h) return;
    const terr = m.terrain[t.y][t.x];
    const ft = farmTileAt(t);
    const tool = st.handTool;

    if (tool === 'hoe') {
      if (ft && ft.crop && ft.crop.dead) { if (!useEnergy(1)) return; delete st.farmTiles[t.x + ',' + t.y]; G.sfx('dig'); particles(t.x, t.y, '#8a7a5a'); return; }
      if (ft && ft.o === 'weed') { if (!useEnergy(2)) return; clearObject(t, ft); if (rng() < 0.5) { addItem('fiber', 1); G.UI.toast('+1 纤维', ''); } G.sfx('dig'); particles(t.x, t.y, '#6aa84f'); return; }
      if (!ft && st.map === 'farm' && (terr === '.' || terr === ',')) { if (!useEnergy(2)) return; st.farmTiles[t.x + ',' + t.y] = { tilled: 1 }; G.sfx('dig'); particles(t.x, t.y, '#8a6a42'); return; }
      G.UI.toast('这里不能锄地（农场空地才可以）', ''); G.sfx('error'); return;
    }
    if (tool === 'axe') {
      if (ft && ft.o === 'tree') { if (!useEnergy(3)) return; ft.hp--; G.sfx('chop'); particles(t.x, t.y, '#71b04e'); if (ft.hp <= 0) { clearObject(t, ft); addItem('wood', 3); G.UI.toast('+3 木头', 'good'); } else G.UI.toast('树：还差 ' + ft.hp + ' 斧', ''); return; }
      if (ft && ft.o === 'stump') { if (!useEnergy(2)) return; clearObject(t, ft); addItem('wood', 1); G.sfx('chop'); particles(t.x, t.y, '#b08a5a'); G.UI.toast('+1 木头', 'good'); return; }
      if (st.map === 'forest' && facingIsLogpile(t)) {
        if (st.foragePicked['logpile'] === st.day + st.year * 1000) { G.UI.toast('木堆明天才会补上', ''); return; }
        if (!useEnergy(3)) return;
        st.foragePicked['logpile'] = st.day + st.year * 1000;
        addItem('wood', 3); G.sfx('chop'); particles(t.x, t.y, '#b08a5a');
        G.UI.toast('+3 木头', 'good'); checkQuests(); return;
      }
      G.UI.toast('（斧头：砍树/树桩/木堆）', ''); return;
    }
    if (tool === 'pick') {
      if (ft && ft.o === 'rock') { if (!useEnergy(3)) return; ft.hp--; G.sfx('chop'); particles(t.x, t.y, '#c8ccd2'); if (ft.hp <= 0) { clearObject(t, ft); addItem('stone', 2); G.UI.toast('+2 石头', 'good'); } else G.UI.toast('石头：还差 ' + ft.hp + ' 镐', ''); return; }
      if (ft && !ft.o) { delete st.farmTiles[t.x + ',' + t.y]; G.sfx('dig'); particles(t.x, t.y, '#8a6a42'); return; } // 铲掉耕地
      G.UI.toast('（十字镐：敲碎石块）', ''); return;
    }
    if (tool === 'can') {
      if (ft && ft.tilled) {
        if (ft.wet) { G.UI.toast('这块地已经湿润了', ''); return; }
        if (!useEnergy(1)) return;
        ft.wet = 1; G.sfx('water'); particles(t.x, t.y, '#5fb8e8');
        return;
      }
      G.UI.toast('（水壶：浇灌开垦过的土地）', ''); return;
    }
    if (tool === 'rod') {
      if (terr === 'w') { startFishing(t); return; }
      G.UI.toast('面向水面才能抛竿', ''); G.sfx('error'); return;
    }
  }
  G.doTool = doTool;

  /* ================= 互动（A键） ================= */
  function doInteract() {
    const st = G.state;
    if (G.placing) { tryPlace(); return; }
    const t = G.facingTile();
    const m = G.MAPS[st.map];
    if (t.x < 0 || t.y < 0 || t.x >= m.w || t.y >= m.h) return;

    // NPC优先
    const npc = G.facingNPC();
    if (npc) { talk(npc); return; }

    // 建筑
    const b = (m.buildings || []).find(b => t.x >= b.x && t.x < b.x + b.w && t.y >= b.y && t.y < b.y + b.h);
    if (b) {
      if (b.door && t.x === b.door.x && t.y === b.door.y) { interactBuilding(b); return; }
      if (interactBuilding(b)) return;
    }

    // 静态道具
    const prop = (m.props || []).find(p => {
      if (p.type === 'rug') return false;
      const pw = p.w || 1, ph = p.h || 1;
      return t.x >= p.x && t.x < p.x + pw && t.y >= p.y && t.y < p.y + ph;
    });
    if (prop) {
      if (prop.type === 'bed') { G.UI.confirmSleep(); return; }
      if (prop.type === 'sign') { G.UI.dialog('告示牌', prop.text); return; }
      if (prop.type === 'bin') { G.UI.openPanel('sell-bin'); return; }
      if (prop.type === 'logpile') { G.UI.toast('用斧头砍木堆获得木头', ''); return; }
    }

    // 森林觅食
    if (st.map === 'forest') {
      const spot = (G.MAPS.forest.forageSpots || []).find(s => s.x === t.x && s.y === t.y);
      if (spot) {
        const key = 'f' + spot.x + ',' + spot.y;
        const picked = st.foragePicked[key] === st.day + st.year * 1000;
        const type = forageType(spot);
        if (picked) { G.UI.toast('明天才会再长出来…', ''); return; }
        addItem(type, 1);
        st.foragePicked[key] = st.day + st.year * 1000;
        G.sfx('pick'); particles(t.x, t.y, '#8fd45a');
        G.UI.toast('+1 ' + G.ITEMS[type].name, 'good');
        return;
      }
    }

    // 农场作物
    const ft = farmTileAt(t);
    if (ft && ft.crop && !ft.crop.dead && ft.crop.prog >= G.CROPS[ft.crop.id].days) {
      const c = G.CROPS[ft.crop.id];
      if (!useEnergy(1)) return;
      const bonus = rng() < 0.12 ? 2 : 1;
      addItem(c.seed.replace('_seed', ''), bonus);
      delete st.farmTiles[t.x + ',' + t.y];
      st.stats.harvested += bonus;
      G.sfx('pick'); particles(t.x, t.y, c.color);
      G.UI.toast('收获 ' + c.name + ' ×' + bonus + '！', 'good');
      checkQuests();
      return;
    }

    // 手持物品
    if (st.handItem) {
      const it = G.ITEMS[st.handItem];
      if (it.cat === 'seed') { plantSeed(t, ft); return; }
      if (G.EATABLE.includes(st.handItem)) {
        const e = G.EAT_ENERGY[st.handItem];
        takeItem(st.handItem, 1);
        G.gainEnergy(e);
        G.sfx('eat');
        G.UI.toast('吃了 ' + it.name + '，体力 +' + e, 'good');
        return;
      }
    }
    G.UI.toast('（没有可互动的目标）', '');
  }
  G.doInteract = doInteract;

  function plantSeed(t, ft) {
    const st = G.state;
    const cid = G.ITEMS[st.handItem].cropId;
    const c = G.CROPS[cid];
    if (!ft || !ft.tilled || ft.crop) { G.UI.toast('需要先锄好一块空地', ''); G.sfx('error'); return; }
    if (!c.seasons.includes(st.season)) { G.UI.toast(c.name + '不适合在' + G.SEASON_NAMES[st.season] + '天种植', 'bad'); G.sfx('error'); return; }
    if (!useEnergy(1)) return;
    takeItem(st.handItem, 1);
    ft.crop = { id: cid, prog: 0 };
    st.stats.planted++;
    G.sfx('plant'); particles(t.x, t.y, c.color);
    checkQuests();
  }

  function forageType(spot) {
    const idx = G.MAPS.forest.forageSpots.indexOf(spot);
    if (idx % 2 === 0) {
      const s = G.state.season;
      return s === 2 ? 'mushroom' : s === 3 ? 'winterroot' : 'berry';
    }
    return 'flower';
  }
  function isForageAt(x, y) {
    if (G.state.map !== 'forest') return null;
    const spot = G.MAPS.forest.forageSpots.find(s => s.x === x && s.y === y);
    if (!spot) return null;
    return forageType(spot);
  }

  /* ================= 建造 ================= */
  G.placing = null;
  G.startPlace = function (type) {
    G.placing = { type };
    G.UI.closePanel();
    G.UI.toast('移动选择位置，按 互动 放置 / 工具 取消', '');
  };
  function cancelPlace() { G.placing = null; G.UI.toast('已取消建造', ''); }

  G.placeValid = function (type, tx, ty) {
    const st = G.state, m = G.MAPS.farm;
    if (st.map !== 'farm') return false;
    const def = G.BUILDS[type];
    if (type === 'bridge') {
      if (st.built.bridge) return false;
      return G.MAPS.lake.bridgeTiles.some(b => b.x === tx && b.y === ty);
    }
    const w = def.w || 1, h = def.h || 1;
    for (let y = ty; y < ty + h; y++) for (let x = tx; x < tx + w; x++) {
      if (x >= m.w || y >= m.h) return false;
      const terr = m.terrain[y][x];
      if (terr !== '.' && terr !== ',') return false;
      if (st.farmTiles[x + ',' + y]) return false;
      if (m.buildings.some(b => x >= b.x && x < b.x + b.w && y >= b.y && y < b.y + b.h)) return false;
      if (m.props.some(p => p.type !== 'rug' && x >= p.x && x < p.x + (p.w || 1) && y >= p.y && y < p.y + (p.h || 1))) return false;
    }
    return true;
  };

  function tryPlace() {
    const st = G.state;
    if (!G.placing) return;
    const type = G.placing.type, def = G.BUILDS[type];
    const t = G.facingTile();
    if (!G.placeValid(type, t.x, t.y)) { G.UI.toast('这里不能放置', 'bad'); G.sfx('error'); return; }
    const cost = def.cost;
    if (st.gold < cost.gold) { G.UI.toast('金币不足（需要 ' + cost.gold + '金）', 'bad'); G.sfx('error'); return; }
    if (cost.wood && !hasItem('wood', cost.wood)) { G.UI.toast('木头不足（需要 ' + cost.wood + '个）', 'bad'); G.sfx('error'); return; }
    st.gold -= cost.gold;
    if (cost.wood) takeItem('wood', cost.wood);
    if (type === 'bridge') {
      st.built.bridge = true;
      G.UI.toast('🌉 栈桥修好了！深水区开放！', 'good');
      G.UI.dayLogLine('修复了湖边栈桥');
    } else {
      st.placed.push({ type, x: t.x, y: t.y });
      G.UI.toast('建造了' + def.name + '！', 'good');
      G.UI.dayLogLine('建造了' + def.name);
    }
    st.stats.built++;
    G.sfx('build');
    G.placing = null;
    checkQuests(); G.UI.refreshHUD();
  }

  /* ================= 钓鱼 ================= */
  const fish = { active: false, phase: '', timer: 0, fishY: 50, barY: 120, barV: 0, prog: 0, deep: false, t: 0 };
  G.fishing = fish;

  function startFishing(t) {
    const st = G.state;
    if (!useEnergy(6)) return;
    fish.active = true;
    fish.phase = 'wait';
    fish.timer = 1 + rng() * 2.5;
    fish.deep = st.map === 'lake' && t.x >= 22 && t.y >= 16;
    fish.prog = 0.35;
    fish.barY = Math.max(6, Math.min(236 - 42, fish.fishY - 21));
    fish.barV = 0; fish.t = 0;
    fish.fishY = 60 + rng() * 100;
    fish.barY = Math.max(6, Math.min(236 - 42, fish.fishY - 21));
    G.sfx('cast');
    G.UI.showFishing(true);
    G.UI.fishMsg(fish.deep ? '深水区…有大家伙的动静！' : '抛竿…等待鱼儿上钩');
  }

  function fishPress() {
    if (!fish.active) return;
    if (fish.phase === 'wait') {
      if (fish.bite) { fish.phase = 'reel'; fish.timer = 7; G.sfx('biteset'); G.UI.fishMsg('咬钩了！保持鱼在框内！'); }
      else G.UI.fishMsg('还没动静…耐心等浮标下沉');
    }
  }
  G.fishPress = fishPress;
  G.fishHold = (on) => { fish.holding = on; };

  function updateFishing(dt) {
    if (!fish.active) return;
    fish.t += dt;
    if (fish.phase === 'wait') {
      if (!fish.bite) {
        fish.timer -= dt;
        if (fish.timer <= 0) {
          fish.bite = true; fish.timer = 0.8;
          G.sfx('bite'); G.UI.fishMsg('❗ 快按 互动/空格 提竿！');
        }
      } else {
        fish.timer -= dt;
        if (fish.timer <= 0) endFishing(false, '鱼跑掉了…（要在浮标闪烁时提竿）');
      }
      if (fish.t > 10) endFishing(false, '等太久了…换个位置试试');
      return;
    }
    if (fish.phase === 'reel') {
      fish.timer -= dt;
      // 鱼
      if (rng() < dt * 1.6) fish.fishVY = (rng() - 0.5) * 160;
      if (rng() < dt * 0.35) fish.fishVY = (rng() < 0.5 ? -1 : 1) * (90 + rng() * 90);
      fish.fishY += (fish.fishVY || 0) * dt;
      fish.fishY = Math.max(14, Math.min(210, fish.fishY));
      // 鱼筐
      fish.barV += (fish.holding ? -900 : 900) * dt;
      fish.barV = Math.max(-260, Math.min(260, fish.barV));
      fish.barY += fish.barV * dt;
      const H = 42;
      if (fish.barY < 6) { fish.barY = 6; fish.barV = 0; }
      if (fish.barY > 236 - H) { fish.barY = 236 - H; fish.barV = 0; }
      const inBox = fish.fishY > fish.barY + 2 && fish.fishY < fish.barY + H - 2;
      fish.prog += (inBox ? 0.34 : -0.22) * dt;
      if (fish.prog >= 1) {
        const pool = G.FISH_TABLE.filter(f => fish.deep ? f.w[1] > 0 && f.min <= 1 : f.w[0] > 0 && f.min === 0);
        let total = 0; const ws = pool.map(f => { const w = fish.deep ? f.w[1] : f.w[0]; total += w; return w; });
        let r = rng() * total, pick = pool[0];
        for (let i = 0; i < pool.length; i++) { r -= ws[i]; if (r <= 0) { pick = pool[i]; break; } }
        addItem(pick.id, 1);
        G.state.stats.fish++;
        G.sfx('catch');
        endFishing(true, '钓到了【' + G.ITEMS[pick.id].name + '】！', pick.id);
        checkQuests();
      } else if (fish.prog <= 0 || fish.timer <= 0) {
        endFishing(false, '鱼挣脱了…再试一次！');
      }
    }
  }
  function endFishing(ok, msg, itemId) {
    fish.active = false; fish.bite = false;
    G.UI.showFishing(false);
    G.UI.toast((ok ? '🎣 ' : '') + msg, ok ? 'good' : 'bad');
    if (ok && itemId) G.UI.dayLogLine('钓到 ' + G.ITEMS[itemId].name);
    if (ok) G.UI.settleable = true;
  }
  G.updateFishing = updateFishing;

  /* ================= 粒子与音效 ================= */
  const parts = [];
  function particles(tx, ty, color) {
    for (let i = 0; i < 8; i++) {
      parts.push({
        x: tx * TS + 8, y: ty * TS + 8, vx: (rng() - 0.5) * 60, vy: -rng() * 60 - 20,
        life: 0.5 + rng() * 0.3, color, s: 1 + Math.floor(rng() * 2),
      });
    }
  }
  G.particles = parts;

  // 极简WebAudio音效
  let AC = null, muted = false;
  G.toggleMute = function () { muted = !muted; return muted; };
  G.sfx = function (name) {
    if (muted) return;
    try {
      if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)();
      if (AC.state === 'suspended') AC.resume();
      const t = AC.currentTime;
      const o = AC.createOscillator(), g = AC.createGain();
      o.connect(g); g.connect(AC.destination);
      const conf = {
        dig: ['square', 120, 0.08, 0.12], chop: ['sawtooth', 90, 0.1, 0.14],
        water: ['sine', 500, 0.15, 0.1], plant: ['sine', 700, 0.06, 0.12],
        pick: ['sine', 880, 0.07, 0.1], coin: ['square', 980, 0.06, 0.12],
        error: ['sawtooth', 140, 0.15, 0.1], talk: ['sine', 440, 0.05, 0.08],
        eat: ['sine', 300, 0.1, 0.1], cast: ['sine', 600, 0.12, 0.08],
        bite: ['square', 1200, 0.09, 0.14], biteset: ['square', 800, 0.08, 0.12],
        catch: ['square', 660, 0.1, 0.16], build: ['square', 300, 0.15, 0.14],
        sleep: ['sine', 520, 0.3, 0.12],
      }[name] || ['sine', 440, 0.05, 0.05];
      o.type = conf[0];
      o.frequency.setValueAtTime(conf[1], t);
      if (name === 'coin' || name === 'catch' || name === 'sleep') o.frequency.setValueAtTime(conf[1] * 1.5, t + 0.08);
      g.gain.setValueAtTime(conf[3], t);
      g.gain.exponentialRampToValueAtTime(0.001, t + conf[2]);
      o.start(t); o.stop(t + conf[2] + 0.05);
    } catch (e) { }
  };

  /* ================= 主更新 ================= */
  G.update = function (dt) {
    if (!G.running) return;
    if (fish.active) { updateFishing(dt); return; }
    if (G.paused) return;
    const st = G.state;
    if (fish.active) { updateFishing(dt); return; }
    // 时间
    st.minute += MIN_PER_SEC * dt;
    if (st.minute >= DAY_END) {
      G.UI.toast('你累倒了…被送回了床上（体力恢复减少）', 'bad');
      st.map = 'farm'; st.px = 6 * TS + 8; st.py = 7 * TS + 12;
      sleepNow(true);
      return;
    }
    updatePlayer(dt);
    updateNPCs(dt);
    // 粒子
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 200 * dt;
      if (p.life <= 0) parts.splice(i, 1);
    }
    G.UI.updateHint();
  };

  /* ================= 渲染 ================= */
  G.render = function (ctx, dt) {
    if (!G.state) return;
    const st = G.state, m = G.MAPS[st.map];
    const vw = G.view.w, vh = G.view.h;
    const camX = Math.max(0, Math.min(st.px - vw / 2, m.w * TS - vw));
    const camY = Math.max(0, Math.min(st.py - vh / 2, m.h * TS - vh));
    G._cam = { x: camX, y: camY };
    const x0 = Math.floor(camX / TS), y0 = Math.floor(camY / TS);
    const x1 = Math.min(m.w - 1, x0 + Math.ceil(vw / TS)), y1 = Math.min(m.h - 1, y0 + Math.ceil(vh / TS));
    const S = G.SPR, seasonTiles = S.tilesBySeason[st.season];
    const time = performance.now() / 1000;
    const wf = Math.floor(time * 1.6) % 2;

    ctx.fillStyle = '#0e130d'; ctx.fillRect(0, 0, vw, vh);
    ctx.save();
    ctx.translate(-Math.round(camX), -Math.round(camY));

    // 地形
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
      const t = m.terrain[ty][tx];
      let spr = null;
      if (t === '.') spr = seasonTiles.grass[(tx * 7 + ty * 13) % 4];
      else if (t === ',') spr = seasonTiles.grass[(tx * 3 + ty * 5 + 2) % 4];
      else if (t === 'p') spr = seasonTiles.path;
      else if (t === 'w') spr = seasonTiles.water[wf];
      else if (t === 'P') spr = S.pier;
      else if (t === 'f') spr = S.floor;
      else if (t === 'W') spr = S.wall;
      if (spr) ctx.drawImage(spr, tx * TS, ty * TS);
      if (st.map === 'farm') {
        const ft = st.farmTiles[tx + ',' + ty];
        if (ft && ft.tilled) ctx.drawImage(ft.wet ? S.watered : S.tilled, tx * TS, ty * TS);
        if (ft && ft.crop) {
          const c = G.CROPS[ft.crop.id];
          const stage = ft.crop.dead ? 4 : Math.min(3, Math.floor(ft.crop.prog / c.days * 3.4));
          ctx.drawImage(S.crops[ft.crop.id][stage], tx * TS, ty * TS);
        }
      }
      if (st.map === 'home') {
        const rug = m.props.find(p => p.type === 'rug');
        if (rug && tx >= rug.x && tx < rug.x + rug.w && ty >= rug.y && ty < rug.y + rug.h) ctx.drawImage(S.rug, tx * TS, ty * TS);
      }
      if (st.map === 'lake' && st.built.bridge && G.MAPS.lake.bridgeTiles.some(b => b.x === tx && b.y === ty)) ctx.drawImage(S.bridge, tx * TS, ty * TS);
    }

    // 收集可排序绘制物
    const draws = [];
    (m.props || []).forEach(p => {
      if (p.type === 'rug') return;
      draws.push({ y: p.y * TS + TS, kind: 'prop', p });
    });
    (m.buildings || []).forEach(b => draws.push({ y: (b.y + b.h) * TS, kind: 'building', b }));
    if (st.map === 'farm') {
      Object.keys(st.farmTiles).forEach(k => {
        const ft = st.farmTiles[k];
        if (!ft.o) return;
        const [tx, ty] = k.split(',').map(Number);
        draws.push({ y: ty * TS + TS, kind: 'farmobj', tx, ty, ft });
      });
      st.placed.forEach(p => draws.push({ y: (p.y + (G.BUILDS[p.type].h || 1)) * TS, kind: 'placed', p }));
    }
    if (st.map === 'forest') {
      (G.MAPS.forest.forageSpots || []).forEach(s => {
        const key = 'f' + s.x + ',' + s.y;
        if (st.foragePicked[key] === st.day + st.year * 1000) return;
        draws.push({ y: s.y * TS + TS, kind: 'forage', s });
      });
    }
    Object.keys(npcPos).forEach(id => {
      const p = npcPos[id];
      if (p.map === st.map && G.npcSlot(G.NPCS.find(n => n.id === id), st.minute).map === st.map) {
        draws.push({ y: p.y + 6, kind: 'npc', id, p });
      }
    });
    draws.push({ y: st.py + 6, kind: 'player' });
    draws.sort((a, b) => a.y - b.y);

    const shadow = (x, y) => {
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.beginPath(); ctx.ellipse(x, y, 6, 2.5, 0, 0, Math.PI * 2); ctx.fill();
    };
    const drawChar = (px, py, dir, frame, set) => {
      shadow(px, py + 1);
      const arr = set[dir] || set.down;
      ctx.drawImage(arr[frame % arr.length], Math.round(px - 8), Math.round(py - 13));
    };

    draws.forEach(d => {
      if (d.kind === 'prop') {
        const p = d.p;
        let spr = p.type === 'tree' ? S.trees[st.season]
          : p.type === 'logpile' ? S.props.log
          : S.props[p.type];
        if (!spr) return;
        ctx.drawImage(spr, p.x * TS, p.y * TS + TS - spr.height);
      } else if (d.kind === 'building') {
        const meta = S.buildings[d.b.type];
        ctx.drawImage(meta.cv, d.b.x * TS, d.b.y * TS - meta.doorY);
      } else if (d.kind === 'farmobj') {
        const { tx, ty, ft } = d;
        let spr = null;
        if (ft.o === 'tree') spr = S.trees[st.season];
        else if (ft.o === 'weed') spr = S.props.weed[st.season === 2 ? 1 : 0];
        else spr = S.props[ft.o];
        if (spr) ctx.drawImage(spr, tx * TS, ty * TS + TS - spr.height);
        if (ft.o === 'rock' && ft.hp < 2) { ctx.fillStyle = '#00000033'; ctx.fillRect(tx * TS + 4, ty * TS + 4, 8, 8); }
      } else if (d.kind === 'placed') {
        const { p } = d;
        const spr = p.type === 'coop' ? S.props.coop : S.props[p.type];
        ctx.drawImage(spr, p.x * TS, p.y * TS + TS * (G.BUILDS[p.type].h || 1) - spr.height);
        if (p.type === 'scarecrow') { /* 摇摆 */ }
      } else if (d.kind === 'forage') {
        const type = forageType(d.s);
        const sprKey = type === 'berry' ? (st.season >= 0 ? 'bushBerry' : 'bush') : type === 'mushroom' ? 'mushroom' : type === 'winterroot' ? 'winterroot' : 'flower';
        const spr = S.props[sprKey];
        ctx.drawImage(spr, d.s.x * TS, d.s.y * TS + TS - spr.height);
      } else if (d.kind === 'npc') {
        const n = G.NPCS.find(v => v.id === d.id);
        drawChar(d.p.x, d.p.y + 2, d.p.dir, d.p.frame, S.npcs[d.id]);
        // 名牌
        ctx.fillStyle = 'rgba(20,26,18,0.75)';
        const nm = n.name.split(' ')[1] || n.name.split(' ')[0];
        ctx.font = '7px monospace';
        const w = ctx.measureText(nm).width + 6;
        ctx.fillRect(d.p.x - w / 2, d.p.y - 22, w, 10);
        ctx.fillStyle = '#ffe9b8';
        ctx.fillText(nm, d.p.x - w / 2 + 3, d.p.y - 14.5);
      } else if (d.kind === 'player') {
        const st2 = G.state;
        drawChar(st2.px, st2.py + 2, st2.dir, st2.frame, S.player);
        if (G.placing) {
          const t = G.facingTile();
          const ok = G.placeValid(G.placing.type, t.x, t.y);
          ctx.fillStyle = ok ? 'rgba(120,220,120,0.45)' : 'rgba(220,80,80,0.45)';
          const def = G.BUILDS[G.placing.type];
          ctx.fillRect(t.x * TS, t.y * TS, TS * (def.w || 1), TS * (def.h || 1));
          ctx.strokeStyle = ok ? '#8fd45a' : '#e0453a';
          ctx.strokeRect(t.x * TS + 0.5, t.y * TS + 0.5, TS * (def.w || 1) - 1, TS * (def.h || 1) - 1);
        }
      }
    });

    // 粒子
    parts.forEach(p => {
      ctx.globalAlpha = Math.max(0, Math.min(1, p.life * 2));
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - p.s / 2, p.y - p.s / 2, p.s, p.s);
    });
    ctx.globalAlpha = 1;
    ctx.restore();

    /* ---- 天气粒子（屏幕空间） ---- */
    if (st.weather === 'rain' || st.weather === 'storm') {
      const n = st.weather === 'storm' ? 3 : 1;
      ctx.strokeStyle = 'rgba(180,210,255,0.55)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 60 * n; i++) {
        const rx = (hash(i, 1) * vw + time * (260 + hash(i, 2) * 120)) % vw;
        const ry = (hash(i, 3) * vh + time * (420 + hash(i, 4) * 160)) % vh;
        ctx.beginPath(); ctx.moveTo(rx, ry); ctx.lineTo(rx - 3, ry + 9); ctx.stroke();
      }
      if (st.weather === 'storm' && Math.sin(time * 2.3) > 0.995) {
        ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.fillRect(0, 0, vw, vh);
      }
    } else if (st.weather === 'snow') {
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      for (let i = 0; i < 40; i++) {
        const rx = (hash(i, 7) * vw + Math.sin(time + i) * 14 + time * 12) % vw;
        const ry = (hash(i, 11) * vh + time * (35 + hash(i, 5) * 30)) % vh;
        ctx.fillRect(rx, ry, 2, 2);
      }
    }

    /* ---- 昼夜光照 ---- */
    const min = st.minute;
    let tint = null;
    if (min < 480) tint = ['rgba(255,160,80,0.16)', 1];
    else if (min < 540) tint = ['rgba(255,180,120,0.08)', 0];
    else if (min < 1020) tint = null;
    else if (min < 1140) tint = ['rgba(255,140,60,0.18)', 1];
    else if (min < 1260) tint = ['rgba(80,60,140,0.30)', 1];
    else tint = ['rgba(20,30,80,0.50)', 1];
    if (st.weather === 'rain' || st.weather === 'storm') {
      ctx.fillStyle = 'rgba(40,60,90,0.25)'; ctx.fillRect(0, 0, vw, vh);
    } else if (st.weather === 'cloud') {
      ctx.fillStyle = 'rgba(80,80,90,0.15)'; ctx.fillRect(0, 0, vw, vh);
    }
    if (tint) {
      ctx.fillStyle = tint[0]; ctx.fillRect(0, 0, vw, vh);
      // 夜晚灯光
      if (min >= 1140 || min < 480) {
        const lamps = [];
        (m.props || []).forEach(p => { if (p.type === 'lamp') lamps.push(p); });
        lamps.forEach(p => {
          const sx = p.x * TS + 8 - camX, sy = p.y * TS + 4 - camY;
          const gr = ctx.createRadialGradient(sx, sy, 2, sx, sy, 34);
          gr.addColorStop(0, 'rgba(255,220,120,0.5)');
          gr.addColorStop(1, 'rgba(255,220,120,0)');
          ctx.fillStyle = gr;
          ctx.fillRect(sx - 34, sy - 34, 68, 68);
        });
        // 建筑窗光
        (m.buildings || []).forEach(b => {
          const meta = S.buildings[b.type];
          meta.glow.forEach(w => {
            const sx = b.x * TS + w.x - camX, sy = b.y * TS + w.y - meta.doorY - camY;
            ctx.fillStyle = 'rgba(255,225,140,0.75)';
            ctx.fillRect(sx, sy, w.w, w.h);
          });
        });
      }
    }
    // 过场黑幕
    if (G.UI.fadeAlpha > 0) {
      ctx.fillStyle = 'rgba(0,0,0,' + G.UI.fadeAlpha + ')';
      ctx.fillRect(0, 0, vw, vh);
    }
  };
})();
