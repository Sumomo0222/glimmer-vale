#!/usr/bin/env node
/* 构建脚本：把 css/js 内联进单个 dist/index.html（便于任意静态CDN托管） */
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');

const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'css', 'style.css'), 'utf8');
const jsOrder = ['data.js', 'maps.js', 'sprites.js', 'engine.js', 'ui.js', 'main.js'];
const js = jsOrder.map(f => fs.readFileSync(path.join(root, 'js', f), 'utf8')).join('\n;\n');

const out = html
  .replace('<!--BUILD_CSS-->', '<style>\n' + css + '\n</style>')
  .replace('<!--BUILD_JS-->', '<script>\n' + js + '\n</script>');

fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
fs.writeFileSync(path.join(root, 'dist', 'index.html'), out);
const kb = (Buffer.byteLength(out) / 1024).toFixed(1);
console.log('dist/index.html built:', kb, 'KB');
