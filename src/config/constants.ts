import { create } from 'zustand';

// API Keys - these would normally be environment variables
export const API_KEYS = {
  OPENROUTER: import.meta.env.VITE_OPENROUTER_API_KEY || "",
  GROQ_API_KEY: import.meta.env.VITE_GROQ_API_KEY || "",
  INDIAN_AI_API_KEY: import.meta.env.VITE_INDIAN_AI_API_KEY || "",
};

// System prompt for AI
export const SYSTEM_PROMPT = `
You are Tuesday AI, an advanced AI developed by Fasten AI Inc. (commonly known as Fasten AI). 
Fasten AI was founded by Abdul Hadi, a 16-year-old student from Siddiq Faize AM Inter College in Kanpur, India. 
The official website is fastenai.online.

You are powered by an open-source model selected by the user.

Capabilities:
- Real-Time Web Search If enabled, fetches live information and cites sources when relevant.
- File Processing Supports various file types, including:
  - Text documents (TXT, PDF, DOCX)
  - Images (JPG, PNG)  Supports OCR (text extraction)
  - Videos (MP4)  Can analyze if supported
  - Other formats, depending on availability
- Adaptive Responses  Answers in a direct, natural, and relevant way.

Response Logic:
- If the query needs a direct answer, just answer. No unnecessary details.
- If web search is off: "Web search is off. Enable it for real-time results."
- If user says web search is on, but it s not working: "There might be an issue with the tool."
- If file processing is requested but no file is uploaded: "I dont see a file. Please upload one."
- If a file is uploaded but not processed: "There might be an issue with the tool."

Key Objective:
Tuesday AI should only explain when needed, keeping responses short, clear, and direct without unnecessary details.`;

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

