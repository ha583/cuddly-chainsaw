import { supabase } from "@/integrations/supabase/client";

// Define the ChatSession and ChatMessage types that match our database schema
// Add this to your ChatSession interface:
export interface ChatSession {
  id: string;
  title: string;
  timestamp: string;
  active?: boolean;
  pinned?: boolean;
  created_at?: string;
  updated_at?: string;
  displayTimestamp?: string;
}
// ...existing code...
// Add this function to your existing chat.ts file

// Get pinned status of a chat session
export const getChatSessionPinnedStatus = async (sessionId: string): Promise<{
  isPinned: boolean;
  error: unknown | null;
}> => {
  if (!isValidUUID(sessionId)) {
    console.error('Invalid session ID:', sessionId);
    return { isPinned: false, error: new Error('Invalid session ID') };
  }

  try {
    const { data, error } = await supabase
      .from('chat_sessions')
      .select('pinned')
      .eq('id', sessionId)
      .single();

    if (error) {
      console.error('Error getting chat session pinned status:', error);
      return { isPinned: false, error };
    }

    return {
      isPinned: (data as { pinned?: boolean } | null)?.pinned ?? false,
      error: null
    };
   } catch (error) {
    console.error('Error getting chat session pinned status:');
    return { isPinned: false, error };
  }
};
// Add this new function:
// Update a chat session's pinned status
export const updateChatSessionPinnedStatus = async (
  sessionId: string, 
  pinned: boolean
): Promise<{
  success: boolean;
  error: unknown | null;
}> => {
  if (!isValidUUID(sessionId)) {
    console.error('Invalid session ID:', sessionId);
    return { success: false, error: new Error('Invalid session ID') };
  }

  try {
    const { error } = await supabase
      .from('chat_sessions')
      .update({ 
        pinned,
        updated_at: new Date().toISOString() 
      })
      .eq('id', sessionId);

    if (error) {
      console.error('Error updating chat session pinned status:', error);
      return { success: false, error };
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Error updating chat session pinned status:', error);
    return { success: false, error };
  }
};



// Example implementation of getChatSessionPinnedStatus for your services/chat.js

export interface ChatMessage {
  id: string;
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

// Helper function to validate UUID
const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

// Create a new chat session
export const createChatSession = async (title: string): Promise<{
  session: ChatSession | null;
  error: unknown | null;
}> => {
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError || !userData.user) {
      console.error('Error getting current user:', userError);
      return { session: null, error: userError || new Error('No authenticated user found') };
    }
    
    const { data: session, error } = await supabase
      .from('chat_sessions')
      .insert({ 
        title, 
        user_id: userData.user.id 
      })
      .select('*')
      .single();

    if (error) {
      console.error('Error creating chat session:', error);
      return { session: null, error };
    }

    return { 
      session: session as unknown as ChatSession, 
      error: null 
    };
  } catch (error) {
    console.error('Error creating chat session:', error);
    return { session: null, error };
  }
};

// Get all chat sessions for the current user
export async function getChatSessions(userId: string) {
  if (!isValidUUID(userId)) {
    console.error('Invalid user ID:', userId);
    throw new Error('Invalid user ID');
  }

  try {
    const { data, error } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting user sessions:', error);
    throw error;
  }
}

// Get a specific chat session and its messages
export async function getChatSession(sessionId: string) {
  if (!isValidUUID(sessionId)) {
    console.error('Invalid session ID:', sessionId);
    throw new Error('Invalid session ID');
  }

  try {
    const [sessionResponse, messagesResponse] = await Promise.all([
      supabase
        .from('chat_sessions')
        .select('*')
        .eq('id', sessionId)
        .single(),
      supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true })
    ]);

    if (sessionResponse.error) throw sessionResponse.error;
    if (messagesResponse.error) throw messagesResponse.error;

    return {
      ...sessionResponse.data,
      messages: messagesResponse.data
    };
  } catch (error) {
    console.error('Error getting chat session:', error);
    throw error;
  }
}

// Update a chat session title
export const updateChatSessionTitle = async (sessionId: string, title: string): Promise<{
  success: boolean;
  error: unknown | null;
}> => {
  if (!isValidUUID(sessionId)) {
    console.error('Invalid session ID:', sessionId);
    return { success: false, error: new Error('Invalid session ID') };
  }

  try {
    const { error } = await supabase
      .from('chat_sessions')
      .update({ 
        title, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', sessionId);

    if (error) {
      console.error('Error updating chat session:', error);
      return { success: false, error };
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Error updating chat session:', error);
    return { success: false, error };
  }
};

// Delete a chat session
export const deleteChatSession = async (sessionId: string): Promise<{
  success: boolean;
  error: unknown | null;
}> => {
  if (!isValidUUID(sessionId)) {
    console.error('Invalid session ID:', sessionId);
    return { success: false, error: new Error('Invalid session ID') };
  }

  try {
    const { error } = await supabase
      .from('chat_sessions')
      .delete()
      .eq('id', sessionId);

    if (error) {
      console.error('Error deleting chat session:', error);
      return { success: false, error };
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Error deleting chat session:', error);
    return { success: false, error };
  }
};

// Get chat messages for a specific session
export async function getChatMessages(sessionId: string) {
  if (!isValidUUID(sessionId)) {
    console.error('Invalid session ID:', sessionId);
    throw new Error('Invalid session ID');
  }

  try {
    const messagesResponse = await supabase
      .from('chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (messagesResponse.error) throw messagesResponse.error;

    return messagesResponse.data;
  } catch (error) {
    console.error('Error getting chat messages:', error);
    throw error;
  }
}

// Add a chat message to a session
export const addChatMessage = async (
  sessionId: string, 
  role: 'user' | 'assistant', 
  content: string
): Promise<{
  message: ChatMessage | null;
  error: unknown | null;
}> => {
  if (!isValidUUID(sessionId)) {
    console.error('Invalid session ID:', sessionId);
    return { message: null, error: new Error('Invalid session ID') };
  }

  try {
    const { data: message, error } = await supabase
      .from('chat_messages')
      .insert({
        session_id: sessionId,
        role,
        content,
      })
      .select('*')
      .single();

    if (error) {
      console.error('Error adding chat message:', error);
      return { message: null, error };
    }

    // Update the session's updated_at timestamp
    await supabase
      .from('chat_sessions')
      .update({ 
        updated_at: new Date().toISOString() 
      })
      .eq('id', sessionId);

    return { 
      message: message as unknown as ChatMessage, 
      error: null 
    };
  } catch (error) {
    console.error('Error adding chat message:', error);
    return { message: null, error };
  }
};


