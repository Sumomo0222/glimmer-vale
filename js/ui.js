/* ============ 微光谷物语 · UI层 ============ */
window.G = window.G || {};
(function () {
  'use strict';
  const $ = (s) => document.querySelector(s);
  const TS = G.TS;
  const UI = G.UI = {};

  let panelType = null;
  let dialogQueue = [], dialogCb = null;
  let settleCb = null;

  /* ================= HUD ================= */
  UI.refreshHUD = function () {
    const st = G.state;
    if (!st) return;
    $('#hud-season').textContent = G.SEASON_NAMES[st.season];
    $('#hud-day').textContent = st.day + '日';
    $('#hud-year').textContent = '第' + st.year + '年';
    $('#hud-weather').textContent = G.WEATHER_NAMES[st.weather];
    $('#hud-clock').textContent = G.fmtClock(st.minute);
    $('#gold-num').textContent = st.gold;
    const pct = Math.max(0, st.energy / st.maxEnergy);
    $('#energy-fill').style.transform = 'scaleX(' + pct + ')';
    $('#energy-text').textContent = Math.ceil(st.energy);
    const qb = $('#btn-quest');
    const unfinished = G.QUESTS.filter(q => !st.quests[q.id].done && G.questProgress(q) > 0).length;
    qb.textContent = unfinished ? '📜' + unfinished : '📜';
  };

  /* ================= 快捷栏 ================= */
  const TOOLS = ['axe', 'pick', 'hoe', 'can', 'rod'];
  UI.refreshHotbar = function () {
    const st = G.state;
    if (!st) return;
    const hb = $('#hotbar');
    hb.innerHTML = '';
    TOOLS.forEach((id, i) => {
      const d = document.createElement('div');
      d.className = 'hb-slot' + (st.handTool === id ? ' sel' : '');
      d.dataset.tool = id;
      d.innerHTML = '<span class="key">' + (i + 1) + '</span>';
      const cv = G.SPR.icons[id].cloneNode();
      cv.getContext('2d').drawImage(G.SPR.icons[id], 0, 0);
      d.appendChild(cv);
      const nm = document.createElement('span'); nm.className = 'name'; nm.textContent = G.ITEMS[id].name;
      d.appendChild(nm);
      d.addEventListener('pointerdown', (e) => { e.preventDefault(); st.handTool = id; UI.refreshHotbar(); });
      hb.appendChild(d);
    });
    const hand = document.createElement('div');
    hand.className = 'hb-slot' + (st.handItem ? '' : '');
    hand.style.opacity = st.handItem ? 1 : 0.5;
    if (st.handItem) {
      const cv = G.SPR.icons[st.handItem].cloneNode();
      cv.getContext('2d').drawImage(G.SPR.icons[st.handItem], 0, 0);
      hand.appendChild(cv);
      const nm = document.createElement('span'); nm.className = 'name'; nm.textContent = G.ITEMS[st.handItem].name;
      hand.appendChild(nm);
      if ((st.inv[st.handItem] || 0) > 1) {
        const c = document.createElement('span'); c.className = 'cnt'; c.textContent = st.inv[st.handItem];
        hand.appendChild(c);
      }
    } else {
      hand.innerHTML = '<span style="font-size:20px;opacity:.5">✋</span>';
    }
    hand.title = '手持物品（背包里选择）';
    hand.addEventListener('pointerdown', (e) => { e.preventDefault(); UI.openPanel('bag'); });
    hb.appendChild(hand);
  };

  /* ================= 对话框 ================= */
  UI.dialog = function (name, text, cb) {
    dialogQueue.push({ name, text });
    if (cb) dialogCb = cb;
    showNextDialog();
  };
  function showNextDialog() {
    const d = $('#dialog');
    if (!dialogQueue.length) {
      d.classList.add('hidden');
      G.paused = isFishingOpen() || panelType !== null;
      if (dialogCb) { const cb = dialogCb; dialogCb = null; cb(); }
      return;
    }
    const { name, text } = dialogQueue.shift();
    $('#dialog-name').textContent = name;
    $('#dialog-text').textContent = text;
    d.classList.remove('hidden');
    G.paused = true;
  }
  UI.advanceDialog = () => { if (!$('#dialog').classList.contains('hidden')) { G.sfx('talk'); showNextDialog(); return true; } return false; };
  $('#dialog').addEventListener('pointerdown', () => UI.advanceDialog());

  /* ================= 提示气泡 ================= */
  UI.toast = function (text, type) {
    const t = document.createElement('div');
    t.className = 'toast ' + (type || '');
    t.textContent = text;
    $('#toasts').appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity .4s'; }, 2200);
    setTimeout(() => t.remove(), 2700);
  };

  UI.dayLogLine = function (text) {
    if (G.state) G.state.dayLog.push(text);
  };

  /* ================= 过场 ================= */
  UI.fadeAlpha = 0;
  UI.transition = function (cb) {
    G.paused = true;
    const start = performance.now();
    const step = () => {
      const t = (performance.now() - start) / 220;
      UI.fadeAlpha = Math.min(1, t);
      if (t < 1) requestAnimationFrame(step);
      else {
        cb();
        setTimeout(() => {
          const start2 = performance.now();
          const step2 = () => {
            const t2 = (performance.now() - start2) / 220;
            UI.fadeAlpha = Math.max(0, 1 - t2);
            if (t2 < 1) requestAnimationFrame(step2);
            else G.paused = false;
          };
          step2();
        }, 90);
      }
    };
    step();
  };

  /* ================= 通用面板 ================= */
  UI.openPanel = function (type) {
    if (type === panelType) { UI.closePanel(); return; }
    panelType = type;
    const titles = {
      bag: '🎒 背包', quests: '📜 任务日志', map: '🗺️ 地图与村民', menu: '⚙️ 菜单',
      shop: '🏪 玛莎杂货店', 'sell-bin': '🧺 出货箱', build: '🔨 老周锯木场',
      settle: '🌙 今日结算', ending: '🎉 通关结算', help: '📖 玩法说明', stats: '📊 农场档案',
    };
    $('#panel-title').textContent = titles[type] || '';
    $('#panel-wrap').classList.remove('hidden');
    $('#panel-wrap').classList.toggle('above', G.running === false);
    renderPanel(type);
    G.paused = true;
  };
  UI.closePanel = function () {
    panelType = null;
    $('#panel-wrap').classList.add('hidden');
    if ($('#fishing').classList.contains('hidden') && $('#dialog').classList.contains('hidden')) G.paused = false;
  };
  $('#panel-close').addEventListener('pointerdown', () => { if (panelType !== 'settle' && panelType !== 'ending') UI.closePanel(); });
  $('#panel-wrap').addEventListener('pointerdown', (e) => { if (e.target === $('#panel-wrap') && panelType !== 'settle' && panelType !== 'ending') UI.closePanel(); });

  function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
  function iconImg(id, size) {
    return '<canvas class="icn" data-icon="' + id + '" width="16" height="16" style="width:' + (size || 30) + 'px;height:' + (size || 30) + 'px"></canvas>';
  }
  function paintIcons(root) {
    root.querySelectorAll('canvas[data-icon]').forEach(cv => {
      const src = G.SPR.icons[cv.dataset.icon];
      if (src) cv.getContext('2d').drawImage(src, 0, 0);
    });
  }

  function invList(filter) {
    const st = G.state;
    return Object.keys(st.inv).filter(id => st.inv[id] > 0 && (!filter || filter(id)));
  }

  function renderSellList(mode) {
    const st = G.state;
    const ids = invList(id => G.ITEMS[id].sell > 0);
    if (!ids.length) return '<div class="inv-empty">背包里还没有可以出售的货物<br>去种地、钓鱼、觅食吧！</div>';
    let html = '';
    ids.forEach(id => {
      const it = G.ITEMS[id];
      html += '<div class="item-row"><span class="nm">' + iconImg(id) + ' ' + esc(it.name) + ' ×' + st.inv[id] + '</span>' +
        '<span><span class="pr">' + it.sell + '金/个</span> ' +
        '<button class="btn" data-sell="' + id + '" data-n="1">卖1</button> ' +
        '<button class="btn" data-sell="' + id + '" data-n="999">全卖</button></span></div>';
    });
    return html;
  }
  function wireSellList(root) {
    root.querySelectorAll('[data-sell]').forEach(b => {
      b.addEventListener('click', () => G.sellItem(b.dataset.sell, parseInt(b.dataset.n)));
    });
  }

  function renderPanel(type) {
    const st = G.state;
    const body = $('#panel-body');
    if (type === 'bag') {
      const ids = Object.keys(st.inv).filter(id => st.inv[id] > 0);
      let html = '<div class="inv-grid">';
      ids.forEach(id => {
        html += '<div class="inv-slot' + (st.handItem === id ? ' sel' : '') + '" data-inv="' + id + '" title="' + esc(G.ITEMS[id].name) + '">' +
          iconImg(id, 44) + (st.inv[id] > 1 ? '<span class="cnt">' + st.inv[id] + '</span>' : '') + '</div>';
      });
      if (!ids.length) html += '<div class="inv-empty" style="grid-column:1/-1">空空如也</div>';
      html += '</div><div class="inv-info" id="inv-info">点击物品查看详情；种子可以设为手持去播种，食物可以食用。</div><div id="inv-actions" style="margin-top:10px;display:flex;gap:8px;justify-content:center"></div>';
      body.innerHTML = html;
      body.querySelectorAll('[data-inv]').forEach(el => {
        el.addEventListener('click', () => {
          const id = el.dataset.inv, it = G.ITEMS[id];
          body.querySelectorAll('.inv-slot').forEach(s => s.classList.remove('sel'));
          el.classList.add('sel');
          const eat = G.EATABLE.includes(id);
          body.querySelector('#inv-info').innerHTML = '<b>' + esc(it.name) + '</b> ×' + st.inv[id] + '　售价 ' + it.sell + '金<br>' + esc(it.desc);
          const act = body.querySelector('#inv-actions');
          act.innerHTML = '';
          if (it.cat === 'seed' || true) {
            const hb = document.createElement('button'); hb.className = 'btn primary'; hb.textContent = '✋ 设为手持';
            hb.addEventListener('click', () => { st.handItem = id; UI.refreshHotbar(); UI.toast('手持：' + it.name, ''); });
            act.appendChild(hb);
          }
          if (eat) {
            const eb = document.createElement('button'); eb.className = 'btn'; eb.textContent = '🍴 食用 +' + G.EAT_ENERGY[id] + '体力';
            eb.addEventListener('click', () => { G.state.inv[id]--; if (G.state.inv[id] <= 0) delete G.state.inv[id]; G.gainEnergy(G.EAT_ENERGY[id]); G.sfx('eat'); UI.refreshHotbar(); renderPanel('bag'); UI.toast('吃了 ' + it.name + '，体力 +' + G.EAT_ENERGY[id], 'good'); });
            act.appendChild(eb);
          }
          paintIcons(act);
        });
      });
      paintIcons(body);
      return;
    }
    if (type === 'quests') {
      let html = '';
      G.QUESTS.forEach(q => {
        const qs = st.quests[q.id];
        const prog = G.questProgress(q);
        const pct = Math.round(prog / q.goal * 100);
        html += '<div class="q-item' + (qs.done ? ' done' : '') + '">' +
          '<div class="q-name"><span>' + esc(q.name) + '</span><span class="tag">' + (qs.done ? '已完成' : '进行中') + '</span></div>' +
          '<div class="q-desc">' + esc(q.desc) + '</div>' +
          '<div class="q-prog"><i style="width:' + pct + '%"></i></div>' +
          '<div class="q-reward">进度 ' + prog + '/' + q.goal + ' · 奖励：' + (q.reward.gold ? q.reward.gold + '金' : '') +
          (q.reward.items ? Object.keys(q.reward.items).filter(k => q.reward.items[k] > 0).map(k => ' ' + G.ITEMS[k].name + '×' + q.reward.items[k]).join('') : '') + '</div></div>';
      });
      const done = G.QUESTS.filter(q => st.quests[q.id].done).length;
      html += '<div style="text-align:center;color:#8fa06b;font-size:12px">小镇恢复度 ' + G.recovery() + '%（任务 ' + done + '/' + G.QUESTS.length + '）</div>';
      body.innerHTML = html;
      return;
    }
    if (type === 'map') {
      body.innerHTML = '<div class="map-canvas-wrap"><canvas id="mini-map" width="480" height="300"></canvas></div>' +
        '<div class="npc-list" id="npc-list"></div>';
      drawMiniMap();
      const list = body.querySelector('#npc-list');
      let html = '<div style="color:#cbb98a;font-size:12px;margin-bottom:4px">— 村民日程（随时间变化） · 当前 ' + G.fmtClock(st.minute) + ' —</div>';
      G.NPCS.forEach(n => {
        const loc = G.npcLocText(n);
        const here = loc !== '休息中' && loc.includes(G.MAPS[st.map].name);
        html += '<div class="npc-row"><span><i class="npc-dot" style="background:' + n.shirt + '"></i>' + esc(n.name) + '</span>' +
          '<span class="' + (loc === '休息中' ? 'away' : 'loc') + '">' + (loc === '休息中' ? '😴 休息中' : (here ? '📍附近 · ' : '') + esc(loc)) + '</span></div>';
      });
      list.innerHTML = html;
      return;
    }
    if (type === 'menu') {
      body.innerHTML = '<div class="menu-list">' +
        '<button class="menu-btn small" id="m-resume">▶ 继续游戏</button>' +
        '<button class="menu-btn small" id="m-save">💾 保存游戏</button>' +
        '<button class="menu-btn small" id="m-stats">📊 结算 / 农场档案</button>' +
        '<button class="menu-btn small" id="m-help">📖 玩法说明</button>' +
        '<button class="menu-btn small" id="m-sound">🔊 音效：开</button>' +
        '<button class="menu-btn small" id="m-title" style="border-color:#8c3b30">🏠 回到标题</button>' +
        '<button class="menu-btn small" id="m-restart" style="border-color:#8c3b30">🔄 重新开始（清除存档）</button>' +
        '</div>';
      body.querySelector('#m-resume').addEventListener('click', UI.closePanel);
      body.querySelector('#m-save').addEventListener('click', () => { G.save(); });
      body.querySelector('#m-stats').addEventListener('click', () => renderPanel('stats'));
      body.querySelector('#m-help').addEventListener('click', () => renderPanel('help'));
      body.querySelector('#m-sound').addEventListener('click', (e) => { e.target.textContent = G.toggleMute() ? '🔇 音效：关' : '🔊 音效：开'; });
      body.querySelector('#m-title').addEventListener('click', () => { G.save(true); UI.showTitle(); });
      body.querySelector('#m-restart').addEventListener('click', () => {
        body.innerHTML = '<div style="text-align:center;padding:16px"><p style="margin-bottom:14px">确定要清除存档并重新开始吗？<br> farm上的汗水可就都没啦！</p>' +
          '<button class="btn danger" id="m-yes">确定重来</button> <button class="btn" id="m-no">再想想</button></div>';
        body.querySelector('#m-yes').addEventListener('click', () => { G.eraseSave(); location.reload(); });
        body.querySelector('#m-no').addEventListener('click', () => renderPanel('menu'));
      });
      return;
    }
    if (type === 'stats') {
      const s = st.stats;
      const done = G.QUESTS.filter(q => st.quests[q.id].done).length;
      const rec = G.recovery();
      body.innerHTML = '<div class="settle-day">农场档案 · 第' + st.year + '年' + G.SEASON_NAMES[st.season] + st.day + '日</div>' +
        '<div class="progress-big"><div class="bar"><i style="width:' + rec + '%"></i></div><div class="lbl">小镇恢复度 ' + rec + '%</div></div>' +
        '<div class="settle-grid">' +
        cell('💰 ' + st.gold, '持有金币') + cell('📈 ' + s.earned, '累计收入') +
        cell('🌱 ' + s.harvested, '收获作物') + cell('🎣 ' + s.fish, '钓鱼次数') +
        cell('🔨 ' + s.built, '建造设施') + cell('🧹 ' + s.cleared, '清理杂物') +
        cell('📜 ' + done + '/' + G.QUESTS.length, '完成任务') + cell('📅 ' + ((st.year - 1) * 112 + (st.season) * 28 + st.day), '经营天数') +
        '</div><div style="text-align:center;margin-top:14px"><button class="btn primary" id="s-back">返回</button></div>';
      body.querySelector('#s-back').addEventListener('click', () => renderPanel('menu'));
      return;
      function cell(v, k) { return '<div class="settle-cell"><div class="v">' + v + '</div><div class="k">' + k + '</div></div>'; }
    }
    if (type === 'help') {
      body.innerHTML = '<div class="help-sec"><h3>🎯 目标</h3><p>你继承了爷爷荒废的农场。清理土地、耕种收获、钓鱼赚钱、建造设施，完成任务，让微光镇重新繁荣起来！</p></div>' +
        '<div class="help-sec"><h3>🎮 操作</h3><p>移动：<kbd>WASD</kbd>/<kbd>方向键</kbd> 或左侧摇杆<br>' +
        '互动/使用手持物：<kbd>空格</kbd>/<kbd>E</kbd> 或右侧「互动」按钮<br>' +
        '使用工具：<kbd>F</kbd> 或右侧「工具」按钮（快捷栏1-6切换工具）<br>' +
        '背包 <kbd>I</kbd> · 任务 <kbd>J</kbd> · 地图 <kbd>M</kbd> · 菜单 <kbd>Esc</kbd></p></div>' +
        '<div class="help-sec"><h3>🌱 耕种</h3><p>锄头开垦 → 种子播种（手持种子+互动）→ 每天浇水（或等下雨）→ 成熟后互动收获。作物只在当季生长，换季会枯萎。雨雪天自动浇水。</p></div>' +
        '<div class="help-sec"><h3>🎣 钓鱼</h3><p>装备鱼竿面向水面按工具键抛竿，浮标闪烁时按互动提竿，按住屏幕/空格抬起鱼框套住游动的鱼。湖边栈桥修好后可到深水区钓稀有鱼。</p></div>' +
        '<div class="help-sec"><h3>💰 赚钱</h3><p>农场出货箱、杂货店都能卖货。杂货店营业 8:00-20:00，按季节出售种子。</p></div>' +
        '<div class="help-sec"><h3>🔨 建造</h3><p>去森林锯木场找老周（或到锯木场门口）建造：洒水器自动浇灌、稻草人防乌鸦、鸡舍每天产蛋、小桥通往深水区。</p></div>' +
        '<div class="help-sec"><h3>😴 作息</h3><p>家里的床可以睡觉结算这一天；凌晨2:00会累倒（体力惩罚）。体力不足时吃点农产品吧。</p></div>' +
        '<div style="text-align:center"><button class="btn primary" id="h-back">明白了</button></div>';
      body.querySelector('#h-back').addEventListener('click', () => { if (G.running) renderPanel('menu'); else UI.closePanel(); });
      return;
    }
    if (type === 'shop') {
      const season = st.season;
      const seeds = Object.keys(G.CROPS).filter(cid => G.CROPS[cid].seasons.includes(season)).map(cid => G.CROPS[cid].seed);
      let html = '<div style="font-size:12px;color:#cbb98a;margin-bottom:8px">“当季种子新鲜上市！” · 你的金币：' + st.gold + '</div>';
      seeds.forEach(sid => {
        const c = G.CROPS[G.ITEMS[sid].cropId];
        html += '<div class="item-row"><span class="nm">' + iconImg(sid) + ' ' + esc(c.name) + '种子（' + c.days + '天）</span>' +
          '<span><span class="pr">' + c.seedCost + '金</span> <button class="btn" data-buy="' + sid + '" data-n="1">买1</button> <button class="btn" data-buy="' + sid + '" data-n="5">买5</button></span></div>';
      });
      html += '<div style="margin:14px 0 6px;color:#ffd964;font-size:13px">— 出售货物 —</div>' + renderSellList();
      body.innerHTML = html;
      paintIcons(body);
      wireSellList(body);
      body.querySelectorAll('[data-buy]').forEach(b => {
        b.addEventListener('click', () => {
          const sid = b.dataset.buy, n = parseInt(b.dataset.n);
          const cost = G.ITEMS[sid].seedCost * n;
          if (st.gold < cost) { UI.toast('金币不足', 'bad'); G.sfx('error'); return; }
          st.gold -= cost; G.addItem(sid, n);
          G.sfx('coin'); UI.refreshHUD();
          UI.toast('购买了 ' + G.ITEMS[sid].name + ' ×' + n, 'good');
          renderPanel('shop');
        });
      });
      return;
    }
    if (type === 'sell-bin') {
      body.innerHTML = '<div style="font-size:12px;color:#cbb98a;margin-bottom:8px">把货物卖给来收货的商人 · 全部当场结算</div>' + renderSellList();
      paintIcons(body); wireSellList(body);
      return;
    }
    if (type === 'build') {
      let html = '<div style="font-size:12px;color:#cbb98a;margin-bottom:8px">“好木头配好图纸。” · 金币 ' + st.gold + ' · 木头 ' + (st.inv.wood || 0) + '</div>';
      Object.keys(G.BUILDS).forEach(id => {
        const b = G.BUILDS[id], c = b.cost;
        const owned = id === 'bridge' ? st.built.bridge : false;
        const afford = st.gold >= c.gold && (!c.wood || (st.inv.wood || 0) >= c.wood);
        html += '<div class="item-row"><span class="nm">' + iconImg(id) + '<div><b>' + b.name + '</b><br>' +
          '<span style="font-size:12px;color:#cbb98a">' + b.desc + '</span></div></span>' +
          '<span class="pr" style="text-align:right">' + c.gold + '金' + (c.wood ? '+' + c.wood + '木' : '') + '<br>' +
          (owned ? '<span style="color:#8fd45a">已建成</span>' : '<button class="btn primary" data-build="' + id + '" ' + (afford ? '' : 'disabled') + '>建造</button>') + '</span></div>';
      });
      html += '<div style="font-size:12px;color:#8a7c5c;margin-top:10px">洒水器/稻草人/鸡舍放置在农场空地；小桥在湖边断口处建造。</div>';
      body.innerHTML = html;
      paintIcons(body);
      body.querySelectorAll('[data-build]').forEach(b => {
        b.addEventListener('click', () => G.startPlace(b.dataset.build));
      });
      return;
    }
    if (type === 'settle') {
      const snap = st.daySnap, s = st.stats;
      const dGold = st.gold - snap.gold;
      const lines = st.dayLog.length ? st.dayLog.map(l => '· ' + esc(l)).join('<br>') : '· 平静的一天';
      body.innerHTML = '<div class="settle-day">🌙 第' + st.year + '年' + G.SEASON_NAMES[st.season] + st.day + '日 · 结算</div>' +
        '<div class="settle-grid">' +
        '<div class="settle-cell"><div class="v" style="color:' + (dGold >= 0 ? '#ffd964' : '#e0453a') + '">' + (dGold >= 0 ? '+' : '') + dGold + '</div><div class="k">今日收支</div></div>' +
        '<div class="settle-cell"><div class="v">+' + (s.harvested - snap.harvested) + '</div><div class="k">收获作物</div></div>' +
        '<div class="settle-cell"><div class="v">+' + (s.fish - snap.fish) + '</div><div class="k">今日钓鱼</div></div>' +
        '<div class="settle-cell"><div class="v">+' + (s.cleared - snap.cleared) + '</div><div class="k">清理杂物</div></div>' +
        '</div>' +
        '<div class="progress-big" style="margin-top:12px"><div class="bar"><i style="width:' + G.recovery() + '%"></i></div><div class="lbl">小镇恢复度 ' + G.recovery() + '%</div></div>' +
        '<div class="settle-log">' + lines + '</div>' +
        '<div style="text-align:center;margin-top:12px"><button class="btn primary" id="settle-next">☀️ 开始新的一天</button></div>';
      body.querySelector('#settle-next').addEventListener('click', () => {
        UI.closePanel();
        if (settleCb) { const cb = settleCb; settleCb = null; cb(); }
        UI.toast(G.WEATHER_NAMES[st.weather] + ' · 新的一天开始了！', 'good');
        G.sfx('sleep');
      });
      return;
    }
    if (type === 'ending') {
      const s = st.stats;
      const totalDays = (st.year - 1) * 112 + st.season * 28 + st.day;
      body.innerHTML = '<div class="settle-day">🎉 微光镇复兴了！</div>' +
        '<p style="text-align:center;color:#cbb98a;font-size:13px">在你的打理下，荒废的农场重新飘起炊烟，<br>小镇的广场又热闹了起来。格雷戈里镇长为你颁发了「荣誉镇民」勋章！</p>' +
        '<div class="progress-big"><div class="bar"><i style="width:100%"></i></div><div class="lbl">小镇恢复度 100%</div></div>' +
        '<div class="settle-grid">' +
        '<div class="settle-cell"><div class="v">' + totalDays + '</div><div class="k">经营天数</div></div>' +
        '<div class="settle-cell"><div class="v">' + s.earned + '</div><div class="k">累计收入</div></div>' +
        '<div class="settle-cell"><div class="v">' + s.harvested + '</div><div class="k">收获作物</div></div>' +
        '<div class="settle-cell"><div class="v">' + s.fish + '</div><div class="k">钓鱼次数</div></div>' +
        '</div>' +
        '<div style="text-align:center;margin-top:14px;display:flex;gap:10px;justify-content:center">' +
        '<button class="btn primary" id="e-continue">继续经营</button>' +
        '<button class="btn" id="e-restart">重新开始</button></div>';
      body.querySelector('#e-continue').addEventListener('click', UI.closePanel);
      body.querySelector('#e-restart').addEventListener('click', () => { G.eraseSave(); location.reload(); });
      return;
    }
  }

  function drawMiniMap() {
    const cvEl = $('#mini-map');
    if (!cvEl) return;
    const ctx = cvEl.getContext('2d');
    const st = G.state, m = G.MAPS[st.map];
    const scale = Math.min(cvEl.width / m.w, cvEl.height / m.h);
    const ox = (cvEl.width - m.w * scale) / 2, oy = (cvEl.height - m.h * scale) / 2;
    ctx.fillStyle = '#171208'; ctx.fillRect(0, 0, cvEl.width, cvEl.height);
    const colors = { '.': '#5f9e3e', ',': '#4a7d2e', p: '#d8c08a', w: '#3f76b5', P: '#b08a5a', f: '#c9a878', W: '#8a7a5a' };
    if (st.season === 2) { colors['.'] = '#a5813c'; colors[','] = '#8a6a2e'; }
    if (st.season === 3) { colors['.'] = '#cfd8dc'; colors[','] = '#b8c4ca'; }
    for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
      ctx.fillStyle = colors[m.terrain[y][x]] || '#5f9e3e';
      ctx.fillRect(ox + x * scale, oy + y * scale, scale + 0.5, scale + 0.5);
    }
    // 出口标记
    ctx.fillStyle = '#ffd964';
    (m.exits || []).forEach(e => ctx.fillRect(ox + e.x * scale - 1, oy + e.y * scale - 1, e.w * scale + 2, e.h * scale + 2));
    // 建筑
    ctx.fillStyle = '#b5533c';
    (m.buildings || []).forEach(b => ctx.fillRect(ox + b.x * scale, oy + b.y * scale, b.w * scale, b.h * scale));
    // NPC
    G.NPCS.forEach(n => {
      const slot = G.npcSlot(n, st.minute);
      if (!slot.map || slot.map !== st.map) return;
      ctx.fillStyle = n.shirt;
      ctx.beginPath(); ctx.arc(ox + (slot.x + 0.5) * scale, oy + (slot.y + 0.5) * scale, Math.max(2.5, scale * 0.4), 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.stroke();
    });
    // 玩家
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#2a2018';
    const px = ox + st.px / TS * scale, py = oy + st.py / TS * scale;
    ctx.beginPath(); ctx.arc(px, py, Math.max(3, scale * 0.45), 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    // 标签
    ctx.fillStyle = '#ffe9b8'; ctx.font = '11px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(m.name, cvEl.width / 2, oy + m.h * scale + 14);
    ctx.textAlign = 'left';
  }

  /* ================= 面向提示 ================= */
  UI.updateHint = function () {
    const st = G.state;
    if (!st || G.paused) { $('#tile-hint').classList.add('hidden'); return; }
    const t = G.facingTile();
    const m = G.MAPS[st.map];
    if (t.x < 0 || t.y < 0 || t.x >= m.w || t.y >= m.h) { $('#tile-hint').classList.add('hidden'); return; }
    let txt = null;
    const npc = G.facingNPC();
    if (npc) txt = '💬 ' + npc.name;
    else {
      const b = (m.buildings || []).find(b => t.x >= b.x && t.x < b.x + b.w && t.y >= b.y && t.y < b.y + b.h);
      const labels = { home: '🏠 进屋', shop: '🏪 杂货店', sawmill: '🔨 锯木场', mayor: '镇长家', cottage: '民居' };
      if (b) txt = labels[b.type] || null;
      if (!txt) {
        const prop = (m.props || []).find(p => p.type !== 'rug' && t.x >= p.x && t.x < p.x + (p.w || 1) && t.y >= p.y && t.y < p.y + (p.h || 1));
        if (prop) {
          const pl = { bin: '🧺 出货箱', bed: '🛏️ 睡觉', sign: '📢 查看告示牌', logpile: '🪵 斧头砍木堆', well: '⛲ 老井' };
          txt = pl[prop.type] || null;
        }
      }
      if (!txt && st.map === 'forest') {
        const spot = G.MAPS.forest.forageSpots.find(s => s.x === t.x && s.y === t.y);
        if (spot && st.foragePicked['f' + t.x + ',' + t.y] !== st.day + st.year * 1000) {
          txt = '✋ 采摘 ' + (G.MAPS.forest.forageSpots.indexOf(spot) % 2 === 0
            ? (st.season === 2 ? '蘑菇' : st.season === 3 ? '雪参' : '野莓') : '野花');
        }
      }
      if (!txt) {
        const ft = st.farmTiles && st.farmTiles[t.x + ',' + t.y];
        if (ft && ft.crop && !ft.crop.dead && ft.crop.prog >= G.CROPS[ft.crop.id].days) txt = '🥬 收获 ' + G.CROPS[ft.crop.id].name;
        else if (st.handItem && G.ITEMS[st.handItem] && G.ITEMS[st.handItem].cat === 'seed' && ft && ft.tilled && !ft.crop) txt = '🌱 播种 ' + G.ITEMS[st.handItem].name;
        else if (st.handTool === 'rod') {
          const terr = m.terrain[t.y][t.x];
          if (terr === 'w') txt = '🎣 抛竿钓鱼';
        }
      }
    }
    const el = $('#tile-hint');
    if (txt) {
      const scale = G.view.scale;
      el.textContent = txt;
      el.style.left = ((st.px - G._cam.x) * scale) + 'px';
      el.style.top = ((st.py - 30 - G._cam.y) * scale) + 'px';
      el.classList.remove('hidden');
    } else el.classList.add('hidden');
  };

  /* ================= 睡觉 ================= */
  UI.confirmSleep = function () {
    UI.openPanel('sleep-confirm');
  };
  // 注册临时面板类型
  const _origRender = renderPanel;
  renderPanel = function (type) {
    if (type === 'sleep-confirm') {
      $('#panel-title').textContent = '🛏️ 睡觉';
      const body = $('#panel-body');
      body.innerHTML = '<div style="text-align:center;padding:10px"><p style="margin-bottom:14px">要结束今天，上床睡觉吗？<br><span style="font-size:12px;color:#8a7c5c">睡觉会结算当日收入并进入早晨</span></p>' +
        '<button class="btn primary" id="sl-yes">😴 睡觉</button> <button class="btn" id="sl-no">再忙一会儿</button></div>';
      body.querySelector('#sl-yes').addEventListener('click', () => {
        UI.closePanel();
        G.sfx('sleep');
        setTimeout(() => UI.showSettle(() => G.newDay(false)), 200);
      });
      body.querySelector('#sl-no').addEventListener('click', UI.closePanel);
      return;
    }
    _origRender(type);
  };
  UI.showSettle = function (cb) {
    settleCb = cb;
    G.paused = true;
    UI.openPanel('settle');
  };
  UI.showEnding = function () {
    G.sfx('catch');
    UI.openPanel('ending');
  };

  /* ================= 钓鱼界面 ================= */
  function isFishingOpen() { return !$('#fishing').classList.contains('hidden'); }
  UI.showFishing = function (on) {
    $('#fishing').classList.toggle('hidden', !on);
    G.paused = on;
  };
  UI.fishMsg = function (t) { $('#fish-tip').textContent = t; };
  UI.drawFishing = function (ctx) {
    const cvEl = $('#fish-canvas');
    const x = cvEl.getContext('2d');
    const W = cvEl.width, H = cvEl.height;
    x.fillStyle = '#1d3040'; x.fillRect(0, 0, W, H);
    x.fillStyle = 'rgba(255,255,255,0.06)';
    for (let j = 0; j < H; j += 12) x.fillRect(0, j + (Math.floor(performance.now() / 300) % 2) * 2, W, 1);
    // 进度
    x.fillStyle = '#0e1620'; x.fillRect(10, 6, W - 20, 10);
    x.fillStyle = '#8fd45a'; x.fillRect(11, 7, (W - 22) * Math.max(0, Math.min(1, G.fishing.prog)), 8);
    x.fillStyle = '#0e1620'; x.fillRect(10, 20, W - 20, 4);
    x.fillStyle = '#e0453a'; x.fillRect(11, 21, (W - 22) * Math.max(0, Math.min(1, G.fishing.timer / 7)), 2);
    // 鱼
    const fy = G.fishing.fishY;
    x.fillStyle = G.fishing.deep ? '#e8d05a' : '#7cc4e8';
    x.fillRect(24, fy - 4, 14, 8);
    x.fillRect(20, fy - 2, 4, 4);
    x.fillRect(36, fy - 3, 3, 6);
    x.fillStyle = '#2a2018'; x.fillRect(26, fy - 2, 2, 2);
    // 鱼框
    const by = G.fishing.barY, BH = 42;
    x.strokeStyle = G.fishing.holding ? '#8fd45a' : '#e8e8e8';
    x.lineWidth = 2;
    x.strokeRect(18, by, 24, BH);
    x.fillStyle = 'rgba(143,212,90,0.18)';
    x.fillRect(19, by + 1, 22, BH - 2);
    // 咬钩提示
    if (G.fishing.bite && G.fishing.phase === 'wait') {
      x.fillStyle = '#e0453a';
      x.font = 'bold 28px sans-serif'; x.textAlign = 'center';
      x.fillText('!', W / 2, 60 + Math.sin(performance.now() / 80) * 4);
    }
    x.fillStyle = 'rgba(255,255,255,0.5)';
    x.font = '10px sans-serif'; x.textAlign = 'center';
    x.fillText(G.fishing.deep ? '🌊 深水区' : '🌤️ 浅水区', W / 2, H - 10);
  };

  /* ================= 触屏控件 ================= */
  function setupTouch() {
    const base = $('#joy-base'), stick = $('#joy-stick');
    let pid = null;
    const setStick = (dx, dy) => {
      stick.style.left = (32 + dx * 34) + 'px';
      stick.style.top = (32 + dy * 34) + 'px';
    };
    base.addEventListener('pointerdown', (e) => {
      pid = e.pointerId;
      base.setPointerCapture(pid);
      e.preventDefault();
    });
    base.addEventListener('pointermove', (e) => {
      if (e.pointerId !== pid) return;
      const r = base.getBoundingClientRect();
      let dx = (e.clientX - r.left - r.width / 2) / (r.width / 2);
      let dy = (e.clientY - r.top - r.height / 2) / (r.height / 2);
      const mag = Math.hypot(dx, dy);
      if (mag > 1) { dx /= mag; dy /= mag; }
      G.input.jx = Math.abs(dx) > 0.18 ? dx : 0;
      G.input.jy = Math.abs(dy) > 0.18 ? dy : 0;
      setStick(dx, dy);
      e.preventDefault();
    });
    const endJoy = (e) => {
      if (e.pointerId !== pid) return;
      pid = null;
      G.input.jx = 0; G.input.jy = 0;
      setStick(0, 0);
    };
    base.addEventListener('pointerup', endJoy);
    base.addEventListener('pointercancel', endJoy);

    $('#btn-act').addEventListener('pointerdown', (e) => {
      e.preventDefault();
      if (isFishingOpen()) { G.fishPress(); G.fishHold(true); return; }
      if (UI.advanceDialog()) return;
      if (G.running) G.doInteract();
    });
    $('#btn-act').addEventListener('pointerup', () => G.fishHold(false));
    $('#btn-tool').addEventListener('pointerdown', (e) => {
      e.preventDefault();
      if (G.running) G.doTool();
    });
    $('#fishing').addEventListener('pointerdown', (e) => {
      e.preventDefault();
      G.fishPress(); G.fishHold(true);
    });
    $('#fishing').addEventListener('pointerup', () => G.fishHold(false));
    $('#fishing').addEventListener('pointerleave', () => G.fishHold(false));
  }

  /* ================= 键盘 ================= */
  function setupKeys() {
    window.addEventListener('keydown', (e) => {
      if (e.repeat && !['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd', 'W', 'A', 'S', 'D'].includes(e.key)) return;
      const k = e.key;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(k)) e.preventDefault();
      const st = G.state;
      switch (k) {
        case 'w': case 'W': case 'ArrowUp': G.input.up = 1; break;
        case 's': case 'S': case 'ArrowDown': G.input.down = 1; break;
        case 'a': case 'A': case 'ArrowLeft': G.input.left = 1; break;
        case 'd': case 'D': case 'ArrowRight': G.input.right = 1; break;
        case ' ': case 'Enter': case 'e': case 'E':
          if (UI.advanceDialog()) return;
          if (isFishingOpen()) { G.fishPress(); G.fishHold(true); return; }
          if (G.running) G.doInteract();
          break;
        case 'f': case 'F':
          if (G.running && !G.paused) G.doTool();
          break;
        case 'i': case 'I': if (G.running) UI.openPanel('bag'); break;
        case 'j': case 'J': if (G.running) UI.openPanel('quests'); break;
        case 'm': case 'M': if (G.running) UI.openPanel('map'); break;
        case 'Escape':
          if (G.placing) { G.placing = null; UI.toast('已取消建造', ''); return; }
          if (!panelType) UI.openPanel('menu');
          else if (panelType !== 'settle' && panelType !== 'ending') UI.closePanel();
          break;
        case '1': case '2': case '3': case '4': case '5':
          if (st) { st.handTool = TOOLS[parseInt(k) - 1]; UI.refreshHotbar(); }
          break;
      }
    });
    window.addEventListener('keyup', (e) => {
      const k = e.key;
      switch (k) {
        case 'w': case 'W': case 'ArrowUp': G.input.up = 0; break;
        case 's': case 'S': case 'ArrowDown': G.input.down = 0; break;
        case 'a': case 'A': case 'ArrowLeft': G.input.left = 0; break;
        case 'd': case 'D': case 'ArrowRight': G.input.right = 0; break;
        case ' ': case 'Enter': case 'e': case 'E': G.fishHold(false); break;
      }
    });
  }

  /* ================= HUD按钮 ================= */
  function setupButtons() {
    $('#btn-bag').addEventListener('pointerdown', () => UI.openPanel('bag'));
    $('#btn-quest').addEventListener('pointerdown', () => UI.openPanel('quests'));
    $('#btn-map').addEventListener('pointerdown', () => UI.openPanel('map'));
    $('#btn-menu').addEventListener('pointerdown', () => UI.openPanel('menu'));
  }

  /* ================= 开始画面 ================= */
  UI.showTitle = function () {
    G.running = false;
    $('#start-screen').classList.remove('hidden');
    $('#hud').classList.add('hidden');
    $('#hotbar').classList.add('hidden');
    $('#joystick').classList.add('hidden');
    $('#action-btns').classList.add('hidden');
    UI.closePanel();
    $('#btn-continue').classList.toggle('hidden', !G.hasSave());
  };
  UI.hideTitle = function () {
    $('#start-screen').classList.add('hidden');
    $('#hud').classList.remove('hidden');
    $('#hotbar').classList.remove('hidden');
    document.body.classList.add('touch-ui');
    if (document.body.classList.contains('touch-ui')) {
      $('#joystick').classList.remove('hidden');
      $('#action-btns').classList.remove('hidden');
    }
    G.running = true;
  };

  UI.startGame = function (isNew) {
    if (isNew || !G.load()) G.newGame();
    UI.refreshHUD();
    UI.refreshHotbar();
    UI.hideTitle();
    if (isNew && !G.state.flags.intro) {
      G.state.flags.intro = 1;
      G.save(true);
      const intro = [
        ['镇长格雷戈里', '孩子，你爷爷留下的农场就在镇西边。杂草丛生，但土地肥沃得很！'],
        ['镇长格雷戈里', '屋里有一把锄头、水壶、斧头、镐和鱼竿，杂货店玛莎那儿能买到种子。'],
        ['镇长格雷戈里', '先用锄头清理杂物、开垦几块地种下去吧！累了就回家上床睡觉。有事随时按 J 看任务日志！'],
      ];
      let i = 0;
      const next = () => {
        if (i < intro.length) { UI.dialog(intro[i][0], intro[i][1], next); i++; }
        else { UI.toast('提示：面向地块按 互动/空格 使用物品，按 F/工具 使用工具', ''); }
      };
      next();
    } else {
      UI.toast('欢迎回来，' + G.SEASON_NAMES[G.state.season] + G.state.day + '日 · ' + G.WEATHER_NAMES[G.state.weather], 'good');
    }
  };

  UI.setup = function () {
    setupTouch();
    setupKeys();
    setupButtons();
    $('#btn-new').addEventListener('click', () => UI.startGame(true));
    $('#btn-continue').addEventListener('click', () => UI.startGame(false));
    $('#btn-help').addEventListener('click', () => UI.openPanel('help'));
  };

  window.addEventListener('visibilitychange', () => { if (document.hidden && G.running) G.save(true); });
})();
