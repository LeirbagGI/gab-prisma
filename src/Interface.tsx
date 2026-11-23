import React from 'react';
import {Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig, Easing} from 'remotion';

type P = {p: string; ini: number; f: number};
const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]/g, ' ').trim();

// Quadro (dentro da cena) em que a palavra é dita; se não achar, usa o padrão.
export const quadroDaPalavra = (palavras: P[], termo: string, padrao: number) => {
  const t = norm(termo).split(' ')[0];
  const w = palavras.find((x) => x.p === t || x.p.startsWith(t));
  return w ? Math.max(0, w.f) : padrao;
};

// Tempos de cada tipo (em quadros, contados do começo da cena). Os sons saem destes mesmos números.
const ENTRA = 7;
const tempos = (i: any, palavras: P[]) => {
  switch (i?.tipo) {
    case 'medidor': return {enche: [12, 30]};
    case 'contador': return {conta: [14, 36]};
    case 'lista_riscada': return {risca: i.itens.map((it: string, k: number) => quadroDaPalavra(palavras, it, 22 + k * 8))};
    case 'checklist': return {marca: i.itens.map((it: string, k: number) => quadroDaPalavra(palavras, it, 8 + k * 8))};
    case 'numero': return {conta: [4, 34], chips: i.chips.map((c: string, k: number) => quadroDaPalavra(palavras, c, 38 + k * 6))};
    case 'botao': return {aperta: 34};
    default: return {};
  }
};

export const sonsDaInterface = (i: any, palavras: P[]): {som: string; f: number; vol?: number}[] => {
  if (!i) return [];
  const t: any = tempos(i, palavras);
  switch (i.tipo) {
    case 'aviso': return [{som: 'toque', f: ENTRA}, ...(i.tom === 'alerta' ? [{som: 'apito', f: ENTRA + 6, vol: 0.18}] : [{som: 'ding', f: ENTRA + 8, vol: 0.4}])];
    case 'medidor': return [{som: 'toque', f: ENTRA}, {som: 'apito', f: t.enche[0], vol: 0.35}];
    case 'contador': return [{som: 'toque', f: ENTRA}, {som: 'toque', f: t.conta[1], vol: 0.9}];
    case 'lista_riscada': return t.risca.map((f: number) => ({som: 'risco', f}));
    case 'marca': return [{som: 'boom', f: 0, vol: 0.9}, {som: 'ding', f: 10, vol: 0.5}];
    case 'checklist': return t.marca.map((f: number) => ({som: 'toque', f, vol: 0.9}));
    case 'numero': return [{som: 'ding', f: t.conta[1], vol: 0.5}, ...t.chips.map((f: number) => ({som: 'pop', f, vol: 0.6}))];
    case 'botao': return [{som: 'pop', f: ENTRA}, {som: 'toque', f: t.aperta, vol: 1}, {som: 'ding', f: t.aperta + 2, vol: 0.5}];
    default: return [];
  }
};

const Cartao: React.FC<{children: React.ReactNode; atraso?: number; tremor?: number; fundo?: string}> = ({children, atraso = ENTRA, tremor = 0, fundo = '#FFFFFF'}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = spring({frame: f - atraso, fps, config: {damping: 13, stiffness: 170}});
  const sx = tremor ? Math.sin(f * 2.4) * tremor : 0;
  return (
    <div style={{background: fundo, borderRadius: 44, padding: '38px 46px', boxShadow: '0 30px 70px rgba(60,30,10,0.16), 0 4px 14px rgba(0,0,0,0.06)', transform: `translate(${sx}px, ${(1 - s) * 120}px) scale(${0.9 + s * 0.1})`, opacity: Math.min(1, s * 1.6)}}>
      {children}
    </div>
  );
};

const Rotulo: React.FC<{children: React.ReactNode; cor?: string}> = ({children, cor = '#69727D'}) => (
  <div style={{fontSize: 30, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: cor}}>{children}</div>
);

const Icone: React.FC<{bom: boolean; tam?: number; s?: number}> = ({bom, tam = 88, s = 1}) => (
  <div style={{width: tam, height: tam, borderRadius: '50%', flex: 'none', background: bom ? '#22A559' : '#E5484D', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${s})`}}>
    <svg width={tam * 0.5} height={tam * 0.5} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round">
      {bom ? <path d="M5 12.5l4.5 4.5L19 7.5" /> : <path d="M6 6l12 12M18 6L6 18" />}
    </svg>
  </div>
);

export const Interface: React.FC<{i: any; cores: Record<string, string>; palavras: P[]; grande: boolean}> = ({i, cores, palavras, grande}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t: any = tempos(i, palavras);
  const D = cores.destaque;

  if (i.tipo === 'aviso') {
    const bom = i.tom !== 'alerta';
    return (
      <Cartao tremor={!bom && f > ENTRA + 6 ? 4 : 0}>
        <div style={{display: 'flex', alignItems: 'center', gap: 34}}>
          <Icone bom={bom} s={spring({frame: f - ENTRA - 6, fps, config: {damping: 8}})} />
          <div>
            <Rotulo>{i.titulo}</Rotulo>
            <div style={{fontSize: 56, fontWeight: 700, letterSpacing: '-0.02em', color: bom ? '#1A1A1A' : '#E5484D', marginTop: 6}}>{i.linha}</div>
          </div>
        </div>
      </Cartao>
    );
  }

  if (i.tipo === 'medidor') {
    const v = interpolate(f, t.enche, [0.15, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.in(Easing.quad)});
    const pisca = v >= 1 && Math.floor(f / 4) % 2 === 0;
    return (
      <Cartao tremor={v >= 1 ? 5 : 0}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline'}}>
          <Rotulo cor={v >= 1 ? '#E5484D' : '#69727D'}>{i.titulo}</Rotulo>
          <div style={{fontSize: 44, fontWeight: 700, color: v > 0.8 ? '#E5484D' : '#1A1A1A'}}>{Math.round(v * 100)}%</div>
        </div>
        <div style={{display: 'flex', gap: 10, marginTop: 26}}>
          {Array.from({length: 14}).map((_, k) => {
            const on = k / 14 < v;
            const cor = k < 8 ? '#22A559' : k < 11 ? '#F2B01E' : '#E5484D';
            return <div key={k} style={{flex: 1, height: 70, borderRadius: 12, background: on ? cor : '#ECE6DF', opacity: on && pisca && k >= 11 ? 0.45 : 1}} />;
          })}
        </div>
      </Cartao>
    );
  }

  if (i.tipo === 'contador') {
    const v = interpolate(f, t.conta, [i.de, i.ate], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
    const fim = f >= t.conta[1];
    return (
      <Cartao tremor={fim ? 0 : 0}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <Rotulo>{i.titulo}</Rotulo>
          <div style={{fontSize: 96, fontWeight: 700, letterSpacing: '-0.04em', color: fim ? '#E5484D' : '#1A1A1A', transform: `scale(${fim ? 1 + 0.15 * Math.max(0, 1 - (f - t.conta[1]) / 8) : 1})`}}>
            {Math.round(v)}{i.sufixo ?? (i.de > 100 ? ` de ${i.de}` : '')}
          </div>
        </div>
      </Cartao>
    );
  }

  if (i.tipo === 'lista_riscada') {
    return (
      <Cartao>
        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px 40px'}}>
          {i.itens.map((it: string, k: number) => {
            const r = interpolate(f, [t.risca[k], t.risca[k] + 6], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
            return (
              <div key={k} style={{position: 'relative', fontSize: 52, fontWeight: 600, color: r > 0 ? '#9A9188' : '#1A1A1A', display: 'flex', alignItems: 'center', gap: 16}}>
                <span style={{width: 16, height: 16, borderRadius: 4, background: "#E5484D", flex: "none"}} />{it}
                <div style={{position: 'absolute', left: 0, top: '52%', height: 7, borderRadius: 4, background: '#E5484D', width: `${r * 100}%`}} />
              </div>
            );
          })}
        </div>
      </Cartao>
    );
  }

  if (i.tipo === 'marca') {
    const s = spring({frame: f - 3, fps, config: {damping: 10, stiffness: 120}});
    const s2 = spring({frame: f - 14, fps, config: {damping: 14}});
    return (
      <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', marginTop: -120}}>
        <Img src={staticFile('logo-gi.png')} style={{height: 360, filter: 'brightness(0) invert(1)', transform: `scale(${s}) rotate(${(1 - s) * -20}deg)`}} />
        <div style={{marginTop: 50, fontSize: 40, fontWeight: 600, letterSpacing: '0.3em', color: 'rgba(255,255,255,0.9)', opacity: s2, transform: `translateY(${(1 - s2) * 30}px)`}}>{(i.linha || '').toUpperCase()}</div>
      </div>
    );
  }

  if (i.tipo === 'checklist') {
    return (
      <Cartao atraso={4}>
        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '22px 30px'}}>
          {i.itens.map((it: string, k: number) => {
            const s = spring({frame: f - t.marca[k], fps, config: {damping: 9, stiffness: 200}});
            return (
              <div key={k} style={{display: 'flex', alignItems: 'center', gap: 20, fontSize: 52, fontWeight: 700, color: s > 0.5 ? '#1A1A1A' : '#B9B0A6'}}>
                <div style={{width: 62, height: 62, borderRadius: 18, border: `4px solid ${s > 0.1 ? D : '#D8D0C7'}`, background: s > 0.1 ? D : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none', transform: `scale(${0.7 + s * 0.3})`}}>
                  <svg width={34} height={34} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3.6} strokeLinecap="round" strokeLinejoin="round" style={{opacity: s}}><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
                </div>
                {it}
              </div>
            );
          })}
        </div>
      </Cartao>
    );
  }

  if (i.tipo === 'numero') {
    const v = interpolate(f, t.conta, [i.de, i.ate], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
    const fim = f >= t.conta[1];
    return (
      <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%'}}>
        <div style={{fontSize: 400, fontWeight: 700, letterSpacing: '-0.06em', lineHeight: 0.9, color: D, transform: `scale(${fim ? 1 + 0.08 * Math.max(0, 1 - (f - t.conta[1]) / 10) : 1})`, ...(i.casas ? {fontSize: 300} : {})}}>{i.prefixo ?? ''}{i.casas ? v.toLocaleString('pt-BR', {minimumFractionDigits: i.casas, maximumFractionDigits: i.casas}) : Math.round(v)}</div>
        <div style={{fontSize: 80, fontWeight: 700, color: '#1A1A1A', marginTop: 10, letterSpacing: '-0.02em'}}>{i.rotulo}</div>
        <div style={{display: 'flex', gap: 22, marginTop: 70, flexWrap: 'wrap', justifyContent: 'center'}}>
          {i.chips.map((c: string, k: number) => {
            const s = spring({frame: f - t.chips[k], fps, config: {damping: 10, stiffness: 180}});
            return <div key={k} style={{padding: '22px 40px', borderRadius: 999, background: '#FFFFFF', boxShadow: '0 16px 40px rgba(60,30,10,0.14)', fontSize: 46, fontWeight: 600, color: '#1A1A1A', transform: `scale(${s})`, display: 'flex', alignItems: 'center', gap: 14}}><span style={{width: 18, height: 18, borderRadius: '50%', background: D}} />{c}</div>;
          })}
        </div>
      </div>
    );
  }

  if (i.tipo === 'botao') {
    const ap = t.aperta;
    const press = f >= ap && f < ap + 6 ? 0.93 : 1;
    const dedo = interpolate(f, [ap - 14, ap], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
    const onda = f >= ap ? (f - ap) / 18 : 0;
    return (
      <Cartao>
        <div style={{position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 26}}>
          <div style={{position: 'relative', width: '100%', padding: '40px 0', borderRadius: 999, background: D, color: '#fff', fontSize: 60, fontWeight: 700, textAlign: 'center', letterSpacing: '-0.01em', transform: `scale(${press})`, boxShadow: `0 20px 40px ${D}55`}}>
            {i.titulo}
            {onda > 0 && onda < 1 && <div style={{position: 'absolute', left: '62%', top: '50%', width: 300 * onda, height: 300 * onda, marginLeft: -150 * onda, marginTop: -150 * onda, borderRadius: '50%', border: '6px solid rgba(255,255,255,0.8)', opacity: 1 - onda}} />}
          </div>
          <div style={{fontSize: 36, fontWeight: 500, color: '#69727D'}}>{i.linha}</div>
          <div style={{position: 'absolute', left: '60%', top: 70 + dedo * 260, width: 70, height: 70, borderRadius: '50%', background: 'rgba(26,26,26,0.25)', border: '5px solid rgba(255,255,255,0.95)', opacity: f > ap + 14 ? 0 : 1 - dedo * 0.3}} />
        </div>
      </Cartao>
    );
  }
  return null;
};
