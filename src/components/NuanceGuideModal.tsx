import React from 'react';
import {
  X,
  BookOpen,
  MicOff,
  Flame,
  Sparkles,
  Smile,
  Zap,
  Tv,
  ChevronsRight,
  Cpu,
  Pause,
  Check,
} from 'lucide-react';
import { NUANCE_PRESETS } from '../utils/nuances';

interface NuanceGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertSample: (text: string) => void;
}

export const NuanceGuideModal: React.FC<NuanceGuideModalProps> = ({
  isOpen,
  onClose,
  onInsertSample,
}) => {
  if (!isOpen) return null;

  const nuanceExamples = [
    {
      type: 'whisper',
      icon: MicOff,
      title: 'Sussurrando (Whisper)',
      tag: '[sussurro]texto[/sussurro]',
      desc: 'Entrega vocal cheia de ar, baixa amplitude e tom confidente. Ideal para suspense, segredos, audiolivros misteriosos e ASMR.',
      sample: '[sussurro]Abaixe-se agora mesmo, tem alguém vindo pelo corredor...[/sussurro]',
      color: 'text-teal-300',
      bg: 'bg-teal-950/40',
      border: 'border-teal-700/60',
    },
    {
      type: 'strong',
      icon: Flame,
      title: 'Falar Forte & Imponente',
      tag: '[forte]texto[/forte]',
      desc: 'Projeção encorpada, presença marcante e volume aumentado. Ideal para ordens, momentos climáticos, trailers e chamadas para ação.',
      sample: '[forte]Atenção toda a equipe! Iniciem os procedimentos de emergência imediatamente![/forte]',
      color: 'text-amber-300',
      bg: 'bg-amber-950/40',
      border: 'border-amber-700/60',
    },
    {
      type: 'emphasis',
      icon: Sparkles,
      title: 'Ênfase Marcada',
      tag: '[enfase]texto[/enfase]',
      desc: 'Inflexão melódica com destaque e dicção precisa nas palavras cruciais do roteiro.',
      sample: 'O fator mais importante [enfase]é a consistência diária[/enfase] em cada detalhe.',
      color: 'text-indigo-300',
      bg: 'bg-indigo-950/40',
      border: 'border-indigo-700/60',
    },
    {
      type: 'calm',
      icon: Smile,
      title: 'Calmo & Suave',
      tag: '[calmo]texto[/calmo]',
      desc: 'Cadência serena e desacelerada. Ideal para meditações guiadas, vídeos de relaxamento e notícias tranquilas.',
      sample: '[calmo]Inspire profundamente e sinta a tranquilidade preencher a sua mente.[/calmo]',
      color: 'text-emerald-300',
      bg: 'bg-emerald-950/40',
      border: 'border-emerald-700/60',
    },
    {
      type: 'excited',
      icon: Zap,
      title: 'Entusiasmado & Alegre',
      tag: '[alegre]texto[/alegre]',
      desc: 'Tom solar, sorriso vocal e andamento vivo. Ideal para comerciais de varejo, anúncios e vídeos dinâmicos de YouTube.',
      sample: '[alegre]Hoje é um dia incrível com novidades fantásticas para todos vocês![/alegre]',
      color: 'text-yellow-300',
      bg: 'bg-yellow-950/40',
      border: 'border-yellow-700/60',
    },
    {
      type: 'dramatic',
      icon: Tv,
      title: 'Dramático & Solene',
      tag: '[dramatico]texto[/dramatico]',
      desc: 'Tom grave, pausas solenes e ressonância teatral. Perfeito para contos literários, história e trailers de ficção.',
      sample: '[dramatico]Naquele instante, o destino de toda a dinastia foi selado para sempre.[/dramatico]',
      color: 'text-purple-300',
      bg: 'bg-purple-950/40',
      border: 'border-purple-700/60',
    },
    {
      type: 'fast',
      icon: ChevronsRight,
      title: 'Apressado / Rápido',
      tag: '[rapido]texto[/rapido]',
      desc: 'Velocidade acelerada mantendo nitidez silábica. Ideal para advertências, avisos legais e urgência.',
      sample: '[rapido]Consulte as condições no regulamento oficial da promoção.[/rapido]',
      color: 'text-blue-300',
      bg: 'bg-blue-950/40',
      border: 'border-blue-700/60',
    },
    {
      type: 'robotic',
      icon: Cpu,
      title: 'Robótico / Sintético',
      tag: '[robo]texto[/robo]',
      desc: 'Afinação constante e ausência de modulação emocional. Estilo androide ou inteligência de nave espacial.',
      sample: '[robo]Protocolo de navegação ativado. Aguardando comandos do operador.[/robo]',
      color: 'text-rose-300',
      bg: 'bg-rose-950/40',
      border: 'border-rose-700/60',
    },
    {
      type: 'pause',
      icon: Pause,
      title: 'Pausa Silenciosa',
      tag: '[pausa: 1.5s]',
      desc: 'Insere silêncio exato (em segundos) entre as frases para criar expectativa dramática ou respiro.',
      sample: 'Ele hesitou diante da porta trancada... [pausa: 2.0s] E então girou a maçaneta.',
      color: 'text-slate-300',
      bg: 'bg-slate-900/60',
      border: 'border-slate-700/60',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="relative flex flex-col max-h-[88vh] w-full max-w-3xl rounded-2xl border border-slate-800 bg-[#0d121f] p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600/20 text-indigo-400">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Guia de Nuances Vocais</h2>
              <p className="text-xs text-slate-400">
                Aprenda a aplicar diferentes emoções, intensidades e pausas ao seu texto
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto space-y-3.5 my-4 pr-1">
          <div className="rounded-xl border border-indigo-900/40 bg-indigo-950/20 p-4 text-xs text-indigo-200 leading-relaxed">
            💡 <strong>Como funciona:</strong> Você pode mesclar várias nuances no mesmo roteiro.
            Basta envolver o trecho com as tags correspondentes ou selecionar o texto no editor e clicar no botão desejado.
            O motor neural e o motor offline adaptarão automaticamente o tom, a velocidade, a respiração e a intensidade.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {nuanceExamples.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.type}
                  className={`rounded-xl border p-4 flex flex-col justify-between ${item.bg} ${item.border}`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <Icon className={`h-4 w-4 ${item.color}`} />
                        <h4 className="text-sm font-semibold text-white">{item.title}</h4>
                      </div>
                      <code className="text-[11px] font-mono px-2 py-0.5 rounded bg-black/40 text-slate-300">
                        {item.tag}
                      </code>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed mb-3">
                      {item.desc}
                    </p>
                  </div>

                  <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between gap-2">
                    <span className="text-[11px] text-slate-400 italic truncate max-w-[200px]">
                      {item.sample}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        onInsertSample(item.sample);
                        onClose();
                      }}
                      className="text-xs font-medium text-indigo-300 hover:text-white transition-colors shrink-0"
                    >
                      Inserir Exemplo &rarr;
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-slate-800 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-slate-800 px-4 py-2 text-xs font-medium text-white hover:bg-slate-700 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
