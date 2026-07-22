/**
 * constants.ts — FabLab Platform
 * Constantes globais compartilhadas por toda a aplicação.
 * Open Source: adicione novas constantes aqui ao invés de hard-code nos componentes.
 */

// ── Áreas de habilidade (Inteligências Múltiplas - Howard Gardner) ──
export const SKILL_AREAS = [
  'Lógico-Matemática', 'Linguística', 'Espacial',
  'Musical', 'Naturalista', 'Interpessoal', 'Intrapessoal', 'Criatividade',
];

// ── Categorias de inventário ─────────────────────────────────────
export const INV_CATS = [
  'Equipamento', 'Eletrônico', 'Ferramenta',
  'Insumo', 'Material', 'Consumível', 'EPI', 'Outro',
] as const;

export const UNIT_MEASURES = [
  'un', 'kg', 'g', 'L', 'mL', 'm', 'cm', 'rolo', 'caixa', 'par', 'kit',
] as const;

// ── Rótulos de perfil ────────────────────────────────────────────
export const ROLE_LABELS: Record<string, string> = {
  admin:       'Administrador',
  professor:   'Professor',
  funcionario: 'Funcionário',
  student:     'Aluno',
};

// ── Mapa de rotas com permissões ─────────────────────────────────
// Adicione novas rotas aqui ao criar novos módulos.
export const ALL_ROUTES = [
  // FabLab
  { route: '/fablab/home',        label: 'FabLab · Início',         module: 'fablab' },
  { route: '/fablab/dashboard',   label: 'FabLab · Dashboard',      module: 'fablab' },
  { route: '/fablab/inventory',   label: 'FabLab · Inventário',     module: 'fablab' },
  { route: '/fablab/schedule',    label: 'FabLab · Agendamentos',   module: 'fablab' },
  { route: '/fablab/suggestions', label: 'FabLab · Sugestões',      module: 'fablab' },
  { route: '/fablab/projects',    label: 'FabLab · Projetos',       module: 'fablab' },
  { route: '/fablab/blog',        label: 'FabLab · Blog',           module: 'fablab' },
  { route: '/fablab/reports',     label: 'FabLab · Relatórios',     module: 'fablab' },
  { route: '/fablab/users',       label: 'FabLab · Usuários',       module: 'fablab' },
  // Projetos (ex-Gifted / Altas Habilidades — agora multi-projeto)
  { route: '/projects/home',        label: 'Projetos · Início',       module: 'projects' },
  { route: '/projects/dashboard',   label: 'Projetos · Dashboard',    module: 'projects' },
  { route: '/projects/students',    label: 'Projetos · Alunos',       module: 'projects' },
  { route: '/projects/quiz-creator',label: 'Projetos · Quiz',         module: 'projects' },
  { route: '/projects/manage',      label: 'Projetos · Gerenciar',    module: 'projects' },
  // Student
  { route: '/student/quiz',       label: 'Aluno · Quiz',            module: 'student' },
  { route: '/student/grades',     label: 'Aluno · Notas',           module: 'student' },
  { route: '/student/proposal',   label: 'Aluno · Proposta',        module: 'student' },
] as const;

// ── Cores disponíveis para classes de usuário ────────────────────
export const CLASS_COLORS = [
  '#1D4ED8', '#DC2626', '#059669', '#7c3aed',
  '#ea580c', '#0891b2', '#be185d', '#65a30d',
];

// ── Países com FabLabs (Fab Foundation Network) ──────────────────
// Fonte: fablabs.io / Fab Foundation (atualizado 2024)
export const FABLAB_COUNTRIES = [
  { name: 'Brasil', flag: '🇧🇷', count: 80 },
  { name: 'Estados Unidos', flag: '🇺🇸', count: 200 },
  { name: 'Japão', flag: '🇯🇵', count: 150 },
  { name: 'França', flag: '🇫🇷', count: 130 },
  { name: 'Itália', flag: '🇮🇹', count: 110 },
  { name: 'Espanha', flag: '🇪🇸', count: 95 },
  { name: 'Alemanha', flag: '🇩🇪', count: 90 },
  { name: 'Índia', flag: '🇮🇳', count: 85 },
  { name: 'Holanda', flag: '🇳🇱', count: 75 },
  { name: 'China', flag: '🇨🇳', count: 70 },
  { name: 'México', flag: '🇲🇽', count: 60 },
  { name: 'Argentina', flag: '🇦🇷', count: 40 },
  { name: 'Portugal', flag: '🇵🇹', count: 35 },
  { name: 'Austrália', flag: '🇦🇺', count: 50 },
  { name: 'Reino Unido', flag: '🇬🇧', count: 80 },
  { name: 'Coreia do Sul', flag: '🇰🇷', count: 65 },
  { name: 'Canadá', flag: '🇨🇦', count: 55 },
  { name: 'Marrocos', flag: '🇲🇦', count: 20 },
  { name: 'Colômbia', flag: '🇨🇴', count: 25 },
  { name: 'Chile', flag: '🇨🇱', count: 20 },
];

// ── Unidades FabLab (configurável pelo admin) ────────────────────
// Essas unidades aparecem no popup de seleção de unidade
export const DEFAULT_UNITS = [
  'FabLab Central',
  'FabLab Norte',
  'FabLab Sul',
  'FabLab Leste',
  'FabLab Oeste',
];

// ── Tipo de projetos disponíveis no módulo Projetos ──────────────
export const PROJECT_TYPES = [
  'Altas Habilidades',
  'Maker',
  'Robótica',
  'Programação',
  'Eletrônica',
  'Impressão 3D',
  'Corte a Laser',
  'Sustentabilidade',
  'IoT',
  'Outro',
] as const;
