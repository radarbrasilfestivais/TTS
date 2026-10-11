import React from 'react';
import {
  Play,
  Pause,
  Square,
  Volume2,
  Gauge,
  Sliders,
  Sparkles,
  HardDrive,
  Loader2,
} from 'lucide-react';
import { VoiceOption } from '../types/tts';

interface VoiceControlsProps {
  voices: VoiceOption[];
  selectedVoiceId: string;
  setSelectedVoiceId: (id: string) => void;
  speed: number;
  setSpeed: (speed: number) => void;
  pitch: number;
  setPitch: (pitch: number) => void;
  volume: number;
  setVolume: (volume: number) => void;
  isPlaying: boolean;
  isPaused: boolean;
  isLoadingNeural: boolean;
  onPlay: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  engineMode: 'neural' | 'offline';
  chunksCount: number;
  activeChunkIndex: number;
}

export const VoiceControls: React.FC<VoiceControlsProps> = ({
  voices,
  selectedVoiceId,
  setSelectedVoiceId,
  speed,
  setSpeed,
  pitch,
  setPitch,
  volume,
  setVolume,
  isPlaying,
  isPaused,
  isLoadingNeural,
  onPlay,
  onPause,
  onResume,
  onStop,
  engineMode,
  chunksCount,
  activeChunkIndex,
}) => {
  const neuralVoices = voices.filter((v) => v.isNeural);
  const localVoices = voices.filter((v) => v.isNativeOffline);

  return (
    <div className="rounded-2xl border border-slate-800 bg-[#0d121f] p-4 lg:p-5 shadow-xl">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
        {/* Voice Selector */}
        <div className="md:col-span-5 space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
              <span>Voz Selecionada</span>
            </label>
            <span className="text-[11px] text-slate-400">
              {engineMode === 'neural' ? 'Estúdio Neural' : 'Motor Offline'}
            </span>
          </div>

          <div className="relative">
            <select
              value={selectedVoiceId}
              onChange={(e) => setSelectedVoiceId(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-900/90 px-3.5 py-2.5 text-sm font-medium text-slate-100 shadow-inner focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
            >
              {engineMode === 'neural' && (
                <optgroup label="✨ Vozes Neurais (Alta Fidelidade)">
                  {neuralVoices.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </optgroup>
              )}
              <optgroup label="💾 Vozes Nativas do Sistema (100% Offline)">
                {localVoices.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>
        </div>

        {/* Master Tuning Sliders (Velocidade, Tom, Volume) */}
        <div className="md:col-span-4 grid grid-cols-3 gap-3">
          {/* Velocidade / Speed */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
              <span className="flex items-center gap-1">
                <Gauge className="h-3 w-3 text-slate-400" />
                <span>Veloc.</span>
              </span>
              <span className="font-mono text-slate-200 tabular-nums">{speed.toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.05"
              value={speed}
              onChange={(e) => setSpeed(parseFloat(e.target.value))}
              className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />
          </div>

          {/* Tom / Pitch */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
              <span className="flex items-center gap-1">
                <Sliders className="h-3 w-3 text-slate-400" />
                <span>Tom</span>
              </span>
              <span className="font-mono text-slate-200 tabular-nums">{pitch.toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min="0.6"
              max="1.5"
              step="0.05"
              value={pitch}
              onChange={(e) => setPitch(parseFloat(e.target.value))}
              className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />
          </div>

          {/* Volume */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
              <span className="flex items-center gap-1">
                <Volume2 className="h-3 w-3 text-slate-400" />
                <span>Volume</span>
              </span>
              <span className="font-mono text-slate-200 tabular-nums">{Math.round(volume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />
          </div>
        </div>

        {/* Master Playback Buttons */}
        <div className="md:col-span-3 flex items-center justify-end gap-2.5">
          {isPlaying ? (
            <button
              onClick={onPause}
              className="flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-amber-600/30 hover:bg-amber-500 active:scale-95 transition-all whitespace-nowrap"
            >
              <Pause className="h-4 w-4" />
              <span>Pausar</span>
            </button>
          ) : isPaused ? (
            <button
              onClick={onResume}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-indigo-600/30 hover:bg-indigo-500 active:scale-95 transition-all whitespace-nowrap"
            >
              <Play className="h-4 w-4 fill-white" />
              <span>Retomar</span>
            </button>
          ) : (
            <button
              onClick={onPlay}
              disabled={isLoadingNeural || chunksCount === 0}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-indigo-600/30 hover:bg-indigo-500 active:scale-95 transition-all whitespace-nowrap disabled:opacity-50 disabled:hover:bg-indigo-600"
            >
              {isLoadingNeural ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4 fill-white" />
              )}
              <span>Ouvir Tudo</span>
            </button>
          )}

          {(isPlaying || isPaused) && (
            <button
              onClick={onStop}
              className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors whitespace-nowrap"
            >
              <Square className="h-3.5 w-3.5" />
              <span>Parar</span>
            </button>
          )}

          {/* Sound wave visualizer when speaking */}
          {isPlaying && (
            <div className="hidden xl:flex items-center gap-0.5 px-2">
              <span className="w-1 h-3 bg-indigo-400 rounded-full animate-pulse" />
              <span className="w-1 h-5 bg-violet-400 rounded-full animate-pulse delay-75" />
              <span className="w-1 h-2 bg-indigo-400 rounded-full animate-pulse delay-150" />
              <span className="w-1 h-4 bg-pink-400 rounded-full animate-pulse delay-100" />
            </div>
          )}
        </div>
      </div>

      {/* Progress pill if playing */}
      {isPlaying && activeChunkIndex >= 0 && (
        <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-indigo-400 animate-ping" />
            <span>
              Narrando segmento <strong className="text-white font-mono tabular-nums">{activeChunkIndex + 1}</strong> de{' '}
              <span className="font-mono tabular-nums">{chunksCount}</span>
            </span>
          </span>
          <span className="text-[11px] text-indigo-300">
            Acompanhe o destaque em tempo real no editor
          </span>
        </div>
      )}
    </div>
  );
};
