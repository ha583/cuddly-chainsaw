import React, { useState, useRef, useEffect } from 'react';
import { Copy, Check, Volume2, VolumeX, ThumbsUp, ThumbsDown, Edit } from 'lucide-react';
import { marked } from 'marked';
import hljs from 'highlight.js';
import 'highlight.js/styles/github-dark-dimmed.css';

import katex from 'katex';
import 'katex/dist/katex.min.css';
import '../components/custom.css';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
  time?: string; // Add time property
}

interface MessageListProps {
  messages: Message[];
  onEditMessage?: (index: number) => void;
  isGenerating: boolean;
  onStopStreaming: () => void;
  onFeedback?: (messageId: string, feedback: 'up' | 'down') => void;
}

// Inline styles for dot animation


// ...existing code...
const MessageList: React.FC<MessageListProps> = ({
  messages,
  onEditMessage,
  isGenerating,
  
  onFeedback
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [isReading, setIsReading] = useState(false);
  const [feedback, setFeedback] = useState<{ [key: string]: 'up' | 'down' | null }>({});
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (isGenerating) {
      messagesEndRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [isGenerating]);

  const readAloud = (text: string) => {
    if (speechSynthesisRef.current) {
      window.speechSynthesis.cancel();
      speechSynthesisRef.current = null;
      setIsReading(false);
    } else {
      const utterance = new SpeechSynthesisUtterance(text);
      speechSynthesisRef.current = utterance;
      utterance.onend = () => {
        setIsReading(false);
        speechSynthesisRef.current = null;
      };
      window.speechSynthesis.speak(utterance);
      setIsReading(true);
    }
  };

  const handleFeedback = (messageId: string, type: 'up' | 'down') => {
    setFeedback(prev => ({
      ...prev,
      [messageId]: prev[messageId] === type ? null : type
    }));
    onFeedback?.(messageId, type);
  };

  const convertToLocalTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  const renderMarkdown = (content: string) => {
    marked.setOptions({
      breaks: true,
      gfm: true
    });

    marked.use({
      renderer: {
        code(token) {
          const code = token.text;
          const validLanguage = token.lang || 'plaintext';
          let highlightedCode: string;
  
          try {
            highlightedCode = hljs.highlight(code, { language: validLanguage }).value;
          } catch {
            highlightedCode = hljs.highlight(code, { language: 'plaintext' }).value;
          }
  
          return `
            <div class="contain-inline-size rounded-md border-[0.3px] border-token-border-medium relative bg-token-surface-primary max-w-full my-3">
            <div class="flex items-center text-token-text-secondary px-4 py-1.5 text-xs font-sans justify-between h-8 select-none rounded-t-[5px] bg-gray-800">
            <span>${validLanguage}</span>
            <div class="flex items-center">
            <button class="copy-code-btn flex items-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700/50 transition-colors" data-code="${encodeURIComponent(code)}">
            <svg class="copy-icon w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M8 17.929H6c-1.105 0-2-.912-2-2.036V5.036C4 3.912 4.895 3 6 3h8c1.105 0 2 .912 2 2.036v1.866m-6 .17h8c1.105 0 2 .91 2 2.035v10.857C20 21.088 19.105 22 18 22h-8c-1.105 0-2-.911-2-2.036V9.107c0-1.124.895-2.036 2-2.036z"/>
            </svg>
            <svg class="check-icon w-4 h-4 mr-1 hidden" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <span class="copy-text">Copy code</span>
            
            <span class="copy-success-message text-green-400 text-xs hidden">Code copied!</span>
            </button>
            </div>
            </div>
            <div class="p-0" dir="ltr">
            <pre class="hljs m-0 p-4 rounded-md">
            <code class="hljs language-${validLanguage}">${highlightedCode}</code>
            </pre>
            </div>
            </div>
          `;
        }
      }
    });

    // Add event listener for copy buttons after rendering markdown
    setTimeout(() => {
      document.querySelectorAll('.copy-code-btn').forEach(button => {
        button.addEventListener('click', () => {
          const code = decodeURIComponent((button as HTMLElement).dataset.code || '');
          navigator.clipboard.writeText(code).then(() => {
            const copyIcon = button.querySelector('.copy-icon');
            const checkIcon = button.querySelector('.check-icon');
            const copyText = button.querySelector('.copy-text');
            const copiedText = button.querySelector('.copied-text');
            const successMessage = button.parentElement?.querySelector('.copy-success-message');
            
            if (copyIcon && checkIcon && successMessage) {
              copyIcon.classList.add('hidden');
              checkIcon.classList.remove('hidden');
              
              if (copyText) copyText.classList.add('hidden');
              if (copiedText) copiedText.classList.remove('hidden');
              successMessage.classList.remove('hidden');
              
              setTimeout(() => {
                copyIcon.classList.remove('hidden');
                checkIcon.classList.add('hidden');
                if (copyText) copyText.classList.remove('hidden');
                if (copiedText) copiedText.classList.add('hidden');
                successMessage.classList.add('hidden');
              }, 600);
            }
          });
        });
      });
    }, 100);

    try {
      return { __html: marked.parse(content) };
    } catch (err) {
      console.error('Markdown rendering error:', err);
      return { __html: '<p>Error rendering markdown content</p>' };
    } 
  };
  
  const copyToClipboard = (content: string, index: number): void => {
    navigator.clipboard.writeText(content)
      .then(() => {
        setCopiedIndex(index);
        setTimeout(() => {
          setCopiedIndex(null);
        }, 2000);
      })
      .catch(err => {
        console.error('Failed to copy: ', err);
      });
  };
// ...existing code...

  const renderMessageContent = (content: string) => {
    // Check if content contains LaTeX expressions
    const containsLatex = (text: string) => {
      const latexPatterns = [
        /\$\$[\s\S]*?\$\$/,         // Display math with $$..$$
        /\$[^$\n]+?\$/,             // Inline math with $..$ (non-greedy)
        /\\\[[\s\S]*?\\\]/,         // Display math with \[..\]
        /\\\([\s\S]*?\\\)/,         // Inline math with \(..\)
        /\\begin\{[a-z*]*\}[\s\S]*?\\end\{[a-z*]*\}/  // LaTeX environments
      ];
      return latexPatterns.some(pattern => pattern.test(text));
    };

    // Process content to render LaTeX expressions
    const processLatex = (content: string) => {
      // Handle display math with $$..$$
      content = content.replace(/\$\$([\s\S]*?)\$\$/g, (match, formula) => {
        try {
          return `<div class="math-display my-2.5 px-1.5">${katex.renderToString(formula, { displayMode: true })}</div>`;
        } catch (e) {
          console.error('KaTeX rendering error:', e);
          return match; // Return original if rendering fails
        }
      });

      // Handle inline math with $..$ (non-greedy)
      content = content.replace(/\$([^$\n]+?)\$/g, (match, formula) => {
        try {
          return katex.renderToString(formula, { displayMode: false });
        } catch (e) {
          console.error('KaTeX rendering error:', e);
          return match; // Return original if rendering fails
        }
      });

      // Handle display math with \[..\]
      content = content.replace(/\\\[([\s\S]*?)\\\]/g, (match, formula) => {
        try {
          return `<div class="math-display">${katex.renderToString(formula, { displayMode: true })}</div>`;
        } catch (e) {
          console.error('KaTeX rendering error:', e);
          return match;
        }
      });

      // Handle inline math with \(..\)
      content = content.replace(/\\\(([\s\S]*?)\\\)/g, (match, formula) => {
        try {
          return katex.renderToString(formula, { displayMode: false });
        } catch (e) {
          console.error('KaTeX rendering error:', e);
          return match;
        }
      });

      // Handle LaTeX environments
      content = content.replace(/\\begin\{([a-z*]*)\}([\s\S]*?)\\end\{\1\}/g, (match, env, formula) => {
        try {
          const displayMode = ['equation', 'align', 'gather', 'multline'].includes(env);
          return `<div class="math-environment my-2.5 px-1.5">${katex.renderToString(formula, { displayMode })}</div>`;
        } catch (e) {
          console.error('KaTeX rendering error:', e);
          return match;
        }
      });

      return content;
    };

    // First process LaTeX expressions if present
    let processedContent = content;
    if (containsLatex(content)) {
      processedContent = processLatex(content);
    }

    return renderMarkdown(processedContent);
  };
  

    

return (
    <div className="relative flex-1 overflow-y-auto overflow-x-hidden px-4 py-6">
      <div className="max-w-3xl mx-auto space-y-8">
      {messages.map((message, index) => (
        <div
          key={message.id}
            className={`message-container ${message.role === 'assistant' ? 'justify-start' : 'justify-end'} items-start gap-6`}
          >
            <div className={` flex-1 ${message.role === 'assistant' ? 'mr-8' : 'ml-8'}`}>
              <div className={`rounded-lg p-6 ${message.role === 'user' ? 'bg-zinc-800' : ''} text-gray-200`}>
                {message.role === 'assistant' ? (
                  <>
                  {message.content.trim() === "" ? (
                    <p className="text-gray-200">Generating response...</p>
                  ) : (
                    <div
                    className="prose prose-invert max-w-none prose-pre:my-0 prose-p:leading-relaxed prose-p:my-3 prose-headings:my-4 prose-ul:my-3 prose-ol:my-3"
                    dangerouslySetInnerHTML={renderMessageContent(message.content)}

                    
                    
                    />
                  )}
                  {!message.isStreaming && message.content.trim() !== "" && (
                  <div className="flex items-center justify-end gap-2 mt-4 pt-4">
                  <button
                    onClick={() => handleFeedback(message.id, 'up')}
                    className={`p-1.5 rounded-md transition-colors ${
                    feedback[message.id] === 'up'
                    ? 'text-emerald-400 bg-emerald-400/10'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                    }`}
                  >
                    <ThumbsUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleFeedback(message.id, 'down')}
                    className={`p-1.5 rounded-md transition-colors ${
                    feedback[message.id] === 'down'
                    ? 'text-red-400 bg-red-400/10'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                    }`}
                  >
                    <ThumbsDown className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => copyToClipboard(message.content, index)}
                    className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-gray-700/50 transition-colors"
                  >
                    {copiedIndex === index ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => readAloud(message.content)}
                    className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-gray-700/50 transition-colors"
                  >
                      {isReading ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </button>
                    </div>
                  )}
                  </>
                ) : (
                  <div className="flex items-start justify-between gap-4">
                    <div className="text-base text-gray-200 whitespace-pre-wrap leading-relaxed">{message.content}</div>
                    {onEditMessage && !isGenerating && (
                      <button
                        onClick={() => onEditMessage(index)}
                        className="p-1.5 text-gray-400 hover:text-white transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
                {message.time && (
                  <span className="text-xs text-gray-400 block mt-2">
                    {convertToLocalTime(message.time)}
                  </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);
};

export default MessageList;