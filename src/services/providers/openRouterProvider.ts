
import { API_KEYS, SYSTEM_PROMPT, useAnalysisStore } from '../../config/constants';
import type { AIModel, WebSearchResults } from '../types';


export async function fetchModels(): Promise<{ data: AIModel[] }> {
  try {
    if (!API_KEYS.OPENROUTER) {
      throw new Error('OpenRouter API key is not configured');
    }

    const response = await fetch('https://openrouter.ai/api/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_KEYS.OPENROUTER}`,
        'HTTP-Referer': window.location.origin,
        'X-Title': 'Fasten AI',
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const models = data.data.map((model: {
      id: string;
      name?: string;
      description?: string;
      context_length?: number;
      pricing?: { prompt?: string; completion?: string };
    }) => ({
      id: model.id,
      name: model.name || model.id.split('/').pop(),
      description: model.description || 'OpenRouter language model',
      context_length: model.context_length || 4096,
      pricing: {
        prompt: model.pricing?.prompt || 'N/A',
        completion: model.pricing?.completion || 'N/A'
      }
    }));

    return { data: models };
  } catch (error) {
    console.error('Error fetching models:', error);
    throw error;
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
    if (!API_KEYS.OPENROUTER) {
      throw new Error('OpenRouter API key is not configured');
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
            ? `Vision Analysis:\n${visionAnalysis}\n\n` 
            : ''
        }${
          documentAnalysis 
            ? `Document Analysis:\n${documentAnalysis}` 
            : ''
        }\n\nPlease consider this analysis when responding.`
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

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEYS.OPENROUTER}`,
        "HTTP-Referer": window.location.origin,
        "X-Title": "Fasten AI",
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
    throw new Error('Failed to get response from AI. Please try again.');
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
