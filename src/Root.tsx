import React from 'react';
import {Composition, staticFile} from 'remotion';
import {Filme, Dados} from './Filme';

// filme.json é montado por ferramentas/render.mjs (roteiro + tempos da voz + personagens que existem).
export const Root: React.FC = () => (
  <Composition
    id="Filme"
    component={Filme}
    width={1080}
    height={1920}
    fps={30}
    durationInFrames={300}
    defaultProps={{projeto: 'centro-eventos', dados: null as Dados | null}}
    calculateMetadata={async ({props}) => {
      const dados: Dados = await fetch(staticFile(`${props.projeto}/filme.json`)).then((r) => r.json());
      const f = dados.roteiro.formato;
      return {
        props: {...props, dados},
        width: f.largura,
        height: f.altura,
        fps: f.fps,
        durationInFrames: Math.ceil(dados.tempo.duracao * f.fps),
      };
    }}
  />
);
