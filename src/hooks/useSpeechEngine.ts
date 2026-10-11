import { useCallback, useEffect, useRef, useState } from 'react';
import { NuanceType, TextChunk, VoiceOption } from '../types/tts';
import { NUANCE_PRESETS, stripNuanceTags } from '../utils/nuances';

export function useSpeechEngine() {
  const [voices, setVoices] = useState<VoiceOption[]>([]);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>('pt-BR-auto');
  const [engineMode, setEngineMode] = useState<'neural' | 'offline'>('neural');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [activeChunkIndex, setActiveChunkIndex] = useState<number>(-1);
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [hasServerGemini, setHasServerGemini] = useState<boolean>(true);
  const [isLoadingNeural, setIsLoadingNeural] = useState<boolean>(false);

  // Audio elements & timers for sequential playback
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const pauseTimerRef = useRef<number | null>(null);
  const speechUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const chunksQueueRef = useRef<TextChunk[]>([]);
  const currentIndexRef = useRef<number>(-1);
  const isPlayingRef = useRef<boolean>(false);

  // Monitor network online/offline state
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => {
      setIsOnline(false);
      setEngineMode('offline'); // auto-switch to offline mode when disconnected
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check backend health
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        setHasServerGemini(Boolean(data.hasGeminiKey));
        if (!data.hasGeminiKey) {
          setEngineMode('offline');
        }
      })
      .catch(() => {
        setHasServerGemini(false);
        setEngineMode('offline');
      });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load browser speech synthesis voices
  const refreshVoices = useCallback(() => {
    const voiceList: VoiceOption[] = [];

    // Neural Gemini Voices
    voiceList.push(
      { id: 'Kore', name: 'Kore — Estúdio Neural (Feminino / Claro)', lang: 'pt-BR / Multi', isNeural: true },
      { id: 'Puck', name: 'Puck — Estúdio Neural (Masculino / Jovem)', lang: 'pt-BR / Multi', isNeural: true },
      { id: 'Charon', name: 'Charon — Estúdio Neural (Masculino / Narrador)', lang: 'pt-BR / Multi', isNeural: true },
      { id: 'Fenrir', name: 'Fenrir — Estúdio Neural (Masculino / Imponente)', lang: 'pt-BR / Multi', isNeural: true },
      { id: 'Zephyr', name: 'Zephyr — Estúdio Neural (Feminino / Suave)', lang: 'pt-BR / Multi', isNeural: true }
    );

    // Browser local voices
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const nativeVoices = window.speechSynthesis.getVoices();
      nativeVoices.forEach((v) => {
        voiceList.push({
          id: `local-${v.name}-${v.lang}`,
          name: `${v.name} (${v.lang})`,
          lang: v.lang,
          isNativeOffline: true,
          voiceURI: v.voiceURI,
        });
      });
    }

    setVoices(voiceList);
  }, []);

  useEffect(() => {
    refreshVoices();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = refreshVoices;
    }
  }, [refreshVoices]);

  // Set intelligent initial default voice
  useEffect(() => {
    if (voices.length > 0 && selectedVoiceId === 'pt-BR-auto') {
      if (engineMode === 'neural' && hasServerGemini) {
        setSelectedVoiceId('Kore');
      } else {
        const ptVoice = voices.find(
          (v) => v.isNativeOffline && (v.lang.toLowerCase().includes('pt') || v.lang.toLowerCase().includes('por'))
        );
        setSelectedVoiceId(ptVoice ? ptVoice.id : voices[0].id);
      }
    }
  }, [voices, engineMode, hasServerGemini, selectedVoiceId]);

  // Stop everything
  const stopPlayback = useCallback(() => {
    isPlayingRef.current = false;
    setIsPlaying(false);
    setIsPaused(false);
    setActiveChunkIndex(-1);
    currentIndexRef.current = -1;

    if (pauseTimerRef.current) {
      window.clearTimeout(pauseTimerRef.current);
      pauseTimerRef.current = null;
    }

    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current.currentTime = 0;
      audioPlayerRef.current = null;
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  // Play next chunk in queue
  const playNextChunk = useCallback(
    (
      globalSpeed: number = 1.0,
      globalPitch: number = 1.0,
      globalVolume: number = 1.0
    ) => {
      if (!isPlayingRef.current) return;

      const nextIndex = currentIndexRef.current + 1;
      if (nextIndex >= chunksQueueRef.current.length) {
        stopPlayback();
        return;
      }

      currentIndexRef.current = nextIndex;
      setActiveChunkIndex(nextIndex);
      const chunk = chunksQueueRef.current[nextIndex];
      const nuanceInfo = NUANCE_PRESETS[chunk.nuance] || NUANCE_PRESETS.normal;

      // Handle pause chunk
      if (chunk.nuance === 'pause') {
        const durationMs = (chunk.pauseDurationSec || 1.0) * 1000;
        pauseTimerRef.current = window.setTimeout(() => {
          if (isPlayingRef.current) {
            playNextChunk(globalSpeed, globalPitch, globalVolume);
          }
        }, durationMs);
        return;
      }

      const cleanText = stripNuanceTags(chunk.text);
      if (!cleanText) {
        playNextChunk(globalSpeed, globalPitch, globalVolume);
        return;
      }

      // Check if we should use Neural cached audio or synthesize via API
      const useNeural = engineMode === 'neural' && hasServerGemini && isOnline;

      if (useNeural && chunk.audioBase64) {
        // Play already cached audio
        const audio = new Audio(`data:audio/wav;base64,${chunk.audioBase64}`);
        audioPlayerRef.current = audio;
        audio.playbackRate = globalSpeed;
        audio.volume = Math.max(0, Math.min(1, globalVolume * nuanceInfo.localVolume));

        audio.onended = () => {
          if (isPlayingRef.current) {
            playNextChunk(globalSpeed, globalPitch, globalVolume);
          }
        };
        audio.onerror = () => {
          // Fallback to local
          playLocalUtterance(cleanText, chunk.nuance, globalSpeed, globalPitch, globalVolume, () =>
            playNextChunk(globalSpeed, globalPitch, globalVolume)
          );
        };
        audio.play().catch(() => {
          playLocalUtterance(cleanText, chunk.nuance, globalSpeed, globalPitch, globalVolume, () =>
            playNextChunk(globalSpeed, globalPitch, globalVolume)
          );
        });
      } else if (useNeural && !chunk.audioBase64) {
        // Fetch neural on-the-fly for single chunk preview or playback
        setIsLoadingNeural(true);
        fetch('/api/tts/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: cleanText,
            voice: selectedVoiceId.startsWith('local-') ? 'Kore' : selectedVoiceId,
            style: nuanceInfo.geminiStylePrompt,
          }),
        })
          .then((res) => res.json())
          .then((data) => {
            setIsLoadingNeural(false);
            if (!isPlayingRef.current) return;
            if (data.audioBase64) {
              chunk.audioBase64 = data.audioBase64;
              const audio = new Audio(`data:audio/wav;base64,${data.audioBase64}`);
              audioPlayerRef.current = audio;
              audio.playbackRate = globalSpeed;
              audio.volume = Math.max(0, Math.min(1, globalVolume * nuanceInfo.localVolume));
              audio.onended = () => {
                if (isPlayingRef.current) {
                  playNextChunk(globalSpeed, globalPitch, globalVolume);
                }
              };
              audio.play().catch(() => {
                playLocalUtterance(cleanText, chunk.nuance, globalSpeed, globalPitch, globalVolume, () =>
                  playNextChunk(globalSpeed, globalPitch, globalVolume)
                );
              });
            } else {
              playLocalUtterance(cleanText, chunk.nuance, globalSpeed, globalPitch, globalVolume, () =>
                playNextChunk(globalSpeed, globalPitch, globalVolume)
              );
            }
          })
          .catch(() => {
            setIsLoadingNeural(false);
            playLocalUtterance(cleanText, chunk.nuance, globalSpeed, globalPitch, globalVolume, () =>
              playNextChunk(globalSpeed, globalPitch, globalVolume)
            );
          });
      } else {
        // 100% Offline Speech Synthesis
        playLocalUtterance(cleanText, chunk.nuance, globalSpeed, globalPitch, globalVolume, () => {
          if (isPlayingRef.current) {
            playNextChunk(globalSpeed, globalPitch, globalVolume);
          }
        });
      }
    },
    [engineMode, hasServerGemini, isOnline, selectedVoiceId, stopPlayback]
  );

  // Offline Web Speech API player
  const playLocalUtterance = (
    text: string,
    nuance: NuanceType,
    globalSpeed: number,
    globalPitch: number,
    globalVolume: number,
    onEnded: () => void
  ) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      onEnded();
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    speechUtteranceRef.current = utterance;

    const nuanceInfo = NUANCE_PRESETS[nuance] || NUANCE_PRESETS.normal;

    utterance.rate = Math.max(0.2, Math.min(2.0, globalSpeed * nuanceInfo.localRate));
    utterance.pitch = Math.max(0.2, Math.min(2.0, globalPitch * nuanceInfo.localPitch));
    utterance.volume = Math.max(0.0, Math.min(1.0, globalVolume * nuanceInfo.localVolume));

    // Match chosen local voice
    const rawVoices = window.speechSynthesis.getVoices();
    if (selectedVoiceId.startsWith('local-')) {
      const match = rawVoices.find((v) => `local-${v.name}-${v.lang}` === selectedVoiceId);
      if (match) utterance.voice = match;
    } else {
      // Pick best Portuguese voice if available
      const ptMatch = rawVoices.find((v) => v.lang.toLowerCase().includes('pt'));
      if (ptMatch) utterance.voice = ptMatch;
    }

    utterance.onend = () => {
      onEnded();
    };

    utterance.onerror = (e) => {
      console.warn('Erro na síntese de voz local:', e);
      onEnded();
    };

    window.speechSynthesis.speak(utterance);
  };

  // Start continuous sequential playback from startIndex
  const playAll = useCallback(
    (
      chunks: TextChunk[],
      startIndex: number = 0,
      globalSpeed: number = 1.0,
      globalPitch: number = 1.0,
      globalVolume: number = 1.0
    ) => {
      if (!chunks || chunks.length === 0) return;

      stopPlayback();
      chunksQueueRef.current = chunks;
      currentIndexRef.current = startIndex - 1;
      isPlayingRef.current = true;
      setIsPlaying(true);
      setIsPaused(false);

      playNextChunk(globalSpeed, globalPitch, globalVolume);
    },
    [stopPlayback, playNextChunk]
  );

  // Play single chunk
  const playSingleChunk = useCallback(
    (
      chunk: TextChunk,
      globalSpeed: number = 1.0,
      globalPitch: number = 1.0,
      globalVolume: number = 1.0
    ) => {
      playAll([chunk], 0, globalSpeed, globalPitch, globalVolume);
    },
    [playAll]
  );

  const pausePlayback = useCallback(() => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.pause();
    }
    setIsPaused(true);
    setIsPlaying(false);
    isPlayingRef.current = false;
  }, []);

  const resumePlayback = useCallback(
    (
      globalSpeed: number = 1.0,
      globalPitch: number = 1.0,
      globalVolume: number = 1.0
    ) => {
      if (isPaused && currentIndexRef.current >= 0) {
        isPlayingRef.current = true;
        setIsPlaying(true);
        setIsPaused(false);
        // Resume current index
        currentIndexRef.current = currentIndexRef.current - 1;
        playNextChunk(globalSpeed, globalPitch, globalVolume);
      }
    },
    [isPaused, playNextChunk]
  );

  return {
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
  };
}
