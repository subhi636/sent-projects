import { useState, useEffect, createContext, useContext } from 'react';
import type { Language } from '@/types';
import { t } from '@/lib/i18n';
import HomePage from '@/sections/HomePage';
import AdminDashboard from '@/sections/AdminDashboard';
import LoginPage from '@/sections/LoginPage';
import { Toaster } from '@/components/ui/sonner';

interface AppContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  isAuthenticated: boolean;
  setIsAuthenticated: (auth: boolean) => void;
  t: (key: string) => string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}

function App() {
  const [language, setLanguage] = useState<Language>('ar');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentPage, setCurrentPage] = useState<'home' | 'admin' | 'login'>('home');

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
    }

    // Set direction based on language
    document.body.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.body.setAttribute('dir', language === 'ar' ? 'rtl' : 'ltr');
  }, [language]);

  const handleLogin = () => {
    setIsAuthenticated(true);
    setCurrentPage('admin');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setCurrentPage('home');
  };

  const translate = (key: string) => t(key, language);

  const renderPage = () => {
    switch (currentPage) {
      case 'admin':
        return isAuthenticated ? (
          <AdminDashboard onLogout={handleLogout} />
        ) : (
          <LoginPage onLogin={handleLogin} onNavigate={setCurrentPage} />
        );
      case 'login':
        return <LoginPage onLogin={handleLogin} onNavigate={setCurrentPage} />;
      default:
        return <HomePage onNavigate={setCurrentPage} />;
    }
  };

  return (
    <AppContext.Provider
      value={{
        language,
        setLanguage,
        isAuthenticated,
        setIsAuthenticated,
        t: translate,
      }}
    >
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        {/* Navigation */}
        <nav className="fixed top-0 left-0 right-0 z-50 glass">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Logo */}
              <button
                onClick={() => setCurrentPage('home')}
                className="flex items-center space-x-2 rtl:space-x-reverse"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                </div>
                <span className="text-xl font-bold gradient-text">
                  {translate('appName')}
                </span>
              </button>

              {/* Navigation Links */}
              <div className="flex items-center space-x-4 rtl:space-x-reverse">
                {/* Language Switcher */}
                <button
                  onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
                  className="btn-secondary text-sm py-2 px-3"
                >
                  {language === 'ar' ? 'EN' : 'AR'}
                </button>

                {/* Admin Link */}
                {isAuthenticated ? (
                  <button
                    onClick={() => setCurrentPage('admin')}
                    className="btn-primary text-sm py-2 px-4"
                  >
                    {translate('dashboard')}
                  </button>
                ) : (
                  <button
                    onClick={() => setCurrentPage('login')}
                    className="text-slate-400 hover:text-white transition-colors text-sm"
                  >
                    {translate('admin')}
                  </button>
                )}
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="pt-16">
          {renderPage()}
        </main>

        {/* Footer */}
        <footer className="py-8 border-t border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <p className="text-slate-500 text-sm">
                {translate('footerText')}
              </p>
              <div className="flex items-center space-x-4 rtl:space-x-reverse mt-4 md:mt-0">
                <span className="text-slate-600 text-sm">Sent Projects</span>
              </div>
            </div>
          </div>
        </footer>

        {/* Toast Notifications */}
        <Toaster 
          position={language === 'ar' ? 'top-left' : 'top-right'}
          toastOptions={{
            style: {
              background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#f8fafc',
            },
          }}
        />
      </div>
    </AppContext.Provider>
  );
}

export default App;
