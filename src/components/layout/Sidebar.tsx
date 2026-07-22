/**
 * Sidebar.tsx — FabLab Platform
 * Barra lateral de navegação.
 * Respeita permissões por classe de usuário.
 *
 * Para adicionar novas rotas:
 *   1. Adicione em ALL_ROUTES (lib/constants.ts)
 *   2. Adicione o item no array correspondente abaixo
 *   3. Crie a rota em App.tsx
 */
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import { useClassStore } from '@/stores/classStore';
import { useEffect } from 'react';
import type { UserRole } from '@/types';
import {
  Home, LayoutDashboard, Package, Calendar, Lightbulb,
  BarChart3, Users, GraduationCap, FileText, HelpCircle,
  BookOpen, FolderKanban, Layers, Settings, AlertTriangle, FolderOpen, Cpu,
} from 'lucide-react';

interface SidebarProps {
  module: 'fablab' | 'projects' | 'student';
  role: UserRole;
  collapsed: boolean;
}

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  divider?: boolean;
  adminOnly?: boolean;
}

export function Sidebar({ module, role, collapsed }: SidebarProps) {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { classes, fetchClasses } = useClassStore();

  useEffect(() => { if (classes.length === 0) fetchClasses(); }, []);

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  /** Retorna rotas permitidas para o usuário atual (via classe ou role padrão). */
  const getAllowedRoutes = (): Set<string> => {
    if (role === 'admin') return new Set(['*']);
    if (!user?.class_id) {
      const defaults: Record<string, string[]> = {
        professor:   ['/fablab/home','/fablab/inventory','/fablab/machinery','/fablab/maintenance','/fablab/files','/fablab/schedule','/fablab/suggestions','/fablab/projects','/fablab/blog','/fablab/reports','/projects/home','/projects/dashboard','/projects/students','/projects/quiz-creator','/projects/manage'],
        funcionario: ['/fablab/home','/fablab/inventory','/fablab/machinery','/fablab/maintenance','/fablab/files','/fablab/schedule','/fablab/blog'],
        student:     ['/student/quiz','/student/grades','/student/proposal','/fablab/files','/fablab/blog'],
      };
      return new Set(defaults[role as string] || []);
    }
    const cls = classes.find(c => c.id === user.class_id);
    if (!cls) return new Set();
    return new Set(cls.permissions.filter(p => p.allowed).map(p => p.route));
  };

  const allowed = getAllowedRoutes();
  const canSee = (path: string) => allowed.has('*') || allowed.has(path);

  // ── Navegação FabLab ──────────────────────────────────────────
  const fabNav: NavItem[] = [
    { label: t('sidebar.home'),        path: '/fablab/home',        icon: <Home size={18} /> },
    { label: t('sidebar.dashboard'),     path: '/fablab/dashboard',   icon: <LayoutDashboard size={18} />, adminOnly: true },
    { divider: true, label: '', path: '', icon: null },
    { label: t('sidebar.inventory'),    path: '/fablab/inventory',   icon: <Package size={18} /> },
    { label: t('sidebar.machinery'),   path: '/fablab/machinery',   icon: <Cpu size={18} /> },
    { label: t('sidebar.files'),      path: '/fablab/files',       icon: <FolderOpen size={18} /> },
    { label: t('sidebar.schedule'),  path: '/fablab/schedule',    icon: <Calendar size={18} /> },
    { label: t('sidebar.suggestions'),     path: '/fablab/suggestions', icon: <Lightbulb size={18} /> },
    { label: t('sidebar.blog'),          path: '/fablab/blog',        icon: <BookOpen size={18} /> },
    { divider: true, label: '', path: '', icon: null },
    { label: t('sidebar.reports'),    path: '/fablab/reports',     icon: <BarChart3 size={18} /> },
    { label: t('sidebar.users'),      path: '/fablab/users',       icon: <Users size={18} />, adminOnly: true },
  ];

  // ── Navegação Projetos (substitui Gifted) ────────────────────
  const projectsNav: NavItem[] = [
    { label: t('sidebar.home'),        path: '/projects/home',         icon: <Home size={18} /> },
    { label: t('sidebar.dashboard'),     path: '/projects/dashboard',    icon: <LayoutDashboard size={18} /> },
    { divider: true, label: '', path: '', icon: null },
    { label: t('sidebar.projects'),      path: '/projects/manage',       icon: <FolderKanban size={18} /> },
    { label: t('sidebar.students'),        path: '/projects/students',     icon: <Users size={18} /> },
    { label: t('sidebar.quiz'),          path: '/projects/quiz-creator', icon: <HelpCircle size={18} /> },
  ];

  // ── Navegação Aluno ──────────────────────────────────────────
  const studentNav: NavItem[] = [
    { label: t('sidebar.myQuiz'),      path: '/student/quiz',      icon: <HelpCircle size={18} /> },
    { label: t('sidebar.myGrades'),  path: '/student/grades',    icon: <GraduationCap size={18} /> },
    { label: t('sidebar.myProposal'),path: '/student/proposal',  icon: <FileText size={18} /> },
  ];

  const navMap = { fablab: fabNav, projects: projectsNav, student: studentNav };
  const navItems = navMap[module];

  const filteredNav = navItems.filter(item => {
    if (!item.path) return true; // dividers
    if (item.adminOnly && role !== 'admin') return false;
    return canSee(item.path);
  });

  // Cor de acento por módulo
  const accentColor = module === 'fablab'
    ? '#1D4ED8'
    : module === 'projects'
      ? '#059669'
      : '#7c3aed';

  return (
    <aside
      className={cn(
        'h-[calc(100vh-64px)] sticky top-16 flex-shrink-0 flex flex-col border-r border-border transition-all duration-200 overflow-hidden',
        collapsed ? 'w-16' : 'w-56'
      )}
      style={{ background: 'var(--surface)' }}
    >
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {filteredNav.map((item, i) => {
          if (item.divider) {
            return <div key={`div-${i}`} className="my-2 border-t border-border/50 mx-2" />;
          }
          const active = isActive(item.path);
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              title={collapsed ? item.label : undefined}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                active
                  ? 'text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/60',
                collapsed && 'justify-center px-0'
              )}
              style={active ? { background: accentColor } : undefined}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              {!collapsed && <span className="truncate">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Rodapé da sidebar */}
      {!collapsed && (
        <div className="p-3 border-t border-border">
          <p className="text-[10px] text-muted-foreground text-center leading-tight">
            FabLab Platform<br />
            <span className="opacity-60">Open Source · MIT</span>
          </p>
        </div>
      )}
    </aside>
  );
}
