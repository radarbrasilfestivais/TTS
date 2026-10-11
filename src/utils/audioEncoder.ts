import lamejs from 'lamejs';

// Trigger download of any Blob to user's device
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

// Build a clean RIFF WAV Blob from an Int16Array of PCM samples
export function createWavBlobFromPcm(
  samples: Int16Array,
  sampleRate: number = 24000,
  numChannels: number = 1
): Blob {
  const bytesPerSample = 2; // 16-bit
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = samples.length * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  // RIFF identifier
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, 'WAVE');

  // fmt sub-chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size
  view.setUint16(20, 1, true); // AudioFormat (PCM = 1)
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true); // BitsPerSample

  // data sub-chunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  // Write 16-bit PCM samples
  let offset = 44;
  for (let i = 0; i < samples.length; i++, offset += 2) {
    view.setInt16(offset, samples[i], true);
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

// Concatenate multiple standard WAV ArrayBuffers into a single continuous WAV Blob
export function concatenateWavBuffers(buffers: ArrayBuffer[]): Blob {
  if (buffers.length === 0) return new Blob([], { type: 'audio/wav' });
  if (buffers.length === 1) return new Blob([buffers[0]], { type: 'audio/wav' });

  let totalDataLength = 0;
  let sampleRate = 24000;
  let numChannels = 1;

  const pcmParts: Uint8Array[] = [];

  for (const buf of buffers) {
    const view = new DataView(buf);
    if (buf.byteLength < 44) continue;

    // Read header parameters
    numChannels = view.getUint16(22, true);
    sampleRate = view.getUint32(24, true);

    // Look for 'data' chunk
    let dataOffset = 12;
    while (dataOffset < buf.byteLength - 8) {
      const chunkId =
        String.fromCharCode(view.getUint8(dataOffset)) +
        String.fromCharCode(view.getUint8(dataOffset + 1)) +
        String.fromCharCode(view.getUint8(dataOffset + 2)) +
        String.fromCharCode(view.getUint8(dataOffset + 3));
      const chunkSize = view.getUint32(dataOffset + 4, true);

      if (chunkId === 'data') {
        const pcmData = new Uint8Array(buf, dataOffset + 8, Math.min(chunkSize, buf.byteLength - (dataOffset + 8)));
        pcmParts.push(pcmData);
        totalDataLength += pcmData.byteLength;
        break;
      }
      dataOffset += 8 + chunkSize;
    }
  }

  // Construct master WAV header
  const header = new ArrayBuffer(44);
  const view = new DataView(header);
  const byteRate = (sampleRate * numChannels * 16) / 8;
  const blockAlign = (numChannels * 16) / 8;

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + totalDataLength, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, 'data');
  view.setUint32(40, totalDataLength, true);

  return new Blob([header, ...(pcmParts as unknown as BlobPart[])], { type: 'audio/wav' });
}

// Convert a WAV ArrayBuffer to an MP3 Blob using lamejs
export async function convertWavToMp3(
  wavBuffer: ArrayBuffer,
  bitrateKbps: number = 192
): Promise<Blob> {
  const view = new DataView(wavBuffer);
  const channels = view.getUint16(22, true) || 1;
  const sampleRate = view.getUint32(24, true) || 24000;

  // Find data offset
  let dataOffset = 44;
  for (let i = 12; i < wavBuffer.byteLength - 8; i++) {
    if (
      view.getUint8(i) === 0x64 && // 'd'
      view.getUint8(i + 1) === 0x61 && // 'a'
      view.getUint8(i + 2) === 0x74 && // 't'
      view.getUint8(i + 3) === 0x61 // 'a'
    ) {
      dataOffset = i + 8;
      break;
    }
  }

  const pcmBytes = new Int16Array(
    wavBuffer.slice(dataOffset, dataOffset + (wavBuffer.byteLength - dataOffset))
  );

  const mp3encoder = new lamejs.Mp3Encoder(channels, sampleRate, bitrateKbps);
  const mp3Data: Uint8Array[] = [];

  const sampleBlockSize = 1152;
  for (let i = 0; i < pcmBytes.length; i += sampleBlockSize) {
    const chunk = pcmBytes.subarray(i, i + sampleBlockSize);
    const mp3buf = mp3encoder.encodeBuffer(chunk);
    if (mp3buf.length > 0) {
      mp3Data.push(new Uint8Array(mp3buf));
    }
  }

  const mp3End = mp3encoder.flush();
  if (mp3End.length > 0) {
    mp3Data.push(new Uint8Array(mp3End));
  }

  return new Blob(mp3Data as BlobPart[], { type: 'audio/mp3' });
}

// Generate silence buffer of specified duration
export function generateSilencePcm(durationSec: number, sampleRate: number = 24000): Int16Array {
  const sampleCount = Math.floor(durationSec * sampleRate);
  return new Int16Array(sampleCount);
}

// Synthesize an offline vocal-like preview audio buffer using Web Audio API Formant Synthesis
// Allows generating real downloadable audio even 100% offline without any server!
export async function synthesizeOfflineAudioBuffer(
  text: string,
  nuance: string,
  rate: number = 1.0,
  pitch: number = 1.0
): Promise<Blob> {
  const words = text.trim().split(/\s+/);
  const durationSec = Math.max(0.8, (words.length / 2.2) / rate);
  const sampleRate = 24000;
  const offlineCtx = new OfflineAudioContext(1, Math.floor(sampleRate * durationSec), sampleRate);

  // Base fundamental frequency (F0)
  let baseFreq = 160 * pitch;
  if (nuance === 'dramatic') baseFreq = 110 * pitch;
  if (nuance === 'whisper') baseFreq = 140 * pitch;
  if (nuance === 'excited') baseFreq = 220 * pitch;

  // Formant filters for human vocal tract simulation
  const carrier = offlineCtx.createOscillator();
  carrier.type = nuance === 'robotic' ? 'sawtooth' : 'triangle';
  carrier.frequency.setValueAtTime(baseFreq, 0);

  // Subtle pitch vibrato/prosody
  carrier.frequency.exponentialRampToValueAtTime(baseFreq * 1.05, durationSec * 0.3);
  carrier.frequency.linearRampToValueAtTime(baseFreq * 0.95, durationSec * 0.8);
  carrier.frequency.linearRampToValueAtTime(baseFreq * 0.88, durationSec);

  // Vocal formant filter (F1 ~ 700Hz vowel resonance)
  const f1 = offlineCtx.createBiquadFilter();
  f1.type = 'bandpass';
  f1.frequency.setValueAtTime(700, 0);
  f1.Q.setValueAtTime(4.0, 0);

  // Vocal formant filter (F2 ~ 1800Hz vowel resonance)
  const f2 = offlineCtx.createBiquadFilter();
  f2.type = 'bandpass';
  f2.frequency.setValueAtTime(1800, 0);
  f2.Q.setValueAtTime(3.5, 0);

  // Whisper noise / breathiness generator
  let whisperNode: AudioNode | null = null;
  if (nuance === 'whisper') {
    const bufferSize = sampleRate * durationSec;
    const noiseBuffer = offlineCtx.createBuffer(1, bufferSize, sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    const whiteNoise = offlineCtx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    const noiseFilter = offlineCtx.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.setValueAtTime(1200, 0);
    whiteNoise.connect(noiseFilter);
    whisperNode = noiseFilter;
    whiteNoise.start(0);
  }

  // Amplitude envelope (words cadence)
  const gainNode = offlineCtx.createGain();
  gainNode.gain.setValueAtTime(0.001, 0);

  // Simulate syllables envelope
  const syllableCount = Math.max(2, Math.round(words.length * 2.5));
  const syllableDuration = durationSec / syllableCount;
  for (let s = 0; s < syllableCount; s++) {
    const tStart = s * syllableDuration;
    const tPeak = tStart + syllableDuration * 0.35;
    const tEnd = tStart + syllableDuration * 0.9;
    const peakGain = nuance === 'whisper' ? 0.25 : nuance === 'strong' ? 0.95 : 0.6;
    gainNode.gain.linearRampToValueAtTime(peakGain, tPeak);
    gainNode.gain.linearRampToValueAtTime(0.05, tEnd);
  }
  gainNode.gain.linearRampToValueAtTime(0.001, durationSec);

  carrier.connect(f1);
  carrier.connect(f2);
  f1.connect(gainNode);
  f2.connect(gainNode);

  if (whisperNode) {
    whisperNode.connect(gainNode);
  }

  gainNode.connect(offlineCtx.destination);
  carrier.start(0);
  carrier.stop(durationSec);

  const renderedBuffer = await offlineCtx.startRendering();
  const channelData = renderedBuffer.getChannelData(0);
  const pcm16 = new Int16Array(channelData.length);
  for (let i = 0; i < channelData.length; i++) {
    const s = Math.max(-1, Math.min(1, channelData[i]));
    pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }

  return createWavBlobFromPcm(pcm16, sampleRate, 1);
}
