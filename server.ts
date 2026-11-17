import 'dotenv/config';
import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;

const ANTHROPIC_MODEL_MAP: Record<string, string> = {
  'claude-3-7-sonnet': 'claude-3-7-sonnet-20250219',
  'claude-3-5-haiku': 'claude-3-5-haiku-20241022',
};

const GEMINI_MODEL_MAP: Record<string, string> = {
  'gemini-2.5-flash': 'gemini-4-hydrogen',
  'gemini-2.5-pro': 'gemini-4-hydrogen',
  'gemini-2.0-flash': 'gemini-4-hydrogen',
  'gemini-2.0-pro': 'gemini-4-hydrogen',
  'gemini-1.5-flash': 'gemini-4-hydrogen',
  'gemini-1.5-pro': 'gemini-4-hydrogen',
};

interface GenerateRequestBody {
  provider: 'gemini' | 'anthropic' | 'openai';
  model: string;
  apiKey?: string;
  systemPrompt: string;
  userPrompt: string;
}

interface GenerateImageBody {
  prompt: string;
  apiKey?: string;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '15mb' }));

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      ok: true,
      hasServerGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    });
  });

  app.post('/api/generate', async (req: Request, res: Response) => {
    try {
      const { provider, model, apiKey, systemPrompt, userPrompt } =
        req.body as GenerateRequestBody;

      if (!provider || !model || !userPrompt) {
        return res.status(400).json({
          error: 'Parameter provider, model, dan userPrompt wajib diisi.',
        });
      }

      if (provider === 'gemini') {
        const effectiveKey = (apiKey || '').trim() || process.env.GEMINI_API_KEY;
        if (!effectiveKey) {
          return res.status(401).json({
            error:
              'API Key Google Gemini belum dikonfigurasi. Silakan masukkan API Key di Pengaturan API.',
          });
        }

        const resolvedModel = GEMINI_MODEL_MAP[model] || model;

        const ai = new GoogleGenAI({
          apiKey: effectiveKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            },
          },
        });

        const response = await ai.models.generateContent({
          model: resolvedModel,
          contents: userPrompt,
          config: {
            systemInstruction: systemPrompt,
            responseMimeType: 'application/json',
          },
        });

        const rawText = response.text ?? '';
        if (!rawText.trim()) {
          return res.status(502).json({
            error: 'Model Gemini mengembalikan respons kosong.',
          });
        }

        return res.json({ rawText, provider, model: resolvedModel });
      }

      if (provider === 'anthropic') {
        const effectiveKey = (apiKey || '').trim();
        if (!effectiveKey) {
          return res.status(401).json({
            error:
              'API Key Anthropic Claude wajib diisi pada panel Pengaturan API.',
          });
        }

        const resolvedModel = ANTHROPIC_MODEL_MAP[model] || model;
        const upstream = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': effectiveKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: resolvedModel,
            max_tokens: 8192,
            system: systemPrompt,
            messages: [{ role: 'user', content: userPrompt }],
          }),
        });

        const data = (await upstream.json()) as {
          content?: Array<{ type: string; text?: string }>;
          error?: { message?: string; type?: string };
        };

        if (!upstream.ok) {
          return res.status(upstream.status).json({
            error:
              data?.error?.message ||
              `Anthropic API error (${upstream.status})`,
          });
        }

        const rawText =
          data.content
            ?.filter((c) => c.type === 'text' && c.text)
            .map((c) => c.text)
            .join('\n') || '';

        if (!rawText.trim()) {
          return res.status(502).json({
            error: 'Model Claude mengembalikan respons kosong.',
          });
        }

        return res.json({ rawText, provider, model: resolvedModel });
      }

      if (provider === 'openai') {
        const effectiveKey = (apiKey || '').trim();
        if (!effectiveKey) {
          return res.status(401).json({
            error:
              'API Key OpenAI ChatGPT wajib diisi pada panel Pengaturan API.',
          });
        }

        const upstream = await fetch(
          'https://api.openai.com/v1/chat/completions',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${effectiveKey}`,
            },
            body: JSON.stringify({
              model,
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
              ],
              temperature: 0.7,
            }),
          }
        );

        const data = (await upstream.json()) as {
          choices?: Array<{ message?: { content?: string } }>;
          error?: { message?: string };
        };

        if (!upstream.ok) {
          return res.status(upstream.status).json({
            error:
              data?.error?.message || `OpenAI API error (${upstream.status})`,
          });
        }

        const rawText = data.choices?.[0]?.message?.content || '';
        if (!rawText.trim()) {
          return res.status(502).json({
            error: 'Model OpenAI mengembalikan respons kosong.',
          });
        }

        return res.json({ rawText, provider, model });
      }

      return res.status(400).json({ error: 'Penyedia AI tidak dikenali.' });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Terjadi kesalahan pada server AI.';
      const statusCode =
        message.includes('429') || message.toLowerCase().includes('quota')
          ? 429
          : 500;
      return res.status(statusCode).json({ error: message });
    }
  });

  app.post('/api/generate-image', async (req: Request, res: Response) => {
    try {
      const { prompt, apiKey } = req.body as GenerateImageBody;
      const effectiveKey = (apiKey || '').trim() || process.env.GEMINI_API_KEY;

      if (!effectiveKey) {
        return res.status(401).json({
          error: 'API Key Gemini diperlukan untuk menghasilkan ilustrasi AI.',
        });
      }

      if (!prompt?.trim()) {
        return res.status(400).json({ error: 'Deskripsi gambar kosong.' });
      }

      const ai = new GoogleGenAI({
        apiKey: effectiveKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite-image',
        contents: `Clean educational textbook diagram or illustration without messy watermarks, crisp lines, bright clear background, suitable for Indonesian school assessment exam paper: ${prompt}`,
      });

      const parts = response.candidates?.[0]?.content?.parts || [];
      for (const part of parts) {
        if (part.inlineData?.data && part.inlineData?.mimeType) {
          const dataUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          return res.json({ dataUrl });
        }
      }

      return res.status(502).json({
        error: 'Tidak ada data gambar yang dikembalikan oleh model.',
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Gagal membuat ilustrasi gambar.';
      return res.status(500).json({ error: message });
    }
  });

  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
