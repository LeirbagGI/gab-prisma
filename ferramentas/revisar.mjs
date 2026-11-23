// revisar.mjs <projeto> [pastaSaida]
// Revisão SEM render: o agente "revisao" percorre a linha do tempo no estúdio aberto (aba da frente),
// parando no começo e no fim de cada cena, e eu fotografo o palco direto da tela (screencapture).
// Saem palco-<cena>-<pos>.png + folha.jpg para eu olhar.
import {execFileSync} from 'node:child_process';
import {mkdirSync, readFileSync} from 'node:fs';
import {join} from 'node:path';

const [proj, saidaArg] = process.argv.slice(2);
const API = 'http://localhost:4460/api';
const out = saidaArg || join(process.env.HOME, 'gab-prisma/trabalho/revisao', proj, String(Date.now()));
mkdirSync(out, {recursive: true});
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
const mandar = (a) => fetch(`${API}/acoes/${proj}`, {method: 'POST', body: JSON.stringify(a)});

const tempo = JSON.parse(readFileSync(join(process.env.HOME, 'gab-prisma/public', proj, 'tempo.json'), 'utf8'));
const n = JSON.parse(readFileSync(join(process.env.HOME, 'gab-prisma/roteiros', proj + '.json'), 'utf8')).cenas.length;

await mandar([{agente: 'revisao', tipo: 'nota', msg: 'revisando na linha do tempo, cena por cena', ms: 600}, {agente: 'revisao', tipo: 'medir'}]);
let m = null;
for (let t = 0; t < 40 && !m; t++) {
  await esperar(500);
  const a = await fetch(`${API}/agentes`).then((r) => r.json());
  const l = [...a.registro].reverse().find((x) => x.agente === 'medida');
  if (l && Date.now() - l.t < 30000) m = JSON.parse(l.msg);
}
if (!m) { console.error('o estúdio não respondeu (aba aberta e na frente?)'); process.exit(1); }
console.log('palco na tela:', m);

// fotografa a janela do estúdio (mesmo atrás de nada: ela está na frente) e recorta o palco
const janela = () => execFileSync(join(process.env.HOME, 'gab-prisma/ferramentas/janela'), ['Prisma Studio']).toString().trim().split(' ');
const foto = (f) => {
  const [id] = janela();
  const bruto = f.replace(/\.png$/, '-janela.png');
  execFileSync('screencapture', ['-x', '-o', '-l', id, bruto]);
  const [W, H] = execFileSync('sips', ['-g', 'pixelWidth', '-g', 'pixelHeight', bruto]).toString().match(/\d+(?=\n|$)/g).map(Number);
  const k = W / m.iw, topo = H - m.ih * k; // barra do navegador em cima
  const c = [m.w * k, m.h * k, m.x * k, topo + m.y * k].map(Math.round);
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', bruto, '-vf', `crop=${c.join(':')}`, f]);
};
const posicoes = [0.12, 0.85];
for (let i = 0; i < Math.min(n, tempo.cenas.length); i++) {
  for (const pos of posicoes) {
    await mandar({agente: 'revisao', tipo: 'ver', cena: i, pos, ms: 300});
    await esperar(1700);
    const f = join(out, `palco-${String(i + 1).padStart(2, '0')}-${pos}.png`);
    foto(f);
  }
}
await mandar({agente: 'revisao', tipo: 'nota', msg: 'revisão feita, olhando os quadros', ms: 400});
execFileSync('ffmpeg', ['-v', 'error', '-y', '-pattern_type', 'glob', '-i', join(out, 'palco-*[0-9].png'), '-vf', 'scale=200:-1,tile=8x3', '-frames:v', '1', join(out, 'folha.jpg')]);
console.log(join(out, 'folha.jpg'));
