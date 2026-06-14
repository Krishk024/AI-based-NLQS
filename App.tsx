
import React, { useState, useEffect, useRef } from 'react';
import { processNaturalLanguageQuery } from './services/geminiService';
import { historyDb } from './services/historyDb';
import { userDb } from './services/userDb';
import { QueryResponse, QueryStatus, HistoryItem } from './types';
import { SUGGESTED_QUERIES, DB_SCHEMA } from './constants';
import { InputSection } from './components/InputSection';
import { SqlPreview } from './components/SqlPreview';
import { ResultsTable } from './components/ResultsTable';
import { DataVisualizer } from './components/DataVisualizer';
import { SchemaModal } from './components/SchemaModal';
import { LoginModal } from './components/LoginModal';
import { FileUpload } from './components/FileUpload';
import { HistorySidebar } from './components/HistorySidebar';
import { RecommendationEngine } from './components/RecommendationEngine';
import { UserProfileModal } from './components/UserProfileModal';
import { PowerfulFeatures } from './components/PowerfulFeatures';

const App: React.FC = () => {
  const [status, setStatus] = useState<QueryStatus>(QueryStatus.IDLE);
  const [result, setResult] = useState<QueryResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [currentQuery, setCurrentQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'table' | 'viz' | 'sql'>('table');
  const [dataSource, setDataSource] = useState<'demo' | 'custom'>('demo');
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [sharedDatasetContext, setSharedDatasetContext] = useState<string | undefined>(undefined);
  
  const [user, setUser] = useState<{name: string, email: string} | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [authModalConfig, setAuthModalConfig] = useState<{ register: boolean, message: string }>({ register: false, message: '' });
  
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>(() => historyDb.getAll());
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isSchemaModalOpen, setIsSchemaModalOpen] = useState(false);

  const mainScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize user database and restore session
    const initApp = async () => {
      await userDb.init();
      
      // Restore user session from localStorage
      const session = userDb.getSession();
      if (session) {
        setUser({ name: session.name, email: session.email });
      }
    };
    
    initApp();

    // Theme initialization
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme === 'dark' || (!storedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDarkMode(true);
    }
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const handleUserRegistration = async (name: string, email: string, password: string): Promise<boolean> => {
    const registeredUser = await userDb.registerUser(name, email, password);
    setUser({ name: registeredUser.name, email: registeredUser.email });
    return true;
  };

  const handleUserLoginAttempt = async (email: string, password: string): Promise<boolean> => {
    const loggedInUser = await userDb.login(email, password);
    setUser({ name: loggedInUser.name, email: loggedInUser.email });
    return true;
  };

  const handleLogout = () => {
    setUser(null);
    setIsProfileModalOpen(false);
    userDb.clearSession();
    setDataSource('demo');
    setUploadedFiles([]);
    setSharedDatasetContext(undefined);
  };

  const handleAnalyzeMyDataClick = () => {
    if (!user) {
      setAuthModalConfig({ register: false, message: 'Please login to analyze your own datasets (Excel, CSV, JSON).' });
      setIsLoginModalOpen(true);
    } else {
      setDataSource('custom');
    }
  };

  const handleSearch = async (query: string) => {
    setCurrentQuery(query);
    setStatus(QueryStatus.PROCESSING);
    setErrorMsg('');
    setResult(null);

    const context = dataSource === 'custom' 
        ? (sharedDatasetContext ?? `The user is querying their own uploaded files: ${uploadedFiles.join(', ')}. Please respond as if you have access to these files.`)
        : undefined;

    try {
      const response = await processNaturalLanguageQuery(query, context);
      setResult(response);
      setStatus(QueryStatus.SUCCESS);
      setActiveTab(response.visualizationSuggestion !== 'none' ? 'viz' : 'table');

      const updatedHistory = historyDb.add({
          id: Date.now().toString(),
          query: query,
          timestamp: Date.now(),
          response: response
      });
      setHistory(updatedHistory);
    } catch (err: any) {
      setStatus(QueryStatus.ERROR);
      setErrorMsg(err.message || "Failed to process query.");
    }
  };

  const handleNewQuery = () => {
    setResult(null);
    setStatus(QueryStatus.IDLE);
    setCurrentQuery('');
    setIsHistoryOpen(false);
  };

  const DatabaseLogo = () => (
    <div className="relative animate-float">
      {/* 3D-ish Database Stack Icon */}
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="filter drop-shadow-lg">
        <ellipse cx="32" cy="20" rx="16" ry="8" className="fill-blue-600 dark:fill-blue-500" />
        <path d="M16 20V28C16 32.4183 23.1634 36 32 36C40.8366 36 48 32.4183 48 28V20" className="fill-blue-600 dark:fill-blue-500" />
        <ellipse cx="32" cy="28" rx="16" ry="8" className="fill-blue-500 dark:fill-blue-400 opacity-50" />
        <path d="M16 32V40C16 44.4183 23.1634 48 32 48C40.8366 48 48 44.4183 48 40V32" className="fill-blue-600 dark:fill-blue-500" />
        <ellipse cx="32" cy="32" rx="16" ry="8" className="fill-blue-400 dark:fill-blue-300 opacity-50" />
        <ellipse cx="32" cy="20" rx="16" ry="8" className="stroke-white/20" strokeWidth="1" />
      </svg>
      {/* Sparkles */}
      <div className="absolute -top-2 -right-2 text-cyan-400 animate-pulse">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L14.5 9.5H22L16 14L18.5 22L12 17L5.5 22L8 14L2 9.5H9.5L12 2Z" />
        </svg>
      </div>
      <div className="absolute top-4 -right-4 text-cyan-300 animate-pulse delay-75 scale-75">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L14.5 9.5H22L16 14L18.5 22L12 17L5.5 22L8 14L2 9.5H9.5L12 2Z" />
        </svg>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#F8FAFF] dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-sans overflow-hidden transition-colors duration-300">
      <SchemaModal isOpen={isSchemaModalOpen} onClose={() => setIsSchemaModalOpen(false)} />
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
        onAuthenticate={handleUserLoginAttempt} 
        onRegister={handleUserRegistration}
        message={authModalConfig.message}
      />
      {user && (
        <UserProfileModal 
            isOpen={isProfileModalOpen} 
            onClose={() => setIsProfileModalOpen(false)} 
            user={user} 
            onLogout={handleLogout} 
            queryCount={history.length}
        />
      )}
      <HistorySidebar 
        isOpen={isHistoryOpen} 
        onClose={() => setIsHistoryOpen(false)} 
        history={history} 
        onSelect={(item) => { setResult(item.response); setStatus(QueryStatus.SUCCESS); setIsHistoryOpen(false); }} 
        onClear={() => setHistory(historyDb.clear())} 
        onNewQuery={handleNewQuery}
        onViewSchema={() => { setIsSchemaModalOpen(true); setIsHistoryOpen(false); }}
      />

      <main className="flex-1 flex flex-col h-full overflow-hidden relative w-full">
        {/* Navbar */}
        <div className="flex-shrink-0 h-16 px-6 flex items-center justify-between z-20">
            <button onClick={() => setIsHistoryOpen(true)} className="p-2 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300">
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>
            </button>
            <div className="flex items-center gap-4">
                 <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 rounded-full hover:bg-slate-200/50 dark:hover:bg-slate-800 text-slate-500">
                   {isDarkMode ? <svg className="w-5 h-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" /></svg> : <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" /></svg>}
                 </button>
                 {user ? (
                   <div className="flex items-center gap-4">
                     <div className="flex flex-col items-start border-l-2 border-slate-200 dark:border-slate-600 pl-4">
                       <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{user.name}</span>
                       <button onClick={handleLogout} className="text-sm font-medium text-blue-500 hover:text-blue-600 transition-colors">Sign Out</button>
                     </div>
                     <button 
                       onClick={() => setIsProfileModalOpen(true)} 
                       className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-lg font-bold shadow-lg hover:shadow-xl transition-all hover:scale-105"
                     >
                       {user.name.charAt(0).toLowerCase()}
                     </button>
                   </div>
                 ) : (
                   <button onClick={() => { setAuthModalConfig({ register: false, message: '' }); setIsLoginModalOpen(true); }} className="px-6 py-2 rounded-lg bg-blue-600 text-white text-sm font-bold shadow-md hover:bg-blue-700 transition-all">Login</button>
                 )}
            </div>
        </div>

        <div ref={mainScrollRef} className="flex-1 overflow-y-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-20">
                {status === QueryStatus.IDLE ? (
                    <div className="flex flex-col items-center pt-12 animate-fade-in">
                        {/* Database Animated Logo Header */}
                        <div className="w-24 h-24 bg-white dark:bg-slate-800 rounded-3xl shadow-xl flex items-center justify-center mb-8 border border-slate-100 dark:border-slate-700 relative overflow-visible">
                           <DatabaseLogo />
                        </div>
                        <h1 className="text-5xl font-black text-slate-900 dark:text-white mb-4 text-center">
                            AI Based <br/>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">Natural Query System</span>
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 text-center max-w-xl mb-10 leading-relaxed">
                            {dataSource === 'custom' 
                              ? "Analyze your own Excel, CSV, or JSON datasets with natural language. Upload your files and start asking questions."
                              : "Transform natural language into powerful SQL queries. Ask questions in plain English, get instant insights with advanced analytics and visualizations."}
                        </p>

                        <div className="flex items-center bg-white dark:bg-slate-800 p-1 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm mb-12">
                            <button onClick={() => setDataSource('demo')} className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${dataSource === 'demo' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>Use Demo Database</button>
                            <button onClick={handleAnalyzeMyDataClick} className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${dataSource === 'custom' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-slate-400 hover:text-slate-600'}`}>
                                {dataSource !== 'custom' && <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" /></svg>}
                                Analyze My Data
                            </button>
                        </div>

                        {dataSource === 'custom' && uploadedFiles.length === 0 ? (
                            <FileUpload 
                              onUploadComplete={(names) => setUploadedFiles(names)}
                              onSharedDatasetSelect={(context, label) => {
                                setSharedDatasetContext(context);
                                setUploadedFiles([label]);
                              }}
                            />
                        ) : (
                            <div className="w-full max-w-3xl mb-12">
                                <InputSection onSearch={handleSearch} isLoading={false} />
                                <div className="flex justify-center mt-4 flex-col items-center gap-2">
                                    <div className="flex items-center gap-2 px-3 py-1 bg-white dark:bg-slate-800 rounded-full border border-slate-100 dark:border-slate-700 shadow-sm">
                                        <div className={`w-2 h-2 rounded-full ${dataSource === 'custom' ? 'bg-blue-500' : 'bg-emerald-500'}`}></div>
                                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                                            {dataSource === 'custom' 
                                              ? `${uploadedFiles.length} File(s) Ready for Analysis` 
                                              : 'Retail E-Commerce Dataset Active'}
                                        </span>
                                    </div>
                                    {dataSource === 'custom' && (
                                      <button 
                                        onClick={() => { setUploadedFiles([]); setSharedDatasetContext(undefined); }} 
                                        className="text-[10px] text-blue-600 dark:text-blue-400 font-bold hover:underline"
                                      >
                                        Change Files
                                      </button>
                                    )}
                                </div>
                            </div>
                        )}

                        {dataSource === 'demo' && (
                          <div className="w-full mb-16">
                              <div className="flex items-center justify-center gap-4 mb-8">
                                  <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1"></div>
                                  <div className="flex flex-col items-center gap-2">
                                    <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em]">Available Data</span>
                                    <button 
                                        onClick={() => setIsSchemaModalOpen(true)}
                                        className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                                    >
                                        View Data Schema
                                    </button>
                                  </div>
                                  <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1"></div>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                  {DB_SCHEMA.slice(0, 4).map((table, i) => (
                                      <div 
                                        key={table.tableName} 
                                        onClick={() => setIsSchemaModalOpen(true)}
                                        className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all text-center group cursor-pointer"
                                      >
                                          <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                                              {i === 0 && <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>}
                                              {i === 1 && <svg className="w-6 h-6 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25" /></svg>}
                                              {i === 2 && <svg className="w-6 h-6 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-1.243 1.267-3.418.309-4.815a.75.75 0 01.12-.119L18.525 7.5a.75.75 0 00-.58-1.25H6.551l-.574-2.152a2.25 2.25 0 00-2.148-1.673H2.25" /></svg>}
                                              {i === 3 && <svg className="w-6 h-6 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25a2.25 2.25 0 01-2.25-2.25v-2.25z" /></svg>}
                                          </div>
                                          <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-1 capitalize">{table.tableName}</h4>
                                          <p className="text-[10px] text-slate-500 leading-tight">{table.description}</p>
                                      </div>
                                  ))}
                              </div>
                          </div>
                        )}

                        <div className="w-full">
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6 text-center">
                              Try These Example Queries
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {SUGGESTED_QUERIES.map((q, i) => (
                                    <button 
                                        key={i} 
                                        onClick={() => handleSearch(q)}
                                        className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm text-left hover:border-blue-500 dark:hover:border-blue-400 transition-all group"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-[10px] font-black text-blue-600/50 uppercase tracking-widest">{dataSource === 'custom' ? 'Custom' : 'Demo'}</span>
                                            <svg className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
                                        </div>
                                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300 leading-snug">{q}</p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Powerful Features Section */}
                        <PowerfulFeatures onVoiceCommandClick={() => {
                          // Focus the input and trigger voice recognition
                          const inputElement = document.querySelector('input[placeholder="Ask anything about your data..."]') as HTMLInputElement;
                          if (inputElement) {
                            inputElement.focus();
                          }
                        }} />
                    </div>
                ) : (
                    <div className="pt-4 animate-slide-up">
                        {status === QueryStatus.PROCESSING ? (
                            <div className="max-w-4xl mx-auto space-y-8 mt-12 animate-pulse">
                                <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-3xl"></div>
                                <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-3xl"></div>
                            </div>
                        ) : errorMsg ? (
                            <div className="max-w-2xl mx-auto mt-12 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 p-8 rounded-3xl text-center">
                                <h3 className="text-red-600 font-bold mb-2">Query Failed</h3>
                                <p className="text-sm text-red-500">{errorMsg}</p>
                                <button onClick={handleNewQuery} className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg font-bold">Try Again</button>
                            </div>
                        ) : result && (
                            <div className="space-y-8 pb-12">
                                <button onClick={handleNewQuery} className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"/></svg> Back to Dashboard
                                </button>

                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 p-8">
                                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">AI Interpretation</h3>
                                        <p className="text-xl font-bold leading-relaxed text-slate-800 dark:text-slate-100">{result.naturalLanguageSummary}</p>
                                    </div>
                                    <div className="bg-gradient-to-br from-blue-600 to-cyan-500 rounded-3xl p-8 text-white shadow-lg">
                                        <h3 className="text-xs font-black text-blue-100 uppercase tracking-widest mb-4">SQL Logic</h3>
                                        <p className="text-sm font-medium italic opacity-90 leading-relaxed">"{result.optimizationFeedback || "Query refined for maximum performance."}"</p>
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
                                    <div className="flex border-b border-slate-100 dark:border-slate-700 px-8 pt-4 gap-10">
                                        {['table', 'viz', 'sql'].map(tab => (
                                            <button key={tab} onClick={() => setActiveTab(tab as any)} disabled={tab === 'viz' && result.visualizationSuggestion === 'none'} className={`pb-4 text-sm font-black uppercase tracking-widest transition-all relative ${activeTab === tab ? 'text-blue-600' : 'text-slate-400'} ${tab === 'viz' && result.visualizationSuggestion === 'none' ? 'opacity-20 cursor-not-allowed' : ''}`}>
                                                {tab} {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-600 rounded-t-full"></div>}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="min-h-[500px]">
                                        {activeTab === 'table' && <ResultsTable data={result.data} />}
                                        {activeTab === 'viz' && (
                                            <div className="p-10 space-y-6">
                                                <DataVisualizer result={result} isDarkMode={isDarkMode} />
                                                {result.chartDescription && (
                                                    <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-700">
                                                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Visualization Summary</h4>
                                                        <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">{result.chartDescription}</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        {activeTab === 'sql' && <div className="p-10"><SqlPreview sql={result.generatedSql} /></div>}
                                    </div>
                                </div>

                                {/* Recommendation Engine Section moved to Bottom */}
                                {result.recommendation && (
                                    <RecommendationEngine 
                                        recommendation={result.recommendation} 
                                        onFollowUpClick={handleSearch} 
                                    />
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
      </main>
    </div>
  );
};

export default App;
