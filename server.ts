import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '50mb' }));

// Helper to initialize GoogleGenAI with proper telemetry headers
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY não configurada no servidor.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// API: Check status & engine availability
app.get('/api/health', (req: Request, res: Response) => {
  const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY);
  res.json({
    status: 'ok',
    hasGeminiKey,
    supportedVoices: [
      { id: 'Kore', name: 'Kore (Voz Feminina Natural / Clara)', gender: 'Feminino' },
      { id: 'Puck', name: 'Puck (Voz Jovem / Dinâmica)', gender: 'Masculino' },
      { id: 'Charon', name: 'Charon (Voz Profunda / Narrador)', gender: 'Masculino' },
      { id: 'Fenrir', name: 'Fenrir (Voz Imponente / Séria)', gender: 'Masculino' },
      { id: 'Zephyr', name: 'Zephyr (Voz Suave / Equilibrada)', gender: 'Feminino' },
    ],
  });
});

// API: Generate speech for a single segment with nuanced style
app.post('/api/tts/generate', async (req: Request, res: Response) => {
  try {
    const { text, voice = 'Kore', style = '' } = req.body;

    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'Texto não fornecido ou vazio.' });
    }

    const ai = getGeminiClient();

    // Map style instructions into natural voice prompt directives
    const speechPart: { text: string; speechMetadata?: { style?: string } } = {
      text: text.trim(),
    };

    if (style && typeof style === 'string' && style.trim()) {
      speechPart.speechMetadata = {
        style: style.trim(),
      };
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [speechPart],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice },
          },
        },
      },
    });

    const candidate = response.candidates?.[0];
    const audioPart = candidate?.content?.parts?.find(
      (part: any) => part.inlineData && part.inlineData.data
    );

    const base64Audio = audioPart?.inlineData?.data;

    if (!base64Audio) {
      return res.status(502).json({
        error: 'Nenhum áudio gerado pelo modelo neural.',
      });
    }

    return res.json({
      success: true,
      audioBase64: base64Audio,
      mimeType: audioPart?.inlineData?.mimeType || 'audio/wav',
    });
  } catch (error: any) {
    console.error('Erro na rota /api/tts/generate:', error);
    return res.status(500).json({
      error: error?.message || 'Falha ao processar síntese de voz neural.',
    });
  }
});

// Helper to concatenate raw PCM from multiple 24kHz 16-bit mono WAV files
function concatenateWavBuffers(wavBuffers: Buffer[]): Buffer {
  if (wavBuffers.length === 0) return Buffer.alloc(0);
  if (wavBuffers.length === 1) return wavBuffers[0];

  // Extract PCM data after 44-byte standard header
  const pcmChunks: Buffer[] = [];
  for (const buf of wavBuffers) {
    if (buf.length > 44) {
      pcmChunks.push(buf.subarray(44));
    }
  }

  const combinedPcm = Buffer.concat(pcmChunks);
  const sampleRate = 24000;
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = combinedPcm.length;
  const fileSize = 36 + dataSize;

  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(fileSize, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16); // Subchunk1Size
  header.writeUInt16LE(1, 20); // PCM audio format
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write('data', 36);
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, combinedPcm]);
}

// API: Batch synthesis for unlimited long texts (multiple chunks)
app.post('/api/tts/batch', async (req: Request, res: Response) => {
  try {
    const { chunks, voice = 'Kore' } = req.body;

    if (!Array.isArray(chunks) || chunks.length === 0) {
      return res.status(400).json({ error: 'Nenhum segmento fornecido.' });
    }

    const ai = getGeminiClient();
    const results: Array<{ id: string; text: string; audioBase64: string; durationEst?: number }> = [];
    const wavBuffers: Buffer[] = [];

    // Process chunks sequentially to respect rate limits
    for (const chunk of chunks) {
      const text = chunk.text?.trim();
      if (!text) continue;

      const speechPart: { text: string; speechMetadata?: { style?: string } } = {
        text,
      };

      if (chunk.style && typeof chunk.style === 'string' && chunk.style.trim()) {
        speechPart.speechMetadata = {
          style: chunk.style.trim(),
        };
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash-lite-tts',
        contents: [
          {
            role: 'user',
            parts: [speechPart],
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: chunk.voice || voice },
            },
          },
        },
      });

      const candidate = response.candidates?.[0];
      const audioPart = candidate?.content?.parts?.find(
        (part: any) => part.inlineData && part.inlineData.data
      );

      const base64Audio = audioPart?.inlineData?.data;
      if (base64Audio) {
        results.push({
          id: chunk.id,
          text,
          audioBase64: base64Audio,
        });
        wavBuffers.push(Buffer.from(base64Audio, 'base64'));
      }
    }

    let mergedWavBase64 = '';
    if (wavBuffers.length > 0) {
      const mergedBuffer = concatenateWavBuffers(wavBuffers);
      mergedWavBase64 = mergedBuffer.toString('base64');
    }

    return res.json({
      success: true,
      chunksProcessed: results.length,
      chunks: results,
      masterAudioBase64: mergedWavBase64,
      mimeType: 'audio/wav',
    });
  } catch (error: any) {
    console.error('Erro na rota /api/tts/batch:', error);
    return res.status(500).json({
      error: error?.message || 'Falha ao processar lote de áudio.',
    });
  }
});

async function startServer() {
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (req: Request, res: Response) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`VozCraft Studio rodando na porta ${PORT}`);
  });
}

startServer();
