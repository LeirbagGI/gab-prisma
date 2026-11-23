# GAB Prisma — motor de vídeo por código

## Instalar (Mac com Apple Silicon)

1. Instale Node 20+, ffmpeg, Google Chrome e o whisper (`brew install whisper-cpp`); baixe o modelo
   `ggml-large-v3-turbo.bin` e aponte `WHISPER_MODELO` para ele em `~/.gab-prisma.env`.
2. `./instalar.sh` (dependências, ferramentas em Swift, sons).
3. `./estudio.sh <projeto>` sobe o estúdio em http://localhost:4460 (ex.: `./estudio.sh gi-nvidia-reels`).
4. Novo vídeo: página http://localhost:4460/pedido.html (prompt do roteiro). Quem gera a voz e edita é o
   Claude Code com este repositório aberto (Higgsfield para a voz, `ferramentas/criar.mjs` para montar ao vivo).
5. Personagens novos: app ChatGPT (Codex) logado; `ferramentas/personagens.sh`.

Configuração local (nunca no repositório): `~/.gab-prisma.env` (`PRISMA_COPIA`, `WHISPER_MODELO`, `PRISMA_AB`).

## Fluxo (sempre assim, pedido do Gabriel em 23/11/2026)

1. **Roteiro do Gabriel** → `trabalho/<proj>/plano-final.json` (roteiro completo: cenas com fala, personagem,
   personagem2, texto, interface, fundo, ajuste, marcas, tela).
2. **Voz primeiro**: Higgsfield TTS (preset Dylan, provisória até ter a voz dele) → `trabalho/<proj>/narracao.mp3`,
   e o caminho no campo `narracao` do plano.
3. **`node ferramentas/criar.mjs <proj>`**: abre o estúdio em janela nova do Chrome, na frente; a voz entra na linha
   do tempo e os agentes montam as cenas ao vivo (cursores); no fim confere o resultado com o plano (se diferir,
   grava o plano e recarrega) e fotografa a linha do tempo (`olhar.mjs`, modo `?ver=1`, sem render).
4. **Revisão**: olhar a `folha.jpg` impressa no fim, corrigir (editar `roteiros/<proj>.json` + ação `recarregar`,
   ou ações ao vivo com `ao-vivo.mjs`) e avisar.
5. **Exportar é só o Gabriel** (botão do estúdio). Nunca renderizar por conta própria.

Armadilhas: a aba do estúdio precisa estar na frente (aba atrás de outra janela trava); com mais de um Chrome
aberto o `open` não cria a aba, por isso o `criar.mjs` abre janela nova pelo AppleScript.


Copiado do "Prisma Studio" (reel da Luzia): anúncio com personagens 3D, cartões de interface,
efeitos sonoros e cenas presas à voz. Tudo é código (Remotion); nada passa pelo CapCut.

## Como fazer um vídeo

1. Escreva o roteiro em `roteiros/<nome>.json` (veja `centro-eventos.json`):
   - `personagens`: nome → descrição; o estilo comum fica em `estilo_personagem`.
   - `cenas`: `fala` (o que a voz diz), `personagem`, `texto` (título), `interface`, `fundo` (`claro`/`forte`).
   - `ancora` (opcional): palavras que o whisper escreve diferente da fala (ex.: "140 lugares").
2. Gere a narração do texto de todas as falas, em um arquivo só.
3. `./fazer.sh roteiros/<nome>.json narracao.mp3` → `saida/<projeto>.mp4`.

Conferir um quadro sem renderizar tudo: `node ferramentas/render.mjs roteiros/x.json --quadro 120`.
Ver e mexer ao vivo: `npm run studio`.

## Peças

| Etapa | Arquivo | O que faz |
|---|---|---|
| Personagens | `ferramentas/personagens.sh` | Codex gera (conta ChatGPT, sem chave), `recortar` (Vision do macOS) tira o fundo |
| Sons | `ferramentas/sons.sh` | pop, whoosh, toque, ding, apito, risco, boom sintetizados no ffmpeg |
| Voz → cenas | `ferramentas/alinhar.mjs` | whisper local dá o tempo de cada palavra; cada cena começa na sua primeira palavra |
| Filme | `src/Filme.tsx`, `src/Interface.tsx` | título palavra a palavra, personagem com mola/balanço, cartões animados |
| Render | `ferramentas/render.mjs` | junta tudo em `public/<projeto>/filme.json` e chama o Remotion |

Tipos de interface: `aviso` (tom ok/alerta), `medidor`, `contador`, `lista_riscada`, `marca`,
`checklist` (cada item marca na hora em que a voz fala a palavra), `numero` (com chips), `botao`.

## Estúdio (o editor igual ao do vídeo)

`./estudio.sh` → abre http://localhost:4460 (sobe o servidor se não estiver no ar; log em `trabalho/estudio.log`).

- **Biblioteca**: clicar num personagem põe/tira da cena selecionada; ↻ redesenha pelo Codex; **+** cria personagem novo. Sons tocam ao clicar. Voz: *Trocar voz* (manda arquivo de áudio → realinha sozinho) e *Realinhar*.
- **Palco**: o filme rodando (mesmo código do render). Espaço = play/pausa; ← → = cena anterior/próxima.
- **Camadas**: fundo, personagem, texto e interface da cena.
- **cena.json**: o código da cena, editável; muda o palco na hora. Aba *Filme.tsx* mostra o motor.
- **Movimento**: Quica / Pop / Balança / Desliza / Reta + posição, escala, rotação, opacidade (duplo clique zera).
- **Cores do projeto**, **Agentes** (personagem/voz/render trabalhando) e **Registro dos agentes**.
- **Linha do tempo**: CENAS, PERSONAGENS, TEXTO, INTERFACE, EFEITOS, VOZ; clicar pula para o ponto.
- **Exportar**: renderiza `saida/<projeto>.mp4` e copia para o Drive (`VIDEO CENTRO DE EVENTOS/reel-prisma-<projeto>-<data>.mp4`).
- Salva sozinho a cada mudança; ⌘Z desfaz.
- Mudar a **fala** exige voz nova (aparece aviso amarelo no palco).
