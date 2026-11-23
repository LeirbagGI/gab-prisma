#!/bin/zsh
# personagens.sh <roteiro.json> [nome ...]
# Gera cada personagem do roteiro pelo Codex (geração nativa, conta ChatGPT, sem chave), tira o fundo
# com o Vision do macOS e salva em public/<projeto>/personagens/<nome>.png. Pula quem já existe.
# Roda até 3 de uma vez.
set -e
setopt null_glob
RAIZ=${0:A:h:h}
R=${1:A}; shift
CODEX=/Applications/ChatGPT.app/Contents/Resources/codex-cli/CodexCLI.app/Contents/MacOS/codex
proj=$(node -e "console.log(require('$R').projeto)")
estilo=$(node -e "console.log(require('$R').estilo_personagem)")
nomes=(${@:-$(node -e "console.log(Object.keys(require('$R').personagens).join(' '))")})
dest=$RAIZ/public/$proj/personagens; mkdir -p $dest $RAIZ/trabalho/$proj
swiftc -O -o $RAIZ/ferramentas/recortar $RAIZ/ferramentas/recortar.swift 2>/dev/null || true

um() {
  local n=$1 w=$RAIZ/trabalho/$proj/$1
  [[ -f $dest/$n.png ]] && { echo "$n: já existe"; return; }
  mkdir -p $w
  # personagem pode ser texto ou {descricao, refs:[fotos reais]} — com refs, o rosto vem da foto (Leo/Ítalo)
  local desc=$(node -e "const v=require('$R').personagens['$n'];console.log(typeof v==='string'?v:v.descricao)")
  local refs=("${(@f)$(node -e "const v=require('$R').personagens['$n'];if(typeof v==='object')for(const r of v.refs||[])console.log(require('path').resolve('$RAIZ',r))")}")
  local imgs=() rosto=""
  for r in $refs; do [[ -f $r ]] && imgs+=(-i "$r"); done
  (( ${#imgs} )) && rosto="
ROSTO: é uma pessoa real. Mantenha os traços dela exatamente como nas fotos anexas (formato do rosto e da cabeça, cabelo ou careca, barba e sua cor, óculos ou ausência deles), em versão caricatura 3D fofa: cabeça grande, corpo pequeno. A pessoa precisa ser reconhecível."
  local pedido="Gere UMA imagem com a SUA ferramenta nativa de geração de imagem (não use script nem API) e salve nesta pasta como bruto.png. Quadrado 1024x1024.

Personagem: $desc.
Estilo: $estilo.$rosto
Sem nenhuma letra, palavra, logo ou marca. No fim, responda só o caminho do arquivo."
  "$CODEX" exec --skip-git-repo-check --ephemeral $imgs -s workspace-write -C $w "$pedido" < /dev/null > $w/codex.log 2>&1 \
    || { echo "$n: codex falhou (ver $w/codex.log)"; return; }
  local b=($w/*.png)
  [[ -n $b ]] || { echo "$n: codex não salvou imagem"; return; }
  $RAIZ/ferramentas/recortar ${b[1]} $dest/$n.png >/dev/null && echo "$n: ok" || echo "$n: recorte falhou"
}

for n in $nomes; do
  um $n &
  while (( $(jobs -r | wc -l) >= 4 )); do sleep 2; done
done
wait
