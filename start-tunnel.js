const localtunnel = require('./node_modules/localtunnel');

const LOCAL_PORT = 8080;

async function startTunnel() {
  console.log(`Starting tunnel to local server on port ${LOCAL_PORT}...`);

  try {
    const tunnel = await localtunnel({
      port: LOCAL_PORT,
      subdomain: 'sbti-' + Math.random().toString(36).substring(7)
    });

    console.log('\n========================================');
    console.log('✅ 内网穿透成功！');
    console.log('========================================');
    console.log('\n🌐 您的公网访问地址：');
    console.log(`   ${tunnel.url}`);
    console.log('\n📱 在微信中打开上面的地址即可访问');
    console.log('\n========================================');
    console.log('按 Ctrl+C 停止隧道');
    console.log('========================================\n');

    tunnel.on('close', () => {
      console.log('Tunnel closed');
    });

  } catch (err) {
    console.error('❌ 创建隧道失败:', err.message);
    console.log('\n请检查：');
    console.log('1. 本地服务器是否正在运行 (http://localhost:8080)');
    console.log('2. 网络连接是否正常');
  }
}

startTunnel();
