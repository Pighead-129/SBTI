const localtunnel = require('./node_modules/localtunnel');

(async () => {
  console.log('正在连接到 localtunnel.me...');

  try {
    const tunnel = await localtunnel({
      port: 8080
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
      console.log('隧道已关闭');
    });

  } catch (err) {
    console.error('❌ 创建隧道失败:', err.message);
    console.error(err);
  }
})();
