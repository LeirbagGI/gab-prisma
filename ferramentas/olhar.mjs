// olhar.mjs <projeto> <pastaSaida> [pos1,pos2,...]
// Revisão SEM render e sem mexer na aba do Gabriel: abre o estúdio em modo só de olhar (?ver=1) no
// navegador de testes (~/gab-painel-ia/ab), pula pela linha do tempo e fotografa o palco em cada ponto.
import {execFileSync} from 'node:child_process';
import {mkdirSync, readFileSync} from 'node:fs';
import {join, resolve, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const [proj, out, posArg] = process.argv.slice(2);
// navegador de testes por linha de comando (agent-browser ou o wrapper ab do painel): PRISMA_AB
const AB = process.env.PRISMA_AB || join(process.env.HOME, 'gab-painel-ia/ab');
const ab = (...a) => execFileSync(AB, a, {stdio: ['ignore', 'pipe', 'pipe']}).toString();
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
mkdirSync(out, {recursive: true});
const tempo = JSON.parse(readFileSync(join(RAIZ, 'public', proj, 'tempo.json'), 'utf8'));
const posicoes = (posArg || '0.12,0.5,0.88').split(',').map(Number);

try { ab('nota', 'Revisão do vídeo pelo estúdio (só olhando, sem editar)'); } catch {}
ab('set', 'viewport', '1680', '1000');
ab('open', `http://localhost:4460/?p=${proj}&ver=1`);
await esperar(5000);
for (let i = 0; i < tempo.cenas.length; i++) {
  const c = tempo.cenas[i];
  for (const p of posicoes) {
    const t = c.ini + (c.fim - c.ini) * p;
    ab('eval', `window.__estudio.ir(${t.toFixed(3)}); 1`);
    await esperar(450);
    ab('screenshot', '.tela .player', join(out, `palco-${String(i + 1).padStart(2, '0')}-${p}.png`));
  }
}
ab('close');
execFileSync('ffmpeg', ['-v', 'error', '-y', '-pattern_type', 'glob', '-i', join(out, 'palco-*.png'), '-vf', `scale=170:-1,tile=${posicoes.length * 3}x4`, '-frames:v', '1', join(out, 'folha.jpg')]);
console.log(join(out, 'folha.jpg'));
