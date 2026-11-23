/* ============ 微光谷物语 · 主入口 ============ */
window.G = window.G || {};
(function () {
  'use strict';
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  let lastT = 0;

  function resize() {
    const vw = window.innerWidth, vh = window.innerHeight;
    // 选择整数缩放：保证视野至少 22x12 瓦片，桌面更大视野
    let scale = Math.max(2, Math.floor(Math.min(vw / (21 * 16), vh / (13 * 16))));
    if (vw / scale < 15 * 16) scale = 2;
    G.view.scale = scale;
    G.view.w = Math.ceil(vw / scale);
    G.view.h = Math.ceil(vh / scale);
    canvas.width = G.view.w;
    canvas.height = G.view.h;
    ctx.imageSmoothingEnabled = false;
  }
  window.addEventListener('resize', resize);

  function loop(t) {
    requestAnimationFrame(loop);
    const dt = Math.min(0.05, (t - lastT) / 1000 || 0.016);
    lastT = t;
    if (G.running && G.state) {
      G.update(dt);
      G.render(ctx, dt);
      G._cam && G.UI.updateHint();
      if (G.fishing.active) G.UI.drawFishing(ctx);
    } else if (!G.running) {
      drawStartBg(ctx, t / 1000);
    }
  }

  // 标题背景：缓动的像素农场小景
  function drawStartBg(ctx, time) {
    const w = canvas.width, h = canvas.height;
    const sc = document.getElementById('start-canvas');
    if (!sc) return;
    if (sc.width !== w || sc.height !== h) { sc.width = w; sc.height = h; }
    const x = sc.getContext('2d');
    x.imageSmoothingEnabled = false;
    // 天空渐变（黄昏→夜循环缓慢变化）
    const ph = (Math.sin(time * 0.05) + 1) / 2;
    const sky = x.createLinearGradient(0, 0, 0, h * 0.6);
    sky.addColorStop(0, ph > 0.5 ? '#2b3a66' : '#ffb36b');
    sky.addColorStop(1, ph > 0.5 ? '#3f5a8a' : '#e88a5a');
    x.fillStyle = sky; x.fillRect(0, 0, w, h * 0.6);
    // 太阳/月亮
    const cx = w * 0.75, cy = h * 0.18 + Math.sin(time * 0.05) * 4;
    x.fillStyle = ph > 0.5 ? '#e8ecf2' : '#ffd964';
    x.fillRect(cx - 6, cy - 6, 12, 12);
    x.fillRect(cx - 8, cy - 2, 16, 4); x.fillRect(cx - 2, cy - 8, 4, 16);
    // 远山与树林
    x.fillStyle = '#3f5a3a'; x.fillRect(0, h * 0.42, w, h * 0.1);
    x.fillStyle = '#33492f'; x.fillRect(0, h * 0.5, w, h * 0.2);
    for (let i = 0; i < 14; i++) {
      const tx = (i * 37 + 10) % w;
      x.fillStyle = i % 3 === 0 ? '#2a3d26' : '#3a5232';
      x.fillRect(tx, h * 0.38 + (i % 3) * 3, 10, 16);
      x.fillRect(tx + 3, h * 0.36 + (i % 3) * 3, 4, 4);
    }
    // 农田
    x.fillStyle = '#5f9e3e'; x.fillRect(0, h * 0.62, w, h * 0.38);
    x.fillStyle = '#8a6a42';
    for (let r = 0; r < 3; r++) x.fillRect(w * 0.1 + r * 26, h * 0.7 + r * 8, 120, 6);
    // 小房子
    x.fillStyle = '#d9b98a'; x.fillRect(w * 0.16, h * 0.56, 40, 26);
    x.fillStyle = '#b5533c';
    for (let j = 0; j < 10; j++) { const ins = Math.max(0, 6 - j); x.fillRect(w * 0.16 - ins, h * 0.56 - 10 + j, 40 + ins * 2, 2); }
    x.fillStyle = '#5a3a20'; x.fillRect(w * 0.16 + 16, h * 0.56 + 14, 8, 12);
    x.fillStyle = '#ffe98a'; x.fillRect(w * 0.16 + 4, h * 0.56 + 6, 6, 6); x.fillRect(w * 0.16 + 30, h * 0.56 + 6, 6, 6);
    // 烟囱烟雾
    const smoke = (time * 10) % 30;
    x.fillStyle = 'rgba(240,240,240,0.5)';
    x.fillRect(w * 0.16 + 46, h * 0.56 - 14 - smoke, 4, 4);
    // 飘云
    for (let i = 0; i < 4; i++) {
      const cxx = ((time * (6 + i * 2) + i * 90) % (w + 60)) - 30;
      x.fillStyle = ph > 0.5 ? 'rgba(200,210,230,0.5)' : 'rgba(255,235,210,0.7)';
      x.fillRect(cxx, h * 0.12 + i * 14, 26, 6); x.fillRect(cxx + 6, h * 0.12 + i * 14 - 4, 14, 4);
    }
  }

  function boot() {
    G.buildSprites();
    resize();
    G.UI.setup();
    G.UI.showTitle();
    requestAnimationFrame(loop);
  }
  boot();
})();
