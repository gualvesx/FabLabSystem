/**
 * types/index.ts — FabLab Platform
 * Tipos TypeScript centrais da aplicação.
 * Mantenha os tipos aqui para garantir consistência entre componentes.
 * Open Source: ao adicionar novas features, declare os tipos aqui primeiro.
 */

// ── Perfil de usuário ────────────────────────────────────────────
export type UserRole = 'admin' | 'professor' | 'funcionario' | 'student' | string;

export interface UserClass {
  id: string;
  name: string;         // ex: "Técnico de Lab"
  base_role: UserRole;
  permissions: RoutePermission[];
  color: string;        // hex
  created_at: string;
}

export interface RoutePermission {
  route: string;        // ex: "/fablab/inventory"
  label: string;        // ex: "Inventário"
  allowed: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  class_id?: string;
  class_name?: string;
  unit: string;         // unidade do FabLab
  active: boolean;
}

// ── Alunos (usado no módulo Projetos) ───────────────────────────
export type StudentStatus = 'identificado' | 'em_avaliacao' | 'monitoramento' | 'concluido';

export interface Grade {
  id: string;
  subject: string;
  grade: number;
  period: string;
  date: string;
  notes?: string;
}

export interface Skill {
  area: string;
  score: number;
  assessed_by: string;
  date: string;
}

export interface Development {
  id: string;
  date: string;
  title: string;
  description: string;
  category: string;
  author: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  date: string;
  type: 'olimpiada' | 'projeto' | 'reconhecimento' | 'publicacao' | 'outro';
}

export interface Student {
  id: string;
  name: string;
  birth_date: string;
  grade: string;
  school: string;
  status: StudentStatus;
  responsible_name: string;
  responsible_contact: string;
  primary_areas: string[];
  notes: string;
  identified_at: string;
  identified_by: string;
  project_id?: string;      // FK para o projeto ao qual o aluno pertence
  gifted_grades: Grade[];
  gifted_skills: Skill[];
  gifted_developments: Development[];
  gifted_achievements: Achievement[];
}

// ── Projetos (módulo unificado — substitui Gifted separado) ─────
export interface Project {
  id: string;
  title: string;
  description: string;
  type: string;           // ex: "Altas Habilidades", "Maker", etc.
  link: string;
  author: string;
  author_id?: string;
  class_name: string;
  tags: string[];
  // Campos adicionais para gerenciamento de projetos
  status?: 'ativo' | 'concluido' | 'arquivado';
  cover_url?: string;
  has_quiz?: boolean;
  has_students?: boolean;
  student_count?: number;
  quiz_count?: number;
  created_at?: string;
  updated_at?: string;
}

// ── Inventário ───────────────────────────────────────────────────
export type InventoryCategory =
  | 'Equipamento' | 'Eletrônico' | 'Ferramenta'
  | 'Insumo' | 'Material' | 'Consumível' | 'EPI' | 'Outro';

export interface InventoryItem {
  id: string;
  name: string;
  category: InventoryCategory;
  subcategory?: string;
  quantity: number;
  total: number;
  unit_measure: string;
  status: 'in' | 'out';
  description: string;
  location?: string;
  min_stock?: number;
  last_action: string;
  last_action_by: string;
}

export interface Movement {
  id: string;
  item_id: string;
  item_name: string;
  action: 'entrada' | 'saida';
  quantity: number;
  responsible: string;
  notes: string;
  moved_at: string;
}

// ── Agendamentos ─────────────────────────────────────────────────
export interface Schedule {
  id: string;
  title: string;
  date: string;
  start_time: string;
  end_time: string;
  responsible: string;
  class_name: string;
  notes: string;
  status: 'pendente' | 'confirmado' | 'concluido' | 'cancelado' | 'remarcado';
  schedule_materials: ScheduleMaterial[];
}

export interface ScheduleMaterial {
  id: string;
  item_name: string;
  quantity_used: number;
  registered_by: string;
}

// ── Sugestões ────────────────────────────────────────────────────
export interface Suggestion {
  id: string;
  title: string;
  description: string;
  tags: string[];
  author: string;
  votes: number;
  status: 'open' | 'approved' | 'rejected';
  // Tipo diferencia sugestões para o site vs para FabLabs
  suggestion_type?: 'site' | 'fablab' | 'geral';
  category?: string;
  created_at?: string;
}

// ── Quiz ─────────────────────────────────────────────────────────
export interface Quiz {
  id: string;
  title: string;
  description: string;
  subject: string;
  time_limit: number;
  status: 'draft' | 'published';
  questions: Question[];
  assigned_students: string[];
  project_id?: string;     // agora ligado a um projeto
  created_by: string;
  created_at: string;
}

export interface Question {
  id: string;
  text: string;
  options: { id: string; text: string; correct: boolean }[];
  points: number;
  multiple_correct: boolean;
}

export interface QuizResult {
  id: string;
  quiz_id: string;
  student_id: string;
  score: number;
  max_score: number;
  answers: { question_id: string; selected: string[]; correct: boolean }[];
  completed_at: string;
  time_taken: number;
}

// ── Proposta de trabalho ─────────────────────────────────────────
export interface WorkProposal {
  id: string;
  student_id: string;
  title: string;
  description: string;
  objectives: string;
  methodology: string;
  expected_results: string;
  timeline: string;
  status: 'submitted' | 'under_review' | 'approved' | 'in_progress' | 'completed';
  feedback: string;
  created_at: string;
  updated_at: string;
}

// ── Relatórios ───────────────────────────────────────────────────
export interface Report {
  id: string;
  type: 'daily' | 'weekly' | 'monthly';
  period_start: string;
  period_end: string;
  total_schedules: number;
  total_completed: number;
  total_pending: number;
  total_cancelled: number;
  generated_by: string;
  generated_at: string;
  summary: {
    stats: { total: number; completed: number; pending: number; cancelled: number };
    top_materials: { item_name: string; total: number }[];
    schedules: { title: string; start_time: string; responsible: string; status: string }[];
  };
}

export interface MaterialUsage {
  item_name: string;
  category: string;
  total_used: number;
  times_used: number;
  last_used: string;
}

// ── Navegação ────────────────────────────────────────────────────
export type AppModule = 'fablab' | 'projects' | 'student';
