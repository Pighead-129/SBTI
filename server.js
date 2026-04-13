const http = require('http');
const fs = require('fs').promises;
const path = require('path');
const fsSync = require('fs');

// ==============================================
// 基础配置（干净、清晰、可随意修改）
// ==============================================
const CONFIG = {
  PORT: 8080,
  INDEX_PAGE: 'sbti_new_optimized.html',
  GUIDE_PAGE: 'sbti_study_abroad_guide_optimized.html',
  STATIC_FOLDERS: ['css', 'js', 'static', 'images', 'assets']
};

// ==============================================
// 文件类型识别（让浏览器正确识别样式、图片、JS）
// ==============================================
function getMimeType(ext) {
  const types = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
  };
  return types[ext] || 'application/octet-stream';
}

// ==============================================
// 自动注入公众号二维码弹窗（你最初的要求）
// ==============================================
function injectPopup(html) {
  const popup = `
  <style>
    .qrcode-modal{
      position:fixed;
      inset:0;
      background:rgba(0,0,0,0.7);
      display:flex;
      align-items:center;
      justify-content:center;
      z-index:99999;
      font-family:system-ui, -apple-system, sans-serif;
    }
    .qrcode-box{
      background:#fff;
      border-radius:20px;
      padding:36px 30px;
      max-width:330px;
      text-align:center;
      box-shadow:0 25px 50px rgba(0,0,0,0.25);
      position:relative;
      animation:popupScale 0.3s ease;
    }
    @keyframes popupScale{
      from{opacity:0; transform:scale(0.9);}
      to{opacity:1; transform:scale(1);}
    }
    .qrcode-img{
      width:230px;
      height:230px;
      object-fit:contain;
      border-radius:12px;
      margin-bottom:20px;
    }
    .close-btn{
      position:absolute;
      top:-14px;
      right:-14px;
      width:40px;
      height:40px;
      background:#ff5c5c;
      color:#fff;
      border:none;
      border-radius:50%;
      font-size:22px;
      cursor:pointer;
      display:flex;
      align-items:center;
      justify-content:center;
      box-shadow:0 4px 12px rgba(0,0,0,0.15);
      transition:0.2s;
    }
    .close-btn:hover{
      background:#ff4444;
    }
    .qrcode-title{
      font-size:17px;
      color:#222;
      margin-bottom:8px;
      font-weight:600;
    }
    .qrcode-desc{
      font-size:14px;
      color:#666;
      line-height:1.5;
    }
  </style>

  <div class="qrcode-modal" id="qrcodeModal">
    <div class="qrcode-box">
      <button class="close-btn" onclick="closePopup()">×</button>
      <img src="/static/qrcode.png" class="qrcode-img" alt="公众号二维码">
      <div class="qrcode-title">关注公众号获取完整资料</div>
      <div class="qrcode-desc">每日更新 SBTI 留学干货 | 回复【资料】领取</div>
    </div>
  </div>

  <script>
    function closePopup(){
      document.getElementById("qrcodeModal").style.display = "none";
    }
    window.addEventListener('DOMContentLoaded', function(){
      document.getElementById("qrcodeModal").style.display = "flex";
    });
  </script>
  </body>`;

  return html.replace('</body>', popup);
}

// ==============================================
// 静态资源服务（CSS / JS / 图片）
// ==============================================
async function serveStatic(filePath, res) {
  try {
    const content = await fs.readFile(filePath);
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': getMimeType(ext) });
    res.end(content);
  } catch (e) {
    res.writeHead(404);
    res.end('404 Not Found');
  }
}

// ==============================================
// 主服务器
// ==============================================
const server = http.createServer(async (req, res) => {
  const url = req.url.split('?')[0];
  const isStatic = CONFIG.STATIC_FOLDERS.some(f => url.startsWith(`/${f}/`));

  // 静态资源
  if (isStatic) {
    const filePath = path.join(__dirname, url);
    return await serveStatic(filePath, res);
  }

  // 主页
  if (url === '/' || url === '/index.html') {
    const htmlPath = path.join(__dirname, CONFIG.INDEX_PAGE);
    let html = await fs.readFile(htmlPath, 'utf8');
    html = injectPopup(html);
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(html);
  }

  // 指南页
  if (url === '/guide') {
    const htmlPath = path.join(__dirname, CONFIG.GUIDE_PAGE);
    let html = await fs.readFile(htmlPath, 'utf8');
    html = injectPopup(html);
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(html);
  }

  // 404
  res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end('<h1>404 页面不存在</h1>');
});

// ==============================================
// 启动服务（美观输出）
// ==============================================
server.listen(CONFIG.PORT, () => {
  console.log('\n========================================');
  console.log('✅ 服务启动成功！');
  console.log('📍 本地地址：http://localhost:' + CONFIG.PORT);
  console.log('📄 主页：http://localhost:' + CONFIG.PORT + '/');
  console.log('📄 指南页：http://localhost:' + CONFIG.PORT + '/guide');
  console.log('========================================\n');
});

// 优雅关闭
process.on('SIGINT', () => {
  server.close(() => {
    console.log('\n👋 服务已正常关闭');
    process.exit(0);
  });
});