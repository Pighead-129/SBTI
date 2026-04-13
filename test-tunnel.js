const localtunnel = require('./node_modules/localtunnel');
const http = require('http');

console.log('检查本地服务器状态...');

const testReq = http.get('http://localhost:8080/', (res) => {
  console.log(`本地服务器状态: ${res.statusCode}`);

  if (res.statusCode === 200) {
    console.log('本地服务器正常，开始创建隧道...\n');

    localtunnel({ port: 8080 }).then((tunnel) => {
      console.log('========================================');
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
        process.exit(0);
      });
    }).catch((err) => {
      console.error('❌ 隧道创建失败:', err.message);
      if (err.message.includes('socket')) {
        console.error('\n可能是网络问题，无法连接到 localtunnel.me 服务器');
        console.error('建议：');
        console.error('1. 检查网络连接');
        console.error('2. 可能需要 VPN');
        console.error('3. 或者部署到免费的静态托管服务');
      }
      process.exit(1);
    });
  }
}).on('error', (err) => {
  console.error('❌ 本地服务器无法访问:', err.message);
  console.error('请确保 server.js 正在运行');
  process.exit(1);
});
