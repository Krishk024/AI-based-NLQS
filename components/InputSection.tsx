import React, { useState, useEffect, useRef, forwardRef } from 'react';

interface InputSectionProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
  externalQuery?: string;
  setExternalQuery?: (q: string) => void;
  isHighlighted?: boolean;
}

// Extend Window interface for WebkitSpeechRecognition
declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

export const InputSection = forwardRef<HTMLInputElement, InputSectionProps>(({ 
  onSearch, 
  isLoading,
  externalQuery = '',
  setExternalQuery,
  isHighlighted = false
}, ref) => {
  const [internalQuery, setInternalQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Sync internal state with external prop if provided
  useEffect(() => {
    if (externalQuery !== undefined) {
      setInternalQuery(externalQuery);
    }
  }, [externalQuery]);

  const handleQueryChange = (val: string) => {
    setInternalQuery(val);
    if (setExternalQuery) setExternalQuery(val);
  };

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        handleQueryChange(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Voice input is not supported in this browser.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (internalQuery.trim()) {
      onSearch(internalQuery);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto transition-all duration-300">
      <form onSubmit={handleSubmit} className="relative">
        <div 
            className={`relative flex items-center bg-white dark:bg-slate-800 rounded-full shadow-xl transition-all duration-500 hover:shadow-2xl focus-within:ring-2 focus-within:ring-blue-100 dark:focus-within:ring-slate-600 ${
                isHighlighted 
                    ? 'ring-4 ring-blue-400 shadow-blue-300 dark:shadow-blue-900/50 scale-105 animate-pulse' 
                    : 'shadow-blue-100 dark:shadow-none border border-slate-100 dark:border-slate-700 hover:shadow-blue-100/50 dark:hover:shadow-slate-900/50'
            }`}
        >
          
          <div className="pl-6 text-slate-400 dark:text-slate-500">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </div>

          <input
            ref={ref}
            type="text"
            className="flex-grow px-4 py-5 text-lg text-slate-700 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none bg-transparent"
            placeholder="Ask anything about your data..."
            value={internalQuery}
            onChange={(e) => handleQueryChange(e.target.value)}
            disabled={isLoading}
          />
          
          <div className="flex items-center pr-2">
            <button
              type="button"
              onClick={toggleListening}
              className={`p-3 rounded-full transition-all duration-300 mr-2 ${
                isListening 
                  ? 'bg-red-50 dark:bg-red-900/30 text-red-500 animate-pulse' 
                  : 'text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-blue-600 dark:hover:text-blue-400'
              }`}
              title="Voice Input"
            >
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                 <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 1.5a3 3 0 013 3v1.5a3 3 0 01-6 0v-1.5a3 3 0 013-3z" />
               </svg>
            </button>

            <button
              type="submit"
              disabled={!internalQuery.trim() || isLoading}
              className={`p-3 px-6 bg-blue-600 dark:bg-blue-500 text-white font-medium rounded-full shadow-lg shadow-blue-200 dark:shadow-slate-900 transition-all duration-300 flex items-center justify-center ${
                 !internalQuery.trim() || isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-blue-700 dark:hover:bg-blue-400 hover:scale-105 active:scale-95'
              }`}
            >
              {isLoading ? (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
});