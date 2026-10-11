import { TextChunk } from '../types/tts';
import { stripNuanceTags } from './nuances';

function formatSrtTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const millis = Math.floor((totalSeconds % 1) * 1000);

  const pad = (n: number, z = 2) => String(n).padStart(z, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)},${pad(millis, 3)}`;
}

export function generateSrtContent(chunks: TextChunk[]): string {
  let currentTime = 0;
  let srtIndex = 1;
  const srtEntries: string[] = [];

  for (const chunk of chunks) {
    const duration = chunk.pauseDurationSec || chunk.estimatedDurationSec || 2.0;
    const startTime = currentTime;
    const endTime = currentTime + duration;
    currentTime = endTime;

    // Skip pause-only blocks in subtitles
    if (chunk.nuance === 'pause') {
      continue;
    }

    const cleanText = stripNuanceTags(chunk.text);
    if (!cleanText) continue;

    srtEntries.push(
      `${srtIndex}\n${formatSrtTime(startTime)} --> ${formatSrtTime(endTime)}\n${cleanText}\n`
    );
    srtIndex++;
  }

  return srtEntries.join('\n');
}
