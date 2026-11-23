#!/bin/zsh
# instalar.sh — prepara o GAB Prisma num Mac novo (Apple Silicon).
# Precisa: Node 20+, ffmpeg, whisper-cli (brew install whisper-cpp) e o modelo ggml-large-v3-turbo.bin,
# Google Chrome. Para desenhar personagens: o app ChatGPT (Codex) logado.
set -e
cd ${0:A:h}
for c in node ffmpeg whisper-cli swiftc; do command -v $c >/dev/null || echo "⚠ falta: $c"; done
npm install --no-audit --no-fund
swiftc -O ferramentas/janela.swift -o ferramentas/janela
swiftc -O ferramentas/recortar.swift -o ferramentas/recortar
swiftc -O ferramentas/clique.swift -o ferramentas/clique
[[ -f public/sons/pop.wav ]] || ./ferramentas/sons.sh
[[ -f ~/.gab-prisma.env ]] || cat > ~/.gab-prisma.env <<'EOT'
# configuração local do GAB Prisma (não vai para o GitHub)
# export PRISMA_COPIA="/caminho/da/pasta/para/onde/o/Exportar/copia"
# export WHISPER_MODELO="$HOME/modelos/ggml-large-v3-turbo.bin"
# export PRISMA_AB="agent-browser"   # navegador de testes usado na revisão
EOT
echo "pronto. Suba o estúdio com ./estudio.sh <projeto>"
