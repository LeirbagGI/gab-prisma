#!/bin/zsh
# sons.sh — sintetiza os efeitos (pop, whoosh, toque, ding, apito, risco) com o ffmpeg, sem baixar nada.
# Saem em public/sons/*.wav. Para trocar por um efeito melhor, é só pôr outro arquivo com o mesmo nome.
set -e
D=${0:A:h:h}/public/sons; mkdir -p $D
f() { ffmpeg -v error -y -f lavfi -i "$2" -ac 2 -ar 48000 "$D/$1.wav"; }
# pop: seno que cai de 900 para 250 Hz em 90 ms
f pop      "aevalsrc='0.9*sin(2*PI*(250*t+650*(1-exp(-t*40))/40))*exp(-t*38)':d=0.16"
# whoosh: ruído rosa filtrado com envelope que sobe e desce
f whoosh   "anoisesrc=c=pink:d=0.45:a=0.6,highpass=f=400,lowpass=f=3500,afade=t=in:d=0.22,afade=t=out:st=0.22:d=0.23"
# toque: clique curto e agudo
f toque    "aevalsrc='0.7*sin(2*PI*2200*t)*exp(-t*120)':d=0.06"
# ding: sino com harmônico
f ding     "aevalsrc='0.5*(sin(2*PI*1320*t)+0.5*sin(2*PI*2640*t)+0.25*sin(2*PI*3960*t))*exp(-t*5)':d=0.9"
# apito: microfonia (seno 3 kHz que cresce e corta)
f apito    "aevalsrc='0.35*sin(2*PI*(2900+120*sin(2*PI*6*t))*t)*min(1\,t*3)':d=0.7"
# risco: caneta riscando (ruído agudo curto)
f risco    "anoisesrc=c=white:d=0.18:a=0.35,bandpass=f=5000:w=3000,afade=t=out:st=0.08:d=0.1"
# boom: grave do momento da marca
f boom     "aevalsrc='0.9*sin(2*PI*(45*t+80*(1-exp(-t*12))/12))*exp(-t*4)':d=1.2"
ls $D
