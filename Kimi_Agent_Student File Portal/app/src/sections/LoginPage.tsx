import { useState } from 'react';
import { useApp } from '@/App';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Lock, Mail, Eye, EyeOff, ArrowLeft } from 'lucide-react';

interface LoginPageProps {
  onLogin: () => void;
  onNavigate: (page: 'home' | 'admin' | 'login') => void;
}

export default function LoginPage({ onLogin, onNavigate }: LoginPageProps) {
  const { t, language } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      toast.error(t('requiredFields'));
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:3001/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.token) {
        localStorage.setItem('token', data.token);
        toast.success('Login successful');
        onLogin();
      } else {
        toast.error(t('loginError'));
      }
    } catch (error) {
      toast.error(t('loginError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <button
          onClick={() => onNavigate('home')}
          className="flex items-center text-slate-400 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className={`w-5 h-5 ${language === 'ar' ? 'rotate-180' : ''}`} />
          <span className="ml-2 rtl:mr-2 rtl:ml-0">{t('home')}</span>
        </button>

        {/* Login Card */}
        <div className="card animate-fadeInUp">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold gradient-text">{t('adminLogin')}</h1>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div className="text-left rtl:text-right">
              <Label htmlFor="email" className="text-slate-300 mb-2 block">
                {t('email')} <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 rtl:right-3 rtl:left-auto top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className="input pl-10 rtl:pr-10 rtl:pl-4"
                  disabled={isLoading}
                  dir="ltr"
                />
              </div>
            </div>

            {/* Password */}
            <div className="text-left rtl:text-right">
              <Label htmlFor="password" className="text-slate-300 mb-2 block">
                {t('password')} <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 rtl:right-3 rtl:left-auto top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input pl-10 rtl:pr-10 rtl:pl-4"
                  disabled={isLoading}
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 rtl:left-3 rtl:right-auto top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading || !email || !password}
              className="w-full btn-primary h-12 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center space-x-2 rtl:space-x-reverse">
                  <div className="spinner w-5 h-5" />
                  <span>{t('login')}</span>
                </span>
              ) : (
                <span>{t('login')}</span>
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
