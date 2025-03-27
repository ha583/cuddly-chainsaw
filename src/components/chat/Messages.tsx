import React, { useEffect, useState } from 'react';
import ChatMessage from '../ChatMessage';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  useWebSearch?: boolean;
  documentContent?: string;
}

interface MessagesProps {
  messages: Message[];
  isThinking: boolean;
  isStreaming: boolean;
  onStopGeneration: () => void;
  onSendMessage: (content: string) => void;
}

const Messages: React.FC<MessagesProps> = ({
  messages,
  isStreaming,
  onStopGeneration,
}) => {
  
  const [loadingUser] = useState<boolean>(true);

  return (
    <div className="flex-1 bg-zinc-900">
      <div className="h-full bg-zinc-900">
        <div className="max-w-3xl mx-auto px-4 py-6 bg-zinc-900">
          {messages.map((message, index) => (
            <div
              key={message.id}
              className={`mb-6 ${message.role === 'user' ? 'flex justify-end' : ''}`}
            >
              <div className={`${message.role === 'user' ? 'max-w-[80%] ml-auto' : 'max-w-[90%]'}`}>
                <ChatMessage
                  messages={[message]}
                  isGenerating={isStreaming && index === messages.length - 1}
                  onStopStreaming={onStopGeneration}
                />
              </div>
            </div>
          ))}

          {messages.length === 0 && (
            <div className="mt-8 text-center">
              {loadingUser ? (
                <div className="animate-pulse text-zinc-400">Loading...</div>
              ) : (
                <h1 className="text-2xl font-medium text-zinc-200 mb-2">
                  Welcome
                </h1>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;