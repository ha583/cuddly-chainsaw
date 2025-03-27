
export interface AIModel {
  id: string;
  name: string;
  description: string;
  context_length: number;
  pricing: {
    prompt: string;
    completion: string;
  };
}

export interface WebSearchResults {
  webSearchResults: string | null;
  response: string;
}

export interface ChatInputStatus {
  status: 'ready' | 'submitted' | 'streaming' | 'error' | 'thinking';
}  // Define and export the Message type
export interface Message {
  id: string;
  type: 'bot' | 'user';
  content: string;
  document?: {
    title: string;
    content: string;
    type: string;
  };
  isStreaming?: boolean;
}

export interface StockData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  date: string;
  afterHours?: {
    price: number;
    change: number;
    changePercent: number;
  };
  metrics?: {
    open: number;
    dayRange: string;
    weekRange: string;
    volume: string;
  };
}  

export interface Messages {
  id: string;
  type: 'bot' | 'user';
  content: string;
  isStreaming?: boolean;
  isThinking?: boolean;
  thinking?: string;
  graphData?: unknown;
  stockData?: StockData;
  sources?: Array<{
    title: string;
    link: string;
  }>;
}