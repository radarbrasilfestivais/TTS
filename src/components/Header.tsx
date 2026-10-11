import React, { useState } from 'react';
import { Download, HardDrive, Wifi, WifiOff, DownloadCloud } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface HeaderProps {
  activeTab: 'editor' | 'timeline' | 'projects' | 'guide';
  setActiveTab: (tab: 'editor' | 'timeline' | 'projects' | 'guide') => void;
  onOpenExport: () => void;
  isOnline: boolean;
  engineMode: 'neural' | 'offline';
  setEngineMode: (mode: 'neural' | 'offline') => void;
  hasServerGemini: boolean;
  activeProjectTitle: string;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenExport,
  isOnline,
  engineMode,
  setEngineMode,
  hasServerGemini,
  activeProjectTitle,
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-[#090d16]/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-8 px-4 sm:px-6 lg:px-8">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 shadow-md shadow-indigo-500/20">
            <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18M8 8v8M16 6v12M4 11v2M20 10v4" />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold tracking-tight text-white whitespace-nowrap">
              VozCraft Studio
            </span>
          </div>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
          <button
            onClick={() => setActiveTab('editor')}
            className={`transition-colors whitespace-nowrap hover:text-white pb-0.5 ${
              activeTab === 'editor' ? 'text-white border-b-2 border-indigo-500 font-semibold' : 'text-slate-400'
            }`}
          >
            Editor de Roteiro
          </button>
          <button
            onClick={() => setActiveTab('timeline')}
            className={`transition-colors whitespace-nowrap hover:text-white pb-0.5 ${
              activeTab === 'timeline' ? 'text-white border-b-2 border-indigo-500 font-semibold' : 'text-slate-400'
            }`}
          >
            Linha de Nuances
          </button>
          <button
            onClick={() => setActiveTab('projects')}
            className={`transition-colors whitespace-nowrap hover:text-white pb-0.5 ${
              activeTab === 'projects' ? 'text-white border-b-2 border-indigo-500 font-semibold' : 'text-slate-400'
            }`}
          >
            Projetos Salvos
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`transition-colors whitespace-nowrap hover:text-white pb-0.5 ${
              activeTab === 'guide' ? 'text-white border-b-2 border-indigo-500 font-semibold' : 'text-slate-400'
            }`}
          >
            Guia de Voz & Estilos
          </button>
        </nav>

        {/* Zone 3: Primary Action & Status */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Mode Switcher */}
          <div className="hidden sm:flex items-center rounded-lg bg-slate-900/90 border border-slate-800 p-1">
            <button
              onClick={() => setEngineMode('neural')}
              disabled={!hasServerGemini || !isOnline}
              title={
                !isOnline
                  ? 'Sem internet: use o Modo Offline'
                  : !hasServerGemini
                  ? 'Chave neural não detectada, usando motor local'
                  : 'Modo Estúdio Neural com nuances de voz'
              }
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap ${
                engineMode === 'neural' && hasServerGemini && isOnline
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 disabled:opacity-40 disabled:hover:text-slate-400'
              }`}
            >
              <Wifi className="h-3 w-3" />
              <span>Estúdio Neural</span>
            </button>
            <button
              onClick={() => setEngineMode('offline')}
              title="Modo 100% Offline: funciona sem internet com vozes do sistema e caracteres ilimitados"
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap ${
                engineMode === 'offline'
                  ? 'bg-slate-700 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <HardDrive className="h-3 w-3" />
              <span>Offline Local</span>
            </button>
          </div>

          {/* PWA Install Button */}
          {isInstallable && !isInstalled && (
            <button
              onClick={install}
              className="hidden lg:flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 hover:text-white transition-colors whitespace-nowrap"
            >
              <DownloadCloud className="h-3.5 w-3.5 text-indigo-400" />
              <span>Instalar App</span>
            </button>
          )}

          {isIOS && !isInstalled && (
            <button
              onClick={() => setShowIOSModal(true)}
              className="hidden lg:flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 hover:text-white transition-colors whitespace-nowrap"
            >
              <DownloadCloud className="h-3.5 w-3.5 text-indigo-400" />
              <span>Instalar no iOS</span>
            </button>
          )}

          {/* Master Export Button */}
          <button
            onClick={onOpenExport}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-600/30 hover:bg-indigo-500 active:scale-95 transition-all whitespace-nowrap"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Exportar Áudio</span>
          </button>
        </div>
      </div>

      {/* iOS Install Guide Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl">
            <h3 className="text-base font-semibold text-white">Instalar no iPhone / iPad</h3>
            <p className="mt-3 text-sm text-slate-300 leading-relaxed">
              1. Toque no botão de <strong>Compartilhar</strong> na barra do Safari.<br />
              2. Role para baixo e selecione <strong>Adicionar à Tela de Início</strong>.<br />
              3. O VozCraft funcionará como um aplicativo nativo mesmo sem internet!
            </p>
            <button
              onClick={() => setShowIOSModal(false)}
              className="mt-5 w-full rounded-lg bg-indigo-600 py-2 text-xs font-medium text-white hover:bg-indigo-500 transition-colors"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
