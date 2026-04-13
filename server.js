const http = require('http');
const fs = require('fs').promises;
const path = require('path');
const fsSync = require('fs');

const CONFIG = {
  PORT: 8080,
  MAIN_PAGE: 'sbti_new_optimized.html',
  GUIDE_PAGE: 'sbti_study_abroad_guide_optimized.html',
  STATIC_FOLDERS: ['css', 'js', 'static', 'images', 'assets']
};

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

function injectPopup(html) {
  const popup = `
  <style>
    .qrcode-modal{position:fixed;inset:0;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:99999;font-family:system-ui;}
    .qrcode-box{background:#fff;border-radius:20px;padding:36px 30px;max-width:330px;text-align:center;box-shadow:0 25px 50px rgba(0,0,0,0.25);position:relative;animation:popupScale 0.3s ease;}
    @keyframes popupScale{from{opacity:0; transform:scale(0.9);}to{opacity:1; transform:scale(1);}}
    .qrcode-img{width:230px;height:230px;object-fit:contain;border-radius:12px;margin-bottom:20px;}
    .close-btn{position:absolute;top:-14px;right:-14px;width:40px;height:40px;background:#ff5c5c;color:#fff;border:none;border-radius:50%;font-size:22px;cursor-pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(0,0,0,0.15);transition:0.2s;}
    .close-btn:hover{background:#ff4444;}
    .qrcode-title{font-size:17px;color:#222;margin-bottom:8px;font-weight:600;}
    .qrcode-desc{font-size:14px;color:#666;line-height:1.5;}

    .follow-modal{position:fixed;inset:0;background:rgba(0,0,0,0.7);display:none;align-items:center;justify-content:center;z-index:100000;}
    .follow-box{background:#fff;border-radius:20px;padding:30px;max-width:340px;text-align:center;box-shadow:0 25px 50px rgba(0,0,0,0.25);position:relative;animation:popupScale 0.3s ease;}
    .emoji{width:80px;height:80px;margin-bottom:10px;}
    .follow-text{font-size:15px;color:#333;line-height:1.6;margin-bottom:15px;}
    .corner-qr{position:absolute;bottom:18px;right:18px;width:100px;height:100px;}
    .know-btn{padding:10px 24px;background:#409eff;color:#fff;border:none;border-radius:10px;font-size:15px;cursor-pointer;}

    .detail-page{display:none;position:fixed;inset:0;background:#fff;z-index:9999;padding:40px 20px;overflow-y:auto;}
    .detail-container{max-width:600px;margin:0 auto;}
    .back-btn{padding:12px 24px;background:#409eff;color:#fff;border:none;border-radius:10px;cursor-button;margin-top:20px;}
  </style>

  <div class="qrcode-modal" id="qrcodeModal">
    <div class="qrcode-box">
      <button class="close-btn" onclick="closeQrcode()">×</button>
      <img src="/static/qrcode.png" class="qrcode-img">
      <div class="qrcode-title">关注公众号获取完整资料</div>
      <div class="qrcode-desc"> SBTI 留学干货 | 回复【资料】领取</div>
    </div>
  </div>

  <div class="follow-modal" id="followModal">
    <div class="follow-box">
      <img src="/static/cute-emoji.png" class="emoji">
      <div class="follow-text">真的不关注一下嘛 😜<br>后续我们会持续更新更多好玩、实用的新创意！</div>
      <img src="/static/qrcode.png" class="corner-qr">
      <button class="know-btn" onclick="closeFollow()">知道啦</button>
    </div>
  </div>

  <div class="detail-page" id="detailPage">
    <div class="detail-container">
      <h1>ATM 型人格</h1>
      <p>ATM 型人格非常慷慨、温柔、喜欢照顾别人，习惯优先满足他人，总是默默付出。</p>
      <button class="back-btn" onclick="goBack()">返回查询</button>
    </div>
  </div>

  <script>
    function closeQrcode(){
      document.getElementById('qrcodeModal').style.display = 'none';
      document.getElementById('followModal').style.display = 'flex';
    }
    function closeFollow(){
      document.getElementById('followModal').style.display = 'none';
    }
    function goBack(){
      document.getElementById('detailPage').style.display = 'none';
    }

    function checkInput(input) {
      const val = input.value.trim().toUpperCase();
      if (val === 'ATM') {
        document.getElementById('detailPage').style.display = 'block';
        return false;
      } else {
        document.getElementById('qrcodeModal').style.display = 'flex';
        return false;
      }
    }
  </script>
  </body>`;

  return html.replace('</body>', popup);
}

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

const server = http.createServer(async (req, res) => {
  const url = req.url.split('?')[0];
  const isStatic = CONFIG.STATIC_FOLDERS.some(f => url.startsWith(`/${f}/`));

  if (isStatic) {
    const filePath = path.join(__dirname, url);
    return await serveStatic(filePath, res);
  }

  if (url === '/' || url === '/index.html') {
    const htmlPath = path.join(__dirname, CONFIG.MAIN_PAGE);
    let html = await fs.readFile(htmlPath, 'utf8');
    html = injectPopup(html);
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(html);
  }

  if (url === '/guide') {
    const htmlPath = path.join(__dirname, CONFIG.GUIDE_PAGE);
    let html = await fs.readFile(htmlPath, 'utf8');
    html = injectPopup(html);
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(html);
  }

  res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end('<h1>404</h1>');
});

server.listen(CONFIG.PORT, () => {
  console.log('\n========================================');
  console.log('✅ 服务启动成功！');
  console.log('📍 主页：http://localhost:' + CONFIG.PORT);
  console.log('📄 指南页：http://localhost:' + CONFIG.PORT + '/guide');
  console.log('========================================\n');
});

process.on('SIGINT', () => {
  server.close(() => {
    console.log('\n👋 服务已关闭');
    process.exit(0);
  });
});