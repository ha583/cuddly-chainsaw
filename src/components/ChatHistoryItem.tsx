import React, { useState, useRef, useEffect } from 'react';
import { cn } from "@/lib/utils";
import { MessageSquare, MoreVertical, Trash2, Pin, Edit, Link } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useNavigate } from 'react-router-dom';
import { toast } from "@/hooks/use-toast";
import { deleteChatSession, updateChatSessionTitle, updateChatSessionPinnedStatus } from '@/services/chat';
import { ChatSession } from './../services/chat';

interface ChatHistoryItemProps {
  session: ChatSession;
  onSelect: (id: string) => void;
  refreshSessions?: () => void;
}

export const ChatHistoryItem: React.FC<ChatHistoryItemProps> = ({ session, onSelect, refreshSessions }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [newTitle, setNewTitle] = useState(session.title);
  const [localSession, setLocalSession] = useState<ChatSession>({...session});
  const inputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const navigate = useNavigate();

  // Update local session when the prop changes
  useEffect(() => {
    setLocalSession({...session});
  }, [session]);

  // Click outside detection to cancel rename
  useEffect(() => {
    if (isEditing) {
      const handleClickOutside = (event: MouseEvent) => {
        if (formRef.current && !formRef.current.contains(event.target as Node)) {
          setNewTitle(session.title); // Reset to original title
          setIsEditing(false);
        }
      };
      
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isEditing, session.title]);

  const handleRenameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newTitle.trim()) {
      try {
        // Optimistic update
        setLocalSession(prev => ({...prev, title: newTitle.trim()}));
        
        const { error } = await updateChatSessionTitle(session.id, newTitle.trim());
        if (error) {
          // Revert on error
          setLocalSession(prev => ({...prev, title: session.title}));
          toast({
            title: "Error",
            description: "Failed to rename chat session",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Success",
            description: "Chat session renamed"
          });
          // Still refresh to sync with other components
          if (refreshSessions) {
            refreshSessions();
          }
        }
      } catch (err) {
        // Revert on exception
        setLocalSession(prev => ({...prev, title: session.title}));
        console.error("Error renaming chat:", err);
      }
      setIsEditing(false);
    }
  };

  const handleDeleteSession = async () => {
    try {
      // Navigate away first to prevent UI issues
      navigate('/chat');
      
      const { error } = await deleteChatSession(session.id);
      if (error) {
        toast({
          title: "Error",
          description: "Failed to delete chat session",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Success",
          description: "Chat session deleted"
        });
        // Refresh the sessions list
        if (refreshSessions) {
          refreshSessions();
        }
      }
    } catch (err) {
      console.error("Error deleting chat:", err);
    }
  };

  const handlePinToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const newPinState = !localSession.pinned;
      
      // Optimistic update
      setLocalSession(prev => ({...prev, pinned: newPinState}));
      
      const { success } = await updateChatSessionPinnedStatus(session.id, newPinState);
      
      if (success) {
        toast({
          title: newPinState ? "Pinned" : "Unpinned",
          description: `Chat session ${newPinState ? "pinned" : "unpinned"} successfully`
        });
        if (refreshSessions) {
          refreshSessions();
        }
      } else {
        // Revert optimistic update on failure
        setLocalSession(prev => ({...prev, pinned: !newPinState}));
        toast({
          title: "Error",
          description: "Failed to update pin status",
          variant: "destructive"
        });
      }
    } catch (err) {
      // Revert optimistic update on exception
      setLocalSession(prev => ({...prev, pinned: !prev.pinned}));
      console.error("Exception in pin toggle operation:", err);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    }
  };

  const copySessionLink = () => {
    const url = `${window.location.origin}/chat/${session.id}`;
    navigator.clipboard.writeText(url);
    toast({
      title: "Link copied",
      description: "Chat session link copied to clipboard"
    });
  };

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);
 
  if (isEditing) {
    // Add cancel handler function
    const handleCancel = (e: React.MouseEvent) => {
      e.preventDefault();
      setNewTitle(session.title); // Reset to original title
      setIsEditing(false);
    };

    return (
      <form ref={formRef} onSubmit={handleRenameSubmit} className="w-full flex items-center gap-2">
        <input
          ref={inputRef}
          type="text"
          value={newTitle}
          onChange={e => setNewTitle(e.target.value)}
          className="w-full text-sm bg-[#1a1a1a] text-sidebar-foreground rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <button 
          type="submit"
          className="px-3 py-2 text-xs bg-[#1a1a1a] hover:bg-[#222222] text-sidebar-foreground rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
        >
          Save
        </button>
        <button 
          type="button"
          onClick={handleCancel}
          className="px-3 py-2 text-xs bg-[#1a1a1a] hover:bg-[#222222] text-sidebar-foreground rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
        >
          Cancel
        </button>
      </form>
    );
  }
  
  return (
    <button
      onClick={() => {
        onSelect(session.id);
        navigate(`/chat/${session.id}`);
      }} 
      className={cn(
        "w-full group flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors",
        localSession.active ? "bg-[#1a1a1a] text-sidebar-accent-foreground" : "hover:bg-[#1a1a1a] text-sidebar-foreground"
      )}
    >
      <MessageSquare size={16} className="flex-shrink-0" />
      <span className="truncate flex-1 text-left">{localSession.title}</span>
      <span className={cn("text-xs opacity-0 group-hover:opacity-60", localSession.active && "opacity-60")}>
        {localSession.timestamp}
      </span>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className="opacity-0 group-hover:opacity-100 p-1 hover:bg-[#222222] rounded" onClick={e => e.stopPropagation()}>
            <MoreVertical size={14} />
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40 bg-[#1a1a1a] border-[#222222]">
          <DropdownMenuLabel className="text-xs">Chat options</DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-[#222222]" />
          <DropdownMenuItem
            className="text-xs cursor-pointer flex items-center gap-2 focus:bg-[#222222]"
            onClick={e => {
              e.stopPropagation();
              copySessionLink();
            }}
          >
            <Link size={14} /> Copy link
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-xs cursor-pointer flex items-center gap-2 focus:bg-[#222222]"
            onClick={e => {
              e.stopPropagation();
              setIsEditing(true);
            }}
          >
            <Edit size={14} /> Rename
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-xs cursor-pointer flex items-center gap-2 focus:bg-[#222222]"
            onClick={handlePinToggle}
          >
            <Pin size={14} /> {localSession.pinned ? "Unpin chat" : "Pin chat"}
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-[#222222]" />
          <DropdownMenuItem
            className="text-xs cursor-pointer text-destructive flex items-center gap-2 focus:bg-[#222222]"
            onClick={e => {
              e.stopPropagation();
              handleDeleteSession();
            }}
          >
            <Trash2 size={14} /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </button>
  );
};