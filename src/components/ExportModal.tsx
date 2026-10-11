import React, { useState } from 'react';
import {
  X,
  Download,
  FileAudio,
  FileText,
  Save,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Music,
  Radio,
} from 'lucide-react';
import { ExportFormat, TextChunk, ProjectDraft } from '../types/tts';
import {
  concatenateWavBuffers,
  convertWavToMp3,
  createWavBlobFromPcm,
  downloadBlob,
  generateSilencePcm,
  synthesizeOfflineAudioBuffer,
} from '../utils/audioEncoder';
import { generateSrtContent } from '../utils/srtExporter';
import { stripNuanceTags, NUANCE_PRESETS } from '../utils/nuances';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  chunks: TextChunk[];
  title: string;
  selectedVoiceId: string;
  speed: number;
  pitch: number;
  volume: number;
  engineMode: 'neural' | 'offline';
  isOnline: boolean;
  hasServerGemini: boolean;
  activeProject: ProjectDraft;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  chunks,
  title,
  selectedVoiceId,
  speed,
  pitch,
  volume,
  engineMode,
  isOnline,
  hasServerGemini,
  activeProject,
}) => {
  const [format, setFormat] = useState<ExportFormat>('wav');
  const [mp3Bitrate, setMp3Bitrate] = useState<number>(192);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progressText, setProgressText] = useState<string>('');
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [completedSuccess, setCompletedSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const safeFilename = (title || 'meu-audio')
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '_')
    .slice(0, 40);

  const handleExport = async () => {
    setIsProcessing(true);
    setErrorMessage('');
    setProgressPercent(10);
    setCompletedSuccess(false);

    try {
      if (format === 'srt') {
        setProgressText('Gerando arquivo de legendas sincronizado...');
        const srtText = generateSrtContent(chunks);
        const blob = new Blob([srtText], { type: 'text/plain;charset=utf-8' });
        downloadBlob(blob, `${safeFilename}.srt`);
        setProgressPercent(100);
        setCompletedSuccess(true);
        setIsProcessing(false);
        return;
      }

      if (format === 'json') {
        setProgressText('Exportando pacote de projeto...');
        const jsonText = JSON.stringify(activeProject, null, 2);
        const blob = new Blob([jsonText], { type: 'application/json' });
        downloadBlob(blob, `${safeFilename}_projeto.json`);
        setProgressPercent(100);
        setCompletedSuccess(true);
        setIsProcessing(false);
        return;
      }

      // Audio Export: WAV, MP3, WebM
      const useNeural = engineMode === 'neural' && hasServerGemini && isOnline;

      let masterWavBlob: Blob;

      if (useNeural) {
        setProgressText('Sintetizando áudio com motor neural em alta resolução...');
        setProgressPercent(25);

        // Call backend batch synthesis
        const response = await fetch('/api/tts/batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chunks: chunks.map((c) => ({
              id: c.id,
              text: stripNuanceTags(c.text),
              style: NUANCE_PRESETS[c.nuance]?.geminiStylePrompt || '',
              voice: selectedVoiceId.startsWith('local-') ? 'Kore' : selectedVoiceId,
            })),
            voice: selectedVoiceId.startsWith('local-') ? 'Kore' : selectedVoiceId,
          }),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || 'Falha na sintetização de áudio neural do servidor.');
        }

        const data = await response.json();
        if (!data.masterAudioBase64) {
          throw new Error('Nenhum dado de áudio foi retornado pelo servidor.');
        }

        setProgressPercent(70);
        setProgressText('Decodificando áudio master PCM...');

        // Convert base64 to binary ArrayBuffer
        const binaryString = atob(data.masterAudioBase64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        masterWavBlob = new Blob([bytes.buffer], { type: 'audio/wav' });
      } else {
        // Offline synthesis generator
        setProgressText('Gerando áudio local em modo offline...');
        setProgressPercent(30);

        const chunkWavBlobs: Blob[] = [];
        for (let i = 0; i < chunks.length; i++) {
          const c = chunks[i];
          setProgressPercent(30 + Math.round((i / chunks.length) * 40));
          setProgressText(`Processando segmento ${i + 1} de ${chunks.length}...`);

          if (c.nuance === 'pause') {
            const silencePcm = generateSilencePcm(c.pauseDurationSec || 1.0, 24000);
            chunkWavBlobs.push(createWavBlobFromPcm(silencePcm, 24000, 1));
          } else {
            const clean = stripNuanceTags(c.text);
            if (clean) {
              const wavChunk = await synthesizeOfflineAudioBuffer(clean, c.nuance, speed, pitch);
              chunkWavBlobs.push(wavChunk);
            }
          }
        }

        const arrayBuffers = await Promise.all(
          chunkWavBlobs.map((b) => b.arrayBuffer())
        );
        masterWavBlob = concatenateWavBuffers(arrayBuffers);
      }

      setProgressPercent(85);

      if (format === 'wav') {
        setProgressText('Finalizando arquivo WAV master...');
        downloadBlob(masterWavBlob, `${safeFilename}.wav`);
      } else if (format === 'mp3') {
        setProgressText(`Codificando para MP3 (${mp3Bitrate} kbps)...`);
        const wavArrayBuffer = await masterWavBlob.arrayBuffer();
        const mp3Blob = await convertWavToMp3(wavArrayBuffer, mp3Bitrate);
        downloadBlob(mp3Blob, `${safeFilename}.mp3`);
      } else if (format === 'webm') {
        setProgressText('Empacotando áudio em WebM...');
        const webmBlob = new Blob([masterWavBlob], { type: 'audio/webm' });
        downloadBlob(webmBlob, `${safeFilename}.webm`);
      }

      setProgressPercent(100);
      setCompletedSuccess(true);
      setProgressText('Download concluído com sucesso!');
    } catch (err: any) {
      console.error('Erro durante exportação:', err);
      setErrorMessage(err.message || 'Ocorreu um erro ao exportar o áudio.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-xl rounded-2xl border border-slate-800 bg-[#0d121f] p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600/20 text-indigo-400">
              <Download className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Exportar Áudio & Legendas</h2>
              <p className="text-xs text-slate-400">
                Gere arquivos prontos para edição de vídeo, DAWs ou podcasts
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

        {/* Format Selector Grid */}
        <div className="my-5 space-y-4">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
            Formato de Saída:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {/* WAV */}
            <button
              type="button"
              onClick={() => setFormat('wav')}
              className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                format === 'wav'
                  ? 'border-indigo-500 bg-indigo-950/40 text-white ring-1 ring-indigo-500'
                  : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <FileAudio className="h-4 w-4 text-indigo-400" />
                <span className="font-semibold text-sm">WAV</span>
              </div>
              <span className="text-[11px] text-slate-400 leading-tight">
                Lossless PCM 24kHz / Master Universal
              </span>
            </button>

            {/* MP3 */}
            <button
              type="button"
              onClick={() => setFormat('mp3')}
              className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                format === 'mp3'
                  ? 'border-indigo-500 bg-indigo-950/40 text-white ring-1 ring-indigo-500'
                  : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Music className="h-4 w-4 text-violet-400" />
                <span className="font-semibold text-sm">MP3</span>
              </div>
              <span className="text-[11px] text-slate-400 leading-tight">
                Comprimido leve para redes e streaming
              </span>
            </button>

            {/* WebM */}
            <button
              type="button"
              onClick={() => setFormat('webm')}
              className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                format === 'webm'
                  ? 'border-indigo-500 bg-indigo-950/40 text-white ring-1 ring-indigo-500'
                  : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Radio className="h-4 w-4 text-emerald-400" />
                <span className="font-semibold text-sm">WebM</span>
              </div>
              <span className="text-[11px] text-slate-400 leading-tight">
                Formato web leve e moderno
              </span>
            </button>

            {/* SRT */}
            <button
              type="button"
              onClick={() => setFormat('srt')}
              className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                format === 'srt'
                  ? 'border-indigo-500 bg-indigo-950/40 text-white ring-1 ring-indigo-500'
                  : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <FileText className="h-4 w-4 text-amber-400" />
                <span className="font-semibold text-sm">Legenda (.srt)</span>
              </div>
              <span className="text-[11px] text-slate-400 leading-tight">
                Sincronização com minutagem para vídeo
              </span>
            </button>

            {/* JSON Projeto */}
            <button
              type="button"
              onClick={() => setFormat('json')}
              className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                format === 'json'
                  ? 'border-indigo-500 bg-indigo-950/40 text-white ring-1 ring-indigo-500'
                  : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Save className="h-4 w-4 text-teal-400" />
                <span className="font-semibold text-sm">Projeto (.json)</span>
              </div>
              <span className="text-[11px] text-slate-400 leading-tight">
                Backup offline completo com nuances
              </span>
            </button>
          </div>

          {/* MP3 Bitrate option if MP3 selected */}
          {format === 'mp3' && (
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium">Taxa de Bits (Bitrate):</span>
              <div className="flex items-center gap-2">
                {[128, 192, 320].map((kbps) => (
                  <button
                    key={kbps}
                    type="button"
                    onClick={() => setMp3Bitrate(kbps)}
                    className={`rounded px-2.5 py-1 font-mono transition-colors ${
                      mp3Bitrate === kbps
                        ? 'bg-indigo-600 text-white font-semibold'
                        : 'text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    {kbps} kbps
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Engine note */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3 text-xs text-slate-400">
            <span className="font-semibold text-slate-300">Motor de síntese: </span>
            {engineMode === 'neural' && hasServerGemini && isOnline ? (
              <span className="text-indigo-400 font-medium">
                Estúdio Neural (renderização em alta resolução com nuances vocais completas)
              </span>
            ) : (
              <span className="text-amber-400 font-medium">
                Motor 100% Offline (exportação local instantânea gerada no dispositivo)
              </span>
            )}
          </div>

          {/* Progress bar */}
          {isProcessing && (
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 flex items-center gap-1.5">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-400" />
                  <span>{progressText}</span>
                </span>
                <span className="font-mono text-slate-400 tabular-nums">{progressPercent}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full bg-indigo-500 transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* Success */}
          {completedSuccess && !isProcessing && (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-950/40 border border-emerald-800/60 p-3 text-xs text-emerald-300">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
              <span>Arquivo gerado e baixado no seu dispositivo com sucesso!</span>
            </div>
          )}

          {/* Error */}
          {errorMessage && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-950/40 border border-rose-800/60 p-3 text-xs text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-800 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
          >
            Fechar
          </button>

          <button
            type="button"
            onClick={handleExport}
            disabled={isProcessing || chunks.length === 0}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-600/30 hover:bg-indigo-500 active:scale-95 transition-all disabled:opacity-50"
          >
            {isProcessing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            <span>{isProcessing ? 'Gerando Arquivo...' : 'Baixar Arquivo'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
