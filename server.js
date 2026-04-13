const http = require('http');
const fs = require('fs').promises; // 改用Promise版fs，避免回调地狱
const fsSync = require('fs'); // 同步fs用于检查文件是否存在
const path = require('path');
const localtunnel = require('localtunnel');

// 配置项（集中管理，方便修改）
const CONFIG = {
  PORT: 3000,
  QRCODE_PATH: path.join(__dirname, 'static', 'qrcode.png'), // 二维码放到static目录，更规范
  HTML_FILES: { // 映射多页面路由
    '/': 'sbti_new.html',
    '/guide': 'sbti_study_abroad_guide.html'
  },
  TUNNEL_SUBDOMAIN: 'sbti-project' // 自定义内网穿透子域名（可选）
};

// 读取HTML文件并注入弹窗代码（核心优化：复用弹窗逻辑，不重复写HTML）
async function getHtmlWithPopup(pagePath) {
  try {
    // 读取原始HTML文件
    let htmlContent = await fs.readFile(pagePath, 'utf8');
    
    // 弹窗模板（独立抽离，便于维护）
    const popupTemplate = `
<!-- 公众号二维码弹窗（自动注入） -->
<div class="qrcode-mask" id="qrcodeMask">
  <div class="qrcode-popup">
    <button class="close-btn" id="closeBtn">&times;</button>
    <img src="/static/qrcode.png" alt="公众号二维码" class="qrcode-img">
    <div class="qrcode-text-group">
      <p class="qrcode-main-tip">📢 关注我的公众号</p>
      <p class="qrcode-sub-tip">每日更新 SBTI 相关干货 | 回复【资料】领资源</p>
      <p class="qrcode-mini-tip">扫码后点击「关注」即可</p>
    </div>
  </div>
</div>

<!-- 弹窗样式 -->
<style>
  /* 重置默认样式 */
  .qrcode-mask, .qrcode-popup, .close-btn, .qrcode-img, .qrcode-text-group {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  /* 弹窗遮罩层 */
  .qrcode-mask {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
    opacity: 1;
    transition: opacity 0.3s ease;
  }
  /* 弹窗容器 */
  .qrcode-popup {
    position: relative;
    background-color: #fff;
    padding: 25px 20px;
    border-radius: 12px;
    box-shadow: 0 0 25px rgba(0, 0, 0, 0.2);
    text-align: center;
    max-width: 90%;
    width: 320px;
  }
  /* 关闭按钮 */
  .close-btn {
    position: absolute;
    top: -12px;
    right: -12px;
    width: 32px;
    height: 32px;
    background: #ff5555;
    color: #fff;
    border: none;
    border-radius: 50%;
    font-size: 20px;
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    transition: background 0.2s;
  }
  .close-btn:hover {
    background: #ff7777;
  }
  /* 二维码图片 */
  .qrcode-img {
    width: 100%;
    max-width: 260px;
    height: auto;
    margin-bottom: 18px;
    border: 1px solid #eee;
    padding: 8px;
    border-radius: 8px;
  }
  /* 提示文字 */
  .qrcode-main-tip {
    font-size: 18px;
    color: #222;
    font-weight: 600;
    margin: 0 0 8px 0;
    line-height: 1.4;
  }
  .qrcode-sub-tip {
    font-size: 14px;
    color: #666;
    margin: 0 0 6px 0;
    line-height: 1.3;
  }
  .qrcode-mini-tip {
    font-size: 12px;
    color: #999;
    margin: 0;
    line-height: 1.2;
  }
  /* 隐藏弹窗 */
  .qrcode-mask.hidden {
    opacity: 0;
    pointer-events: none;
  }
</style>

<!-- 弹窗逻辑脚本（移除localStorage逻辑，每次打开都显示） -->
<script>
  (function() {
    // 避免重复执行
    if (window.qrcodePopupLoaded) return;
    window.qrcodePopupLoaded = true;

    // 获取元素
    const qrcodeMask = document.getElementById('qrcodeMask');
    const closeBtn = document.getElementById('closeBtn');

    // 关闭弹窗（仅隐藏，不记录本地存储）
    function closePopup() {
      qrcodeMask.classList.add('hidden');
    }

    // 初始化
    window.addEventListener('DOMContentLoaded', () => {
      // 移除：检查本地存储是否关闭的逻辑，确保每次都显示弹窗

      // 关闭按钮事件
      closeBtn.addEventListener('click', closePopup);
      // 点击遮罩层关闭
      qrcodeMask.addEventListener('click', (e) => {
        if (e.target === qrcodeMask) closePopup();
      });
    });
  })();
</script>`;

    // 将弹窗注入到HTML的</body>前（核心优化：不修改原有HTML文件，自动注入）
    return htmlContent.replace('</body>', `${popupTemplate}</body>`);
  } catch (err) {
    console.error(`读取HTML文件失败: ${pagePath}`, err);
    return `<h1>页面加载失败</h1><p>错误信息: ${err.message}</p>`;
  }
}

// 创建HTTP服务器
const server = http.createServer(async (req, res) => {
  try {
    // 1. 处理静态资源（二维码图片）
    if (req.url === '/static/qrcode.png') {
      if (!fsSync.existsSync(CONFIG.QRCODE_PATH)) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        return res.end('错误：二维码图片不存在，请检查 static/qrcode.png 文件');
      }
      const qrcodeData = await fs.readFile(CONFIG.QRCODE_PATH);
      res.writeHead(200, { 'Content-Type': 'image/png' });
      return res.end(qrcodeData);
    }

    // 2. 处理页面路由
    const requestedPath = req.url.split('?')[0]; // 忽略URL参数
    const htmlFileName = CONFIG.HTML_FILES[requestedPath];
    
    if (htmlFileName) {
      const htmlPath = path.join(__dirname, htmlFileName);
      const htmlWithPopup = await getHtmlWithPopup(htmlPath);
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(htmlWithPopup);
    }

    // 3. 404页面
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`<h1>404 - 页面未找到</h1><p>可访问的页面：${Object.keys(CONFIG.HTML_FILES).join('、')}</p>`);
  } catch (err) {
    // 全局错误处理
    console.error('服务器错误:', err);
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('服务器内部错误，请查看控制台日志');
  }
});

// 启动服务器+内网穿透
server.listen(CONFIG.PORT, async () => {
  console.log(`✅ 网站服务已启动（本地）`);
  console.log(`🔗 本地访问地址：http://localhost:${CONFIG.PORT}`);
  console.log(`📄 可访问页面：`);
  Object.entries(CONFIG.HTML_FILES).forEach(([path, file]) => {
    console.log(`   - http://localhost:${CONFIG.PORT}${path} (对应文件：${file})`);
  });

  // 启动内网穿透（优化：增加错误处理+自定义子域名）
  try {
    const tunnel = await localtunnel({
      port: CONFIG.PORT,
      subdomain: CONFIG.TUNNEL_SUBDOMAIN // 自定义子域名，方便记忆
    });
    console.log(`🌐 内网穿透地址：${tunnel.url}`);
    console.log(`⚠️  注意：内网穿透地址仅临时可用，关闭服务器后失效`);
    tunnel.on('close', () => console.log('❌ 内网穿透连接已关闭'));
  } catch (err) {
    console.warn(`⚠️  内网穿透启动失败（不影响本地访问）`, err.message);
  }
});

// 优雅关闭服务器
process.on('SIGINT', () => {
  console.log('\n📤 正在关闭服务器...');
  server.close(() => {
    console.log('✅ 服务器已关闭');
    process.exit(0);
  });
});