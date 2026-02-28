/// <reference types="vite/client" />

interface PuterAI {
  txt2img(prompt: string, options?: { model?: string }): Promise<HTMLImageElement>;
  chat(prompt: string, options?: { model?: string }): Promise<{ message: { content: string } }>;
}

interface Puter {
  ai: PuterAI;
}

interface Window {
  puter?: Puter;
}
