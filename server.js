const http = require('http');
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const localtunnel = require('localtunnel');

const CONFIG = {
  PORT: 3000,
  QRCODE_PATH: path.join(__dirname, 'static', 'qrcode.png'),
  HTML_FILES: {
    '/': 'sbti_new.html',
    '/guide': 'sbti_study_abroad_guide.html'
  },
  TUNNEL_SUBDOMAIN: 'sbti-project'
};

async function getHtmlWithPopup(pagePath) {
  try {
    let htmlContent = await fs.readFile(pagePath, 'utf8');

    const popupTemplate = `
<!-- 美化版公众号二维码弹窗 → 每次打开必弹 + 动画 + 高颜值 -->
<div class="qrcode-mask" id="qrcodeMask">
  <div class="qrcode-popup">
    <button class="close-btn" id="closeBtn">&times;</button>
    <img src="/static/qrcode.png" alt="公众号二维码" class="qrcode-img">
    <div class="qrcode-text-group">
      <p class="qrcode-main-tip">🌟 关注我们的公众号</p>
      <p class="qrcode-sub-tip">获取最新干货 | 学习资料 | 行业动态</p>
    </div>
  </div>
</div>

<style>
  .qrcode-mask {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, rgba(0,0,0,0.65), rgba(0,0,0,0.85));
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
    opacity: 0;
    visibility: hidden;
    transition: all 0.5s ease;
  }
  .qrcode-mask.show {
    opacity: 1;
    visibility: visible;
  }
  .qrcode-popup {
    position: relative;
    background: #fff;
    padding: 32px 24px;
    border-radius: 20px;
    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    text-align: center;
    width: 340px;
    transform: scale(0.85);
    transition: transform 0.5s cubic-bezier(0.25, 1, 0.5, 1);
  }
  .qrcode-mask.show .qrcode-popup {
    transform: scale(1);
  }
  .close-btn {
    position: absolute;
    top: -12px;
    right: -12px;
    width: 40px;
    height: 40px;
    background: linear-gradient(135deg, #ff6b6b, #ff4757);
    color: #fff;
    border: none;
    border-radius: 50%;
    font-size: 22px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 12px rgba(255,71,87,0.3);
    transition: all 0.2s ease;
  }
  .close-btn:hover {
    transform: scale(1.08);
  }
  .qrcode-img {
    width: 100%;
    max-width: 260px;
    border-radius: 12px;
    margin-bottom: 20px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  }
  .qrcode-main-tip {
    font-size: 20px;
    font-weight: bold;
    color: #222;
    margin-bottom: 8px;
  }
  .qrcode-sub-tip {
    font-size: 14px;
    color: #666;
  }
</style>

<script>
  const mask = document.getElementById('qrcodeMask');
  const close = document.getElementById('closeBtn');

  function closePopup() {
    mask.classList.remove('show');
  }

  window.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      mask.classList.add('show');
    }, 200);

    close.addEventListener('click', closePopup);
    mask.addEventListener('click', (e) => {
      if (e.target === mask) closePopup();
    });
  });
</script>
`;

    return htmlContent.replace('</body>', `${popupTemplate}</body>`);
  } catch (err) {
    console.error('读取HTML失败', err);
    return '<h1>页面加载失败</h1>';
  }
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.url === '/static/qrcode.png') {
      if (!fsSync.existsSync(CONFIG.QRCODE_PATH)) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        return res.end('请在 static/qrcode.png 放入公众号二维码');
      }
      const data = await fs.readFile(CONFIG.QRCODE_PATH);
      res.writeHead(200, { 'Content-Type': 'image/png' });
      return res.end(data);
    }

    const pathname = req.url.split('?')[0];
    const file = CONFIG.HTML_FILES[pathname];
    if (file) {
      const html = await getHtmlWithPopup(path.join(__dirname, file));
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(html);
    }

    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end('<h1>404 页面不存在</h1>');
  } catch (e) {
    res.end('服务器错误');
  }
});

server.listen(CONFIG.PORT, async () => {
  console.log('✅ 网站已启动: http://localhost:' + CONFIG.PORT);
  try {
    const tunnel = await localtunnel({ port: CONFIG.PORT, subdomain: CONFIG.TUNNEL_SUBDOMAIN });
    console.log('🌐 外网地址:', tunnel.url);
  } catch (e) {}
});