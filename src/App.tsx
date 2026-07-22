/**
 * App.tsx — FabLab Platform
 * Definição de rotas da aplicação.
 *
 * Módulos:
 *   /landing           → Landing page pública (FabLab MIT)
 *   /login, /register  → Autenticação
 *   /fablab/*          → Gestão do laboratório
 *   /projects/*        → Projetos (ex-Gifted + novos tipos)
 *   /student/*         → Área do aluno
 *
 * Lazy loading em todas as páginas de app para melhor performance.
 * Para adicionar novas rotas: importe o componente com lazy() e adicione o <Route>.
 */
import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';

// Carregamento eager — sempre necessário
import { LoginPage }        from '@/pages/auth/LoginPage';
import { RegisterPage }     from '@/pages/auth/RegisterPage';
import { LandingPage }      from '@/pages/LandingPage';
import { PublicBlog }       from '@/pages/landing/PublicBlog';
import { PublicUnidades }   from '@/pages/landing/PublicUnidades';

// ── FabLab (lazy) ────────────────────────────────────────────
const FabHome        = lazy(() => import('@/pages/fablab/FabHome').then(m => ({ default: m.FabHome })));
const FabDashboard   = lazy(() => import('@/pages/fablab/FabDashboard').then(m => ({ default: m.FabDashboard })));
const FabInventory   = lazy(() => import('@/pages/fablab/FabInventory').then(m => ({ default: m.FabInventory })));
const FabMaintenance = lazy(() => import('@/pages/fablab/FabMaintenance').then(m => ({ default: m.FabMaintenance })));
const FabMachinery   = lazy(() => import('@/pages/fablab/FabMachinery').then(m => ({ default: m.FabMachinery })));
const FabFiles       = lazy(() => import('@/pages/fablab/FabFiles').then(m => ({ default: m.FabFiles })));
const FabSchedule    = lazy(() => import('@/pages/fablab/FabSchedule').then(m => ({ default: m.FabSchedule })));
const FabSuggestions = lazy(() => import('@/pages/fablab/FabSuggestions').then(m => ({ default: m.FabSuggestions })));
const FabReports     = lazy(() => import('@/pages/fablab/FabReports').then(m => ({ default: m.FabReports })));
const FabUsers       = lazy(() => import('@/pages/fablab/FabUsers').then(m => ({ default: m.FabUsers })));
const FabBlog        = lazy(() => import('@/pages/fablab/FabBlog').then(m => ({ default: m.FabBlog })));

// ── Projetos (lazy) — substitui Gifted ──────────────────────
const ProjectsHome     = lazy(() => import('@/pages/projects/ProjectsHome').then(m => ({ default: m.ProjectsHome })));
const ProjectsDashboard= lazy(() => import('@/pages/projects/ProjectsDashboard').then(m => ({ default: m.ProjectsDashboard })));
const ProjectsStudents = lazy(() => import('@/pages/projects/ProjectsStudents').then(m => ({ default: m.ProjectsStudents })));
const ProjectsManage   = lazy(() => import('@/pages/projects/ProjectsManage').then(m => ({ default: m.ProjectsManage })));
const StudentProfile   = lazy(() => import('@/pages/projects/StudentProfile').then(m => ({ default: m.StudentProfile })));
const QuizCreator      = lazy(() => import('@/pages/projects/QuizCreator').then(m => ({ default: m.QuizCreator })));

// ── Área do aluno (lazy) ─────────────────────────────────────
const StudentHome     = lazy(() => import('@/pages/student/StudentHome').then(m => ({ default: m.StudentHome })));
const StudentQuiz     = lazy(() => import('@/pages/student/StudentQuiz').then(m => ({ default: m.StudentQuiz })));
const StudentGrades   = lazy(() => import('@/pages/student/StudentGrades').then(m => ({ default: m.StudentGrades })));
const StudentProposal = lazy(() => import('@/pages/student/StudentProposal').then(m => ({ default: m.StudentProposal })));

/** Spinner de carregamento de página */
function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64 gap-3 text-muted-foreground">
      <div className="w-5 h-5 border-2 border-border border-t-blue-500 rounded-full animate-spin" />
      <span className="text-sm">Carregando...</span>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      {/* ── Públicas ── */}
      <Route path="/landing"           element={<LandingPage />} />
      <Route path="/landing/blog"      element={<PublicBlog />} />
      <Route path="/landing/unidades"  element={<PublicUnidades />} />
      <Route path="/login"    element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* ── App protegido ── */}
      <Route path="/" element={<AppLayout />}>
        <Route index element={<Navigate to="/fablab/home" replace />} />

        {/* FabLab */}
        <Route path="fablab/home"          element={<Suspense fallback={<PageLoader />}><FabHome /></Suspense>} />
        <Route path="fablab/dashboard"     element={<Suspense fallback={<PageLoader />}><FabDashboard /></Suspense>} />
        <Route path="fablab/inventory"     element={<Suspense fallback={<PageLoader />}><FabInventory /></Suspense>} />
        <Route path="fablab/maintenance"   element={<Suspense fallback={<PageLoader />}><FabMaintenance /></Suspense>} />
        <Route path="fablab/machinery"     element={<Suspense fallback={<PageLoader />}><FabMachinery /></Suspense>} />
        <Route path="fablab/files"         element={<Suspense fallback={<PageLoader />}><FabFiles /></Suspense>} />
        <Route path="fablab/schedule"      element={<Suspense fallback={<PageLoader />}><FabSchedule /></Suspense>} />
        <Route path="fablab/suggestions"   element={<Suspense fallback={<PageLoader />}><FabSuggestions /></Suspense>} />
        <Route path="fablab/blog"          element={<Suspense fallback={<PageLoader />}><FabBlog /></Suspense>} />
        <Route path="fablab/reports"       element={<Suspense fallback={<PageLoader />}><FabReports /></Suspense>} />
        <Route path="fablab/users"         element={<Suspense fallback={<PageLoader />}><FabUsers /></Suspense>} />

        {/* Projetos */}
        <Route path="projects/home"         element={<Suspense fallback={<PageLoader />}><ProjectsHome /></Suspense>} />
        <Route path="projects/dashboard"    element={<Suspense fallback={<PageLoader />}><ProjectsDashboard /></Suspense>} />
        <Route path="projects/students"     element={<Suspense fallback={<PageLoader />}><ProjectsStudents /></Suspense>} />
        <Route path="projects/manage"       element={<Suspense fallback={<PageLoader />}><ProjectsManage /></Suspense>} />
        <Route path="projects/student/:id"  element={<Suspense fallback={<PageLoader />}><StudentProfile /></Suspense>} />
        <Route path="projects/quiz-creator" element={<Suspense fallback={<PageLoader />}><QuizCreator /></Suspense>} />

        {/* Área do aluno */}
        <Route path="student/home"     element={<Suspense fallback={<PageLoader />}><StudentHome /></Suspense>} />
        <Route path="student/quiz"     element={<Suspense fallback={<PageLoader />}><StudentQuiz /></Suspense>} />
        <Route path="student/grades"   element={<Suspense fallback={<PageLoader />}><StudentGrades /></Suspense>} />
        <Route path="student/proposal" element={<Suspense fallback={<PageLoader />}><StudentProposal /></Suspense>} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/landing" replace />} />
    </Routes>
  );
}
