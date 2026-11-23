// ao-vivo.mjs <projeto> <acoes.json>  — manda ações para o estúdio aberto executar na tela (modo ao vivo).
import {readFileSync} from 'node:fs';
const [proj, arq] = process.argv.slice(2);
const acoes = JSON.parse(readFileSync(arq, 'utf8'));
const r = await fetch(`http://localhost:4460/api/acoes/${proj}`, {method: 'POST', body: JSON.stringify(acoes)}).then((r) => r.json());
console.log(`${acoes.length} ações na fila de ${proj} (total ${r.ultimo})`);
