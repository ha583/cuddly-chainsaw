import * as groqProvider from './providers/groqProvider';
import * as indianAIProvider from './providers/indianAIProvider';
import * as openRouterProvider from './providers/openRouterProvider';

import type { AIModel, WebSearchResults } from '../../src/services/types';

// Available AI providers with their models
export const providers = [
  { 
    id: 'groq', 
    name: 'Groq',
    models: [
      { id: 'llama3-70b-8192', name: 'Llama-3 70B' },
      { id: 'llama3-8b-8192', name: 'Llama-3 8B' },
      { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B' }
    ]
  },
  { 
    id: 'indianAI', 
    name: 'Indian AI',
    models: [
      { id: 'HelpingAI2.5-10B', name: 'HelpingAI2.5-10B' },
     
    ]
  },
  { 
    id: 'openrouter', 
    name: 'OpenRouter',
    models: [
      { id: 'qwen/qwen-vl-plus:free', name: 'qwen/qwen-vl-plus:free' },
    
    ]
  }
];

// Function to get the provider module based on provider ID
function getProviderModule(providerId: string) {
  switch (providerId) {
    case 'groq':
      return groqProvider;
    case 'indianAI':
      return indianAIProvider;
    case 'openrouter':
      return openRouterProvider;
    default:
      return openRouterProvider; // Default to OpenRouter
  }
}

// Function to fetch models for a specific provider
export async function fetchModels(providerId: string): Promise<{ data: AIModel[] }> {
  try {
    const provider = getProviderModule(providerId);
    return await provider.fetchModels();
  } catch (error) {
    console.error(`Error fetching models for ${providerId}:`, error);
    
    // Fall back to static model list if API fails
    const providerData = providers.find(p => p.id === providerId);
    if (providerData) {
      return { 
        data: providerData.models.map(m => ({
          id: m.id,
          name: m.name,
          description: `${providerData.name} language model`,
          context_length: 4096,
          pricing: {
            prompt: 'Variable',
            completion: 'Variable'
          }
        }))
      };
    }
    
    throw error;
  }
}

// Default models for each provider
const DEFAULT_MODELS: Record<string, string> = {
  'groq': 'llama3-70b-8192',
  'indianAI': 'HelpingAI2.5-10B',
  'openrouter': 'qwen/qwen-vl-plus:free'
};

// Get default model for a provider
export function getDefaultModel(providerId: string): string {
  
  return DEFAULT_MODELS[providerId] || 
         providers.find(p => p.id === providerId)?.models[0]?.id || 
         'qwen/qwen-vl-plus:free';
}

// Function to get models for a specific provider
export function getModelsForProvider(providerId: string) {
  const provider = providers.find(p => p.id === providerId);
  return provider ? provider.models : [];
}

// Unified send message function
export async function sendMessage(
  provider: string,
  model: string,
  messages: Array<{ role: string; content: string }>,
  abortController?: AbortController,
  onStream?: (chunk: string) => void,
  webSearchResults?: string
): Promise<{ content: string }> {
  const providerModule = getProviderModule(provider);
  return providerModule.sendMessage(model, messages, abortController, onStream, webSearchResults);
}

// Unified web search function
export async function searchWeb(query: string): Promise<WebSearchResults> {
  // We'll use OpenRouter's implementation for all providers to keep it simple
  return openRouterProvider.searchWeb(query);
}
