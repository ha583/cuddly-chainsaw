import React, { useState, useRef, useCallback } from 'react';
import { Send, Paperclip, Square, Loader2, Globe, ArrowDown } from 'lucide-react';
import DocumentUpload from './DocumentUpload';
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSendMessage: (message: string, useWebSearch: boolean) => void;
  onProcessDocument?: (document: File) => void;
  disabled?: boolean;
  status?: 'ready' | 'submitted' | 'streaming' | 'error' | 'thinking';
  onStop?: () => void;
  webSearch?: boolean;
  onWebSearchChange?: (webSearch: boolean) => void;
  showInCenter?: boolean;
  // New props for scroll functionality
  scrollToLatest?: () => void;
  showScrollButton?: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  onProcessDocument,
  disabled = false,
  status = 'ready',
  onStop,
  webSearch = false,
  onWebSearchChange,
  showInCenter = false,
  scrollToLatest,
  showScrollButton = false
}) => {
  const [message, setMessage] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Helper to determine if the input should be disabled
  const isInputDisabled = disabled || status !== 'ready';

  // Helper to determine if we should show stop button
  const isGenerating = status === 'streaming' || status === 'submitted' || status === 'thinking' || status === 'error';
  
  const handleTextAreaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);

    // Auto-resize the textarea with a max height
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = '0px';
      // Limit max height to 100px (about 4-5 lines)
      const scrollHeight = textarea.scrollHeight < 100 ? textarea.scrollHeight : 100;
      textarea.style.height = `${scrollHeight}px`;
      setIsExpanded(textarea.scrollHeight > 32);
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() !== '' && status === 'ready') {
      onSendMessage(message.trim(), webSearch);
      setMessage('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
      setIsExpanded(false);
      
      // Scroll to latest message after sending
      if (scrollToLatest) {
        setTimeout(scrollToLatest, 100);
      }
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (message.trim() !== '' && status === 'ready') {
        handleSubmit(e);
      }
    }
  };
  
  const toggleWebSearch = useCallback(() => {
    if (onWebSearchChange) {
      onWebSearchChange(!webSearch);
    }
  }, [webSearch, onWebSearchChange]);
  
  return (
    <div className={cn(
      "w-full mx-auto relative",
      showInCenter ? "max-w-xl" : "max-w-3xl"
    )}>
    
      
      {showFileUpload && (
        <div className="mb-4">
          <DocumentUpload 
            onUpload={content => {
              console.log("Document content:", content);
            }} 
            onProcessDocument={onProcessDocument} 
            onClose={() => setShowFileUpload(false)} 
          />
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="relative">
        <div className={cn(
          "flex flex-col transition-all duration-200 rounded-xl",
          isExpanded ? 'pb-8' : ''
        )}>
          <div className="flex items-center rounded-xl px-3 border">
            {onProcessDocument && (
              <button 
                type="button" 
                className={cn(
                  "p-2 text-zinc-500 hover:text-zinc-300 rounded-full transition-colors", 
                  showFileUpload && "text-zinc-300 bg-zinc-700/50"
                )}
                onClick={() => setShowFileUpload(prev => !prev)} 
                disabled={isInputDisabled}
              >
                <Paperclip size={18} />
              </button>
            )}
            
            <button 
              type="button" 
              className={cn(
                "p-2 rounded-full transition-colors mr-2",
                webSearch ? "text-blue-500" : "text-zinc-500 hover:text-zinc-300",
                isInputDisabled && "opacity-50 cursor-not-allowed"
              )}
              onClick={toggleWebSearch} 
              disabled={isInputDisabled}
            >
              <Globe size={18} />
            </button>
            
            <textarea 
              ref={textareaRef}
              value={message} 
              onChange={handleTextAreaChange} 
              onKeyDown={handleKeyDown} 
              placeholder="Message..." 
              className="flex-1 max-h-[100px] min-h-[52px] bg-transparent border-none focus:outline-none resize-none py-3 px-2 scrollbar-thin text-zinc-200 placeholder-zinc-500 text-base" 
              disabled={isInputDisabled} 
              rows={1} 
            />
            
            {!isGenerating ? (
              <button 
                type="submit" 
                className="p-2 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 mx-1" 
                disabled={disabled || message.trim() === ''}
              >
                <Send size={18} />
              </button>
            ) : (
              <button 
                type="button" 
                className="p-2 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors flex-shrink-0 mx-1" 
                onClick={onStop}
              >
                {status === 'thinking' || status === 'submitted' ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Square size={18} />
                )}
              </button>
            )}
          </div>
          {!showInCenter && (
            <div className={cn(
              "flex items-center justify-end transition-all duration-300 mt-2 px-1"
            )}>
              <div className="text-xs transition-colors duration-300 text-blue-500">
                {webSearch ? "Web search enabled" : ""}
              </div>
            </div>
          )}
        </div>
      </form>
    </div>
  );
};

export default ChatInput;