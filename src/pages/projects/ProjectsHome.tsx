import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, HelpCircle } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useTranslation } from 'react-i18next';
import { PageTransition } from '@/components/layout/PageTransition';

export function ProjectsHome() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  return (
    <PageTransition>
      <div className="relative rounded-2xl p-8 md:p-10 mb-6 overflow-hidden text-white" style={{ background: 'linear-gradient(135deg, #1e40af 0%, #2563EB 60%, #60A5FA 100%)' }}>
        <span className="absolute right-[-20px] bottom-[-40px] text-[160px] font-serif italic opacity-[0.07] leading-none select-none pointer-events-none">FabLab</span>
        <div className="text-xs italic opacity-70 mb-1 font-serif">{t('projectsHome.module')}</div>
        <h1 className="text-3xl md:text-4xl font-serif mb-2">{t('sidebar.projects')}</h1>
        <p className="text-sm opacity-85 max-w-md leading-relaxed">
          {t('projectsHome.welcome')}, {user?.name?.split(' ').slice(0, 2).join(' ')}. {t('projectsHome.subtitle')}
        </p>
      </div>

      <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">{t('projectsHome.availableActions')}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {[
          { icon: <Users size={20} />, title: t('projectsHome.studentsList'), desc: t('projectsHome.studentsListDesc'), path: '/projects/students' },
          { icon: <LayoutDashboard size={20} />, title: t('app.overview'), desc: t('projectsHome.overviewDesc'), path: '/projects/dashboard' },
          { icon: <HelpCircle size={20} />, title: t('projectsHome.quizCreator'), desc: t('projectsHome.quizCreatorDesc'), path: '/projects/quiz-creator' },
        ].map((f) => (
          <button key={f.path} onClick={() => navigate(f.path)}
            className="bg-card border border-border rounded-xl p-5 text-left transition-all hover:shadow-md hover:-translate-y-0.5 hover:border-muted-foreground/30 group">
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center mb-3 group-hover:gift-bg group-hover:gift-primary transition-colors">
              <span className="text-muted-foreground group-hover:gift-primary transition-colors">{f.icon}</span>
            </div>
            <div className="font-bold text-sm mb-0.5">{f.title}</div>
            <div className="text-xs text-muted-foreground">{f.desc}</div>
          </button>
        ))}
      </div>
    </PageTransition>
  );
}
