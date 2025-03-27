
import { API_KEYS, SYSTEM_PROMPT, useAnalysisStore } from '../../config/constants';
import type { AIModel, WebSearchResults } from '../types';

export async function fetchModels(): Promise<{ data: AIModel[] }> {
  try {
    if (!API_KEYS.INDIAN_AI_API_KEY) {
      throw new Error('Indian AI API key is not configured');
    }

    const response = await fetch('https://api.helpingai.co/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_KEYS.INDIAN_AI_API_KEY}`,
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const modelNames = await response.json();
    const models = modelNames.map((modelName: string) => ({
      id: modelName,
      name: modelName,
      description: 'Indian AI Language Model',
      context_length: 4096,
      pricing: {
        prompt: 'N/A',
        completion: 'N/A'
      }
    }));

    return { data: models };
  } catch (error) {
    console.error('Error fetching Indian AI models:', error);
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
    if (!API_KEYS.INDIAN_AI_API_KEY) {
      throw new Error('Indian AI API key is not configured');
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

    const response = await fetch("https://api.helpingai.co/v1/chat/completions", {
      method: "POST",
      headers: {
        'Authorization': `Bearer ${API_KEYS.INDIAN_AI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: augmentedMessages,
        stream: Boolean(onStream),
        max_tokens: 7000,
        temperature: 0.4,
      }),
      signal: abortController?.signal,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
    }

    if (onStream) {
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let content = "";

      if (reader) {
        while (true) {
          try {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split("\n").filter((line) => line.startsWith("data:"));
            
            for (const line of lines) {
              const jsonStr = line.replace("data: ", "").trim();
              if (jsonStr === "[DONE]") break;

              try {
                const parsed = JSON.parse(jsonStr);
                if (parsed.choices?.[0]?.delta?.content) {
                  const newContent = parsed.choices[0].delta.content;
                  content += newContent;
                  onStream(newContent);
                }
                if (parsed.choices?.[0]?.finish_reason === "stop") {
                  return { content };
                }
              } catch (err) {
                console.warn("Streaming JSON parse error:", err);
              }
            }
          } catch (err) {
            if (err instanceof Error && err.name === "AbortError") {
              console.warn("Streaming aborted by user.");
              return { content };
            }
            throw err;
          }
        }
      }
      return { content };
    } else {
      const responseData = await response.json();
      if (!responseData.choices?.[0]?.message?.content) {
        throw new Error("Invalid response structure from API");
      }
      return { content: responseData.choices[0].message.content.trim() };
    }
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      console.warn("Request was aborted.");
      return { content: "" };
    }
    console.error("Error sending message:", error);
    throw new Error("Failed to get valid response from AI API");
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
