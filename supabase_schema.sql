-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.user_classes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  base_role text NOT NULL DEFAULT 'professor'::text CHECK (base_role = ANY (ARRAY['admin'::text, 'professor'::text, 'funcionario'::text, 'student'::text])),
  color text NOT NULL DEFAULT '#2563eb'::text,
  permissions jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT user_classes_pkey PRIMARY KEY (id)
);
CREATE TABLE public.users (
  id uuid NOT NULL,
  name text NOT NULL DEFAULT ''::text,
  email text NOT NULL DEFAULT ''::text,
  role text NOT NULL DEFAULT 'professor'::text CHECK (role = ANY (ARRAY['admin'::text, 'professor'::text, 'funcionario'::text, 'student'::text])),
  class_id uuid,
  unit text NOT NULL DEFAULT ''::text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id),
  CONSTRAINT users_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.user_classes(id)
);
CREATE TABLE public.movements (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  item_id uuid,
  item_name text NOT NULL DEFAULT ''::text,
  action text NOT NULL CHECK (action = ANY (ARRAY['entrada'::text, 'saida'::text])),
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  responsible text NOT NULL DEFAULT ''::text,
  notes text NOT NULL DEFAULT ''::text,
  moved_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT movements_pkey PRIMARY KEY (id)
);
CREATE TABLE public.schedules (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  date date NOT NULL,
  start_time time without time zone,
  end_time time without time zone,
  responsible text NOT NULL DEFAULT ''::text,
  class_name text NOT NULL DEFAULT ''::text,
  notes text NOT NULL DEFAULT ''::text,
  status text NOT NULL DEFAULT 'pendente'::text CHECK (status = ANY (ARRAY['pendente'::text, 'confirmado'::text, 'concluido'::text, 'cancelado'::text, 'remarcado'::text])),
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT schedules_pkey PRIMARY KEY (id),
  CONSTRAINT schedules_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id)
);
CREATE TABLE public.schedule_materials (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  schedule_id uuid NOT NULL,
  item_id uuid,
  item_name text NOT NULL,
  quantity_used integer NOT NULL DEFAULT 1 CHECK (quantity_used > 0),
  registered_by text NOT NULL DEFAULT ''::text,
  registered_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT schedule_materials_pkey PRIMARY KEY (id),
  CONSTRAINT schedule_materials_schedule_id_fkey FOREIGN KEY (schedule_id) REFERENCES public.schedules(id)
);
CREATE TABLE public.suggestions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT ''::text,
  tags ARRAY NOT NULL DEFAULT '{}'::text[],
  author text NOT NULL DEFAULT ''::text,
  author_id uuid,
  votes integer NOT NULL DEFAULT 0 CHECK (votes >= 0),
  status text NOT NULL DEFAULT 'open'::text CHECK (status = ANY (ARRAY['open'::text, 'approved'::text, 'rejected'::text])),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  suggestion_type text NOT NULL DEFAULT 'geral'::text CHECK (suggestion_type = ANY (ARRAY['site'::text, 'fablab'::text, 'geral'::text])),
  category text NOT NULL DEFAULT 'Outro'::text,
  CONSTRAINT suggestions_pkey PRIMARY KEY (id),
  CONSTRAINT suggestions_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.users(id)
);
CREATE TABLE public.projects (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT ''::text,
  type text NOT NULL DEFAULT 'Outro'::text,
  link text NOT NULL DEFAULT ''::text,
  author text NOT NULL DEFAULT ''::text,
  author_id uuid,
  class_name text NOT NULL DEFAULT ''::text,
  tags ARRAY NOT NULL DEFAULT '{}'::text[],
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'ativo'::text CHECK (status = ANY (ARRAY['ativo'::text, 'concluido'::text, 'arquivado'::text])),
  CONSTRAINT projects_pkey PRIMARY KEY (id),
  CONSTRAINT projects_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.users(id)
);
CREATE TABLE public.blog_posts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL DEFAULT ''::text,
  cover_url text NOT NULL DEFAULT ''::text,
  tags ARRAY NOT NULL DEFAULT '{}'::text[],
  author text NOT NULL DEFAULT ''::text,
  author_id uuid,
  author_role text NOT NULL DEFAULT ''::text,
  published boolean NOT NULL DEFAULT false,
  views integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT blog_posts_pkey PRIMARY KEY (id),
  CONSTRAINT blog_posts_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.users(id)
);
CREATE TABLE public.reports (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type = ANY (ARRAY['daily'::text, 'weekly'::text, 'monthly'::text])),
  period_start date NOT NULL,
  period_end date NOT NULL,
  total_schedules integer NOT NULL DEFAULT 0,
  total_completed integer NOT NULL DEFAULT 0,
  total_pending integer NOT NULL DEFAULT 0,
  total_cancelled integer NOT NULL DEFAULT 0,
  generated_by text NOT NULL DEFAULT ''::text,
  generated_by_id uuid,
  generated_at timestamp with time zone NOT NULL DEFAULT now(),
  summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT reports_pkey PRIMARY KEY (id),
  CONSTRAINT reports_generated_by_id_fkey FOREIGN KEY (generated_by_id) REFERENCES public.users(id)
);
CREATE TABLE public.material_usage (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  item_id uuid,
  item_name text NOT NULL,
  category text NOT NULL DEFAULT ''::text,
  total_used integer NOT NULL DEFAULT 0,
  times_used integer NOT NULL DEFAULT 0,
  last_used timestamp with time zone,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT material_usage_pkey PRIMARY KEY (id)
);
CREATE TABLE public.students (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  birth_date date,
  grade text NOT NULL DEFAULT ''::text,
  school text NOT NULL DEFAULT ''::text,
  status text NOT NULL DEFAULT 'identificado'::text CHECK (status = ANY (ARRAY['identificado'::text, 'em_avaliacao'::text, 'monitoramento'::text, 'concluido'::text])),
  responsible_name text NOT NULL DEFAULT ''::text,
  responsible_contact text NOT NULL DEFAULT ''::text,
  primary_areas ARRAY NOT NULL DEFAULT '{}'::text[],
  notes text NOT NULL DEFAULT ''::text,
  identified_at date,
  identified_by text NOT NULL DEFAULT ''::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  project_id uuid,
  CONSTRAINT students_pkey PRIMARY KEY (id),
  CONSTRAINT students_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id)
);
CREATE TABLE public.gifted_grades (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  subject text NOT NULL,
  grade numeric NOT NULL CHECK (grade >= 0::numeric AND grade <= 10::numeric),
  period text NOT NULL DEFAULT ''::text,
  date date,
  notes text NOT NULL DEFAULT ''::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT gifted_grades_pkey PRIMARY KEY (id),
  CONSTRAINT gifted_grades_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id)
);
CREATE TABLE public.gifted_skills (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  area text NOT NULL,
  score integer NOT NULL DEFAULT 0 CHECK (score >= 0 AND score <= 100),
  assessed_by text NOT NULL DEFAULT ''::text,
  date date,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT gifted_skills_pkey PRIMARY KEY (id),
  CONSTRAINT gifted_skills_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id)
);
CREATE TABLE public.gifted_developments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  date date,
  title text NOT NULL,
  description text NOT NULL DEFAULT ''::text,
  category text NOT NULL DEFAULT 'academico'::text CHECK (category = ANY (ARRAY['academico'::text, 'social'::text, 'criativo'::text, 'comportamental'::text, 'atividade'::text])),
  author text NOT NULL DEFAULT ''::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT gifted_developments_pkey PRIMARY KEY (id),
  CONSTRAINT gifted_developments_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id)
);
CREATE TABLE public.gifted_achievements (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  title text NOT NULL,
  description text NOT NULL DEFAULT ''::text,
  date date,
  type text NOT NULL DEFAULT 'outro'::text CHECK (type = ANY (ARRAY['olimpiada'::text, 'projeto'::text, 'reconhecimento'::text, 'publicacao'::text, 'outro'::text])),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT gifted_achievements_pkey PRIMARY KEY (id),
  CONSTRAINT gifted_achievements_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id)
);
CREATE TABLE public.quizzes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT ''::text,
  subject text NOT NULL DEFAULT ''::text,
  time_limit integer NOT NULL DEFAULT 30 CHECK (time_limit > 0),
  status text NOT NULL DEFAULT 'draft'::text CHECK (status = ANY (ARRAY['draft'::text, 'published'::text])),
  questions jsonb NOT NULL DEFAULT '[]'::jsonb,
  assigned_students ARRAY NOT NULL DEFAULT '{}'::text[],
  created_by text NOT NULL DEFAULT ''::text,
  created_by_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT quizzes_pkey PRIMARY KEY (id),
  CONSTRAINT quizzes_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES public.users(id)
);
CREATE TABLE public.quiz_results (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  quiz_id uuid NOT NULL,
  student_id text NOT NULL,
  student_uuid uuid,
  score integer NOT NULL DEFAULT 0,
  max_score integer NOT NULL DEFAULT 0,
  answers jsonb NOT NULL DEFAULT '[]'::jsonb,
  completed_at timestamp with time zone NOT NULL DEFAULT now(),
  time_taken integer NOT NULL DEFAULT 0,
  CONSTRAINT quiz_results_pkey PRIMARY KEY (id),
  CONSTRAINT quiz_results_quiz_id_fkey FOREIGN KEY (quiz_id) REFERENCES public.quizzes(id),
  CONSTRAINT quiz_results_student_uuid_fkey FOREIGN KEY (student_uuid) REFERENCES public.students(id)
);
CREATE TABLE public.work_proposals (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  student_id text NOT NULL,
  student_uuid uuid,
  title text NOT NULL,
  description text NOT NULL DEFAULT ''::text,
  objectives text NOT NULL DEFAULT ''::text,
  methodology text NOT NULL DEFAULT ''::text,
  expected_results text NOT NULL DEFAULT ''::text,
  timeline text NOT NULL DEFAULT ''::text,
  status text NOT NULL DEFAULT 'submitted'::text CHECK (status = ANY (ARRAY['submitted'::text, 'under_review'::text, 'approved'::text, 'in_progress'::text, 'completed'::text])),
  feedback text NOT NULL DEFAULT ''::text,
  reviewed_by uuid,
  reviewed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT work_proposals_pkey PRIMARY KEY (id),
  CONSTRAINT work_proposals_student_uuid_fkey FOREIGN KEY (student_uuid) REFERENCES public.students(id),
  CONSTRAINT work_proposals_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.users(id)
);
CREATE TABLE public.access_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'professor'::text,
  unit text NOT NULL DEFAULT ''::text,
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])),
  notes text NOT NULL DEFAULT ''::text,
  reviewed_by uuid,
  reviewed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT access_requests_pkey PRIMARY KEY (id),
  CONSTRAINT access_requests_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.users(id)
);
CREATE TABLE public.inventory_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL,
  subcategory text,
  quantity integer NOT NULL DEFAULT 0,
  total integer NOT NULL DEFAULT 0,
  unit_measure text NOT NULL DEFAULT 'un'::text,
  status text NOT NULL DEFAULT 'in'::text CHECK (status = ANY (ARRAY['in'::text, 'out'::text, 'low'::text, 'maintenance'::text])),
  description text,
  location text,
  min_stock integer DEFAULT 5,
  image_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT inventory_items_pkey PRIMARY KEY (id)
);
CREATE TABLE public.fablabs (
  id bigint NOT NULL DEFAULT nextval('fablabs_id_seq'::regclass),
  name character varying NOT NULL,
  slug character varying UNIQUE,
  address text NOT NULL,
  city character varying NOT NULL,
  state_province character varying,
  country character varying NOT NULL,
  postal_code character varying,
  latitude numeric NOT NULL,
  longitude numeric NOT NULL,
  description text,
  image_url text,
  website_url text,
  email character varying,
  phone character varying,
  is_seed boolean DEFAULT false,
  is_approved boolean DEFAULT false,
  submitted_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT fablabs_pkey PRIMARY KEY (id)
);
CREATE TABLE public.fablab_files (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT ''::text,
  category text NOT NULL DEFAULT 'outro'::text CHECK (category = ANY (ARRAY['stl'::text, 'gcode'::text, 'svg'::text, 'dxf'::text, '3mf'::text, 'glb'::text, 'image'::text, 'outro'::text])),
  tags ARRAY DEFAULT '{}'::text[],
  gallery ARRAY DEFAULT '{}'::text[],
  file_name text NOT NULL DEFAULT ''::text,
  file_url text NOT NULL DEFAULT ''::text,
  storage_path text NOT NULL DEFAULT ''::text,
  size_bytes bigint DEFAULT 0,
  compressed boolean DEFAULT false,
  published boolean DEFAULT false,
  uploaded_by text NOT NULL DEFAULT ''::text,
  author_role text DEFAULT ''::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  project_id uuid,
  CONSTRAINT fablab_files_pkey PRIMARY KEY (id),
  CONSTRAINT fablab_files_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id)
);
CREATE TABLE public.machines (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL DEFAULT ''::text,
  location text NOT NULL DEFAULT ''::text,
  status text NOT NULL DEFAULT 'operacional'::text CHECK (status = ANY (ARRAY['operacional'::text, 'manutencao'::text, 'limpeza'::text, 'aguardando_peca'::text, 'inativo'::text])),
  brand text DEFAULT ''::text,
  model text DEFAULT ''::text,
  serial_number text DEFAULT ''::text,
  acquired_at date,
  last_maintenance date,
  notes text DEFAULT ''::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  category text NOT NULL DEFAULT 'Outro'::text,
  scheduled_events jsonb NOT NULL DEFAULT '[]'::jsonb,
  CONSTRAINT machines_pkey PRIMARY KEY (id)
);
CREATE TABLE public.maintenance_tickets (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  machine_id uuid,
  machine_name text NOT NULL,
  machine_location text DEFAULT ''::text,
  problem text NOT NULL,
  priority text NOT NULL DEFAULT 'media'::text CHECK (priority = ANY (ARRAY['baixa'::text, 'media'::text, 'alta'::text, 'critica'::text])),
  status text NOT NULL DEFAULT 'aberto'::text CHECK (status = ANY (ARRAY['aberto'::text, 'em_andamento'::text, 'aguardando_peca'::text, 'resolvido'::text])),
  reported_by text NOT NULL,
  assigned_to text DEFAULT ''::text,
  opened_at timestamp with time zone NOT NULL DEFAULT now(),
  resolved_at timestamp with time zone,
  logs jsonb NOT NULL DEFAULT '[]'::jsonb,
  inventory_item_id uuid,
  CONSTRAINT maintenance_tickets_pkey PRIMARY KEY (id),
  CONSTRAINT maintenance_tickets_machine_id_fkey FOREIGN KEY (machine_id) REFERENCES public.machines(id),
  CONSTRAINT maintenance_tickets_inventory_item_id_fkey FOREIGN KEY (inventory_item_id) REFERENCES public.inventory_items(id)
);
CREATE TABLE public.attendance (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  project_id uuid,
  date date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'presente'::text CHECK (status = ANY (ARRAY['presente'::text, 'falta'::text, 'justificada'::text])),
  notes text NOT NULL DEFAULT ''::text,
  registered_by text NOT NULL DEFAULT ''::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT attendance_pkey PRIMARY KEY (id),
  CONSTRAINT attendance_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id),
  CONSTRAINT attendance_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id)
);