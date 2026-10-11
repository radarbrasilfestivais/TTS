import React, { useRef, useState } from 'react';
import {
  X,
  FolderOpen,
  Plus,
  Trash2,
  Copy,
  Download,
  Upload,
  Clock,
  FileText,
  Search,
} from 'lucide-react';
import { ProjectDraft } from '../types/tts';
import { downloadBlob } from '../utils/audioEncoder';

interface ProjectManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: ProjectDraft[];
  activeProjectId: string;
  onSelectProject: (id: string) => void;
  onCreateNewProject: () => void;
  onDeleteProject: (id: string) => void;
  onDuplicateProject: (id: string) => void;
  onImportProjects: (imported: ProjectDraft[]) => void;
}

export const ProjectManagerModal: React.FC<ProjectManagerModalProps> = ({
  isOpen,
  onClose,
  projects,
  activeProjectId,
  onSelectProject,
  onCreateNewProject,
  onDeleteProject,
  onDuplicateProject,
  onImportProjects,
}) => {
  const [search, setSearch] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const filtered = projects.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleExportAll = () => {
    const jsonStr = JSON.stringify(projects, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    downloadBlob(blob, `backup_projetos_vozcraft_${new Date().toISOString().slice(0, 10)}.json`);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) {
          onImportProjects(parsed);
        } else if (parsed.id && parsed.content) {
          onImportProjects([parsed]);
        }
      } catch (err) {
        alert('Arquivo de backup inválido.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="relative flex flex-col max-h-[85vh] w-full max-w-2xl rounded-2xl border border-slate-800 bg-[#0d121f] p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600/20 text-indigo-400">
              <FolderOpen className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Projetos & Rascunhos Offline</h2>
              <p className="text-xs text-slate-400">
                Seus roteiros salvos no armazenamento local do dispositivo
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

        {/* Toolbar: Search + Actions */}
        <div className="my-4 flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar rascunho salvo..."
              className="w-full rounded-xl border border-slate-700 bg-slate-900/90 py-2 pl-9 pr-3 text-xs text-white placeholder-slate-400 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onCreateNewProject}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Novo Roteiro</span>
            </button>

            <button
              type="button"
              onClick={handleExportAll}
              title="Exportar backup completo de todos os rascunhos"
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-2 text-xs font-medium text-slate-300 hover:text-white transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Backup</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Restaurar backup de projetos"
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-2 text-xs font-medium text-slate-300 hover:text-white transition-colors"
            >
              <Upload className="h-3.5 w-3.5" />
              <span>Restaurar</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImportFile}
              className="hidden"
            />
          </div>
        </div>

        {/* Projects List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[220px]">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              Nenhum projeto encontrado.
            </div>
          ) : (
            filtered.map((proj) => {
              const isActive = proj.id === activeProjectId;
              const dateStr = new Date(proj.updatedAt).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={proj.id}
                  className={`flex items-center justify-between gap-3 p-3.5 rounded-xl border transition-all ${
                    isActive
                      ? 'border-indigo-500 bg-indigo-950/30'
                      : 'border-slate-800/80 bg-slate-900/50 hover:bg-slate-800/60'
                  }`}
                >
                  <div
                    onClick={() => {
                      onSelectProject(proj.id);
                      onClose();
                    }}
                    className="flex-1 min-w-0 cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className={`h-4 w-4 shrink-0 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                      <h4 className="text-sm font-semibold text-white truncate">
                        {proj.title || 'Sem título'}
                      </h4>
                      {isActive && (
                        <span className="text-[10px] font-medium text-indigo-400">
                          (Atual)
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-slate-400" />
                        <span>{dateStr}</span>
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">{proj.charCount} caracteres</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">{proj.wordCount} palavras</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => onDuplicateProject(proj.id)}
                      title="Duplicar este projeto"
                      className="rounded-lg border border-slate-700 bg-slate-800 p-1.5 text-slate-300 hover:text-white transition-colors"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                    {projects.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Deseja excluir o roteiro "${proj.title}"?`)) {
                            onDeleteProject(proj.id);
                          }
                        }}
                        title="Excluir projeto"
                        className="rounded-lg border border-slate-700 bg-slate-800 p-1.5 text-slate-400 hover:text-rose-400 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-800 pt-4 mt-3 text-xs text-slate-400">
          <span>{projects.length} projetos armazenados offline</span>
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
