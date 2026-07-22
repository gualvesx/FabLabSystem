-- ══════════════════════════════════════════════════════════════════
-- FabLab Platform — Supabase Setup
-- Execute no SQL Editor: https://supabase.com/dashboard > SQL Editor
-- ══════════════════════════════════════════════════════════════════

-- ── 1. Tabela de arquivos (estilo blog) ───────────────────────────
DROP TABLE IF EXISTS public.fablab_files;

CREATE TABLE public.fablab_files (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- conteúdo
  title         text NOT NULL,
  description   text DEFAULT '',            -- markdown rico
  category      text NOT NULL DEFAULT 'outro'
                CHECK (category IN ('stl','gcode','svg','dxf','3mf','glb','image','outro')),
  tags          text[]       DEFAULT '{}',
  gallery       text[]       DEFAULT '{}',  -- array de URLs de imagens
  -- arquivo
  file_name     text NOT NULL DEFAULT '',
  file_url      text NOT NULL DEFAULT '',
  storage_path  text NOT NULL DEFAULT '',
  size_bytes    bigint       DEFAULT 0,
  compressed    boolean      DEFAULT false,
  -- publicação
  published     boolean      DEFAULT false,
  uploaded_by   text NOT NULL DEFAULT '',
  author_role   text         DEFAULT '',
  created_at    timestamptz  NOT NULL DEFAULT now(),
  updated_at    timestamptz  NOT NULL DEFAULT now(),
  -- relação opcional com projeto
  project_id    uuid REFERENCES public.projects(id) ON DELETE SET NULL
);

CREATE INDEX fablab_files_category_idx  ON public.fablab_files (category);
CREATE INDEX fablab_files_published_idx ON public.fablab_files (published);
CREATE INDEX fablab_files_created_idx   ON public.fablab_files (created_at DESC);
CREATE INDEX fablab_files_tags_idx      ON public.fablab_files USING gin (tags);

-- ── 2. RLS ────────────────────────────────────────────────────────
ALTER TABLE public.fablab_files ENABLE ROW LEVEL SECURITY;

-- Leitura: publicados → qualquer um; rascunhos → apenas admin/professor
CREATE POLICY "fablab_files_select" ON public.fablab_files FOR SELECT
  USING (
    published = true
    OR EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role IN ('admin','professor')
    )
  );

CREATE POLICY "fablab_files_insert" ON public.fablab_files FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "fablab_files_update" ON public.fablab_files FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin','professor'))
  );

CREATE POLICY "fablab_files_delete" ON public.fablab_files FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin','professor'))
  );

-- ── 3. Storage Bucket ─────────────────────────────────────────────
-- Crie manualmente em: Supabase Dashboard > Storage > New Bucket
--   Nome: fablab-files
--   Visibilidade: PUBLIC
--   Tamanho máx: 100 MB
--
-- Ou via SQL (requer pg_net / storage extension):
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'fablab-files', 'fablab-files', true, 104857600,
  ARRAY[
    'model/stl','model/gltf-binary','model/gltf+json',
    'application/octet-stream',
    'image/svg+xml','image/png','image/jpeg','image/webp','image/gif',
    'application/gzip','application/zip','application/pdf'
  ]
) ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "fabfiles_storage_select" ON storage.objects FOR SELECT
  USING (bucket_id = 'fablab-files');

CREATE POLICY "fabfiles_storage_insert" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (bucket_id = 'fablab-files');

CREATE POLICY "fabfiles_storage_delete" ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'fablab-files'
    AND EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role IN ('admin','professor')
    )
  );

-- ── 4. Tabela de tickets de manutenção ────────────────────────────
CREATE TABLE IF NOT EXISTS public.maintenance_tickets (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  machine_name      text NOT NULL,
  machine_location  text DEFAULT '',
  problem           text NOT NULL,
  priority          text NOT NULL DEFAULT 'media'
                    CHECK (priority IN ('baixa','media','alta','critica')),
  status            text NOT NULL DEFAULT 'aberto'
                    CHECK (status IN ('aberto','em_andamento','aguardando_peca','resolvido')),
  reported_by       text NOT NULL,
  assigned_to       text DEFAULT '',
  opened_at         timestamptz NOT NULL DEFAULT now(),
  resolved_at       timestamptz,
  logs              jsonb NOT NULL DEFAULT '[]',
  inventory_item_id uuid REFERENCES public.inventory(id) ON DELETE SET NULL
);

ALTER TABLE public.maintenance_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "maint_select" ON public.maintenance_tickets FOR SELECT TO authenticated USING (true);
CREATE POLICY "maint_insert" ON public.maintenance_tickets FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "maint_update" ON public.maintenance_tickets FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin','professor')));
CREATE POLICY "maint_delete" ON public.maintenance_tickets FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin','professor')));
