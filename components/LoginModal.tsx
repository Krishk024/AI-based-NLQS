
import React, { useState, useEffect } from 'react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthenticate: (email: string, password: string) => Promise<boolean>;
  onRegister: (name: string, email: string, password: string) => Promise<boolean>;
  initialRegister?: boolean;
  message?: string;
}

export const LoginModal: React.FC<LoginModalProps> = ({ 
  isOpen, 
  onClose, 
  onAuthenticate,
  onRegister,
  initialRegister = false, 
  message = '' 
}) => {
  const [isRegistering, setIsRegistering] = useState(initialRegister);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [userNotFound, setUserNotFound] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Reset or sync state when modal opens
  useEffect(() => {
    if (isOpen) {
      setIsRegistering(initialRegister);
      setError('');
      setUserNotFound(false);
      setIsSuccess(false);
      setName('');
      setEmail('');
      setPassword('');
    }
  }, [isOpen, initialRegister]);

  if (!isOpen) return null;

  const toggleMode = () => {
    setIsRegistering(!isRegistering);
    setError('');
    setUserNotFound(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setUserNotFound(false);
    
    if (!email || !password || (isRegistering && !name)) {
      setError('Please fill in all fields');
      return;
    }

    if (password.length < 6) {
        setError('Password must be at least 6 characters');
        return;
    }

    setIsLoading(true);

    try {
        if (isRegistering) {
            await onRegister(name, email, password);
        } else {
            await onAuthenticate(email, password);
        }
        
        setIsSuccess(true);
        setTimeout(() => {
            onClose();
            setIsSuccess(false);
            setIsLoading(false);
        }, 1000);

    } catch (err: any) {
        setIsLoading(false);
        if (err.message === 'USER_NOT_FOUND') {
            setUserNotFound(true);
            setError('Account not found with this email.');
        } else {
            setError(err.message || 'Authentication failed');
        }
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-up transition-colors duration-300">
        
        {isSuccess ? (
            <div className="flex flex-col items-center justify-center py-12 px-6">
                <div className="w-16 h-16 bg-teal-100 dark:bg-teal-900/30 rounded-full flex items-center justify-center mb-4 animate-scale-in">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-8 h-8 text-teal-600 dark:text-teal-400">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                </div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white">Success!</h3>
                <p className="text-slate-500 dark:text-slate-400 mt-2">
                    {isRegistering ? 'Account created successfully.' : 'Logged in successfully.'}
                </p>
            </div>
        ) : (
            <>
                {/* Context Message Banner */}
                {message && !error && (
                <div className="bg-blue-50 dark:bg-blue-900/30 px-6 py-3 border-b border-blue-100 dark:border-blue-800/50 flex items-start gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-200 leading-tight">{message}</p>
                </div>
                )}

                {/* Header */}
                <div className={`text-center ${message ? 'pt-6 pb-4' : 'p-8 pb-6'}`}>
                {!message && (
                    <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-blue-600 dark:text-blue-400 transition-all duration-300">
                    {isRegistering ? (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                        </svg>
                    )}
                    </div>
                )}
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                    {isRegistering ? 'Create Account' : 'Welcome Back'}
                </h2>
                <p className="text-slate-500 dark:text-slate-400 px-6">
                    {isRegistering ? 'Sign up to start analyzing your data' : 'Please log in to continue'}
                </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-4">
                {error && (
                    <div className="space-y-3 animate-fade-in">
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 text-sm rounded-lg text-center font-medium border border-red-100 dark:border-red-800/50">
                            {error}
                        </div>
                        {userNotFound && (
                            <button 
                                type="button"
                                onClick={toggleMode}
                                className="w-full py-2.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-bold rounded-xl border border-indigo-100 dark:border-indigo-800 transition-all hover:bg-indigo-100"
                            >
                                Register Now instead?
                            </button>
                        )}
                    </div>
                )}

                {isRegistering && (
                    <div className="space-y-1.5 animate-slide-up">
                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Full Name</label>
                        <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                            </svg>
                        </div>
                        <input 
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder-slate-400"
                            placeholder="John Doe"
                        />
                        </div>
                    </div>
                )}

                <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Email Address</label>
                    <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                        </svg>
                    </div>
                    <input 
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder-slate-400"
                        placeholder="you@example.com"
                    />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Password</label>
                    <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                        </svg>
                    </div>
                    <input 
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder-slate-400"
                        placeholder="••••••••"
                    />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400 text-white font-bold rounded-xl shadow-lg shadow-blue-200 dark:shadow-none transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
                >
                    {isLoading ? (
                    <>
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {isRegistering ? 'Creating Account...' : 'Signing In...'}
                    </>
                    ) : (
                    isRegistering ? 'Create Account' : 'Login'
                    )}
                </button>

                <div className="flex justify-between items-center text-sm pt-4 border-t border-slate-100 dark:border-slate-700">
                    <button type="button" onClick={onClose} className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-medium">
                    Cancel
                    </button>
                    <div className="flex items-center gap-1.5">
                        <span className="text-slate-500 dark:text-slate-400">
                            {isRegistering ? 'Already have an account?' : 'No account yet?'}
                        </span>
                        <button 
                            type="button" 
                            onClick={toggleMode}
                            className="text-blue-600 dark:text-blue-400 hover:underline font-bold"
                        >
                            {isRegistering ? 'Login' : 'Sign Up'}
                        </button>
                    </div>
                </div>
                </form>
            </>
        )}
      </div>
    </div>
  );
};
