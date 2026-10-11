export type NuanceType =
  | 'normal'
  | 'whisper'      // Sussurrando
  | 'strong'       // Falar forte / imponente
  | 'emphasis'     // Ênfase destacada
  | 'calm'         // Calmo e suave
  | 'excited'      // Entusiasmado e alegre
  | 'dramatic'     // Dramático e solene
  | 'fast'         // Apressado / rápido
  | 'robotic'      // Sintético / robótico
  | 'pause';       // Pausa silenciosa

export interface NuancePreset {
  id: NuanceType;
  label: string;
  shortLabel: string;
  tag: string;
  iconName: string;
  description: string;
  // Browser SpeechSynthesis parameters
  localPitch: number;   // 0.1 to 2.0 (1.0 = normal)
  localRate: number;    // 0.1 to 2.0 (1.0 = normal)
  localVolume: number;  // 0.0 to 1.0 (1.0 = normal)
  // Gemini TTS instruction prompt
  geminiStylePrompt: string;
  colorClass: string;
  bgClass: string;
  borderClass: string;
}

export interface TextChunk {
  id: string;
  text: string;
  nuance: NuanceType;
  pauseDurationSec?: number; // for pause nuance
  charCount: number;
  wordCount: number;
  estimatedDurationSec: number;
  audioBase64?: string; // cached WAV from neural engine if generated
  audioUrl?: string;
  status: 'idle' | 'generating' | 'ready' | 'playing' | 'error';
}

export interface VoiceOption {
  id: string;
  name: string;
  lang: string;
  gender?: string;
  isNeural?: boolean;
  isNativeOffline?: boolean;
  voiceURI?: string;
}

export interface ProjectDraft {
  id: string;
  title: string;
  content: string;
  voiceId: string;
  engineMode: 'neural' | 'offline';
  globalSpeed: number;
  globalPitch: number;
  globalVolume: number;
  updatedAt: number;
  createdAt: number;
  wordCount: number;
  charCount: number;
}

export type ExportFormat = 'wav' | 'mp3' | 'webm' | 'srt' | 'json';
