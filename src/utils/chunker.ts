import { NuanceType, TextChunk } from '../types/tts';
import { NUANCE_TAG_MAPPING } from './nuances';

// Estimate duration based on average Portuguese reading pace (~130 words per minute / 14 characters per second)
export function estimateDuration(text: string, rate: number = 1.0): number {
  if (!text || !text.trim()) return 0;
  const words = text.trim().split(/\s+/).length;
  // ~130 WPM = ~2.16 words per second
  const baseSeconds = words / 2.16;
  const adjusted = baseSeconds / (rate || 1.0);
  return Math.max(0.6, Math.round(adjusted * 10) / 10);
}

// Split text into intelligent chunks respecting nuance tags and punctuation
export function parseTextIntoChunks(rawText: string, defaultNuance: NuanceType = 'normal'): TextChunk[] {
  if (!rawText || !rawText.trim()) return [];

  const chunks: TextChunk[] = [];
  let chunkIndex = 0;

  // Regex to match nuance tags: [tag]content[/tag] OR [pausa: Xs]
  const tagRegex = /\[(sussurro|whisper|sussurrando|forte|strong|loud|enfase|ênfase|emphasis|calmo|calm|suave|alegre|excited|animado|dramatico|dramático|dramatic|rapido|rápido|fast|robo|robô|robotic)\]([\s\S]*?)\[\/\1\]|\[pausa:?\s*(\d+(\.\d+)?)s?\]/gi;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tagRegex.exec(rawText)) !== null) {
    const preText = rawText.substring(lastIndex, match.index);
    if (preText && preText.trim()) {
      addSentenceChunks(preText, defaultNuance, chunks, () => `chk-${++chunkIndex}`);
    }

    if (match[3] !== undefined) {
      // It's a pause tag: [pausa: 1.5s]
      const pauseDuration = parseFloat(match[3]) || 1.0;
      chunks.push({
        id: `chk-${++chunkIndex}`,
        text: `[Pausa de ${pauseDuration}s]`,
        nuance: 'pause',
        pauseDurationSec: pauseDuration,
        charCount: 0,
        wordCount: 0,
        estimatedDurationSec: pauseDuration,
        status: 'idle',
      });
    } else if (match[1] && match[2] !== undefined) {
      // It's a paired nuance tag: [forte]texto[/forte]
      const rawTag = match[1].toLowerCase();
      const nuanceType: NuanceType = NUANCE_TAG_MAPPING[rawTag] || defaultNuance;
      const tagContent = match[2];

      if (tagContent && tagContent.trim()) {
        addSentenceChunks(tagContent, nuanceType, chunks, () => `chk-${++chunkIndex}`);
      }
    }

    lastIndex = tagRegex.lastIndex;
  }

  // Handle remaining text after last match
  const remainingText = rawText.substring(lastIndex);
  if (remainingText && remainingText.trim()) {
    addSentenceChunks(remainingText, defaultNuance, chunks, () => `chk-${++chunkIndex}`);
  }

  return chunks;
}

// Sub-split untagged or tagged text into natural sentences to avoid TTS buffer overflow
function addSentenceChunks(
  textBlock: string,
  nuance: NuanceType,
  outChunks: TextChunk[],
  idGen: () => string
) {
  // Clean whitespace without breaking paragraphs
  const paragraphs = textBlock.split(/\n\s*\n+/);

  for (const paragraph of paragraphs) {
    const trimmedPara = paragraph.trim();
    if (!trimmedPara) continue;

    // Split by sentence boundaries (. ! ? ; or linebreaks)
    // Positive lookbehind for sentence punctuation
    const sentences = trimmedPara
      .replace(/([.!?…]+)\s+/g, '$1\n')
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    for (let sentence of sentences) {
      // If a sentence is unusually long (> 300 chars), further break by clauses or commas
      if (sentence.length > 300) {
        const clauses = sentence.split(/([,;:]\s+)/);
        let accumulated = '';
        for (const clause of clauses) {
          if (accumulated.length + clause.length > 250 && accumulated.trim()) {
            pushSingleChunk(accumulated.trim(), nuance, outChunks, idGen);
            accumulated = clause;
          } else {
            accumulated += clause;
          }
        }
        if (accumulated.trim()) {
          pushSingleChunk(accumulated.trim(), nuance, outChunks, idGen);
        }
      } else {
        pushSingleChunk(sentence, nuance, outChunks, idGen);
      }
    }
  }
}

function pushSingleChunk(
  text: string,
  nuance: NuanceType,
  outChunks: TextChunk[],
  idGen: () => string
) {
  if (!text || !text.trim()) return;
  const wordCount = text.trim().split(/\s+/).length;
  outChunks.push({
    id: idGen(),
    text: text.trim(),
    nuance,
    charCount: text.length,
    wordCount,
    estimatedDurationSec: estimateDuration(text),
    status: 'idle',
  });
}

// Compute total script metadata
export function computeScriptStats(text: string, chunks: TextChunk[]) {
  const charCount = text.length;
  const wordCount = text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0;
  const totalDurationSec = chunks.reduce(
    (acc, curr) => acc + (curr.pauseDurationSec || curr.estimatedDurationSec),
    0
  );

  const minutes = Math.floor(totalDurationSec / 60);
  const seconds = Math.floor(totalDurationSec % 60);
  const formattedDuration = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return {
    charCount,
    wordCount,
    totalDurationSec,
    formattedDuration,
    chunksCount: chunks.length,
  };
}
