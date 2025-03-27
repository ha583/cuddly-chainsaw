import React, { useState, useEffect } from 'react';
import { cn } from "@/lib/utils";
import { Plus, Search, X, ChevronLeft, History, Pin , Settings} from 'lucide-react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { getChatSessionPinnedStatus } from '@/services/chat';
import { ChatHistoryItem } from './ChatHistoryItem';
import { ChatSession } from './../services/chat';

const formatTimestamp = (timestamp: string): string => {
  if (!timestamp) return "Unknown";

  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return timestamp; // Handle invalid date

  // Get the current date and set it to midnight (local time)
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // Get the start of the current week (Monday)
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - (today.getDay() === 0 ? 6 : today.getDay() - 1)); // Adjust for Monday start

  // Get the start of the last 30-day period
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 30);

  const dateTime = date.getTime();

  if (dateTime >= today.getTime()) return "Today";
  if (dateTime >= yesterday.getTime()) return "Yesterday";
  if (dateTime >= startOfWeek.getTime()) return "This Week";
  if (dateTime >= thirtyDaysAgo.getTime()) return "Previous 30 Days";

  // Format older dates properly
  if (date.getFullYear() === now.getFullYear()) {
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
  }

  return new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: '2-digit' }).format(date);
};


interface ChatHistoryProps {
  sessions: ChatSession[];
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onToggleSidebar?: () => void;
  refreshSessions?: () => void;
}

const ChatHistory: React.FC<ChatHistoryProps> = ({
  sessions,
  onSelectSession,
  
  onToggleSidebar,
  refreshSessions
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [verifiedSessions, setVerifiedSessions] = useState<ChatSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const verifyPinnedStatus = async () => {
      setIsLoading(true);
      try {
        const sessionsToUpdate = [...sessions];
        const sessionsNeedingCheck = sessionsToUpdate.filter(
          session => session.id !== 'default' && !session.pinned
        );
        
        if (sessionsNeedingCheck.length > 0) {
          for (const session of sessionsNeedingCheck) {
            const { isPinned, error } = await getChatSessionPinnedStatus(session.id);
            if (!error && isPinned) {
              session.pinned = true;
            }
          }
        }
        
        setVerifiedSessions(sessionsToUpdate);
      } catch (error) {
        console.error("Error verifying pinned status:", error);
        setVerifiedSessions(sessions);
      } finally {
        setIsLoading(false);
      }
    };
    
    verifyPinnedStatus();
  }, [sessions]);
  
  const displaySessions = isLoading ? sessions : verifiedSessions;
  
  const processedSessions = displaySessions.map(session => {
    const dateToUse = session.updated_at || session.created_at || session.timestamp;
    return {
      ...session,
      displayTimestamp: formatTimestamp(dateToUse)
    };
  });
  
  const sortedSessions = [...processedSessions].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    
    const dateA = a.updated_at ? new Date(a.updated_at).getTime() : 
                 (a.created_at ? new Date(a.created_at).getTime() : 0);
    const dateB = b.updated_at ? new Date(b.updated_at).getTime() : 
                 (b.created_at ? new Date(b.created_at).getTime() : 0);
    return dateB - dateA;
  });

  const groupSessionsByDate = (sessions: ChatSession[]) => {
    const groups: { [key: string]: ChatSession[] } = {};
    
    sessions.forEach(session => {
      const dateGroup = session.displayTimestamp || "Unknown";
      if (!groups[dateGroup]) {
        groups[dateGroup] = [];
      }
      groups[dateGroup].push(session);
    });
    
    return groups;
  };

  const filteredSessions = sortedSessions.filter(session => 
    !searchQuery || session.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pinnedSessions = filteredSessions.filter(session => session.pinned);
  const unpinnedSessions = filteredSessions.filter(session => !session.pinned);
  const groupedSessions = groupSessionsByDate(unpinnedSessions);
  const dateOrder = [
    "Today",
    "Yesterday", 
    "This Week", // Renamed from "Previous 7 days" for clarity
    "Previous 30 days",
    // First include current year dates (Jan/21 format)
    ...Object.keys(groupedSessions)
      .filter(date => 
        !["Today", "Yesterday", "This Week", "Previous 30 days", "Unknown"].includes(date) && 
        date.match(/^[A-Z][a-z]{2}\/\d{1,2}$/) // Matches "Jan/21" format
      )
      .sort((a, b) => {
        // Get month from format "Jan/21"
        const monthA = a.split('/')[0];
        const monthB = b.split('/')[0];
        // Convert month names to month numbers
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const monthNumA = monthNames.indexOf(monthA);
        const monthNumB = monthNames.indexOf(monthB);
        // Sort chronologically (newest first)
        if (monthNumA !== monthNumB) return monthNumB - monthNumA;
        // If same month, sort by day (newest first)
        const dayA = parseInt(a.split('/')[1]);
        const dayB = parseInt(b.split('/')[1]);
        return dayB - dayA;
      }),
    // Then include previous year dates (January/12/21 format)
    ...Object.keys(groupedSessions)
      .filter(date => 
        !["Today", "Yesterday", "This Week", "Previous 30 days", "Unknown"].includes(date) && 
        date.match(/^[A-Z][a-z]+\/\d{1,2}\/\d{2}$/) // Matches "January/12/21" format
      )
      .sort((a, b) => {
        // Extract year from format "Month/Day/Year"
        const yearA = parseInt(a.split('/')[2]);
        const yearB = parseInt(b.split('/')[2]);
        // Sort by year (newest first)
        if (yearA !== yearB) return yearB - yearA;
        
        // Get month from format "Month/Day/Year"
        const monthA = a.split('/')[0];
        const monthB = b.split('/')[0];
        // Convert month names to month numbers
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const monthNumA = monthNames.indexOf(monthA);
        const monthNumB = monthNames.indexOf(monthB);
        // Sort chronologically by month (newest first)
        if (monthNumA !== monthNumB) return monthNumB - monthNumA;
        
        // If same month, sort by day (newest first)
        const dayA = parseInt(a.split('/')[1]);
        const dayB = parseInt(b.split('/')[1]);
        return dayB - dayA;
      }),
    // Include any remaining dates that don't match the expected formats
    ...Object.keys(groupedSessions)
      .filter(date => 
        !["Today", "Yesterday", "This Week", "Previous 30 days", "Unknown"].includes(date) && 
        !date.match(/^[A-Z][a-z]{2}\/\d{1,2}$/) && 
        !date.match(/^[A-Z][a-z]+\/\d{1,2}\/\d{2}$/)
      )
  ];
  return (
    <div className={cn(
      "flex flex-col h-full bg-[#0f1116]",
      "transition-all duration-200 ease-in-out",
      "fixed top-0 bottom-0 left-0 z-50",
      "w-[260px] max-w-[79vw]"
    )}>
      <div className="p-3 flex justify-between items-center bg-zinc-950">
        <button 
          onClick={onToggleSidebar}
          className="p-1.5 hover:bg-[#1a1a1a] rounded-md text-sidebar-foreground"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="flex items-center gap-2">
          {showSearch ? (
            <div className="flex-1 flex items-center gap-2">
              <Search size={16} className="text-sidebar-foreground/60" />
              <input
                type="text"
                placeholder="Search chats..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-transparent border-none outline-none text-xs text-sidebar-foreground placeholder:text-sidebar-foreground/50"
                autoFocus
              />
              <button onClick={() => setShowSearch(false)} className="p-1 hover:bg-[#1a1a1a] rounded-md text-sidebar-foreground/60">
                <X size={16} />
              </button>
            </div>
          ) : (
            <>
              <button 
                onClick={() => setShowSearch(true)}
                className="p-1.5 hover:bg-[#1a1a1a] rounded-md text-sidebar-foreground"
              >
                <Search size={18} />
              </button>
                <button
                onClick={() => {
                  window.location.href = '/';
                }}
                className="p-1.5 hover:bg-[#1a1a1a] rounded-md text-sidebar-foreground"
                >
                <Plus size={18} />
                </button>
            </>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1 px-3 py-4 bg-zinc-950">
        {pinnedSessions.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-1 px-2 py-1">
              <Pin size={12} className="text-sidebar-foreground/60" />
              <span className="text-xs text-sidebar-foreground/60 font-medium">Pinned</span>
            </div>
            <div className="space-y-1">
              {pinnedSessions.map(session => (
                <ChatHistoryItem
                  key={session.id}
                  session={session}
                  onSelect={onSelectSession}
                  refreshSessions={refreshSessions}
                />
              ))}
            </div>
          </div>
        )}

        {dateOrder.map(dateGroup => {
          const sessions = groupedSessions[dateGroup];
          if (!sessions?.length) return null;
          
          return (
            <div key={dateGroup} className="mb-4">
              <div className="px-2 py-1">
                <span className="text-xs text-sidebar-foreground/60 font-medium">{dateGroup}</span>
              </div>
              <div className="space-y-1">
                {sessions.map(session => (
                  <ChatHistoryItem
                    key={session.id}
                    session={session}
                    onSelect={onSelectSession}
                    refreshSessions={refreshSessions}
                  />
                ))}
              </div>
            </div>
          );
        })}

        {!filteredSessions.length && (
          <div className="flex flex-col items-center justify-center h-[calc(100%-2rem)] text-center px-4 animate-fade-in">
            <div className="w-16 h-16 mb-4 rounded-full bg-slate-800/50 flex items-center justify-center shadow-md">
              <History className="w-8 h-8 text-slate-500" />
            </div>
            <h3 className="text-slate-300 font-medium mb-2">No chat history yet</h3>
            <p className="text-sm text-slate-400">Start a chat by sending the message</p>
          </div>
        )}
      </ScrollArea>

      <div className="p-3 mt-auto bg-zinc-950">
        <div className="text-xs text-sidebar-foreground/60 flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
          Tuesday AI - Online
        </div>
      </div>
    </div>
  );
};

export default ChatHistory;