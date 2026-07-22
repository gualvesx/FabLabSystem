-- ================================================================
-- FabLab Platform · Schema PostgreSQL v2026.1
-- Baseado na Fab Charter MIT · Open Source
--
-- Instruções:
--   1. Acesse: Supabase Dashboard → SQL Editor → New Query
--   2. Cole todo este arquivo e execute
--   3. As classes padrão serão criadas automaticamente
--
-- Changelog v2026.1 (vs v2025.4):
--   + Tabela suggestions: campos suggestion_type e category
--   + Tabela projects: campos status, cover_url, has_quiz, has_students
--   + Tabela students: campo project_id (FK para projects)
--   + Tabela users: campo avatar_url
--   + Tabela fablab_units: nova tabela para unidades
--   + Índices adicionais para performance
--   + Rotas atualizadas para módulo /projects/* (ex-/gifted/*)
-- ================================================================

create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";

-- ================================================================
-- FUNÇÃO AUXILIAR — atualiza updated_at automaticamente
-- ================================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

-- ================================================================
-- FUNÇÕES DE AUTORIZAÇÃO
-- Usadas nas RLS policies abaixo
-- ================================================================

/** Retorna o role do usuário autenticado */
create or replace function public.current_user_role()
returns text language sql stable security definer set search_path = public as $$
  select role from public.users where id = auth.uid();
$$;

/** true se o usuário é admin */
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select role = 'admin' from public.users where id = auth.uid()), false);
$$;

/** true se admin ou professor */
create or replace function public.is_admin_or_professor()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select role in ('admin','professor') from public.users where id = auth.uid()), false);
$$;

-- ================================================================
-- 1. UNIDADES FAB LAB
-- Cada instalação pode ter múltiplas unidades (ex: FabLab Central, Norte...)
-- ================================================================
create table if not exists public.fablab_units (
  id          uuid        primary key default gen_random_uuid(),
  name        text        not null unique,
  city        text        not null default '',
  state       text        not null default '',
  country     text        not null default 'Brasil',
  address     text        not null default '',
  contact     text        not null default '',
  description text        not null default '',
  active      boolean     not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger tr_fablab_units_updated_at before update on public.fablab_units
  for each row execute procedure public.set_updated_at();

-- ================================================================
-- 2. CLASSES DE USUÁRIO (grupos de permissão)
-- ================================================================
create table if not exists public.user_classes (
  id          uuid        primary key default gen_random_uuid(),
  name        text        not null,
  base_role   text        not null default 'professor'
                check (base_role in ('admin','professor','funcionario','student')),
  color       text        not null default '#1D4ED8',
  permissions jsonb       not null default '[]',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger tr_user_classes_updated_at before update on public.user_classes
  for each row execute procedure public.set_updated_at();

-- ================================================================
-- 3. USUÁRIOS (espelho do auth.users com perfil público)
-- ================================================================
create table if not exists public.users (
  id          uuid        primary key references auth.users on delete cascade,
  name        text        not null default '',
  email       text        not null default '',
  role        text        not null default 'professor'
                check (role in ('admin','professor','funcionario','student')),
  class_id    uuid        references public.user_classes on delete set null,
  unit        text        not null default '',
  avatar_url  text        not null default '',   -- URL de avatar personalizado
  active      boolean     not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_users_role   on public.users (role);
create index if not exists idx_users_active on public.users (active);
create index if not exists idx_users_class  on public.users (class_id);
create index if not exists idx_users_unit   on public.users (unit);
create unique index if not exists idx_users_email on public.users (email) where email <> '';

create trigger tr_users_updated_at before update on public.users
  for each row execute procedure public.set_updated_at();

/** Cria perfil automaticamente ao registrar novo usuário */
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, email, name, role, unit, active)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'name', split_part(coalesce(new.email,'u'),'@',1)),
    coalesce(new.raw_user_meta_data->>'role', 'professor'),
    coalesce(new.raw_user_meta_data->>'unit', ''),
    true
  )
  on conflict (id) do update
    set email = excluded.email, updated_at = now()
    where public.users.email <> excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ================================================================
-- 4. INVENTÁRIO
-- ================================================================
create table if not exists public.inventory_items (
  id              uuid        primary key default gen_random_uuid(),
  name            text        not null,
  category        text        not null default 'Equipamento'
                    check (category in ('Equipamento','Eletrônico','Ferramenta','Insumo','Material','Consumível','EPI','Outro')),
  subcategory     text        not null default '',
  quantity        integer     not null default 0  check (quantity >= 0),
  total           integer     not null default 1  check (total >= 0),
  unit_measure    text        not null default 'un',
  status          text        not null default 'in' check (status in ('in','out')),
  description     text        not null default '',
  location        text        not null default '',
  min_stock       integer     not null default 0  check (min_stock >= 0),
  unit            text        not null default '',   -- unidade do FabLab dono do item
  last_action     text        not null default '',
  last_action_by  text        not null default '',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_inv_category  on public.inventory_items (category);
create index if not exists idx_inv_status    on public.inventory_items (status);
create index if not exists idx_inv_unit      on public.inventory_items (unit);
create index if not exists idx_inv_name_trgm on public.inventory_items using gin (name gin_trgm_ops);

create trigger tr_inventory_updated_at before update on public.inventory_items
  for each row execute procedure public.set_updated_at();

create table if not exists public.movements (
  id          uuid        primary key default gen_random_uuid(),
  item_id     uuid        references public.inventory_items on delete set null,
  item_name   text        not null default '',
  action      text        not null check (action in ('entrada','saida')),
  quantity    integer     not null default 1 check (quantity > 0),
  responsible text        not null default '',
  notes       text        not null default '',
  moved_at    timestamptz not null default now()
);

create index if not exists idx_movements_item on public.movements (item_id, moved_at desc);
create index if not exists idx_movements_date on public.movements (moved_at desc);

-- ================================================================
-- 5. AGENDAMENTOS
-- ================================================================
create table if not exists public.schedules (
  id          uuid        primary key default gen_random_uuid(),
  title       text        not null,
  date        date        not null,
  start_time  time,
  end_time    time,
  responsible text        not null default '',
  class_name  text        not null default '',
  notes       text        not null default '',
  status      text        not null default 'pendente'
                check (status in ('pendente','confirmado','concluido','cancelado','remarcado')),
  unit        text        not null default '',   -- unidade do agendamento
  created_by  uuid        references public.users on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_schedules_date   on public.schedules (date, status);
create index if not exists idx_schedules_status on public.schedules (status);
create index if not exists idx_schedules_unit   on public.schedules (unit);

create trigger tr_schedules_updated_at before update on public.schedules
  for each row execute procedure public.set_updated_at();

create table if not exists public.schedule_materials (
  id              uuid        primary key default gen_random_uuid(),
  schedule_id     uuid        not null references public.schedules on delete cascade,
  item_id         uuid        references public.inventory_items on delete set null,
  item_name       text        not null,
  quantity_used   integer     not null default 1 check (quantity_used > 0),
  registered_by   text        not null default '',
  registered_at   timestamptz not null default now()
);

-- ================================================================
-- 6. SUGESTÕES
-- Dois canais: melhorias para o site (suggestion_type='site')
--              ideias para FabLabs  (suggestion_type='fablab')
-- ================================================================
create table if not exists public.suggestions (
  id              uuid        primary key default gen_random_uuid(),
  title           text        not null,
  description     text        not null default '',
  tags            text[]      not null default '{}',
  author          text        not null default '',
  author_id       uuid        references public.users on delete set null,
  votes           integer     not null default 0 check (votes >= 0),
  status          text        not null default 'open'
                    check (status in ('open','approved','rejected')),
  -- NOVO: tipo diferencia o canal da sugestão
  suggestion_type text        not null default 'geral'
                    check (suggestion_type in ('site','fablab','geral')),
  -- NOVO: categoria para o filtro "organizadores"
  category        text        not null default 'Outro',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_suggestions_type   on public.suggestions (suggestion_type);
create index if not exists idx_suggestions_status on public.suggestions (status);
create index if not exists idx_suggestions_votes  on public.suggestions (votes desc);

create trigger tr_suggestions_updated_at before update on public.suggestions
  for each row execute procedure public.set_updated_at();

-- ================================================================
-- 7. PROJETOS MAKER
-- Agora multi-tipo: Altas Habilidades, Maker, Robótica, etc.
-- Cada projeto pode ter alunos, quizzes e propostas vinculados.
-- ================================================================
create table if not exists public.projects (
  id           uuid        primary key default gen_random_uuid(),
  title        text        not null,
  description  text        not null default '',
  type         text        not null default 'Outro',  -- ver PROJECT_TYPES em constants.ts
  link         text        not null default '',
  author       text        not null default '',
  author_id    uuid        references public.users on delete set null,
  class_name   text        not null default '',
  tags         text[]      not null default '{}',
  -- NOVO: campos de gestão
  status       text        not null default 'ativo'
                 check (status in ('ativo','concluido','arquivado')),
  cover_url    text        not null default '',       -- imagem de capa opcional
  unit         text        not null default '',       -- unidade responsável
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists idx_projects_created    on public.projects (created_at desc);
create index if not exists idx_projects_type       on public.projects (type);
create index if not exists idx_projects_status     on public.projects (status);
create index if not exists idx_projects_unit       on public.projects (unit);
create index if not exists idx_projects_title_trgm on public.projects using gin (title gin_trgm_ops);

create trigger tr_projects_updated_at before update on public.projects
  for each row execute procedure public.set_updated_at();

-- ================================================================
-- 8. ALUNOS
-- Vinculados a um projeto (project_id) — antes era implícito no módulo Gifted.
-- Um aluno pode pertencer a um projeto específico ou ser geral (project_id = null).
-- ================================================================
create table if not exists public.students (
  id                  uuid        primary key default gen_random_uuid(),
  name                text        not null,
  birth_date          date,
  grade               text        not null default '',
  school              text        not null default '',
  status              text        not null default 'identificado'
                        check (status in ('identificado','em_avaliacao','monitoramento','concluido')),
  responsible_name    text        not null default '',
  responsible_contact text        not null default '',
  primary_areas       text[]      not null default '{}',
  notes               text        not null default '',
  identified_at       date        not null default current_date,
  identified_by       text        not null default '',
  -- NOVO: vínculo com projeto
  project_id          uuid        references public.projects on delete set null,
  unit                text        not null default '',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists idx_students_status     on public.students (status);
create index if not exists idx_students_project    on public.students (project_id);
create index if not exists idx_students_unit       on public.students (unit);
create index if not exists idx_students_name_trgm  on public.students using gin (name gin_trgm_ops);

create trigger tr_students_updated_at before update on public.students
  for each row execute procedure public.set_updated_at();

-- ── Notas dos alunos ─────────────────────────────────────────
create table if not exists public.gifted_grades (
  id          uuid        primary key default gen_random_uuid(),
  student_id  uuid        not null references public.students on delete cascade,
  subject     text        not null,
  grade       numeric(5,2)not null check (grade >= 0 and grade <= 10),
  period      text        not null default '',
  date        date        not null default current_date,
  notes       text        not null default '',
  created_at  timestamptz not null default now()
);
create index if not exists idx_grades_student on public.gifted_grades (student_id);

-- ── Habilidades dos alunos ───────────────────────────────────
create table if not exists public.gifted_skills (
  id          uuid        primary key default gen_random_uuid(),
  student_id  uuid        not null references public.students on delete cascade,
  area        text        not null,
  score       integer     not null default 0 check (score between 0 and 10),
  assessed_by text        not null default '',
  date        date        not null default current_date,
  created_at  timestamptz not null default now()
);
create index if not exists idx_skills_student on public.gifted_skills (student_id);

-- ── Desenvolvimentos ─────────────────────────────────────────
create table if not exists public.gifted_developments (
  id          uuid        primary key default gen_random_uuid(),
  student_id  uuid        not null references public.students on delete cascade,
  date        date        not null default current_date,
  title       text        not null,
  description text        not null default '',
  category    text        not null default '',
  author      text        not null default '',
  created_at  timestamptz not null default now()
);
create index if not exists idx_dev_student on public.gifted_developments (student_id);

-- ── Conquistas ───────────────────────────────────────────────
create table if not exists public.gifted_achievements (
  id          uuid        primary key default gen_random_uuid(),
  student_id  uuid        not null references public.students on delete cascade,
  title       text        not null,
  description text        not null default '',
  date        date        not null default current_date,
  type        text        not null default 'outro'
                check (type in ('olimpiada','projeto','reconhecimento','publicacao','outro')),
  created_at  timestamptz not null default now()
);
create index if not exists idx_ach_student on public.gifted_achievements (student_id);

-- ================================================================
-- 9. QUIZZES
-- Vinculados a um projeto via project_id
-- ================================================================
create table if not exists public.quizzes (
  id                uuid        primary key default gen_random_uuid(),
  title             text        not null,
  description       text        not null default '',
  subject           text        not null default '',
  time_limit        integer     not null default 30 check (time_limit > 0),
  status            text        not null default 'draft' check (status in ('draft','published')),
  questions         jsonb       not null default '[]',
  assigned_students text[]      not null default '{}',
  -- NOVO: vínculo com projeto
  project_id        uuid        references public.projects on delete set null,
  created_by        uuid        references public.users on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists idx_quizzes_status  on public.quizzes (status);
create index if not exists idx_quizzes_project on public.quizzes (project_id);

create trigger tr_quizzes_updated_at before update on public.quizzes
  for each row execute procedure public.set_updated_at();

create table if not exists public.quiz_results (
  id           uuid        primary key default gen_random_uuid(),
  quiz_id      uuid        not null references public.quizzes on delete cascade,
  student_id   text        not null,
  score        numeric     not null default 0,
  max_score    numeric     not null default 0,
  answers      jsonb       not null default '[]',
  completed_at timestamptz not null default now(),
  time_taken   integer     not null default 0
);

create index if not exists idx_quiz_results_quiz    on public.quiz_results (quiz_id);
create index if not exists idx_quiz_results_student on public.quiz_results (student_id);

-- ================================================================
-- 10. PROPOSTAS DE TRABALHO
-- ================================================================
create table if not exists public.work_proposals (
  id               uuid        primary key default gen_random_uuid(),
  student_id       text        not null,
  title            text        not null,
  description      text        not null default '',
  objectives       text        not null default '',
  methodology      text        not null default '',
  expected_results text        not null default '',
  timeline         text        not null default '',
  status           text        not null default 'submitted'
                     check (status in ('submitted','under_review','approved','in_progress','completed')),
  feedback         text        not null default '',
  project_id       uuid        references public.projects on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists idx_proposals_student on public.work_proposals (student_id);
create index if not exists idx_proposals_status  on public.work_proposals (status);
create index if not exists idx_proposals_project on public.work_proposals (project_id);

create trigger tr_proposals_updated_at before update on public.work_proposals
  for each row execute procedure public.set_updated_at();

-- ================================================================
-- 11. BLOG
-- ================================================================
create table if not exists public.blog_posts (
  id          uuid        primary key default gen_random_uuid(),
  title       text        not null,
  slug        text        not null unique,
  content     text        not null default '',
  excerpt     text        not null default '',
  cover_url   text        not null default '',
  tags        text[]      not null default '{}',
  author      text        not null default '',
  author_id   uuid        references public.users on delete set null,
  published   boolean     not null default false,
  views       integer     not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_blog_published on public.blog_posts (published, created_at desc);
create index if not exists idx_blog_slug      on public.blog_posts (slug);
create index if not exists idx_blog_trgm      on public.blog_posts using gin (title gin_trgm_ops);

create trigger tr_blog_updated_at before update on public.blog_posts
  for each row execute procedure public.set_updated_at();

-- ================================================================
-- 12. RELATÓRIOS
-- ================================================================
create table if not exists public.reports (
  id              uuid        primary key default gen_random_uuid(),
  type            text        not null check (type in ('daily','weekly','monthly')),
  period_start    date        not null,
  period_end      date        not null,
  total_schedules integer     not null default 0,
  total_completed integer     not null default 0,
  total_pending   integer     not null default 0,
  total_cancelled integer     not null default 0,
  generated_by    text        not null default '',
  unit            text        not null default '',
  summary         jsonb       not null default '{}',
  generated_at    timestamptz not null default now()
);

create table if not exists public.material_usage (
  id          uuid        primary key default gen_random_uuid(),
  item_name   text        not null,
  category    text        not null default '',
  total_used  integer     not null default 0,
  times_used  integer     not null default 0,
  last_used   timestamptz not null default now(),
  unit        text        not null default ''
);

-- ================================================================
-- ROW LEVEL SECURITY
-- ================================================================
alter table public.fablab_units       enable row level security;
alter table public.user_classes       enable row level security;
alter table public.users              enable row level security;
alter table public.inventory_items    enable row level security;
alter table public.movements          enable row level security;
alter table public.schedules          enable row level security;
alter table public.schedule_materials enable row level security;
alter table public.suggestions        enable row level security;
alter table public.projects           enable row level security;
alter table public.students           enable row level security;
alter table public.gifted_grades      enable row level security;
alter table public.gifted_skills      enable row level security;
alter table public.gifted_developments enable row level security;
alter table public.gifted_achievements enable row level security;
alter table public.quizzes            enable row level security;
alter table public.quiz_results       enable row level security;
alter table public.work_proposals     enable row level security;
alter table public.blog_posts         enable row level security;
alter table public.reports            enable row level security;
alter table public.material_usage     enable row level security;

-- ================================================================
-- POLICIES
-- ================================================================

-- fablab_units: todos lêem, admin gerencia
create policy "units_select" on public.fablab_units for select to authenticated using (true);
create policy "units_all"    on public.fablab_units for all    to authenticated using (public.is_admin()) with check (public.is_admin());

-- user_classes: todos lêem, admin gerencia
create policy "classes_select" on public.user_classes for select to authenticated using (true);
create policy "classes_all"    on public.user_classes for all    to authenticated using (public.is_admin()) with check (public.is_admin());

-- users: cada um vê o próprio; admin vê todos
create policy "users_select_own"  on public.users for select to authenticated using (id = auth.uid() or public.is_admin_or_professor());
create policy "users_update_own"  on public.users for update to authenticated using (id = auth.uid() or public.is_admin());
create policy "users_insert"      on public.users for insert to authenticated with check (true);

-- inventory
create policy "inv_select"   on public.inventory_items for select to authenticated using (true);
create policy "inv_insert"   on public.inventory_items for insert to authenticated with check (public.is_admin_or_professor());
create policy "inv_update"   on public.inventory_items for update to authenticated using (public.is_admin_or_professor());
create policy "inv_delete"   on public.inventory_items for delete to authenticated using (public.is_admin());

create policy "movements_select" on public.movements for select to authenticated using (true);
create policy "movements_insert" on public.movements for insert to authenticated with check (public.is_admin_or_professor());
create policy "movements_delete" on public.movements for delete to authenticated using (public.is_admin());

-- schedules
create policy "schedules_select" on public.schedules for select to authenticated using (true);
create policy "schedules_insert" on public.schedules for insert to authenticated with check (public.is_admin_or_professor());
create policy "schedules_update" on public.schedules for update to authenticated using (public.is_admin_or_professor());
create policy "schedules_delete" on public.schedules for delete to authenticated using (public.is_admin());

create policy "sched_mat_select" on public.schedule_materials for select to authenticated using (true);
create policy "sched_mat_insert" on public.schedule_materials for insert to authenticated with check (public.is_admin_or_professor());
create policy "sched_mat_delete" on public.schedule_materials for delete to authenticated using (public.is_admin());

-- suggestions: qualquer autenticado lê e cria; dono ou admin edita/deleta
create policy "suggestions_select" on public.suggestions for select to authenticated using (true);
create policy "suggestions_insert" on public.suggestions for insert to authenticated with check (auth.uid() is not null);
create policy "suggestions_update" on public.suggestions for update to authenticated using (author_id = auth.uid() or public.is_admin());
create policy "suggestions_delete" on public.suggestions for delete to authenticated using (author_id = auth.uid() or public.is_admin());

-- projects
create policy "projects_select" on public.projects for select to authenticated using (true);
create policy "projects_insert" on public.projects for insert to authenticated with check (auth.uid() is not null);
create policy "projects_update" on public.projects for update to authenticated using (author_id = auth.uid() or public.is_admin_or_professor());
create policy "projects_delete" on public.projects for delete to authenticated using (author_id = auth.uid() or public.is_admin());

-- students / gifted tables
create policy "students_select" on public.students for select to authenticated using (true);
create policy "students_insert" on public.students for insert to authenticated with check (public.is_admin_or_professor());
create policy "students_update" on public.students for update to authenticated using (public.is_admin_or_professor());
create policy "students_delete" on public.students for delete to authenticated using (public.is_admin());

create policy "grades_select" on public.gifted_grades for select to authenticated using (true);
create policy "grades_all"    on public.gifted_grades for all    to authenticated using (public.is_admin_or_professor()) with check (public.is_admin_or_professor());

create policy "skills_select" on public.gifted_skills for select to authenticated using (true);
create policy "skills_all"    on public.gifted_skills for all    to authenticated using (public.is_admin_or_professor()) with check (public.is_admin_or_professor());

create policy "dev_select" on public.gifted_developments for select to authenticated using (true);
create policy "dev_all"    on public.gifted_developments for all    to authenticated using (public.is_admin_or_professor()) with check (public.is_admin_or_professor());

create policy "ach_select" on public.gifted_achievements for select to authenticated using (true);
create policy "ach_all"    on public.gifted_achievements for all    to authenticated using (public.is_admin_or_professor()) with check (public.is_admin_or_professor());

-- quizzes
create policy "quizzes_select" on public.quizzes for select to authenticated using (true);
create policy "quizzes_insert" on public.quizzes for insert to authenticated with check (public.is_admin_or_professor());
create policy "quizzes_update" on public.quizzes for update to authenticated using (public.is_admin_or_professor());
create policy "quizzes_delete" on public.quizzes for delete to authenticated using (public.is_admin());

create policy "qresults_select" on public.quiz_results for select to authenticated using (true);
create policy "qresults_insert" on public.quiz_results for insert to authenticated with check (auth.uid() is not null);
create policy "qresults_delete" on public.quiz_results for delete to authenticated using (public.is_admin());

-- proposals
create policy "proposals_select" on public.work_proposals for select to authenticated
  using (student_id = auth.uid()::text or public.is_admin_or_professor());
create policy "proposals_insert" on public.work_proposals for insert to authenticated with check (auth.uid() is not null);
create policy "proposals_update" on public.work_proposals for update to authenticated
  using (student_id = auth.uid()::text or public.is_admin_or_professor());
create policy "proposals_delete" on public.work_proposals for delete to authenticated using (public.is_admin());

-- blog
create policy "blog_anon_read" on public.blog_posts for select to anon using (published = true);
create policy "blog_select"    on public.blog_posts for select to authenticated using (true);
create policy "blog_insert"    on public.blog_posts for insert to authenticated with check (public.is_admin_or_professor());
create policy "blog_update"    on public.blog_posts for update to authenticated using (author_id = auth.uid() or public.is_admin());
create policy "blog_delete"    on public.blog_posts for delete to authenticated using (public.is_admin());

-- reports
create policy "reports_select" on public.reports for select to authenticated using (public.is_admin_or_professor());
create policy "reports_insert" on public.reports for insert to authenticated with check (public.is_admin_or_professor());

create policy "matusage_select" on public.material_usage for select to authenticated using (true);
create policy "matusage_all"    on public.material_usage for all    to authenticated using (public.is_admin_or_professor()) with check (public.is_admin_or_professor());

-- ================================================================
-- VIEWS
-- ================================================================
create or replace view public.v_schedule_summary as
select status, count(*) as total,
  count(*) filter (where date = current_date) as today
from public.schedules group by status;

create or replace view public.v_inventory_critical as
select id, name, category, quantity, total, unit_measure, location, unit,
  round(case when total>0 then quantity::numeric/total*100 else 0 end,1) as pct
from public.inventory_items where total>0 and quantity::numeric/total < 0.3
order by pct;

create or replace view public.v_student_grade_avg as
select s.id, s.name, s.grade as class, s.status, s.project_id,
  round(coalesce(avg(g.grade),0),2) as avg_grade, count(g.id) as grade_count
from public.students s left join public.gifted_grades g on g.student_id=s.id
group by s.id,s.name,s.grade,s.status,s.project_id order by avg_grade desc;

create or replace view public.v_project_stats as
select p.id, p.title, p.type, p.status,
  count(distinct s.id) as student_count,
  count(distinct q.id) as quiz_count
from public.projects p
left join public.students s on s.project_id = p.id
left join public.quizzes q on q.project_id = p.id
group by p.id, p.title, p.type, p.status;

-- ================================================================
-- DADOS INICIAIS — Unidades padrão
-- ================================================================
insert into public.fablab_units (name, city, state) values
  ('FabLab Central', '', 'SP'),
  ('FabLab Norte',   '', 'SP'),
  ('FabLab Sul',     '', 'SP')
on conflict (name) do nothing;

-- ================================================================
-- DADOS INICIAIS — Classes de usuário padrão
-- Rotas atualizadas para o novo módulo /projects/* (ex-/gifted/*)
-- ================================================================
insert into public.user_classes (name, base_role, color, permissions) values
('Administrador','admin','#DC2626','[
  {"route":"/fablab/home",          "label":"FabLab · Início",         "allowed":true},
  {"route":"/fablab/dashboard",     "label":"FabLab · Dashboard",      "allowed":true},
  {"route":"/fablab/inventory",     "label":"FabLab · Inventário",     "allowed":true},
  {"route":"/fablab/schedule",      "label":"FabLab · Agendamentos",   "allowed":true},
  {"route":"/fablab/suggestions",   "label":"FabLab · Sugestões",      "allowed":true},
  {"route":"/fablab/blog",          "label":"FabLab · Blog",           "allowed":true},
  {"route":"/fablab/reports",       "label":"FabLab · Relatórios",     "allowed":true},
  {"route":"/fablab/users",         "label":"FabLab · Usuários",       "allowed":true},
  {"route":"/projects/home",        "label":"Projetos · Início",       "allowed":true},
  {"route":"/projects/dashboard",   "label":"Projetos · Dashboard",    "allowed":true},
  {"route":"/projects/students",    "label":"Projetos · Alunos",       "allowed":true},
  {"route":"/projects/quiz-creator","label":"Projetos · Quiz",         "allowed":true},
  {"route":"/projects/manage",      "label":"Projetos · Gerenciar",    "allowed":true},
  {"route":"/student/quiz",         "label":"Aluno · Quiz",            "allowed":false},
  {"route":"/student/grades",       "label":"Aluno · Notas",           "allowed":false},
  {"route":"/student/proposal",     "label":"Aluno · Proposta",        "allowed":false}
]'::jsonb),
('Professor','professor','#1D4ED8','[
  {"route":"/fablab/home",          "label":"FabLab · Início",         "allowed":true},
  {"route":"/fablab/dashboard",     "label":"FabLab · Dashboard",      "allowed":false},
  {"route":"/fablab/inventory",     "label":"FabLab · Inventário",     "allowed":true},
  {"route":"/fablab/schedule",      "label":"FabLab · Agendamentos",   "allowed":true},
  {"route":"/fablab/suggestions",   "label":"FabLab · Sugestões",      "allowed":true},
  {"route":"/fablab/blog",          "label":"FabLab · Blog",           "allowed":true},
  {"route":"/fablab/reports",       "label":"FabLab · Relatórios",     "allowed":true},
  {"route":"/fablab/users",         "label":"FabLab · Usuários",       "allowed":false},
  {"route":"/projects/home",        "label":"Projetos · Início",       "allowed":true},
  {"route":"/projects/dashboard",   "label":"Projetos · Dashboard",    "allowed":true},
  {"route":"/projects/students",    "label":"Projetos · Alunos",       "allowed":true},
  {"route":"/projects/quiz-creator","label":"Projetos · Quiz",         "allowed":true},
  {"route":"/projects/manage",      "label":"Projetos · Gerenciar",    "allowed":true},
  {"route":"/student/quiz",         "label":"Aluno · Quiz",            "allowed":false},
  {"route":"/student/grades",       "label":"Aluno · Notas",           "allowed":false},
  {"route":"/student/proposal",     "label":"Aluno · Proposta",        "allowed":false}
]'::jsonb),
('Funcionário','funcionario','#059669','[
  {"route":"/fablab/home",          "label":"FabLab · Início",         "allowed":true},
  {"route":"/fablab/dashboard",     "label":"FabLab · Dashboard",      "allowed":false},
  {"route":"/fablab/inventory",     "label":"FabLab · Inventário",     "allowed":true},
  {"route":"/fablab/schedule",      "label":"FabLab · Agendamentos",   "allowed":true},
  {"route":"/fablab/suggestions",   "label":"FabLab · Sugestões",      "allowed":false},
  {"route":"/fablab/blog",          "label":"FabLab · Blog",           "allowed":true},
  {"route":"/fablab/reports",       "label":"FabLab · Relatórios",     "allowed":false},
  {"route":"/fablab/users",         "label":"FabLab · Usuários",       "allowed":false},
  {"route":"/projects/home",        "label":"Projetos · Início",       "allowed":false},
  {"route":"/projects/dashboard",   "label":"Projetos · Dashboard",    "allowed":false},
  {"route":"/projects/students",    "label":"Projetos · Alunos",       "allowed":false},
  {"route":"/projects/quiz-creator","label":"Projetos · Quiz",         "allowed":false},
  {"route":"/projects/manage",      "label":"Projetos · Gerenciar",    "allowed":false},
  {"route":"/student/quiz",         "label":"Aluno · Quiz",            "allowed":false},
  {"route":"/student/grades",       "label":"Aluno · Notas",           "allowed":false},
  {"route":"/student/proposal",     "label":"Aluno · Proposta",        "allowed":false}
]'::jsonb),
('Aluno','student','#7c3aed','[
  {"route":"/fablab/home",          "label":"FabLab · Início",         "allowed":false},
  {"route":"/fablab/dashboard",     "label":"FabLab · Dashboard",      "allowed":false},
  {"route":"/fablab/inventory",     "label":"FabLab · Inventário",     "allowed":false},
  {"route":"/fablab/schedule",      "label":"FabLab · Agendamentos",   "allowed":false},
  {"route":"/fablab/suggestions",   "label":"FabLab · Sugestões",      "allowed":false},
  {"route":"/fablab/blog",          "label":"FabLab · Blog",           "allowed":true},
  {"route":"/fablab/reports",       "label":"FabLab · Relatórios",     "allowed":false},
  {"route":"/fablab/users",         "label":"FabLab · Usuários",       "allowed":false},
  {"route":"/projects/home",        "label":"Projetos · Início",       "allowed":false},
  {"route":"/projects/dashboard",   "label":"Projetos · Dashboard",    "allowed":false},
  {"route":"/projects/students",    "label":"Projetos · Alunos",       "allowed":false},
  {"route":"/projects/quiz-creator","label":"Projetos · Quiz",         "allowed":false},
  {"route":"/projects/manage",      "label":"Projetos · Gerenciar",    "allowed":false},
  {"route":"/student/quiz",         "label":"Aluno · Quiz",            "allowed":true},
  {"route":"/student/grades",       "label":"Aluno · Notas",           "allowed":true},
  {"route":"/student/proposal",     "label":"Aluno · Proposta",        "allowed":true}
]'::jsonb)
on conflict do nothing;

-- ================================================================
-- RESET (dev only — descomente para limpar tudo e recriar)
-- ================================================================
/*
drop view  if exists public.v_project_stats, public.v_student_grade_avg,
  public.v_inventory_critical, public.v_schedule_summary cascade;
drop table if exists
  public.work_proposals, public.quiz_results, public.quizzes,
  public.gifted_achievements, public.gifted_developments, public.gifted_skills,
  public.gifted_grades, public.students, public.material_usage, public.reports,
  public.blog_posts, public.projects, public.suggestions,
  public.schedule_materials, public.schedules, public.movements,
  public.inventory_items, public.users, public.user_classes,
  public.fablab_units cascade;
drop function if exists public.handle_new_user, public.set_updated_at,
  public.current_user_role, public.is_admin, public.is_admin_or_professor cascade;
*/

select 'FabLab Platform Schema v2026.1 aplicado com sucesso! 🚀' as resultado;
