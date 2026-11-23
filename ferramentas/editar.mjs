// editar.mjs <projeto> <acoes.json> — edição ao vivo pedida pelo Gabriel: traz o estúdio para a tela dele,
// toca o vídeo a partir da 1ª cena mexida (a cabeça corre na linha do tempo) e os mouses fazem as mudanças
// enquanto ele assiste. Cada ação é igual às do motor (texto, interface, personagem, marca, tela, slider…).
import {readFileSync} from 'node:fs';
import {join, resolve, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {estudioNaFrente} from './estudio-frente.mjs';
const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const [proj, arq] = process.argv.slice(2);
const acoes = JSON.parse(readFileSync(arq, 'utf8'));
const tempo = JSON.parse(readFileSync(join(RAIZ, 'public', proj, 'tempo.json'), 'utf8'));
await estudioNaFrente(proj);
await new Promise((r) => setTimeout(r, 1500));
const cenas = acoes.filter((a) => a.cena != null).map((a) => a.cena);
const ini = cenas.length ? Math.max(0, tempo.cenas[Math.min(...cenas)].ini - 0.3) : 0;
const fila = [
  {tipo: 'esperar_visivel'},
  {tipo: 'ritmo', valor: 0.7},
  {tipo: 'tempo_real', valor: true},
  {agente: 'revisao', tipo: 'tocar_de', seg: ini},
  {tipo: 'vigiar', ate: tempo.duracao, solto: true},
  ...acoes,
  {tipo: 'sincronizar'},
  {tipo: 'tempo_real', valor: false},
  {tipo: 'ritmo', valor: 1},
  {agente: 'revisao', tipo: 'nota', msg: 'ajuste feito', ms: 800},
];
const r = await fetch(`http://localhost:4460/api/acoes/${proj}`, {method: 'POST', body: JSON.stringify(fila)}).then((x) => x.json());
console.log(`${acoes.length} edições ao vivo na tela (a partir de ${ini.toFixed(1)} s) · fila ${r.ultimo}`);
