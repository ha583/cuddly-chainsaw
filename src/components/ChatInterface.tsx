import React, { useEffect, useRef, useState, useCallback } from 'react';
import ChatInput from './ChatInput';
import ModelSelector from './ModelSelector';
import { useChatState } from '@/hooks/useChatState';
import Messages from './chat/Messages';
import {ArrowDown } from 'lucide-react';
import '././custom.css';
import { supabase } from '@/integrations/supabase/client';
interface ChatInterfaceProps {
  currentSessionId: string;
  onToggleSidebar?: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  currentSessionId}) => {
  const {
    provider,
    model,
    webSearch,
    isThinking,
    status,
    currentMessages,
    setProvider,
    setModel,
    setWebSearch,
    handleSendMessage,
    stopGeneration,
    handleProcessDocument
  } = useChatState(currentSessionId);

  const isStreaming = status === 'streaming';
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [userName, setUserName] = useState<string>('User');
  const [showScrollButton, setShowScrollButton] = useState(false);

  const scrollToLatest = useCallback(() => {
    const container = chatContainerRef.current;
    if (container) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, []);

  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const isNearBottom = 
        container.scrollHeight - container.scrollTop <= container.clientHeight + 100;
      setShowScrollButton(!isNearBottom);
    };

    container.addEventListener('scroll', handleScroll);
    handleScroll();

    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (currentMessages.length > 0) {
      scrollToLatest();
    }
  }, [currentMessages.length, scrollToLatest]);
  useEffect(() => {
      const getUserProfile = async () => {
        try {
          const {
            data: { user }
          } = await supabase.auth.getUser();
  
          // Set user name for avatar fallback from Supabase
          const name = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'User';
          setUserName(name);
        } catch (error) {
          console.error('Error fetching user profile:', error);
          // Retry dynamically in case of an error
          requestAnimationFrame(getUserProfile);
        }
      };
      getUserProfile();
    }, []);
  
  return (
    <div className="flex flex-col h-full w-full">
      <header className="sticky top-0 z-10 w-full">
        <ModelSelector
          provider={provider}
          model={model}
          onProviderChange={(value) => setProvider(value)}
          onModelChange={(value) => setModel(value)}
          isGenerating={isStreaming || isThinking} // Add this line
        />
      </header>

      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-auto relative w-full"
      >
        {currentMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center w-full">
            <div className="mb-8">
              <h1 className="text-2xl font-semibold text-white mb-2">Hi, {userName}</h1>
              <p className="text-lg text-zinc-400 max-w-md">How can I help you today?</p>
            </div>

            <div className="w-full max-w-3xl mx-auto mt-8 px-4 sm:px-6 md:px-8">
              <ChatInput
                onSendMessage={handleSendMessage}
                onProcessDocument={handleProcessDocument}
                disabled={status !== 'ready'}
                status={status}
                onStop={stopGeneration}
                webSearch={webSearch}
                onWebSearchChange={setWebSearch}
                showInCenter={true}
                scrollToLatest={scrollToLatest}
                showScrollButton={showScrollButton}
              />
            </div>
          </div>
        ) : (
          <div className="">
            <Messages
              messages={currentMessages}
              isThinking={isThinking && !isStreaming}
              isStreaming={isStreaming} // Removed undefined 'index' reference
              onStopGeneration={stopGeneration}
              onSendMessage={handleSendMessage}
            />
          </div>
        )}
      </div>

      {currentMessages.length > 0 && (
        <div className="w-full px-4 pb-4 pt-2 relative">
          {showScrollButton && (
            <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 z-20">
              <button 
                onClick={scrollToLatest}
                className="cursor-pointer rounded-full bg-blue-500 border text-white border-blue-600 w-10 h-10 flex items-center justify-center shadow-lg hover:bg-blue-400 transition-colors"
              >
                <ArrowDown size={16} />
              </button>
            </div>
          )}
          <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 md:px-8">
            <ChatInput
              onSendMessage={(message) => handleSendMessage(message, webSearch)}
              onProcessDocument={handleProcessDocument}
              disabled={status !== 'ready'}
              status={status}
              onStop={stopGeneration}
              webSearch={webSearch}
              onWebSearchChange={setWebSearch}
              showInCenter={true}
              scrollToLatest={scrollToLatest}
              showScrollButton={showScrollButton}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatInterface;
