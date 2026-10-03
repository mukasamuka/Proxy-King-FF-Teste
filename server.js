const http = require('http');
const fs = require('fs');
const path = require('path');

let PORT = 1900;
let AIM = { target: 'neck', enabled: true, strength: 0.5, head: true };

try {
  const cfg = JSON.parse(fs.readFileSync(path.join(__dirname, 'localconfig.json'), 'utf8'));
  PORT = Number(new URL(cfg.verAddr).port) || 1900;
  if (cfg.aim) AIM = Object.assign(AIM, cfg.aim);
} catch (e) {}

const session = { active: false, since: null, aim: AIM };

function onActivate() {
  console.log('[ATIVAR] sessão iniciada');
  console.log('[AIM]', JSON.stringify(session.aim));
  // AQUI você chama seu injetor passando session.aim
  // ex: require('./injetor').start(session.aim);
}
function onDeactivate() {
  console.log('[DESATIVAR] sessão encerrada');
  // require('./injetor').stop();
}

function send(res, code, obj) {
  res.writeHead(code, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': 'no-store'
  });
  res.end(JSON.stringify(obj));
}

http.createServer((req, res) => {
  if (req.method === 'OPTIONS') return send(res, 204, {});
  const url = req.url.split('?')[0];

  if (req.method === 'GET' && (url === '/' || url === '/status')) {
    return send(res, 200, { ok: true, status: session.active ? 'online' : 'offline', since: session.since });
  }
  if (req.method === 'GET' && url === '/config') {
    return send(res, 200, { ok: true, aim: session.aim });
  }
  if (req.method === 'POST' && url === '/activate') {
    if (!session.active) { session.active = true; session.since = new Date().toISOString(); onActivate(); }
    return send(res, 200, { ok: true, status: 'online' });
  }
  if (req.method === 'POST' && url === '/deactivate') {
    if (session.active) { session.active = false; session.since = null; onDeactivate(); }
    return send(res, 200, { ok: true, status: 'offline' });
  }
  send(res, 404, { ok: false, error: 'rota não encontrada' });
}).listen(PORT, '0.0.0.0', () => console.log('Servidor ouvindo na porta ' + PORT));