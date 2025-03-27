import React, { useEffect, useState, useCallback } from 'react';
import { UserCircle, Search } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from '@/integrations/supabase/client';
import { providers, fetchModels,} from '@/services/aiProvider';
import { Input } from "@/components/ui/input";


interface ModelSelectorProps {
  provider: string;
  model: string;
  onProviderChange: (provider: string) => void;
  onModelChange: (model: string) => void;
  isGenerating?: boolean; // New prop to track if AI is generating a response
}

const ModelSelector: React.FC<ModelSelectorProps> = ({
  provider,
  model,
  onProviderChange,
  onModelChange,
  isGenerating = false // Default to false if not provided
}) => {
  const [availableModels, setAvailableModels] = useState<Array<{
    id: string;
    name: string;
  }>>([]);
  const [filteredModels, setFilteredModels] = useState<Array<{
    id: string;
    name: string;
  }>>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [profileFetchAttempts, setProfileFetchAttempts] = useState(0);

  // Get user initials
  const getUserInitials = (name: string): string => {
    return name.split(' ').map(part => part.charAt(0)).join('').toUpperCase().substring(0, 2);
  };
 
  // Debounce function
  const useDebounce = <T extends (...args: unknown[]) => void>(fn: T, delay: number) => {
    const timerRef = React.useRef<NodeJS.Timeout | null>(null);
    
    return useCallback((...args: Parameters<T>) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => {
        fn(...args);
      }, delay);
    }, [fn, delay]);
  };

  // Filter models based on search query
  const filterModels = useCallback((query: string) => {
    if (!query.trim()) {
      setFilteredModels(availableModels);
      return;
    }
    
    const normalizedQuery = query.toLowerCase().trim();
    const filtered = availableModels.filter(model => 
      model.name.toLowerCase().includes(normalizedQuery)
    );
    setFilteredModels(filtered);
  }, [availableModels]);

  // Debounced search handler
  const debouncedSearch = useDebounce(filterModels, 300);

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    debouncedSearch(query);
  };

  // Handle provider change with model reset
  const handleProviderChange = (newProvider: string) => {
    onProviderChange(newProvider);
    onModelChange(""); // Reset model when provider changes
  };

  // Initialize with default provider if none is selected
  useEffect(() => {
    if (!provider && providers.length > 0) {
      onProviderChange(providers[0].id);
    }
  }, [provider, onProviderChange]);
 
  // Load models when provider changes
  useEffect(() => {
    const loadModels = async () => {
      if (!provider) return; // Don't fetch if no provider is selected
      
      setIsLoading(true);
      try {
        // Fetch models dynamically from the provider
        const { data: models } = await fetchModels(provider);
        
        setAvailableModels(models);
        setFilteredModels(models);
        
        // If we don't have a model selected yet and models are available, select the first one
        if ((!model || model === "") && models.length > 0) {
          onModelChange(models[0].id);
        }
      } catch (error) {
        toast({
          title: "Failed to load models",
          description: "Could not load models for the selected provider",
          variant: "destructive"
        });
        
        setAvailableModels([]);
        setFilteredModels([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadModels();
  }, [provider, model, onModelChange]);
  
  // Get user avatar from supabase auth with limited retries
  useEffect(() => {
    const MAX_ATTEMPTS = 5;
    
    const getUserProfile = async () => {
      if (profileFetchAttempts >= MAX_ATTEMPTS) return;
      
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          // Set avatar if available
          if (user.user_metadata?.avatar_url) {
            setUserAvatar(user.user_metadata.avatar_url);
          }
          
          // Set user name
          const name = user.user_metadata?.full_name || 
                      user.user_metadata?.name || 
                      user?.email?.split('@')[0] || 
                      'User';
          setUserName(name);
        } else {
          // Increment attempt counter and retry after delay if needed
          setProfileFetchAttempts(prev => prev + 1);
          if (profileFetchAttempts < MAX_ATTEMPTS - 1) {
            setTimeout(getUserProfile, 1000);
          }
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        setProfileFetchAttempts(prev => prev + 1);
        if (profileFetchAttempts < MAX_ATTEMPTS - 1) {
          setTimeout(getUserProfile, 1000);
        }
      }
    };
    
    getUserProfile();
  }, [profileFetchAttempts]);

  // Helper function to get model display name
  const getModelDisplayName = () => {
    if (!model) return isLoading ? "Loading..." : "Select model";
    
    // Try to find the model in available models
    const foundModel = availableModels.find(m => m.id === model);
    if (foundModel) return foundModel.name;
    
    // If model not found, show the model ID directly
    return model;
  };

  return (
    <div className="flex items-center justify-between gap-2 p-2">
      <div className="flex items-center gap-2">
        <Select 
          value={provider} 
          onValueChange={handleProviderChange}
          disabled={isGenerating || isLoading}
        >
          <SelectTrigger className={cn("w-[110px] h-8 text-xs bg-zinc-800 border-zinc-700/50 text-white", 
            (isGenerating || isLoading) && "opacity-70 cursor-not-allowed")}>
            <SelectValue placeholder="Provider">
              {providers.find(p => p.id === provider)?.name || "Provider"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="bg-zinc-800 border-zinc-700">
            {providers.map(p => (
              <SelectItem key={p.id} value={p.id} className="text-xs text-zinc-200">
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select 
          value={model || ""} 
          onValueChange={onModelChange} 
          disabled={isLoading || filteredModels.length === 0 || isGenerating}
        >
          <SelectTrigger className={cn("w-[140px] h-8 text-xs bg-zinc-800 border-zinc-700/50 text-white", 
            (isLoading || isGenerating) && "opacity-70 cursor-not-allowed")}>
            <SelectValue placeholder={isLoading ? "Loading..." : "Select model"}>
              {getModelDisplayName()}
            </SelectValue>
          </SelectTrigger>
          
        
          <SelectContent className="bg-zinc-800 border-zinc-700">
            <div className="px-2 py-2 sticky top-0 z-10 bg-zinc-800">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-zinc-400" />
                            
                <Input
                  placeholder="Search models..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="h-7 pl-7 text-xs bg-zinc-700 border-zinc-600 text-white w-full max-w-[180px]"
                  onClick={(e) => e.stopPropagation()}
                  onFocus={(e) => e.stopPropagation()}
                  onBlur={(e) => e.stopPropagation()}
                  onKeyDown={(e) => {
                    e.stopPropagation();
                    
                    // Only handle Escape specially
                    if (e.key === 'Escape') {
                      setSearchQuery('');
                    }
                  }}
                  onKeyPress={(e) => e.stopPropagation()}
                  onKeyUp={(e) => e.stopPropagation()}
                  autoComplete="off"
                  autoFocus
                />
              </div>
            </div>
            <div className="max-h-[200px] overflow-y-auto">
              {filteredModels.length > 0 ? (
                filteredModels.map(m => (
                  <SelectItem key={m.id} value={m.id} className="text-xs text-zinc-200">
                    {m.name}
                  </SelectItem>
                ))
              ) : (
                <div className="text-xs text-zinc-400 py-2 px-2">No models found</div>
              )}
            </div>
          </SelectContent>
        </Select>
      </div>

      {/* User profile dropdown */}
      <div className="flex items-center">
        <DropdownMenu>
          <DropdownMenuTrigger className="p-1 rounded-full hover:bg-zinc-800/40 transition-colors">
            <Avatar className="h-7 w-7">
              <AvatarImage src={userAvatar || ""} alt="User" />
              <AvatarFallback className="bg-zinc-700 text-white text-xs font-medium">
                {userName ? getUserInitials(userName) : <UserCircle size={20} className="text-white" />}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-zinc-800 border-zinc-700">
            <DropdownMenuLabel className="text-zinc-200">{userName || 'My Account'}</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-zinc-700" />
            <DropdownMenuItem className="text-zinc-200 hover:bg-zinc-700">Profile</DropdownMenuItem>
            <DropdownMenuItem className="text-zinc-200 hover:bg-zinc-700">Settings</DropdownMenuItem>
            <DropdownMenuSeparator className="bg-zinc-700" />
            <DropdownMenuItem className="text-zinc-200 hover:bg-zinc-700">Log out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default ModelSelector;