// Vivo.tsx — o que deixa o vídeo "vivo" (pedido do Gabriel em 23/11: "parece apresentação de slides;
// tudo que é narrado precisa aparecer; mais gráficos e interações"):
//  - Legenda: a própria narração, palavra por palavra, no instante em que é dita.
//  - Marcas: ícones/etiquetas que pulam na palavra certa ("prazo" → relógio).
//  - Câmera: zoom lento + soquinho a cada marca; o personagem pula junto.
import React from 'react';
import {Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {quadroDaPalavra} from './Interface';

export type Marca = {palavra: string; icone?: string; texto?: string; tom?: 'ok' | 'alerta' | 'destaque'; som?: string};
type P = {p: string; ini: number; f: number};

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');

// Quadro de cada palavra da fala (texto original, com acento), casando com as palavras do whisper.
export const tempoDasPalavras = (fala: string, palavras: P[]) => {
  const tokens = fala.split(/\s+/).filter(Boolean);
  const ws = palavras.map((w) => ({...w, n: norm(w.p)}));
  let cur = 0, ultimo = 0;
  return tokens.map((tk) => {
    const n = norm(tk);
    let achou = -1;
    for (let k = cur; k < Math.min(ws.length, cur + 4); k++) {
      const w = ws[k].n;
      if (w && n && (w === n || w.startsWith(n.slice(0, 4)) || n.startsWith(w.slice(0, 4)))) { achou = k; break; }
    }
    let f: number;
    if (achou >= 0) { f = Math.max(ws[achou].f, ultimo); cur = achou + 1; } else f = ultimo + 5;
    ultimo = f;
    return {txt: tk, n, f};
  });
};

export const quadrosDasMarcas = (marcas: Marca[] | undefined, palavras: P[]) =>
  (marcas ?? []).map((m, k) => quadroDaPalavra(palavras as any, m.palavra, 10 + k * 12));

export const Legenda: React.FC<{fala: string; palavras: P[]; chaves: string[]; cor: string; destaque: string; cartao?: boolean}> = ({fala, palavras, chaves, cor, destaque, cartao}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const tks = tempoDasPalavras(fala, palavras);
  // quebra em blocos curtos: na pontuação ou a cada 6 palavras
  const blocos: (typeof tks)[] = [[]];
  tks.forEach((t) => {
    const b = blocos[blocos.length - 1];
    b.push(t);
    if (/[,.:;?!…]$/.test(t.txt) || b.length >= 6) blocos.push([]);
  });
  const bs = blocos.filter((b) => b.length);
  let atual = 0;
  bs.forEach((b, i) => { if (f >= b[0].f - 1) atual = i; });
  const chave = new Set(chaves.map(norm).filter((c) => c.length > 2));
  return (
    <div style={{position: 'absolute', top: cartao ? 150 : 205, left: 60, right: 60, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', columnGap: '0.24em', fontSize: 76, lineHeight: 1.12, textAlign: 'center', ...(cartao ? {background: 'rgba(255,255,255,0.9)', borderRadius: 40, padding: '26px 30px', boxShadow: '0 20px 50px rgba(60,30,10,0.18)'} : {})}}>
      {bs[atual]?.map((t, i) => {
        const s = spring({frame: f - t.f + 2, fps, config: {damping: 11, stiffness: 220}});
        const quente = chave.has(t.n) || [...chave].some((c) => t.n.startsWith(c) && c.length > 4);
        return (
          <span key={atual + ':' + i} style={{display: 'inline-block', fontWeight: 700, letterSpacing: '-0.03em', color: quente ? destaque : cor, opacity: f >= t.f - 2 ? Math.min(1, s * 1.6) : 0, transform: `translateY(${(1 - s) * 36}px) scale(${0.8 + s * 0.2})`}}>
            {t.txt}
          </span>
        );
      })}
    </div>
  );
};

export const Etiqueta: React.FC<{texto: string; cor: string; fundo: string}> = ({texto, cor, fundo}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = spring({frame: f + 2, fps, config: {damping: 14}});
  return (
    <div style={{position: 'absolute', top: 118, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
      <div style={{padding: '12px 30px', borderRadius: 999, background: fundo, color: cor, fontSize: 34, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', transform: `scale(${s})`}}>{texto}</div>
    </div>
  );
};

// posições ao redor do personagem (x = centro em px, y = topo)
const LUGARES = [
  {x: 260, y: 560}, {x: 820, y: 640}, {x: 245, y: 920}, {x: 835, y: 1000}, {x: 540, y: 1130}, {x: 330, y: 1120}, {x: 750, y: 540},
];
// com dois personagens: acima das cabeças e abaixo dos pés, para não cobrir ninguém
const LUGARES_DUPLA = [
  {x: 230, y: 395}, {x: 850, y: 395}, {x: 540, y: 395}, {x: 300, y: 1150}, {x: 780, y: 1150}, {x: 540, y: 1150},
];

export const Marcas: React.FC<{marcas: Marca[]; quadros: number[]; cores: Record<string, string>; dupla?: boolean}> = ({marcas, quadros, cores, dupla}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <>
      {marcas.map((m, k) => {
        const q = quadros[k];
        if (f < q - 1) return null;
        const s = spring({frame: f - q + 1, fps, config: {damping: 8, stiffness: 200, mass: 0.7}});
        // em dupla: até 4 numa fileira acima das cabeças, espaçados por igual
        const nTopo = Math.min(4, marcas.length);
        const L = dupla ? (k < 4 ? {x: nTopo === 2 ? (k === 0 ? 315 : 765) : Math.round((1080 * (k + 1)) / (nTopo + 1)), y: 395} : LUGARES_DUPLA[3 + ((k - 4) % 3)]) : LUGARES[k % LUGARES.length];
        const cor = m.tom === 'alerta' ? '#E5484D' : m.tom === 'ok' ? '#22A559' : cores.destaque;
        const flutua = Math.sin((f - q) / 11 + k) * 8;
        const anel = Math.min(1, (f - q) / 12);
        return (
          <div key={k} style={{position: 'absolute', left: L.x, top: L.y, transform: `translate(-50%, ${flutua}px) scale(${s * (dupla ? 0.8 : 1)}) rotate(${(1 - s) * (k % 2 ? 25 : -25)}deg)`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, zIndex: 5}}>
            {anel < 1 && <div style={{position: 'absolute', top: m.icone ? 105 : 40, left: '50%', width: 200 * anel + 60, height: 200 * anel + 60, marginLeft: -(100 * anel + 30), marginTop: -(100 * anel + 30), borderRadius: '50%', border: `5px solid ${cor}`, opacity: 1 - anel}} />}
            {m.icone && (
              <div style={{width: 210, height: 210, borderRadius: '50%', background: '#FFFFFF', boxShadow: '0 22px 50px rgba(60,30,10,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `7px solid ${cor}`}}>
                <Icone nome={m.icone} cor={cor} />
              </div>
            )}
            {m.texto && (
              <div style={{padding: m.icone ? '10px 26px' : '20px 38px', borderRadius: 999, background: m.icone ? '#FFFFFF' : cor, color: m.icone ? '#1A1A1A' : '#FFFFFF', fontSize: m.icone ? 40 : 58, fontWeight: 700, whiteSpace: 'nowrap', boxShadow: '0 12px 30px rgba(60,30,10,0.18)'}}>{m.texto}</div>
            )}
          </div>
        );
      })}
    </>
  );
};

// soquinho de câmera a cada marca + zoom lento ao longo da cena
export const camera = (f: number, dur: number, quadros: number[]) => {
  let soco = 0;
  for (const q of quadros) if (f >= q && f - q < 14) soco += 0.028 * Math.exp(-(f - q) / 4);
  return 1 + 0.035 * Math.min(1, f / Math.max(1, dur)) + soco;
};
export const pulo = (f: number, quadros: number[]) => {
  let y = 0;
  for (const q of quadros) if (f >= q && f - q < 16) y -= 28 * Math.sin(((f - q) / 16) * Math.PI);
  return y;
};

const ICONES: Record<string, string[]> = {
  relogio: ['M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18', 'M12 7v5l3.5 2'],
  dinheiro: ['M3 6h18v12H3z', 'M12 9a3 3 0 1 0 0 6a3 3 0 1 0 0-6', 'M6 9v.01M18 15v.01'],
  pessoa: ['M12 4a4 4 0 1 0 0 8a4 4 0 1 0 0-8', 'M4 21c0-4 4-6.5 8-6.5s8 2.5 8 6.5'],
  equipe: ['M9 5a3.2 3.2 0 1 0 0 6.4a3.2 3.2 0 1 0 0-6.4', 'M17 6.5a2.6 2.6 0 1 0 0 5.2a2.6 2.6 0 1 0 0-5.2', 'M2.5 20c0-3.6 3-5.5 6.5-5.5s6.5 1.9 6.5 5.5', 'M15.5 14.6c3 0 6 1.3 6 4.6'],
  check: ['M5 12.5l4.5 4.5L19 7.5'],
  x: ['M6 6l12 12', 'M18 6L6 18'],
  alerta: ['M12 3L22 20H2Z', 'M12 10v4', 'M12 17h.01'],
  grafico: ['M3 21h18', 'M6 21v-6', 'M11 21v-10', 'M16 21v-14', 'M5 9l5-4 4 3 6-5'],
  seta: ['M5 19L19 5', 'M9 5h10v10'],
  calendario: ['M3 5h18v16H3z', 'M3 10h18', 'M8 3v4', 'M16 3v4', 'M12 14a1.5 1.5 0 1 0 0 3a1.5 1.5 0 1 0 0-3'],
  microfone: ['M9 3h6v11H9z', 'M5 11a7 7 0 0 0 14 0', 'M12 18v3'],
  engrenagem: ['M12 8.5a3.5 3.5 0 1 0 0 7a3.5 3.5 0 1 0 0-7', 'M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1'],
  alvo: ['M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18', 'M12 7a5 5 0 1 0 0 10a5 5 0 1 0 0-10', 'M12 11a1 1 0 1 0 0 2a1 1 0 1 0 0-2'],
  raio: ['M13 2L4 14h7l-1 8 9-12h-7z'],
  estrela: ['M12 2.5l2.9 6 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.2 1.3-6.6-4.9-4.6 6.6-.8z'],
  olho: ['M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z', 'M12 9a3 3 0 1 0 0 6a3 3 0 1 0 0-6'],
  lista: ['M9 6h12M9 12h12M9 18h12', 'M4 6h.01M4 12h.01M4 18h.01'],
  caixa: ['M3 7l9-4 9 4-9 4-9-4z', 'M3 7v10l9 4 9-4V7', 'M12 11v10'],
  telefone: ['M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2z'],
  documento: ['M6 2h9l5 5v15H6z', 'M14 2v6h6', 'M9 13h8M9 17h8'],
  pin: ['M12 22s7-7 7-12a7 7 0 0 0-14 0c0 5 7 12 7 12z', 'M12 7.5a2.5 2.5 0 1 0 0 5a2.5 2.5 0 1 0 0-5'],
  interrogacao: ['M9 9a3 3 0 1 1 4.5 2.6c-1 .6-1.5 1.2-1.5 2.4', 'M12 18h.01'],
  lampada: ['M9 18h6', 'M10 21h4', 'M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z'],
  aperto: ['M2 12l4-4 4 2 3-2 4 1 5 3', 'M7 14l3 3 2-1 2 2 2-1 3-3', 'M2 12l3 3'],
};
export const NOMES_ICONES = Object.keys(ICONES);

const Icone: React.FC<{nome: string; cor: string}> = ({nome, cor}) => (
  <svg width={118} height={118} viewBox="0 0 24 24" fill="none" stroke={cor} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
    {(ICONES[nome] ?? ICONES.estrela).map((d, i) => <path key={i} d={d} />)}
  </svg>
);

// Tela cheia: arte do designer (Codex) ocupando a tela, caricatura grande e etiquetas que pulam na palavra.
export type Tela = {imagem: string; de?: string; personagem?: string; lado?: 'esq' | 'dir'; deslocY?: number; rotulosY?: number; alturaPersonagem?: number; rotulos?: {palavra: string; texto: string; icone?: string; y?: number}[]};
export const inicioDaTela = (tela: Tela | undefined, palavras: P[]) => (!tela ? -1 : tela.de ? quadroDaPalavra(palavras as any, tela.de, 0) : 0);
export const sonsDaTela = (tela: Tela | undefined, palavras: P[]) => {
  if (!tela) return [];
  const q0 = inicioDaTela(tela, palavras);
  return [{som: 'whoosh', f: q0, vol: 0.7}, ...(tela.rotulos ?? []).map((r, k) => ({som: 'toque', f: quadroDaPalavra(palavras as any, r.palavra, q0 + 12 + k * 10), vol: 0.9}))];
};
export const TelaCheia: React.FC<{tela: Tela; projeto: string; palavras: P[]; cores: Record<string, string>; dur: number}> = ({tela, projeto, palavras, cores, dur}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const q0 = inicioDaTela(tela, palavras);
  if (f < q0) return null;
  const abre = spring({frame: f - q0, fps, config: {damping: 20, stiffness: 120}});
  const zoom = 1.12 - abre * 0.08 + 0.05 * Math.min(1, (f - q0) / Math.max(1, dur - q0));
  const esq = (tela.lado ?? 'esq') === 'esq';
  const ps = spring({frame: f - q0 - 6, fps, config: {damping: 12, stiffness: 110}});
  return (
    <div style={{position: 'absolute', inset: 0, clipPath: `circle(${abre * 120}% at 50% 55%)`, zIndex: 8}}>
      <Img src={staticFile(`${projeto}/${tela.imagem}`)} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transform: `translateY(${tela.deslocY ?? 0}px) scale(${zoom})`}} />
      {tela.personagem && (
        <Img src={staticFile(`${projeto}/personagens/${tela.personagem}.png`)} style={{position: 'absolute', bottom: 60, [esq ? 'left' : 'right']: -20, height: tela.alturaPersonagem ?? 1050, transform: `translateX(${(1 - ps) * (esq ? -600 : 600)}px) translateY(${Math.sin((f - q0) / 10) * 8}px) rotate(${Math.sin((f - q0) / 16) * 2}deg)`, filter: 'drop-shadow(0 30px 40px rgba(60,30,10,0.35))'} as any} />
      )}
      <div style={{position: 'absolute', top: tela.rotulosY ?? 640, [esq ? 'right' : 'left']: 50, display: 'flex', flexDirection: 'column', gap: 26, alignItems: esq ? 'flex-end' : 'flex-start'} as any}>
        {(tela.rotulos ?? []).map((r, k) => {
          const q = quadroDaPalavra(palavras as any, r.palavra, q0 + 12 + k * 10);
          const s = spring({frame: f - q, fps, config: {damping: 10, stiffness: 190}});
          if (f < q - 1) return null;
          return (
            <div key={k} style={{...(r.y != null ? {position: 'absolute', top: r.y - (tela.rotulosY ?? 640), [esq ? 'right' : 'left']: 0} : {}), display: 'flex', alignItems: 'center', gap: 18, background: '#FFFFFF', borderRadius: 32, padding: '22px 34px 22px 22px', boxShadow: '0 20px 45px rgba(60,30,10,0.25)', transform: `translateX(${(1 - s) * (esq ? 120 : -120)}px) scale(${0.7 + s * 0.3})`, opacity: Math.min(1, s * 1.5), borderLeft: `10px solid ${cores.destaque}`}}>
              <div style={{width: 76, height: 76, borderRadius: '50%', background: cores.destaque, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none'}}>
                <svg width={44} height={44} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
                  {(ICONES[r.icone ?? 'check'] ?? ICONES.check).map((d, i) => <path key={i} d={d} />)}
                </svg>
              </div>
              <span style={{fontSize: 54, fontWeight: 700, color: '#1A1A1A', letterSpacing: '-0.02em', whiteSpace: 'nowrap'}}>{r.texto}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
