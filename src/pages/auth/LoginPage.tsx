/**
 * LoginPage.tsx — FabLab Platform
 * Página de login com design maker/industrial + logo oficial.
 */
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle, ArrowLeft, Loader2, Mail, CheckCircle2, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/stores/authStore';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';

const FABLAB_LOGO_URL = 'https://images.seeklogo.com/logo-png/20/2/fablab-logo-png_seeklogo-203707.png';

type View = 'login' | 'forgot' | 'forgot-sent';

export function LoginPage() {
  const { t } = useTranslation();
  const [view, setView] = useState<View>('login');

  // ── Estado de login ──────────────────────────────────────
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // ── Estado de esqueci senha ──────────────────────────────
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');

  const { login } = useAuthStore();
  const navigate = useNavigate();

  /* ── Submit login ─────────────────────────────────────── */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError(t('loginPage.fillAllFields')); return; }
    setError(''); setLoading(true);
    const ok = await login(email, password);
    setLoading(false);
    if (ok) navigate('/');
    else setError(t('loginPage.invalidCredentials'));
  };

  /* ── Submit esqueci senha (fluxo nativo Supabase) ─────── */
  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setForgotError(''); setForgotLoading(true);
    // redirectTo: após trocar senha o Supabase redireciona para a URL do projeto
    const { error: err } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: `${window.location.origin}/`,
    });
    setForgotLoading(false);
    if (err) setForgotError(t('loginPage.sendEmailError'));
    else setView('forgot-sent');
  };

  /* ── Background decorativo ────────────────────────────── */
  const BG = (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute inset-0" style={{
        background: 'linear-gradient(135deg, #0a0f1e 0%, #0d1b2a 45%, #091015 100%)'
      }} />
      {/* Orbs azul e verde */}
      <div className="absolute rounded-full" style={{
        width: 600, height: 600, top: -200, right: -100,
        background: 'radial-gradient(circle, rgba(29,78,216,0.2) 0%, transparent 65%)',
        animation: 'float 7s ease-in-out infinite',
      }} />
      <div className="absolute rounded-full" style={{
        width: 400, height: 400, bottom: -100, left: -100,
        background: 'radial-gradient(circle, rgba(5,150,105,0.15) 0%, transparent 65%)',
        animation: 'float 10s ease-in-out infinite reverse',
      }} />
      {/* Grid maker */}
      <div className="absolute inset-0 opacity-[0.04]" style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,.6) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.6) 1px,transparent 1px)',
        backgroundSize: '48px 48px'
      }} />
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center relative px-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      {BG}

      <div className="relative z-10 w-full max-w-md">
        {/* Back to home */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 text-white/40 hover:text-white/70 text-sm mb-6 transition-colors"
        >
          <Home size={14} /> {t('loginPage.backToHome')}
        </button>

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <img
            src={FABLAB_LOGO_URL}
            alt="FabLab Logo"
            className="h-14 mb-3 object-contain"
            style={{ filter: 'brightness(0) invert(1)' }}
          />
          <p className="text-white/50 text-sm tracking-widest uppercase">{t('loginPage.platform')}</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-white/10 p-8" style={{
          background: 'rgba(255,255,255,0.04)',
          backdropFilter: 'blur(16px)',
        }}>
          <AnimatePresence mode="wait">

            {/* ── LOGIN ── */}
            {view === 'login' && (
              <motion.div key="login" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
                <h1 className="text-2xl font-bold text-white mb-1">{t('app.login')}</h1>
                <p className="text-white/40 text-sm mb-6">{t('loginPage.subtitle')}</p>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <Label className="text-white/70 text-xs uppercase tracking-wider mb-1.5 block">{t('app.email')}</Label>
                    <Input
                      type="email" value={email} onChange={e => setEmail(e.target.value)}
                      placeholder="seu@email.com" autoComplete="email"
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <Label className="text-white/70 text-xs uppercase tracking-wider mb-1.5 block">{t('app.password')}</Label>
                    <div className="relative">
                      <Input
                        type={showPw ? 'text' : 'password'} value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="••••••••" autoComplete="current-password"
                        className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-blue-500 pr-10"
                      />
                      <button type="button" onClick={() => setShowPw(p => !p)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                        {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 text-red-400 text-sm">
                      <AlertCircle size={14} /> <span>{error}</span>
                    </div>
                  )}

                  <Button type="submit" disabled={loading} className="w-full font-semibold" style={{ background: '#1D4ED8' }}>
                    {loading ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
                    {loading ? t('auth.loggingIn') : t('app.login')}
                  </Button>
                </form>

                <div className="mt-4 flex items-center justify-between text-sm">
                  <button onClick={() => { setView('forgot'); setForgotEmail(email); }}
                    className="text-blue-400 hover:text-blue-300 transition-colors">
                    {t('loginPage.forgotPassword')}
                  </button>
                  <Link to="/register" className="text-white/40 hover:text-white/70 transition-colors">
                    {t('loginPage.register')}
                  </Link>
                </div>
              </motion.div>
            )}

            {/* ── ESQUECI SENHA ── */}
            {view === 'forgot' && (
              <motion.div key="forgot" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
                <button onClick={() => setView('login')} className="flex items-center gap-1.5 text-white/40 hover:text-white/70 text-sm mb-6 transition-colors">
                  <ArrowLeft size={14} /> {t('app.back')}
                </button>
                <h1 className="text-2xl font-bold text-white mb-1">{t('loginPage.recoverPassword')}</h1>
                <p className="text-white/40 text-sm mb-6">
                  {t('loginPage.recoverDesc')}
                </p>
                <form onSubmit={handleForgot} className="space-y-4">
                  <div>
                    <Label className="text-white/70 text-xs uppercase tracking-wider mb-1.5 block">{t('app.email')}</Label>
                    <Input
                      type="email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)}
                      placeholder="seu@email.com"
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-blue-500"
                    />
                  </div>
                  {forgotError && (
                    <div className="flex items-center gap-2 text-red-400 text-sm">
                      <AlertCircle size={14} /> <span>{forgotError}</span>
                    </div>
                  )}
                  <Button type="submit" disabled={forgotLoading} className="w-full font-semibold" style={{ background: '#1D4ED8' }}>
                    {forgotLoading ? <Loader2 size={16} className="animate-spin mr-2" /> : <Mail size={16} className="mr-2" />}
                    {forgotLoading ? t('loginPage.sending') : t('loginPage.sendRecoveryLink')}
                  </Button>
                </form>
              </motion.div>
            )}

            {/* ── EMAIL ENVIADO ── */}
            {view === 'forgot-sent' && (
              <motion.div key="sent" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-4">
                <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(5,150,105,0.15)' }}>
                  <CheckCircle2 size={28} className="text-green-400" />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">{t('loginPage.emailSent')}</h2>
                <p className="text-white/50 text-sm mb-6">
                  {t('loginPage.emailSentDesc')}
                </p>
                <button onClick={() => setView('login')} className="text-blue-400 hover:text-blue-300 text-sm transition-colors">
                  {t('loginPage.backToLogin')}
                </button>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        <p className="text-center text-white/20 text-xs mt-6">
          {t('loginPage.footer')}
        </p>
      </div>
    </div>
  );
}
