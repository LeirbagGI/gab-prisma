#!/bin/zsh
# estudio.sh — sobe o GAB Prisma Studio (editor) em http://localhost:4460 e abre no navegador.
cd ${0:A:h}
[[ -f ~/.gab-prisma.env ]] && source ~/.gab-prisma.env  # configuração local (fora do repositório)
if ! lsof -iTCP:4460 -sTCP:LISTEN >/dev/null 2>&1; then
  nohup npx vite --config estudio/vite.config.mjs > trabalho/estudio.log 2>&1 &
  for i in {1..40}; do lsof -iTCP:4460 -sTCP:LISTEN >/dev/null 2>&1 && break; sleep 0.5; done
fi
[[ $1 == --sem-abrir ]] || open "http://localhost:4460/?p=${1:-centro-eventos}"
