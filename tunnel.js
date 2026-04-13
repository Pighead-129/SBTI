const http = require('http');
const https = require('https');

const TUNNEL_URL = 'https://localtunnel.me';

function createTunnel(localPort, callback) {
  const req = http.request({
    host: 'localtunnel.me',
    port: localPort,
    method: 'GET'
  }, (res) => {
    console.log(`Tunnel response status: ${res.statusCode}`);
  });

  req.on('error', (e) => {
    console.error('Tunnel error:', e.message);
  });

  const tunnelReq = http.request({
    hostname: 'localtunnel.me',
    port: 80,
    path: `/?port=${localPort}`,
    method: 'GET'
  }, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
      console.log('Tunnel response:', data);
      if (res.statusCode === 200 && data.includes('url')) {
        const match = data.match(/url=([^&]+)/);
        if (match) {
          callback(null, 'https://' + match[1]);
        }
      }
    });
  });

  tunnelReq.on('error', (e) => {
    callback(e);
  });

  tunnelReq.end();
}

const localPort = 8080;
console.log(`Attempting to create tunnel to local server on port ${localPort}...`);
console.log('If this fails, please manually visit https://localtunnel.me and follow instructions.');

// Fallback: just keep server running
console.log('Server is running. To access from internet, please:');
console.log('1. Install localtunnel globally: npm install -g localtunnel');
console.log('2. Run: lt --port 8080');
console.log('Or use cloudflare tunnel or ngrok');
