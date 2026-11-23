#!/bin/zsh
# fazer.sh <roteiro.json> <narracao.mp3|wav> [saida.mp4]
# O motor inteiro: personagens (Codex) → sons → cenas presas à voz (whisper) → render (Remotion).
# A narração vem pronta (voz clonada, TTS ou gravada). Personagem que já existe não é gerado de novo.
set -e
cd ${0:A:h}
[[ -f $1 && -f $2 ]] || { echo "uso: ./fazer.sh roteiros/x.json narracao.mp3 [saida.mp4]"; exit 1; }
./ferramentas/personagens.sh $1
[[ -f public/sons/pop.wav ]] || ./ferramentas/sons.sh
node ferramentas/alinhar.mjs $1 $2
node ferramentas/render.mjs $1 $3
