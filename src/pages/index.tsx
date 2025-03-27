import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { useAuthState } from '@/hooks/useAuthState';
import { useSessionState } from '@/hooks/useSessionState';
import LoadingSpinner from '@/components/LoadingSpinner';
import DesktopChatLayout from '@/components/DesktopChatLayout';

const Index = () => {
  const { sessionId } = useParams();
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const location = useLocation();
  
  const { isAuthenticated, isLoading } = useAuthState();
  const { 
    chatSessions, 
    handleSelectSession, 
    handleNewChat 
  } = useSessionState(sessionId, isAuthenticated);

  // Create a new chat when at root path with no sessionId
  useEffect(() => {
    if (location.pathname === '/' && !sessionId) {
      handleNewChat();
    }
  }, [location.pathname, sessionId]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Use sessionId from URL if available, otherwise find active session
  const activeSessionId = sessionId || chatSessions.find(s => s.active)?.id || '';

  return (
    <div className="">
      <DesktopChatLayout 
        currentSessionId={activeSessionId}
        chatSessions={chatSessions}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={toggleSidebar}
        onSelectSession={handleSelectSession}
        onNewChat={handleNewChat}
      />
    </div>
  );
};

export default Index;