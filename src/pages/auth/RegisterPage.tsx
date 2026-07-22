import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase';

const FABLAB_LOGO_URL = 'https://images.seeklogo.com/logo-png/20/2/fablab-logo-png_seeklogo-203707.png';

export function RegisterPage() {
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', role: 'professor', unit: 'FabLab SP' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { t } = useTranslation();

  const setF = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email) return;
    setError('');
    setSaving(true);

    const { error: err } = await supabase.from('users').insert({
      name: form.name,
      email: form.email,
      role: form.role,
      unit: form.unit,
      active: false,
    });

    setSaving(false);
    if (err) {
      setError(t('registerPage.sendError'));
    } else {
      setSent(true);
    }
  };

  const BG = (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #0a0f1e 0%, #0d1b2a 45%, #091015 100%)' }} />
      <div className="absolute rounded-full" style={{ width: 600, height: 600, top: -200, right: -100, background: 'radial-gradient(circle, rgba(29,78,216,0.2) 0%, transparent 65%)', animation: 'float 7s ease-in-out infinite' }} />
      <div className="absolute rounded-full" style={{ width: 400, height: 400, bottom: -100, left: -100, background: 'radial-gradient(circle, rgba(5,150,105,0.15) 0%, transparent 65%)', animation: 'float 10s ease-in-out infinite reverse' }} />
      <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.6) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.6) 1px,transparent 1px)', backgroundSize: '48px 48px' }} />
    </div>
  );

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center relative px-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
        {BG}
        <div className="relative z-10 w-full max-w-md">
          <div className="flex flex-col items-center mb-8">
            <img src={FABLAB_LOGO_URL} alt="FabLab" className="h-14 mb-3 object-contain" style={{ filter: 'brightness(0) invert(1)' }} />
            <p className="text-white/50 text-sm tracking-widest uppercase">{t('loginPage.platform')}</p>
          </div>
          <div className="rounded-2xl border border-white/10 p-8" style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(16px)' }}>
            <div className="flex flex-col items-center text-center py-4">
              <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4" style={{ background: 'rgba(5,150,105,0.15)' }}>
                <CheckCircle size={28} className="text-green-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">{t('registerPage.requestSent')}</h2>
              <p className="text-white/50 text-sm mb-6">{t('auth.successMessage')}</p>
              <button onClick={() => navigate('/login')} className="text-blue-400 hover:text-blue-300 text-sm transition-colors flex items-center gap-1.5">
                ← {t('auth.backToLogin')}
              </button>
            </div>
          </div>
          <p className="text-center text-white/20 text-xs mt-6">{t('loginPage.footer')}</p>
        </div>
      </div>
    );
  }

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
          <img src={FABLAB_LOGO_URL} alt="FabLab" className="h-14 mb-3 object-contain" style={{ filter: 'brightness(0) invert(1)' }} />
          <p className="text-white/50 text-sm tracking-widest uppercase">{t('loginPage.platform')}</p>
        </div>

        <div className="rounded-2xl border border-white/10 p-8" style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(16px)' }}>
          <h1 className="text-2xl font-bold text-white mb-1">{t('auth.registerTitle')}</h1>
          <p className="text-white/40 text-sm mb-6">{t('auth.registerSubtitle')}</p>

          {error && (
            <div className="p-3 rounded-lg mb-4 text-sm flex items-center gap-2" style={{ background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.25)', color: '#f87171' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-white/70 text-xs uppercase tracking-wider mb-1.5 block">{t('auth.nameLabel')}</Label>
              <Input
                value={form.name}
                onChange={(e) => setF('name', e.target.value)}
                placeholder={t('auth.namePlaceholder')}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-blue-500"
              />
            </div>
            <div>
              <Label className="text-white/70 text-xs uppercase tracking-wider mb-1.5 block">{t('auth.emailLabel')}</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setF('email', e.target.value)}
                placeholder={t('auth.emailPlaceholder')}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-blue-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-white/70 text-xs uppercase tracking-wider mb-1.5 block">{t('auth.roleLabel')}</Label>
                <select
                  value={form.role}
                  onChange={(e) => setF('role', e.target.value)}
                  className="w-full h-10 px-3 rounded-md text-sm text-white"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  <option value="professor" style={{ background: '#0d1b2a' }}>{t('roles.professor')}</option>
                  <option value="funcionario" style={{ background: '#0d1b2a' }}>{t('roles.funcionario')}</option>
                </select>
              </div>
              <div>
                <Label className="text-white/70 text-xs uppercase tracking-wider mb-1.5 block">{t('auth.unitLabel')}</Label>
                <Input
                  value={form.unit}
                  onChange={(e) => setF('unit', e.target.value)}
                  placeholder={t('auth.unitPlaceholder')}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-blue-500"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full font-semibold text-white mt-2"
              disabled={saving}
              style={{ background: '#1D4ED8' }}
            >
              {saving ? t('auth.registering') : t('auth.registerButton')}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm">
            <button onClick={() => navigate('/login')} className="text-white/40 hover:text-white/70 transition-colors">
              ← {t('auth.backToLogin')}
            </button>
          </div>
        </div>

        <p className="text-center text-white/20 text-xs mt-6">{t('loginPage.footer')}</p>
      </div>
    </div>
  );
}
