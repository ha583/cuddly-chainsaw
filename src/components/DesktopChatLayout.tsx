import React, { useState } from 'react';
import { SidebarIcon, Plus } from 'lucide-react';
import ChatHistory from '@/components/ChatHistory';
import ChatInterface from '@/components/ChatInterface';


interface DesktopChatLayoutProps {
  currentSessionId: string;
  chatSessions: Array<{
    id: string;
    title: string;
    timestamp: string;
    active: boolean;
  }>;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
}
const DesktopChatLayout: React.FC<DesktopChatLayoutProps> = ({
  currentSessionId,
  chatSessions,
  isSidebarOpen,
  
  onSelectSession,
  onNewChat
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(isSidebarOpen);

  return (
    <div className="flex h-screen">
      {/* Backdrop for mobile when sidebar is open */}
      {sidebarOpen && (
        <div 
          className="sidebar-overlay md:hidden" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className={`transition-all duration-300 relative flex-shrink-0 ${sidebarOpen ? 'w-64' : 'w-14'} overflow-hidden`}>
        {sidebarOpen ? (
          <ChatHistory 
            sessions={chatSessions}
            onSelectSession={onSelectSession}
            onNewChat={onNewChat}
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          />
        ) : (
          <div className="flex flex-col items-center py-3">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 hover:bg-[#1a1a1a] rounded-md text-sidebar-foreground mb-4"
              aria-label="Open sidebar"
            >
              <SidebarIcon size={18} />
            </button>
            <button 
              onClick={() => {
              onNewChat();
              window.location.assign('/');
              }}
              className="p-1.5 hover:bg-[#1a1a1a] rounded-md text-sidebar-foreground"
              aria-label="New chat"
            >
              <Plus size={18} />
            </button>
          </div>
        )}
      </div>
   
      <div className="flex-1 h-full overflow-hidden relative">
        <ChatInterface 
          currentSessionId={currentSessionId} 
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />
      </div>
    </div>
  );
};

export default DesktopChatLayout;