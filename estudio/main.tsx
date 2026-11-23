import React from 'react';
import {createRoot} from 'react-dom/client';
import {App} from './App';

createRoot(document.getElementById('app')!).render(<App />);

// a janela do estúdio troca de página quando o Claude manda (sempre a mesma janela)
(() => { let seq: number | null = null; const f = async () => { try { const j = await fetch('/api/janela?eu=1').then((r) => r.json()); if (seq === null) seq = j.seq; else if (j.seq !== seq) { seq = j.seq; if (j.url && j.url !== location.href) location.href = j.url; } } catch {} setTimeout(f, 1000); }; if (new URLSearchParams(location.search).get('ver') !== '1') f(); })();
