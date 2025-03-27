import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getChatSessions, getChatSession, getChatMessages } from '@/services/chat';
import { toast } from '@/hooks/use-toast';
import Cookies from 'js-cookie';
import { getCurrentSession } from '@/services/auth'; // updated import

interface ChatSession {
  id: string;
  title: string;
  timestamp: string;
  active: boolean;
}

export const useSessionState = (sessionId: string | undefined, isAuthenticated: boolean) => {
  const navigate = useNavigate();
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [hasMessages, setHasMessages] = useState(false);
  const [creatingNewChat, setCreatingNewChat] = useState(false);

  // Helper function to format dates
  const formatDate = useCallback((dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();

    if (date.toDateString() === now.toDateString()) {
      return 'Today';
    }

    if (date.toDateString() === new Date(now.setDate(now.getDate() - 1)).toDateString()) {
      return 'Yesterday';
    }

    if (now.getTime() - date.getTime() < 7 * 24 * 60 * 60 * 1000) {
      return `${Math.ceil((now.getTime() - date.getTime()) / (24 * 60 * 60 * 1000))}d ago`;
    }

    return date.toLocaleDateString();
  }, []);

  // Load chat sessions for the authenticated user using Supabase's session to get userId
  const loadChatSessions = useCallback(async () => {
    try {
      const { session } = await getCurrentSession();
      if (!session || !session.user) {
        toast({
          title: 'Authentication Error',
          description: 'User session not found. Please log in.',
          variant: 'destructive',
        });
        navigate('/signin');
        return;
      }
      const userId = session.user.id;

      const sessions = await getChatSessions(userId);

      if (sessions.length > 0) {
        const formattedSessions = sessions.map((session) => ({
          id: session.id,
          title: session.title,
          timestamp: formatDate(session.updated_at),
          active: sessionId ? session.id === sessionId : false,
        }));

        if (sessionId) {
          const sessionExists = formattedSessions.some((s) => s.id === sessionId);

          if (!sessionExists) {
            const singleSession = await getChatSession(sessionId);
            if (singleSession) {
              formattedSessions.push({
                id: singleSession.id,
                title: singleSession.title,
                timestamp: formatDate(singleSession.updated_at),
                active: true,
              });
            } else {
              toast({
                title: 'Session not found',
                description: 'The requested chat session could not be found.',
                variant: 'destructive',
              });
              navigate('/');
            }
          }
        }

        setChatSessions(formattedSessions);
      }
    } catch (error) {
      console.error('Error loading chat sessions:', error);
      toast({
        title: 'Error loading sessions',
        description: 'An error occurred while loading chat sessions.',
        variant: 'destructive',
      });
    }
  }, [sessionId, formatDate, navigate]);

  // Load chat sessions when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadChatSessions();
    }
  }, [isAuthenticated, sessionId, loadChatSessions]);

  // Check for messages in the current session
  useEffect(() => {
    if (sessionId && isAuthenticated) {
      setChatSessions((prev) =>
        prev.map((session) => ({
          ...session,
          active: session.id === sessionId,
        }))
      );

      const checkSessionMessages = async () => {
        try {
          const messages = await getChatMessages(sessionId);

          if (messages && messages.length > 0) {
            setHasMessages(true);
          } else {
            setHasMessages(false);
          }
        } catch (err) {
          console.error('Error checking session messages:', err);
          toast({
            title: 'Error loading messages',
            description: 'An error occurred while loading chat messages.',
            variant: 'destructive',
          });
        }
      };

      checkSessionMessages();
    } else {
      setHasMessages(false);
    }
  }, [sessionId, isAuthenticated]);

  // Handle session selection
  const handleSelectSession = useCallback(
    (id: string) => {
      if (creatingNewChat) return;

      const updatedSessions = chatSessions.map((session) => ({
        ...session,
        active: session.id === id,
      }));
      setChatSessions(updatedSessions);

     
    },
    [chatSessions, creatingNewChat]
  );

  // Handle new chat creation
  const handleNewChat = useCallback(async () => {
    if (creatingNewChat) return;

    // Clear session cookie when creating a new chat
    Cookies.remove('lastSessionId', {
      secure: true,
      sameSite: 'strict',
    });

    // Always redirect to the root page for a new chat
    navigate('/');
  }, [creatingNewChat, navigate]);

  return {
    chatSessions,
    hasMessages,
    handleSelectSession,
    handleNewChat,
    creatingNewChat,
    setCreatingNewChat,
  };
};

export default useSessionState;