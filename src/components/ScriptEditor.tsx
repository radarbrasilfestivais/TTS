import React, { useRef } from 'react';
import {
  FileText,
  Upload,
  Trash2,
  Copy,
  Clock,
  Sparkles,
  Layers,
  Save,
  Check,
} from 'lucide-react';
import { NuanceToolbar } from './NuanceToolbar';
import { NuanceType, TextChunk } from '../types/tts';
import { wrapWithNuanceTag, stripNuanceTags } from '../utils/nuances';
import { SAMPLE_PROJECTS } from '../utils/storage';

interface ScriptEditorProps {
  content: string;
  setContent: (val: string) => void;
  title: string;
  setTitle: (val: string) => void;
  chunks: TextChunk[];
  stats: {
    charCount: number;
    wordCount: number;
    formattedDuration: string;
    chunksCount: number;
  };
  onOpenGuide: () => void;
  onSaveProject: () => void;
  isSavedJustNow: boolean;
  activeChunkIndex: number;
}

export const ScriptEditor: React.FC<ScriptEditorProps> = ({
  content,
  setContent,
  title,
  setTitle,
  chunks,
  stats,
  onOpenGuide,
  onSaveProject,
  isSavedJustNow,
  activeChunkIndex,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [copiedClean, setCopiedClean] = React.useState(false);

  // Apply nuance tag to selected text in textarea
  const handleApplyNuance = (nuance: NuanceType, pauseDuration: number = 1.0) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);

    const replacement = wrapWithNuanceTag(selectedText, nuance, pauseDuration);
    const newContent = content.substring(0, start) + replacement + content.substring(end);

    setContent(newContent);

    // Reposition cursor
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start, start + replacement.length);
    }, 10);
  };

  // Import local .txt file
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setContent(text);
        if (!title || title.startsWith('Novo Roteiro')) {
          setTitle(file.name.replace(/\.[^/.]+$/, ''));
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleCopyClean = () => {
    const clean = stripNuanceTags(content);
    navigator.clipboard.writeText(clean);
    setCopiedClean(true);
    setTimeout(() => setCopiedClean(false), 2000);
  };

  const handleLoadSample = (sampleId: string) => {
    const sample = SAMPLE_PROJECTS.find((s) => s.id === sampleId);
    if (sample) {
      setContent(sample.content);
      setTitle(sample.title);
    }
  };

  return (
    <div className="flex flex-col rounded-2xl border border-slate-800 bg-[#0d121f] shadow-xl overflow-hidden">
      {/* Title & Quick Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 bg-slate-900/80 px-4 py-3">
        <div className="flex items-center gap-2.5 flex-1 min-w-[200px]">
          <FileText className="h-4 w-4 text-indigo-400 shrink-0" />
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título do Roteiro..."
            className="w-full bg-transparent text-sm font-semibold text-white placeholder-slate-400 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Sample Select */}
          <select
            onChange={(e) => {
              if (e.target.value) handleLoadSample(e.target.value);
              e.target.value = '';
            }}
            defaultValue=""
            className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white transition-colors focus:outline-none"
          >
            <option value="" disabled>
              Carregar Exemplo...
            </option>
            <option value="sample-suspense">Audiolivro (Suspense & Sussurro)</option>
            <option value="sample-comercial">Comercial (Forte & Enérgico)</option>
            <option value="sample-meditacao">Meditação (Calmo & Pausas)</option>
          </select>

          {/* Import .txt */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Importar arquivo de texto do seu dispositivo"
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white transition-colors"
          >
            <Upload className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Importar .txt</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.md"
            onChange={handleFileUpload}
            className="hidden"
          />

          {/* Copy Clean Text */}
          <button
            type="button"
            onClick={handleCopyClean}
            title="Copiar texto sem as marcações de nuances"
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white transition-colors"
          >
            {copiedClean ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">{copiedClean ? 'Copiado!' : 'Texto Limpo'}</span>
          </button>

          {/* Save Button */}
          <button
            type="button"
            onClick={onSaveProject}
            title="Salvar rascunho offline agora"
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
              isSavedJustNow
                ? 'bg-emerald-600 text-white'
                : 'border border-slate-700 bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            {isSavedJustNow ? <Check className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5 text-indigo-400" />}
            <span>{isSavedJustNow ? 'Salvo!' : 'Salvar'}</span>
          </button>

          {/* Clear */}
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Deseja limpar todo o texto do editor?')) {
                setContent('');
              }
            }}
            title="Limpar editor"
            className="rounded-lg border border-slate-700 bg-slate-800 p-1.5 text-slate-400 hover:text-rose-400 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Nuance Tags Toolbar */}
      <NuanceToolbar onApplyNuance={handleApplyNuance} onOpenGuide={onOpenGuide} />

      {/* Textarea Workspace */}
      <div className="relative flex-1 p-4">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={`Cole ou digite aqui seu texto sem qualquer limite de tamanho...

Dica de Nuances:
Selecione qualquer palavra ou frase e clique nos botões acima para aplicar [sussurro], [forte], [enfase], [calmo] ou inserir [pausa: 1.5s].

Suporta caracteres ilimitados, audiolivros inteiros e funciona 100% offline!`}
          rows={16}
          className="w-full h-full min-h-[360px] resize-y bg-transparent font-sans text-sm sm:text-base leading-relaxed text-slate-100 placeholder-slate-400 focus:outline-none"
        />
      </div>

      {/* Real-Time Metrics Strip (Tabular Numerals & Zero-Pill) */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-800 bg-slate-900/90 px-4 py-2.5 text-xs text-slate-400">
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-1.5">
            <span>Caracteres:</span>
            <strong className="font-mono text-slate-200 tabular-nums font-semibold">
              {stats.charCount.toLocaleString('pt-BR')}
            </strong>
            <span className="text-[10px] text-emerald-400 font-medium">(Ilimitado)</span>
          </div>

          <span aria-hidden="true" className="text-slate-700">·</span>

          <div className="flex items-center gap-1.5">
            <span>Palavras:</span>
            <strong className="font-mono text-slate-200 tabular-nums font-semibold">
              {stats.wordCount.toLocaleString('pt-BR')}
            </strong>
          </div>

          <span aria-hidden="true" className="text-slate-700">·</span>

          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-slate-400" />
            <span>Duração Aprox.:</span>
            <strong className="font-mono text-slate-200 tabular-nums font-semibold">
              {stats.formattedDuration}
            </strong>
          </div>

          <span aria-hidden="true" className="text-slate-700">·</span>

          <div className="flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-slate-400" />
            <span>Segmentos:</span>
            <strong className="font-mono text-slate-200 tabular-nums font-semibold">
              {stats.chunksCount}
            </strong>
          </div>
        </div>

        <div className="text-[11px] text-slate-400">
          Salvamento automático local ativo
        </div>
      </div>
    </div>
  );
};
