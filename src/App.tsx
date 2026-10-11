/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import { Header } from './components/Header';
import { VoiceControls } from './components/VoiceControls';
import { ScriptEditor } from './components/ScriptEditor';
import { ChunkTimeline } from './components/ChunkTimeline';
import { ExportModal } from './components/ExportModal';
import { ProjectManagerModal } from './components/ProjectManagerModal';
import { NuanceGuideModal } from './components/NuanceGuideModal';
import { useSpeechEngine } from './hooks/useSpeechEngine';
import { parseTextIntoChunks, computeScriptStats } from './utils/chunker';
import {
  getSavedProjects,
  saveSingleProject,
  deleteProject,
  getActiveProjectId,
  setActiveProjectId,
  SAMPLE_PROJECTS,
} from './utils/storage';
import { ProjectDraft, NuanceType, TextChunk } from './types/tts';
import { WifiOff } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'editor' | 'timeline' | 'projects' | 'guide'>('editor');
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isProjectsOpen, setIsProjectsOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  // Projects persistence state
  const [projects, setProjects] = useState<ProjectDraft[]>(() => getSavedProjects());
  const [activeProjectId, setCurrentActiveProjectId] = useState<string>(() => getActiveProjectId());

  // Current active draft
  const activeDraft = useMemo(() => {
    return projects.find((p) => p.id === activeProjectId) || projects[0] || SAMPLE_PROJECTS[0];
  }, [projects, activeProjectId]);

  const [title, setTitle] = useState<string>(activeDraft.title);
  const [content, setContent] = useState<string>(activeDraft.content);
  const [speed, setSpeed] = useState<number>(activeDraft.globalSpeed || 1.0);
  const [pitch, setPitch] = useState<number>(activeDraft.globalPitch || 1.0);
  const [volume, setVolume] = useState<number>(activeDraft.globalVolume || 1.0);
  const [isSavedJustNow, setIsSavedJustNow] = useState(false);

  // Speech Engine Hook
  const {
    voices,
    selectedVoiceId,
    setSelectedVoiceId,
    engineMode,
    setEngineMode,
    isOnline,
    hasServerGemini,
    isPlaying,
    isPaused,
    activeChunkIndex,
    isLoadingNeural,
    playAll,
    playSingleChunk,
    pausePlayback,
    resumePlayback,
    stopPlayback,
  } = useSpeechEngine();

  // Parse chunks whenever content changes
  const chunks = useMemo(() => {
    return parseTextIntoChunks(content, 'normal');
  }, [content]);

  // Compute live statistics
  const stats = useMemo(() => {
    return computeScriptStats(content, chunks);
  }, [content, chunks]);

  // Update current draft state when changing active project
  const handleSelectProject = (id: string) => {
    const target = projects.find((p) => p.id === id);
    if (target) {
      setCurrentActiveProjectId(id);
      setActiveProjectId(id);
      setTitle(target.title);
      setContent(target.content);
      setSpeed(target.globalSpeed || 1.0);
      setPitch(target.globalPitch || 1.0);
      setVolume(target.globalVolume || 1.0);
      if (target.voiceId) setSelectedVoiceId(target.voiceId);
      stopPlayback();
    }
  };

  // Autosave active draft to localStorage
  useEffect(() => {
    const timer = setTimeout(() => {
      const updatedDraft: ProjectDraft = {
        ...activeDraft,
        title,
        content,
        voiceId: selectedVoiceId,
        engineMode,
        globalSpeed: speed,
        globalPitch: pitch,
        globalVolume: volume,
        updatedAt: Date.now(),
        wordCount: stats.wordCount,
        charCount: stats.charCount,
      };
      saveSingleProject(updatedDraft);
      setProjects(getSavedProjects());
      setIsSavedJustNow(true);
      setTimeout(() => setIsSavedJustNow(false), 1500);
    }, 1500);

    return () => clearTimeout(timer);
  }, [title, content, selectedVoiceId, engineMode, speed, pitch, volume, stats, activeDraft]);

  const handleManualSave = () => {
    const updatedDraft: ProjectDraft = {
      ...activeDraft,
      title,
      content,
      voiceId: selectedVoiceId,
      engineMode,
      globalSpeed: speed,
      globalPitch: pitch,
      globalVolume: volume,
      updatedAt: Date.now(),
      wordCount: stats.wordCount,
      charCount: stats.charCount,
    };
    saveSingleProject(updatedDraft);
    setProjects(getSavedProjects());
    setIsSavedJustNow(true);
    setTimeout(() => setIsSavedJustNow(false), 2000);
  };

  const handleCreateNewProject = () => {
    const newId = `proj-${Date.now()}`;
    const newDraft: ProjectDraft = {
      id: newId,
      title: `Novo Roteiro ${projects.length + 1}`,
      content: `Comece a escrever seu texto aqui...\n\n[sussurro]Você pode usar sussurros[/sussurro] ou [forte]falar com grande força e impacto![/forte]`,
      voiceId: selectedVoiceId,
      engineMode,
      globalSpeed: 1.0,
      globalPitch: 1.0,
      globalVolume: 1.0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      wordCount: 18,
      charCount: 120,
    };
    saveSingleProject(newDraft);
    const updated = getSavedProjects();
    setProjects(updated);
    handleSelectProject(newId);
    setIsProjectsOpen(false);
  };

  const handleDeleteProject = (id: string) => {
    const remaining = deleteProject(id);
    setProjects(remaining);
    if (activeProjectId === id && remaining.length > 0) {
      handleSelectProject(remaining[0].id);
    }
  };

  const handleDuplicateProject = (id: string) => {
    const source = projects.find((p) => p.id === id);
    if (!source) return;
    const duplicated: ProjectDraft = {
      ...source,
      id: `proj-${Date.now()}`,
      title: `${source.title} (Cópia)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    saveSingleProject(duplicated);
    const updated = getSavedProjects();
    setProjects(updated);
    handleSelectProject(duplicated.id);
  };

  const handleImportProjects = (imported: ProjectDraft[]) => {
    imported.forEach((p) => saveSingleProject(p));
    const updated = getSavedProjects();
    setProjects(updated);
    if (imported.length > 0) {
      handleSelectProject(imported[0].id);
    }
    setIsProjectsOpen(false);
  };

  // Modify a chunk's nuance directly from timeline
  const handleChangeChunkNuance = (chunkId: string, newNuance: NuanceType) => {
    // Rebuild text with updated tag for that chunk
    const targetChunk = chunks.find((c) => c.id === chunkId);
    if (!targetChunk) return;

    // Replace the chunk's text in the overall content
    // For simplicity, we can wrap targetChunk's plain text in new nuance
    const rawPlain = targetChunk.text;
    const newTagWrap =
      newNuance === 'normal'
        ? rawPlain
        : `[${newNuance}]${rawPlain}[/${newNuance}]`;

    setContent((prev) => prev.replace(targetChunk.text, newTagWrap));
  };

  const handleInsertSampleFromGuide = (sampleText: string) => {
    setContent((prev) => (prev ? `${prev}\n\n${sampleText}` : sampleText));
    setActiveTab('editor');
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Top Bar */}
      <Header
        activeTab={activeTab}
        setActiveTab={(t) => {
          if (t === 'projects') {
            setIsProjectsOpen(true);
          } else if (t === 'guide') {
            setIsGuideOpen(true);
          } else {
            setActiveTab(t);
          }
        }}
        onOpenExport={() => setIsExportOpen(true)}
        isOnline={isOnline}
        engineMode={engineMode}
        setEngineMode={setEngineMode}
        hasServerGemini={hasServerGemini}
        activeProjectTitle={title}
      />

      {/* Offline Alert Strip if network drops */}
      {!isOnline && (
        <div className="bg-amber-950/80 border-b border-amber-800/80 px-4 py-2 text-center text-xs text-amber-200 flex items-center justify-center gap-2">
          <WifiOff className="h-3.5 w-3.5 shrink-0" />
          <span>
            <strong>Você está offline:</strong> O VozCraft Studio continua funcionando perfeitamente! Seus rascunhos são salvos no dispositivo e a síntese de voz usa o motor local com caracteres ilimitados.
          </span>
        </div>
      )}

      {/* Main Studio Viewport */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Voice Controls Console */}
        <VoiceControls
          voices={voices}
          selectedVoiceId={selectedVoiceId}
          setSelectedVoiceId={setSelectedVoiceId}
          speed={speed}
          setSpeed={setSpeed}
          pitch={pitch}
          setPitch={setPitch}
          volume={volume}
          setVolume={setVolume}
          isPlaying={isPlaying}
          isPaused={isPaused}
          isLoadingNeural={isLoadingNeural}
          onPlay={() => playAll(chunks, 0, speed, pitch, volume)}
          onPause={pausePlayback}
          onResume={() => resumePlayback(speed, pitch, volume)}
          onStop={stopPlayback}
          engineMode={engineMode}
          chunksCount={chunks.length}
          activeChunkIndex={activeChunkIndex}
        />

        {/* Tab 1: Script Editor */}
        {activeTab === 'editor' && (
          <ScriptEditor
            content={content}
            setContent={setContent}
            title={title}
            setTitle={setTitle}
            chunks={chunks}
            stats={stats}
            onOpenGuide={() => setIsGuideOpen(true)}
            onSaveProject={handleManualSave}
            isSavedJustNow={isSavedJustNow}
            activeChunkIndex={activeChunkIndex}
          />
        )}

        {/* Tab 2: Nuance Timeline Sequence */}
        {activeTab === 'timeline' && (
          <ChunkTimeline
            chunks={chunks}
            activeChunkIndex={activeChunkIndex}
            isPlaying={isPlaying}
            onPlayChunk={(chk) => playSingleChunk(chk, speed, pitch, volume)}
            onPlayFromIndex={(idx) => playAll(chunks, idx, speed, pitch, volume)}
            onChangeChunkNuance={handleChangeChunkNuance}
          />
        )}
      </main>

      {/* Modals */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        chunks={chunks}
        title={title}
        selectedVoiceId={selectedVoiceId}
        speed={speed}
        pitch={pitch}
        volume={volume}
        engineMode={engineMode}
        isOnline={isOnline}
        hasServerGemini={hasServerGemini}
        activeProject={activeDraft}
      />

      <ProjectManagerModal
        isOpen={isProjectsOpen}
        onClose={() => setIsProjectsOpen(false)}
        projects={projects}
        activeProjectId={activeProjectId}
        onSelectProject={handleSelectProject}
        onCreateNewProject={handleCreateNewProject}
        onDeleteProject={handleDeleteProject}
        onDuplicateProject={handleDuplicateProject}
        onImportProjects={handleImportProjects}
      />

      <NuanceGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        onInsertSample={handleInsertSampleFromGuide}
      />
    </div>
  );
}
