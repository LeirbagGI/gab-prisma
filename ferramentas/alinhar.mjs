// alinhar.mjs <roteiro.json> <narracao(mp3|wav)>
// "Cenas presas à voz": transcreve a narração com o whisper local (tempo de cada palavra) e acha
// em que instante começa a fala de cada cena. Grava public/<projeto>/tempo.json, que o filme lê.
import {execFileSync} from 'node:child_process';
import {readFileSync, writeFileSync, mkdirSync, copyFileSync} from 'node:fs';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const [roteiroArq, vozArq] = process.argv.slice(2);
const rot = JSON.parse(readFileSync(roteiroArq, 'utf8'));
const pub = join(RAIZ, 'public', rot.projeto); mkdirSync(pub, {recursive: true});
const trab = join(RAIZ, 'trabalho', rot.projeto); mkdirSync(trab, {recursive: true});
const MODELO = process.env.WHISPER_MODELO || join(process.env.HOME, 'gab-edvid/models/ggml-large-v3-turbo.bin');

// 1) narração → wav 16 kHz (whisper) e cópia para o filme
const wav = join(trab, 'voz16k.wav');
execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', vozArq, '-ac', '1', '-ar', '16000', wav]);
execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', vozArq, '-ac', '2', '-ar', '48000', join(pub, 'narracao.wav')]);
const dur = parseFloat(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', wav]).toString());

// 2) whisper com tempo por palavra (-ml 1 = um token por segmento; -sow = quebra em palavra)
execFileSync('whisper-cli', ['-m', MODELO, '-l', 'pt', '-f', wav, '-ml', '1', '-sow', '-oj', '-of', join(trab, 'palavras'), '-np'], {stdio: 'ignore'});
const segs = JSON.parse(readFileSync(join(trab, 'palavras.json'), 'utf8')).transcription;
const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]/g, ' ').trim();
const palavras = segs.map((s) => ({p: norm(s.text), ini: s.offsets.from / 1000, fim: s.offsets.to / 1000})).filter((w) => w.p);

// 3) para cada cena, acha a sequência das 3 primeiras palavras da fala, procurando sempre para a frente
let cursor = 0;
const cenas = rot.cenas.map((c) => {
  const alvo = norm(c.ancora || c.fala).split(/\s+/).slice(0, 3);
  let melhor = -1, nota = -1;
  for (let i = cursor; i < palavras.length; i++) {
    let n = 0;
    alvo.forEach((a, k) => { const w = palavras[i + k]; if (w && (w.p === a || w.p.startsWith(a) || a.startsWith(w.p))) n++; });
    if (n > nota) { nota = n; melhor = i; }
    if (n === alvo.length) break;
  }
  if (melhor < 0) throw new Error(`cena ${c.id}: não achei "${alvo.join(' ')}" na narração`);
  cursor = melhor + 1;
  return {id: c.id, ini: palavras[melhor].ini, confianca: nota / alvo.length};
});

// cada cena começa 0,15 s antes da primeira palavra (o corte antecipa a fala) e vai até a próxima
const out = cenas.map((c, i) => ({...c, ini: Math.max(0, i === 0 ? 0 : c.ini - 0.15), fim: i < cenas.length - 1 ? cenas[i + 1].ini - 0.15 : dur + 0.35}));
writeFileSync(join(pub, 'tempo.json'), JSON.stringify({duracao: dur + 0.35, cenas: out, palavras}, null, 1));
for (const c of out) console.log(`${c.id}  ${c.ini.toFixed(2)}–${c.fim.toFixed(2)} s  ${c.confianca < 1 ? '⚠ confiança ' + c.confianca.toFixed(2) : ''}`);
