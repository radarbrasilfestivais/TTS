import React, { useState } from 'react';
import {
  MicOff,
  Flame,
  Sparkles,
  Smile,
  Zap,
  Tv,
  ChevronsRight,
  Cpu,
  Pause,
  Info,
} from 'lucide-react';
import { NuanceType } from '../types/tts';
import { NUANCE_PRESETS } from '../utils/nuances';

interface NuanceToolbarProps {
  onApplyNuance: (nuance: NuanceType, pauseDuration?: number) => void;
  onOpenGuide: () => void;
}

export const NuanceToolbar: React.FC<NuanceToolbarProps> = ({
  onApplyNuance,
  onOpenGuide,
}) => {
  const [pauseSeconds, setPauseSeconds] = useState<number>(1.0);
  const [showPauseMenu, setShowPauseMenu] = useState<boolean>(false);

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 bg-slate-900/60 px-4 py-2.5">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 mr-2 flex items-center gap-1.5">
          Nuances de Fala:
        </span>

        {/* Sussurro */}
        <button
          type="button"
          onClick={() => onApplyNuance('whisper')}
          title="Sussurrando: voz íntima, suave e cheia de respiração [sussurro]...[/sussurro]"
          className="flex items-center gap-1.5 rounded-md border border-teal-800/60 bg-teal-950/40 px-2.5 py-1 text-xs font-medium text-teal-300 hover:bg-teal-900/60 transition-colors whitespace-nowrap active:scale-95"
        >
          <MicOff className="h-3 w-3 text-teal-400" />
          <span>Sussurro</span>
        </button>

        {/* Forte / Imponente */}
        <button
          type="button"
          onClick={() => onApplyNuance('strong')}
          title="Forte: voz imponente, autoritária e projetada [forte]...[/forte]"
          className="flex items-center gap-1.5 rounded-md border border-amber-800/60 bg-amber-950/40 px-2.5 py-1 text-xs font-medium text-amber-300 hover:bg-amber-900/60 transition-colors whitespace-nowrap active:scale-95"
        >
          <Flame className="h-3 w-3 text-amber-400" />
          <span>Forte</span>
        </button>

        {/* Ênfase */}
        <button
          type="button"
          onClick={() => onApplyNuance('emphasis')}
          title="Ênfase: destaque expressivo com elevação vocal [enfase]...[/enfase]"
          className="flex items-center gap-1.5 rounded-md border border-indigo-800/60 bg-indigo-950/40 px-2.5 py-1 text-xs font-medium text-indigo-300 hover:bg-indigo-900/60 transition-colors whitespace-nowrap active:scale-95"
        >
          <Sparkles className="h-3 w-3 text-indigo-400" />
          <span>Ênfase</span>
        </button>

        {/* Calmo */}
        <button
          type="button"
          onClick={() => onApplyNuance('calm')}
          title="Calmo: tom relaxante, lento e pacífico [calmo]...[/calmo]"
          className="flex items-center gap-1.5 rounded-md border border-emerald-800/60 bg-emerald-950/40 px-2.5 py-1 text-xs font-medium text-emerald-300 hover:bg-emerald-900/60 transition-colors whitespace-nowrap active:scale-95"
        >
          <Smile className="h-3 w-3 text-emerald-400" />
          <span>Calmo</span>
        </button>

        {/* Alegre / Vibrante */}
        <button
          type="button"
          onClick={() => onApplyNuance('excited')}
          title="Alegre & Entusiasmado: ritmo enérgico e sorridente [alegre]...[/alegre]"
          className="flex items-center gap-1.5 rounded-md border border-yellow-800/60 bg-yellow-950/40 px-2.5 py-1 text-xs font-medium text-yellow-300 hover:bg-yellow-900/60 transition-colors whitespace-nowrap active:scale-95"
        >
          <Zap className="h-3 w-3 text-yellow-400" />
          <span>Alegre</span>
        </button>

        {/* Dramático */}
        <button
          type="button"
          onClick={() => onApplyNuance('dramatic')}
          title="Dramático: tom solene, grave e cinematográfico [dramatico]...[/dramatico]"
          className="flex items-center gap-1.5 rounded-md border border-purple-800/60 bg-purple-950/40 px-2.5 py-1 text-xs font-medium text-purple-300 hover:bg-purple-900/60 transition-colors whitespace-nowrap active:scale-95"
        >
          <Tv className="h-3 w-3 text-purple-400" />
          <span>Drama</span>
        </button>

        {/* Rápido */}
        <button
          type="button"
          onClick={() => onApplyNuance('fast')}
          title="Rápido: locução ágil e acelerada [rapido]...[/rapido]"
          className="flex items-center gap-1.5 rounded-md border border-blue-800/60 bg-blue-950/40 px-2.5 py-1 text-xs font-medium text-blue-300 hover:bg-blue-900/60 transition-colors whitespace-nowrap active:scale-95"
        >
          <ChevronsRight className="h-3 w-3 text-blue-400" />
          <span>Rápido</span>
        </button>

        {/* Robô */}
        <button
          type="button"
          onClick={() => onApplyNuance('robotic')}
          title="Robótico: tom mecânico constante [robo]...[/robo]"
          className="flex items-center gap-1.5 rounded-md border border-rose-800/60 bg-rose-950/40 px-2.5 py-1 text-xs font-medium text-rose-300 hover:bg-rose-900/60 transition-colors whitespace-nowrap active:scale-95"
        >
          <Cpu className="h-3 w-3 text-rose-400" />
          <span>Robô</span>
        </button>

        {/* Pausa Dropdown */}
        <div className="relative inline-block">
          <button
            type="button"
            onClick={() => setShowPauseMenu(!showPauseMenu)}
            title="Inserir pausa de silêncio natural"
            className="flex items-center gap-1.5 rounded-md border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors whitespace-nowrap"
          >
            <Pause className="h-3 w-3 text-slate-400" />
            <span>Pausa ({pauseSeconds}s)</span>
          </button>

          {showPauseMenu && (
            <div className="absolute left-0 mt-1 z-30 w-44 rounded-lg border border-slate-700 bg-slate-900 p-2 shadow-xl">
              <span className="block text-[11px] font-semibold text-slate-400 mb-1.5 px-1">
                Duração da Pausa
              </span>
              <div className="grid grid-cols-2 gap-1 mb-2">
                {[0.5, 1.0, 1.5, 2.0, 2.5, 3.0].map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => {
                      setPauseSeconds(sec);
                      onApplyNuance('pause', sec);
                      setShowPauseMenu(false);
                    }}
                    className={`rounded px-2 py-1 text-xs font-medium text-left transition-colors ${
                      pauseSeconds === sec
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {sec}s {sec === 1.0 ? '(padrão)' : ''}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Guia de Estilos */}
      <button
        type="button"
        onClick={onOpenGuide}
        className="flex items-center gap-1 text-xs text-slate-400 hover:text-indigo-300 transition-colors whitespace-nowrap"
      >
        <Info className="h-3.5 w-3.5" />
        <span>Como usar as nuances?</span>
      </button>
    </div>
  );
};
