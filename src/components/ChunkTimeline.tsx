import React from 'react';
import { Play, Pause, Clock, Volume2, Sparkles, Filter } from 'lucide-react';
import { NuanceType, TextChunk } from '../types/tts';
import { NUANCE_PRESETS } from '../utils/nuances';

interface ChunkTimelineProps {
  chunks: TextChunk[];
  activeChunkIndex: number;
  isPlaying: boolean;
  onPlayChunk: (chunk: TextChunk) => void;
  onPlayFromIndex: (index: number) => void;
  onChangeChunkNuance: (chunkId: string, newNuance: NuanceType) => void;
}

export const ChunkTimeline: React.FC<ChunkTimelineProps> = ({
  chunks,
  activeChunkIndex,
  isPlaying,
  onPlayChunk,
  onPlayFromIndex,
  onChangeChunkNuance,
}) => {
  const [filterNuance, setFilterNuance] = React.useState<string>('all');

  const filteredChunks = chunks.filter((c) => {
    if (filterNuance === 'all') return true;
    return c.nuance === filterNuance;
  });

  if (chunks.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-[#0d121f] p-12 text-center shadow-xl">
        <Volume2 className="mx-auto h-12 w-12 text-slate-400 mb-3" />
        <h3 className="text-base font-semibold text-white">Nenhum trecho de fala detectado</h3>
        <p className="mt-1.5 text-sm text-slate-400 max-w-md mx-auto">
          Digite ou cole um texto no Editor de Roteiro para visualizar a linha do tempo de nuances e frases divididas.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-[#0d121f] shadow-xl overflow-hidden">
      {/* Header and Filter strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 bg-slate-900/80 px-5 py-3.5">
        <div>
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <span>Linha de Nuances & Segmentação de Fala</span>
            <span className="text-xs font-normal text-slate-400 font-mono tabular-nums">
              ({chunks.length} segmentos)
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Cada bloco pode ser testado individualmente com a nuance selecionada.
          </p>
        </div>

        {/* Filter controls (Interactive buttons) */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
          <button
            onClick={() => setFilterNuance('all')}
            className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap ${
              filterNuance === 'all'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Todos ({chunks.length})
          </button>
          <button
            onClick={() => setFilterNuance('whisper')}
            className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap ${
              filterNuance === 'whisper'
                ? 'bg-teal-600 text-white'
                : 'text-teal-400/80 hover:text-teal-300 hover:bg-teal-950/40'
            }`}
          >
            Sussurros
          </button>
          <button
            onClick={() => setFilterNuance('strong')}
            className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap ${
              filterNuance === 'strong'
                ? 'bg-amber-600 text-white'
                : 'text-amber-400/80 hover:text-amber-300 hover:bg-amber-950/40'
            }`}
          >
            Fortes
          </button>
          <button
            onClick={() => setFilterNuance('emphasis')}
            className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap ${
              filterNuance === 'emphasis'
                ? 'bg-indigo-600 text-white'
                : 'text-indigo-400/80 hover:text-indigo-300 hover:bg-indigo-950/40'
            }`}
          >
            Ênfases
          </button>
          <button
            onClick={() => setFilterNuance('pause')}
            className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap ${
              filterNuance === 'pause'
                ? 'bg-slate-700 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Pausas
          </button>
        </div>
      </div>

      {/* Chunks List */}
      <div className="divide-y divide-slate-800/80 max-h-[640px] overflow-y-auto">
        {filteredChunks.map((chunk, index) => {
          const originalIndex = chunks.findIndex((c) => c.id === chunk.id);
          const isActive = isPlaying && activeChunkIndex === originalIndex;
          const nuance = NUANCE_PRESETS[chunk.nuance] || NUANCE_PRESETS.normal;

          return (
            <div
              key={chunk.id}
              className={`p-4 transition-all duration-150 flex items-start gap-3.5 ${
                isActive
                  ? 'bg-indigo-950/30 border-l-2 border-indigo-500'
                  : 'hover:bg-slate-900/40'
              }`}
            >
              {/* Play Single Chunk Button */}
              <button
                type="button"
                onClick={() => onPlayChunk(chunk)}
                title="Ouvir este segmento isolado"
                className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-colors ${
                  isActive
                    ? 'border-indigo-500 bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-600 hover:text-white'
                }`}
              >
                <Play className="h-3.5 w-3.5 fill-current" />
              </button>

              {/* Index & Content */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span className="font-mono text-xs font-semibold text-slate-400 tabular-nums">
                    #{String(originalIndex + 1).padStart(2, '0')}
                  </span>

                  {/* Nuance badge selector */}
                  <select
                    value={chunk.nuance}
                    onChange={(e) =>
                      onChangeChunkNuance(chunk.id, e.target.value as NuanceType)
                    }
                    className={`rounded border px-2 py-0.5 text-xs font-medium cursor-pointer focus:outline-none ${nuance.bgClass} ${nuance.borderClass} ${nuance.colorClass}`}
                  >
                    <option value="normal">Normal (Fala Padrão)</option>
                    <option value="whisper">Sussurro (Whisper)</option>
                    <option value="strong">Forte & Imponente</option>
                    <option value="emphasis">Ênfase Marcada</option>
                    <option value="calm">Calmo & Suave</option>
                    <option value="excited">Alegre & Entusiasmado</option>
                    <option value="dramatic">Dramático & Solene</option>
                    <option value="fast">Rápido / Ágil</option>
                    <option value="robotic">Robótico</option>
                    <option value="pause">Pausa Silenciosa</option>
                  </select>

                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-slate-400" />
                      <span className="font-mono tabular-nums">
                        {(chunk.pauseDurationSec || chunk.estimatedDurationSec).toFixed(1)}s
                      </span>
                    </span>
                    {chunk.charCount > 0 && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">{chunk.charCount} caracteres</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Text snippet */}
                <p
                  className={`text-sm leading-relaxed ${
                    isActive ? 'text-white font-medium' : 'text-slate-200'
                  }`}
                >
                  {chunk.text}
                </p>
              </div>

              {/* Play from here button */}
              <button
                type="button"
                onClick={() => onPlayFromIndex(originalIndex)}
                title="Tocar tudo a partir deste ponto"
                className="hidden sm:flex text-xs font-medium text-slate-400 hover:text-indigo-300 transition-colors shrink-0 pt-1"
              >
                Tocar a partir daqui &rarr;
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
