import { useState, useEffect, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Cookies from 'js-cookie';
import { useNavigate } from 'react-router-dom';
import { toast } from './use-toast';
import { addChatMessage, createChatSession, getChatMessages, updateChatSessionTitle } from '@/services/chat';
import { sendMessage } from '@/services/aiProvider';
import { processDocument, ProcessedDocument } from '@/services/documentProcessor';
import { searchWeb } from '@/services/aiProvider';

export const useChatState = (sessionId: string) => {
  const [provider, setProvider] = useState<string>('openrouter');
  const [model, setModel] = useState<string>('qwen/qwen-vl-plus:free');
  const [webSearch, setWebSearch] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const [status, setStatus] = useState<'ready' | 'submitted' | 'streaming' | 'error'>('ready');
  const [title, setTitle] = useState<string>('New Chat');
  const [currentMessages, setCurrentMessages] = useState<
    {
      id: string;
      role: 'user' | 'assistant';
      content: string;
      timestamp: string;
      useWebSearch?: boolean;
      documentContent?: string;
    }[]
  >([]);
  const [assistantResponse] = useState<string>('');
  const navigate = useNavigate();
  const abortControllerRef = useRef<AbortController | null>(null);

  // Define the web search function
  const performWebSearch = async (query: string): Promise<string> => {
    try {
      const results = await searchWeb(query);
      return typeof results === 'string' ? results : JSON.stringify(results);
    } catch (error) {
      console.error('Error performing web search:', error);
      return '';
    }
  };

  // Fetch messages when sessionId changes
  useEffect(() => {
    if (sessionId && sessionId !== 'default') {
      const fetchMessages = async () => {
        setIsLoading(true);
        try {
          const messages = await getChatMessages(sessionId);
          if (messages && messages.length > 0) {
            const formattedMessages = messages.map((msg) => ({
              id: msg.id,
              role: msg.role as 'user' | 'assistant',
              content: msg.content,
              timestamp: new Date(msg.created_at).toISOString(),
            }));

            setCurrentMessages(formattedMessages);

            // Set the last message as the title if it's from the user
            if (formattedMessages.length > 0) {
              const lastUserMessage = [...formattedMessages].reverse().find((msg) => msg.role === 'user');
              if (lastUserMessage) {
                const title = lastUserMessage.content.slice(0, 30) + (lastUserMessage.content.length > 30 ? '...' : '');
                setTitle(title);
              }
            }
          }
        } catch (error) {
          console.error('Error fetching messages:', error);
        } finally {
          setIsLoading(false);
        }
      };

      fetchMessages();
    }
  }, [sessionId]);

  // Handle sending a message
  const handleSendMessage = useCallback(
    async (content: string, useWebSearch = false) => {
      if (!content) {
        toast({
          title: 'Error',
          description: 'Please enter a message',
          variant: 'destructive',
        });
        return;
      }

      // Create the user message object
      const userMessage = {
        id: uuidv4(),
        role: 'user' as const,
        content,
        timestamp: new Date().toISOString(),
        useWebSearch,
      };

      // Add the user message to the UI immediately
      setCurrentMessages((prev) => [...prev, userMessage]);

      if (!sessionId || sessionId === 'default') {
        // Create a new session if we don't have one
        try {
          const shortTitle = content.slice(0, 30) + (content.length > 30 ? '...' : '');
          const { session, error } = await createChatSession(shortTitle);

          if (error) {
            toast({
              title: 'Error',
              description: 'Failed to create chat session',
              variant: 'destructive',
            });
            return;
          }

          if (session) {
            // Save the session ID
            Cookies.set('lastSessionId', session.id, { expires: 30 });
            navigate(`/chat/${session.id}`);

            // Add the user message to the database
            const { error } = await addChatMessage(session.id, 'user', content);
            if (error) {
              console.error('Error adding message:', error);
            }

            // Call the AI service
            setStatus('submitted');
            setIsThinking(true);

            try {
              // Create a new AbortController for this request
              abortControllerRef.current = new AbortController();

              // Perform web search if enabled
              let webSearchResults: string | undefined;
              if (useWebSearch) {
                webSearchResults = await performWebSearch(content);
              }

              let response = '';
              const messages = [{ role: 'user', content }];

              // Create a placeholder for the assistant's response
              const botMessageId = uuidv4();
              const botMessage = {
                id: botMessageId,
                role: 'assistant' as const,
                content: '',
                timestamp: new Date().toISOString(),
              };

              // Add the placeholder to the UI
              setCurrentMessages((prev) => [...prev, botMessage]);

              await sendMessage(
                provider,
                model,
                messages,
                abortControllerRef.current,
                (token) => {
                  response += token;
                  // Update the assistant's message incrementally
                  setCurrentMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === botMessageId ? { ...msg, content: response } : msg
                    )
                  );
                  setStatus('streaming');
                },
                webSearchResults
              );

              setIsThinking(false);
              setStatus('ready');

              // Add the assistant message to the database
              await addChatMessage(session.id, 'assistant', response);
            } catch (error) {
              setIsThinking(false);
              setStatus('error');
              console.error('Error sending message:', error);
              toast({
                title: 'Error',
                description: 'Failed to get a response',
                variant: 'destructive',
              });
            }
          }
        } catch (error) {
          console.error('Error with chat session:', error);
        }
      } else {
        // Using an existing session
        try {
          // Add the user message to the database
          const { error } = await addChatMessage(sessionId, 'user', content);
          if (error) {
            console.error('Error adding message:', error);
          }

          // Update the session title
         // const shortTitle = content.slice(0, 30) + (content.length > 30 ? '...' : '');
          //await updateChatSessionTitle(sessionId, shortTitle);

          // Call the AI service
          setStatus('submitted');
          setIsThinking(true);

          // Create a new AbortController for this request
          abortControllerRef.current = new AbortController();

          // Perform web search if enabled
          let webSearchResults: string | undefined;
          if (useWebSearch) {
            webSearchResults = await performWebSearch(content);
          }

          try {
            let response = '';
            const messages = [...currentMessages, userMessage].map((msg) => ({
              role: msg.role,
              content: msg.content,
            }));

            // Create a placeholder for the assistant's response
            const botMessageId = uuidv4();
            const botMessage = {
              id: botMessageId,
              role: 'assistant' as const,
              content: '',
              timestamp: new Date().toISOString(),
            };

            // Add the placeholder to the UI
            setCurrentMessages((prev) => [...prev, botMessage]);

            await sendMessage(
              provider,
              model,
              messages,
              abortControllerRef.current,
              (token) => {
                response += token;
                // Update the assistant's message incrementally
                setCurrentMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === botMessageId ? { ...msg, content: response } : msg
                  )
                );
                setStatus('streaming');
              },
              webSearchResults
            );

            setIsThinking(false);
            setStatus('ready');

            // Add the assistant message to the database
            await addChatMessage(sessionId, 'assistant', response);
          } catch (error) {
            if (error instanceof Error && error.name !== 'AbortError') {
              setIsThinking(false);
              setStatus('error');
              console.error('Error sending message:', error);
              toast({
                title: 'Error',
                description: 'Failed to get a response',
                variant: 'destructive',
              });
            }
          }
        } catch (error) {
          console.error('Error processing message:', error);
        }
      }
    },
    [sessionId, provider, model, currentMessages, navigate]
  );

  // Stop AI generation
  const stopGeneration = async () => {
    try {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      setIsThinking(false);
      setStatus('ready');
    } catch (error) {
      console.error('Error stopping generation:', error);
      toast({
        title: 'Error',
        description: 'Failed to stop generation',
        variant: 'destructive',
      });
    }
  };

  // Handle document processing
  const handleProcessDocument = useCallback(async (document: File) => {
    setIsLoading(true);
    try {
      const result = await processDocument(document);

      // Add the processed document message to the UI
      setCurrentMessages((prev) => [
        ...prev,
        {
          id: uuidv4(),
          role: 'assistant' as const,
          content: `Document processed. You can now ask questions about the document.`,
          timestamp: new Date().toISOString(),
          documentContent: typeof result === 'string' ? result : JSON.stringify(result),
        },
      ]);
    } catch (error) {
      console.error('Error processing document:', error);
      toast({
        title: 'Error',
        description: 'Failed to process document',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    provider,
    model,
    webSearch,
    isLoading,
    isThinking,
    status,
    title,
    currentMessages,
    assistantResponse,
    setProvider,
    setModel,
    setWebSearch,
    handleSendMessage,
    stopGeneration,
    handleProcessDocument,
  };
};