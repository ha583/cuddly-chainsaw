
import { API_KEYS, ANALYSIS_PROMPTS, useAnalysisStore } from '../config/constants';

export interface ProcessedDocument {
  content: string;
  metadata: {
    wordCount: number;
    fileType: string;
    processingMethod: string;
    fileSize: number;
    url?: string;
    chunks?: string[];
    embedding?: number[];
    pageCount?: number;
    author?: string;
    createdAt?: string;
    modifiedAt?: string;
    title?: string;
    language?: string;
    properties?: Record<string, unknown>;
  };
}

export async function processDocument(file: File, userQuery?: string): Promise<ProcessedDocument> {
  if (!file) throw new Error('No file provided');

  const fileType = file.type.toLowerCase();
  let content = '';
  let metadata: ProcessedDocument['metadata'] = {
    wordCount: 0,
    fileType,
    processingMethod: '',
    fileSize: file.size
  };

  try {
    if (fileType.startsWith('image/')) {
      // For image files, use vision processing
      content = await processImage(file, userQuery);
      metadata.processingMethod = 'vision';
    } else {
      // For text documents, PDFs, etc.
      switch (fileType) {
        case 'application/pdf':
          content = await processPDF(file);
          metadata.processingMethod = 'pdf';
          break;

        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
          content = await processDocx(file);
          metadata.processingMethod = 'docx';
          break;

        default:
          content = await file.text();
          metadata.processingMethod = 'text';
      }
    }

    if (content.trim() === '') {
      throw new Error('No content could be extracted from the document');
    }

    // If this is a text document (not an image), analyze it with AI
    if (!fileType.startsWith('image/')) {
      const analysis = await analyzeWithAI(content, userQuery);
      useAnalysisStore.getState().setDocumentAnalysis(analysis);
    }

    return {
      content,
      metadata: {
        ...metadata,
        wordCount: content.split(/\s+/).filter(Boolean).length
      }
    };
  } catch (error) {
    console.error('Error processing document:', error);
    throw error instanceof Error 
      ? error 
      : new Error('Unknown error processing document');
  }
}

async function processImage(file: File, userQuery?: string): Promise<string> {
  if (!API_KEYS.GROQ_API_KEY) {
    throw new Error('No API key available for image processing');
  }

  try {
    // Convert image to base64
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    // Call Groq API with vision model
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEYS.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.2-11b-vision-preview',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: userQuery || ANALYSIS_PROMPTS.VISION },
              {
                type: 'image_url',
                image_url: { url: base64 }
              }
            ]
          }
        ],
        max_tokens: 1024
      })
    });

    if (!response.ok) {
      throw new Error(`Image processing failed: ${response.statusText}`);
    }

    const data = await response.json();
    const analysis = data.choices[0].message.content;
    
    // Store the analysis in the store
    useAnalysisStore.getState().setVisionAnalysis(analysis);
    
    return analysis;
  } catch (error) {
    console.error('Error processing image:', error);
    throw new Error('Failed to process image');
  }
}

async function processPDF(file: File): Promise<string> {
  // Simulated PDF processing
  return `PDF content extracted from ${file.name}. This is a placeholder for actual PDF processing which would typically use pdf.js or a similar library.`;
}

async function processDocx(file: File): Promise<string> {
  // Simulated DOCX processing
  return `DOCX content extracted from ${file.name}. This is a placeholder for actual DOCX processing which would typically use a library like mammoth.`;
}

export async function analyzeWithAI(content: string, query: string | null = null): Promise<string> {
  try {
    if (!API_KEYS.GROQ_API_KEY) {
      throw new Error('No API key available for document analysis');
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEYS.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-specdec',
        messages: [
          { role: 'system', content: 'You are a document analysis assistant. Extract key information and insights from the provided document.' },
          { 
            role: 'user', 
            content: query 
              ? `Based on the document content:\n\n${content}\n\nUser Query: ${query}`
              : `${ANALYSIS_PROMPTS.DOCUMENT}\n\n${content}`
          }
        ],
        max_tokens: 2048
      })
    });

    if (!response.ok) {
      throw new Error(`Document analysis failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error in analyzeWithAI:', error);
    return 'Failed to analyze document content.';
  }
}
