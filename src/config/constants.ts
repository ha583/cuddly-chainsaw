
import { create } from 'zustand';

// API Keys - these would normally be environment variables
export const API_KEYS = {
  OPENROUTER: import.meta.env.VITE_OPENROUTER_API_KEY || "",
  GROQ_API_KEY: import.meta.env.VITE_GROQ_API_KEY || "",
  INDIAN_AI_API_KEY: import.meta.env.VITE_INDIAN_AI_API_KEY || "",
};



// System prompt for AI
export const SYSTEM_PROMPT = `You are Tuesday AI, a helpful AI assistant with real-time search capabilities and document analysis abilities using our AI tools. When providing information, please be clear and accurate.`;

// Analysis prompts
export const ANALYSIS_PROMPTS = {
  VISION: 'Analyze this image in detail. Describe what you see, including any text, objects, people, colors, and composition.',
  DOCUMENT: 'Analyze this document thoroughly. Extract key information, main points, and important details.',
  FOLLOW_UP: 'Based on the analysis, please provide additional insights or answer specific questions.'
} as const;

// Analysis context store
interface AnalysisState {
  visionAnalysis: string | null;
  documentAnalysis: string | null;
  metadata: Record<string, unknown>;
  setVisionAnalysis: (analysis: string | null) => void;
  setDocumentAnalysis: (analysis: string | null) => void;
  setMetadata: (metadata: Record<string, unknown>) => void;
  clear: () => void;
}

export const useAnalysisStore = create<AnalysisState>((set) => ({
  visionAnalysis: null,
  documentAnalysis: null,
  metadata: {},
  setVisionAnalysis: (analysis) => set({ visionAnalysis: analysis }),
  setDocumentAnalysis: (analysis) => set({ documentAnalysis: analysis }),
  setMetadata: (metadata) => set({ metadata }),
  clear: () => set({ visionAnalysis: null, documentAnalysis: null, metadata: {} })
}));
