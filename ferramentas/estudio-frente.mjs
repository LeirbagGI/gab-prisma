// estudio-frente.mjs <projeto> — põe o estúdio NA TELA do Gabriel, sempre na MESMA janela
// ("usa sempre o mesmo navegador que já está aberto", 23/11).
// A janela é um Chrome só do estúdio (perfil próprio) aberto com:
//  - som liberado sem clique (sem isso o Chrome bloqueava a voz e segurava o player);
//  - sem estrangular timers/tela quando a janela perde o foco (o player parava e a linha do tempo "voltava ao começo").
// Se ela já está aberta, só troca o endereço (a página obedece /api/janela) e traz para a frente.
import {execFileSync, spawn} from 'node:child_process';
import {join, resolve, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PERFIL = join(RAIZ, 'trabalho', 'chrome-estudio');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const sh = (c, a) => { try { return execFileSync(c, a, {timeout: 15000}).toString().trim(); } catch { return ''; } };
const pidJanela = () => sh('pgrep', ['-f', `user-data-dir=${PERFIL}`]).split('\n').filter(Boolean)[0];
export async function estudioNaFrente(proj, caminho) {
  const url = `http://localhost:4460/${caminho ?? `?p=${proj}`}`;
  let pid = pidJanela();
  if (!pid) {
    // (só com o Chrome do estúdio fechado: senão o AppleScript fala com ele e fecha a própria janela)
    // abas velhas do estúdio no Chrome comum disputariam a edição: fecha
  sh('osascript', ['-e', `tell application "Google Chrome"
repeat with w in windows
  repeat with t in tabs of w
    if (URL of t) contains "localhost:4460" then close t
  end repeat
end repeat
end tell`]);
    const [, , L, A] = sh('osascript', ['-e', 'tell application "Finder" to get bounds of window of desktop']).split(', ').map(Number);
    spawn(CHROME, [`--user-data-dir=${PERFIL}`, '--no-first-run', '--no-default-browser-check', '--autoplay-policy=no-user-gesture-required',
      '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows',
      `--window-position=0,30`, `--window-size=${L || 2560},${(A || 1664) - 30}`, `--app=${url}`], {detached: true, stdio: 'ignore'}).unref();
    for (let i = 0; i < 20 && !pid; i++) { execFileSync('sleep', ['0.5']); pid = pidJanela(); }
    execFileSync('sleep', ['3']);
  } else {
    const j = await fetch('http://localhost:4460/api/janela').then((r) => r.json()).catch(() => ({}));
    if (Date.now() - (j.visto || 0) > 4000) {
      // o Chrome do estúdio está aberto mas sem a janela: abre de novo nele mesmo
      spawn(CHROME, [`--user-data-dir=${PERFIL}`, `--app=${url}`], {detached: true, stdio: 'ignore'}).unref();
      execFileSync('sleep', ['3']);
    } else {
      await fetch('http://localhost:4460/api/janela', {method: 'POST', body: JSON.stringify({url})}).catch(() => {});
      execFileSync('sleep', ['1.5']);
    }
  }
  if (pid) sh('osascript', ['-e', `tell application "System Events" to set frontmost of (first process whose unix id is ${pid}) to true`]);
  return pid;
}
if (import.meta.url === `file://${process.argv[1]}`) console.log(await estudioNaFrente(process.argv[2], process.argv[3]));
