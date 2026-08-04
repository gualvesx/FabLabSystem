/**
 * AppLayout.tsx — FabLab Platform
 * Layout principal da aplicação autenticada.
 * Gerencia: autenticação, módulos, sidebar, topbar e popup de unidade.
 *
 * Módulos disponíveis:
 *   - fablab: gestão do laboratório
 *   - projects: módulo de projetos (inclui altas habilidades, maker, etc.)
 *   - student: área do aluno
 */
import { useState, useEffect, useRef } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { TopBar } from './TopBar';
import { Sidebar } from './Sidebar';
import { UnitSelectPopup } from '@/components/UnitSelectPopup';
import { useAuthStore } from '@/stores/authStore';
import { useThemeStore } from '@/stores/themeStore';
import { useLanguageStore } from '@/stores/languageStore';
import { useClassStore } from '@/stores/classStore';
import type { AppModule } from '@/types';
import i18n from '@/i18n';

export function AppLayout() {
  const { user, isAuthenticated } = useAuthStore();
  const { isDark } = useThemeStore();
  const { lang } = useLanguageStore();
  const { classes, fetchClasses } = useClassStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed] = useState(false);
  const mainRef = useRef<HTMLElement>(null);

  // Carrega classes uma vez
  useEffect(() => { if (classes.length === 0) fetchClasses(); }, []);

  // Guarda de rota: redireciona se não autenticado ou sem permissão
  useEffect(() => {
    if (!isAuthenticated) { navigate('/landing'); return; }

    // Alunos sempre vão para área do aluno
    if (user?.role === 'student' && !location.pathname.startsWith('/student')) {
      navigate('/student/quiz');
      return;
    }

    // Verifica permissões por classe
    if (user && user.role !== 'admin') {
      const cls = classes.find(c => c.id === user.class_id);
      if (cls) {
        const allowed = cls.permissions.filter(p => p.allowed).map(p => p.route as string);
        const currentPath = location.pathname;
        const isAllowed = allowed.some(r => currentPath.startsWith(r));
        if (!isAllowed && currentPath !== '/' && allowed.length > 0) {
          navigate(allowed[0]);
        }
      }
    }
  }, [isAuthenticated, user, navigate, location, classes]);

  // Aplica tema escuro/claro
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  // Aplica idioma
  useEffect(() => { i18n.changeLanguage(lang); }, [lang]);

  if (!isAuthenticated || !user) return null;

  /** Detecta módulo ativo baseado na URL */
  const getActiveModule = (): AppModule => {
    if (location.pathname.startsWith('/fablab'))   return 'fablab';
    if (location.pathname.startsWith('/projects')) return 'projects';
    return 'student';
  };

  /** Navega para o módulo selecionado na TopBar */
  const handleModuleChange = (mod: AppModule) => {
    if (mod === 'fablab')   navigate('/fablab/home');
    if (mod === 'projects') navigate('/projects/home');
  };

  const activeModule = getActiveModule();

  if (user.role === 'student') {
    return (
      <div className="h-full flex flex-col bg-background">
        <UnitSelectPopup />
        <TopBar activeModule="student" onModuleChange={() => {}} />
        <div className="flex flex-1 min-h-0 overflow-hidden">
          <Sidebar module="student" role={user.role} collapsed={collapsed} />
          <main ref={mainRef} className="flex-1 p-6 lg:p-8 overflow-y-auto focus:outline-none" tabIndex={-1}>
            <Outlet />
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Popup de seleção de unidade — aparece na primeira visita */}
      <UnitSelectPopup />
      <TopBar activeModule={activeModule} onModuleChange={handleModuleChange} />
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <Sidebar module={activeModule} role={user.role} collapsed={collapsed} />
        <main ref={mainRef} className="flex-1 p-6 lg:p-8 overflow-y-auto focus:outline-none" tabIndex={-1}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
