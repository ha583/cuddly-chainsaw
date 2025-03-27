
import { API_KEYS, SYSTEM_PROMPT, useAnalysisStore } from '../../config/constants';
import type { AIModel, WebSearchResults } from '../types';

export async function fetchModels(): Promise<{ data: AIModel[] }> {
  try {
    const encryptedApiKey = btoa(API_KEYS.GROQ_API_KEY);
    const response = await fetch('https://api.groq.com/openai/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${atob(encryptedApiKey)}`,
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    const textModels = data.data.filter((model: { id: string; owned_by: string; context_window: number; created: number; active: boolean }) => 
      !model.id.includes('whisper') && 
      !model.id.includes('vision') &&
      !model.id.includes('guard')&& 
      !model.id.includes('tts') &&
      !model.id.includes('tts-arabic') 
     
    );

    const models = textModels.map((model: { id: string; owned_by: string; context_window: number; created: number; active: boolean }) => ({
      id: model.id,
      name: model.id.split('-').join(' ').toUpperCase(),
      description: `${model.owned_by} language model with ${model.context_window.toLocaleString()} context window`,
      context_length: model.context_window,
      owner: model.owned_by,
      created: new Date(model.created * 1000).toLocaleDateString(),
      active: model.active
    }));

    return { data: models };
  } catch (error) {
    console.error('Error fetching models:', error);
    throw new Error('Failed to fetch models. Please try again later.');
  }
}

export async function sendMessage(
  model: string,
  messages: Array<{ role: string; content: string }>,
  abortController?: AbortController,
  onStream?: (chunk: string) => void,
  webSearchResults?: string
): Promise<{ content: string }> {
  try {
    if (!API_KEYS.GROQ_API_KEY) {
      throw new Error('Groq API key is not configured');
    }

    const augmentedMessages = [
      { role: 'system', content: SYSTEM_PROMPT }
    ];

    // Add analysis context if available
    const { visionAnalysis, documentAnalysis } = useAnalysisStore.getState();
    if (visionAnalysis || documentAnalysis) {
      augmentedMessages.push({
        role: 'system',
        content: `Analysis Results:\n\n${
          visionAnalysis 
            ? `Vision Analysis:\n${visionAnalysis}\n\n Please consider this analysis when user ask regrding this doc whther direct or indirect you have to detect this that user really asking regard this or not without expose your backend` 
            : ''
        }${
          documentAnalysis 
            ? `Document Analysis:\n${documentAnalysis}` 
            : ''
        }\n\nPlease consider this analysis when user ask regrding this doc whther direct or indirect you have to detect this that user really asking regard this or not without expose your backend.`
      });
    }


    // Add web search results if available
    if (webSearchResults) {
      augmentedMessages.push({
        role: 'system',
        content: `Additional real-time search information to consider:\n\n${webSearchResults}\n\nCombine this information with any relevant document content in your response.`
      });
    }

    // Add user messages
    messages.forEach(message => {
      if (message.role !== 'system') {
        augmentedMessages.push(message);
      }
    });

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEYS.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: augmentedMessages,
        stream: Boolean(onStream),
        max_tokens: 4000,
        temperature: 0.7,
        top_p: 1,
      }),
      signal: abortController?.signal,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
    }

    if (onStream && response.body) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let content = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(line => line.trim().startsWith('data: '));

        for (const line of lines) {
          const jsonStr = line.replace('data: ', '').trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const newContent = parsed.choices?.[0]?.delta?.content || '';
            if (newContent) {
              content += newContent;
              onStream(newContent);
            }
          } catch (err) {
            console.warn('Streaming parse error:', err);
          }
        }
      }

      return { content };
    } else {
      const data = await response.json();
      return { content: data.choices[0].message.content.trim() };
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return { content: '' };
    }
    console.error('Error in sendMessage:', error);
    throw new Error('Failed to get response from Groq. Please try again.');
  }
}

export async function searchWeb(query: string): Promise<WebSearchResults> {
  try {
    const response = await fetch('https://tuesday-aichatcompletions-production.up.railway.app/query', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer bxfvrOSpXiIp2aWdckcBhJT',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query })
    });

    if (!response.ok) {
      throw new Error(`Search failed: ${response.statusText}`);
    }

    const data = await response.json();
    const parsedResponse = JSON.parse(data.response);
    const webSearchResults = parsedResponse.response.message;

    return { 
      webSearchResults,
      response: webSearchResults 
    };
  } catch (error) {
    console.error('Error in searchWeb:', error);
    return {
      webSearchResults: null,
      response: 'Sorry, I was unable to perform the web search. Please try again.'
    };
  }
}
