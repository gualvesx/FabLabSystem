/**
 * TopBar.tsx — FabLab Platform
 * Barra superior com logo, navegação de módulos e ações do usuário.
 * Módulos: FabLab (azul), Projetos (verde), Aluno (roxo).
 */
import { useNavigate } from 'react-router-dom';
import { Sun, Moon, Globe, LogOut, FlaskConical, FolderKanban, MapPin, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuthStore } from '@/stores/authStore';
import { useThemeStore } from '@/stores/themeStore';
import { useLanguageStore, LANGUAGES } from '@/stores/languageStore';
import { useTranslation } from 'react-i18next';
import type { AppModule } from '@/types';
import { cn } from '@/lib/utils';
import { useState, useRef, useEffect } from 'react';
import { UnitSelectPopup } from '@/components/UnitSelectPopup';

interface TopBarProps {
  activeModule: AppModule;
  onModuleChange: (m: AppModule) => void;
}

export function TopBar({ activeModule, onModuleChange }: TopBarProps) {
  const { user, logout } = useAuthStore();
  const { isDark, toggle: toggleTheme } = useThemeStore();
  const { lang, setLang } = useLanguageStore();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [showUnitPicker, setShowUnitPicker] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const currentLang = LANGUAGES.find(l => l.code === lang) ?? LANGUAGES[0];

  const isFab      = activeModule === 'fablab';
  const isProjects = activeModule === 'projects';
  const isStudent  = user?.role === 'student';

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <>
      <header className="h-16 bg-card border-b border-border flex items-center px-4 gap-4 sticky top-0 z-50 shadow-sm">
        {/* Logo */}
        <button
          onClick={() => navigate('/landing')}
          className="flex items-center gap-2 hover:opacity-75 transition-opacity flex-shrink-0"
        >
          <img
            src="https://images.seeklogo.com/logo-png/20/2/fablab-logo-png_seeklogo-203707.png"
            alt="FabLab"
            className="h-8 w-auto object-contain dark:invert"
          />
        </button>

        <div className="w-px h-7 bg-border" />

        {/* Módulos */}
        <div className="flex gap-1 flex-1">
          {!isStudent && (
            <>
              <button
                onClick={() => onModuleChange('fablab')}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all',
                  isFab
                    ? 'text-white'
                    : 'text-muted-foreground hover:bg-muted'
                )}
                style={isFab ? { background: '#1D4ED8' } : undefined}
              >
                <FlaskConical size={15} />
                {t('modules.fablab')}
              </button>
              <button
                onClick={() => onModuleChange('projects')}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all',
                  isProjects
                    ? 'text-white'
                    : 'text-muted-foreground hover:bg-muted'
                )}
                style={isProjects ? { background: '#059669' } : undefined}
              >
                <FolderKanban size={15} />
                {t('sidebar.projects')}
              </button>
            </>
          )}
          {isStudent && (
            <span className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-white rounded-lg" style={{ background: '#7c3aed' }}>
              <FolderKanban size={15} />
              {t('modules.student')}
            </span>
          )}
        </div>

        {/* Ações */}
        <div className="flex items-center gap-1">
          {/* Unidade atual */}
          {user?.unit && (
            <button
              onClick={() => setShowUnitPicker(true)}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-muted-foreground hover:bg-muted transition-colors"
              title={t('topbar.changeUnit')}
            >
              <MapPin size={12} />
              <span className="max-w-[100px] truncate">{user.unit}</span>
            </button>
          )}

          <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-9 w-9" title={isDark ? t('topbar.lightMode') : t('topbar.darkMode')}>
            {isDark ? <Sun size={17} /> : <Moon size={17} />}
          </Button>

          <div ref={langRef} className="relative">
            <Button variant="ghost" size="sm" onClick={() => setLangOpen(o => !o)}
              className="h-9 px-2 text-xs font-bold gap-1">
              <Globe size={13} />
              <span>{currentLang.flag}</span>
              <span className="hidden sm:inline">{currentLang.code.toUpperCase()}</span>
              <ChevronDown size={11} className={`transition-transform ${langOpen ? 'rotate-180' : ''}`} />
            </Button>
            {langOpen && (
              <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden min-w-[140px]">
                {LANGUAGES.map(l => (
                  <button key={l.code} onClick={() => { setLang(l.code); setLangOpen(false); }}
                    className={cn(
                      'w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors hover:bg-muted text-left',
                      lang === l.code ? 'font-bold text-primary bg-primary/5' : 'text-foreground'
                    )}>
                    <span className="text-base">{l.flag}</span>
                    <span>{l.label}</span>
                    {lang === l.code && <span className="ml-auto text-primary text-[10px]">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="w-px h-7 bg-border mx-1" />

          {/* Avatar + info */}
          <div className="flex items-center gap-2 px-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback
                className="text-xs font-bold text-white"
                style={{ background: isFab ? '#1D4ED8' : isProjects ? '#059669' : '#7c3aed' }}
              >
                {user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="hidden md:block">
              <div className="text-sm font-semibold leading-tight">{user?.name?.split(' ').slice(0, 2).join(' ')}</div>
              <div className="text-xs text-muted-foreground capitalize">{user?.role ? t(`roles.${user.role}`) : ''}</div>
            </div>
          </div>

          <Button variant="ghost" size="icon" onClick={handleLogout} className="h-9 w-9 text-muted-foreground hover:text-destructive" title={t('app.logout')}>
            <LogOut size={17} />
          </Button>
        </div>
      </header>

      {/* Picker de unidade (forçado pelo botão) */}
      {showUnitPicker && (
        <UnitSelectPopup forceOpen onClose={() => setShowUnitPicker(false)} />
      )}
    </>
  );
}
