-- ============================================================
-- SCHEMA: fablabs_map
-- FabLab Platform — Mapa Global de Unidades
-- ============================================================

-- Extensão para coordenadas geográficas (PostgreSQL + PostGIS)
-- Se não usar PostGIS, mantenha apenas latitude/longitude como NUMERIC
-- CREATE EXTENSION IF NOT EXISTS postgis;

-- ── Tabela principal de Fab Labs ────────────────────────────
CREATE TABLE IF NOT EXISTS fablabs (
  id              BIGSERIAL       PRIMARY KEY,

  -- Identificação
  name            VARCHAR(200)    NOT NULL,
  slug            VARCHAR(200)    UNIQUE, -- ex: "fab-lab-sao-paulo"

  -- Localização
  address         TEXT            NOT NULL,
  city            VARCHAR(100)    NOT NULL,
  state_province  VARCHAR(100),
  country         VARCHAR(100)    NOT NULL,
  postal_code     VARCHAR(20),
  latitude        NUMERIC(10, 7)  NOT NULL,
  longitude       NUMERIC(10, 7)  NOT NULL,

  -- Detalhes
  description     TEXT,
  image_url       TEXT,            -- Link externo (Drive, Imgur, etc.)
  website_url     TEXT,
  email           VARCHAR(200),
  phone           VARCHAR(50),

  -- Metadados
  is_seed         BOOLEAN         DEFAULT FALSE,  -- TRUE = ponto fixo inicial do CSV
  is_approved     BOOLEAN         DEFAULT FALSE,  -- Cadastros de usuários aguardam aprovação
  submitted_by    UUID,                           -- FK para users (se aplicável)

  created_at      TIMESTAMPTZ     DEFAULT NOW(),
  updated_at      TIMESTAMPTZ     DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_fablabs_country    ON fablabs (country);
CREATE INDEX IF NOT EXISTS idx_fablabs_city       ON fablabs (city);
CREATE INDEX IF NOT EXISTS idx_fablabs_approved   ON fablabs (is_approved);
CREATE INDEX IF NOT EXISTS idx_fablabs_coords     ON fablabs (latitude, longitude);

-- Trigger: atualiza updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_fablabs_updated_at
  BEFORE UPDATE ON fablabs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ── Dados seed (50 Fab Labs fixos do CSV) ───────────────────
-- Execute este bloco após criar a tabela, ou use COPY para importar o CSV.
-- Os pontos seed são aprovados por padrão (is_approved = TRUE, is_seed = TRUE).

INSERT INTO fablabs (name, address, city, country, latitude, longitude, description, image_url, is_seed, is_approved) VALUES
('Fab Lab MIT','77 Massachusetts Ave','Cambridge','USA',42.3601000,-71.0942000,'O laboratório original Fab Lab, fundado por Neil Gershenfeld no MIT em 2003. Pioneiro global em fabricação digital e prototipagem.',NULL,TRUE,TRUE),
('Fab Lab Barcelona','Carrer de Pallars 122','Barcelona','Spain',41.4036000,2.1926000,'Parte do Instituto de Arquitetura Avançada da Catalunha (IAAC). Referência europeia em design digital e fabricação.',NULL,TRUE,TRUE),
('Fab Lab Amsterdam','Tollensstraat 4','Amsterdam','Netherlands',52.3676000,4.9041000,'Espaço colaborativo de inovação em Amsterdam, focado em projetos de arte digital e tecnologia aberta.',NULL,TRUE,TRUE),
('Fab Lab Trivandrum','NIT Campus','Trivandrum','India',8.5241000,76.9366000,'Um dos primeiros Fab Labs na Índia, ligado ao National Institute of Technology de Trivandrum.',NULL,TRUE,TRUE),
('Fab Lab Vigyan Ashram','Pabal Village','Pune','India',18.8406000,74.1751000,'Laboratório pioneiro em área rural indiana, focado em tecnologia acessível para comunidades locais.',NULL,TRUE,TRUE),
('Fab Lab Nairobi','Bishop Magua Centre','Nairobi','Kenya',-1.2921000,36.8219000,'Hub de inovação tecnológica em Nairobi, capacitando jovens africanos em fabricação digital.',NULL,TRUE,TRUE),
('Fab Lab Lagos','Yaba Tech Road','Lagos','Nigeria',6.5244000,3.3792000,'Um dos mais ativos Fab Labs da África Ocidental, apoiando empreendedores de tecnologia.',NULL,TRUE,TRUE),
('Fab Lab Seoul','Mapo-gu','Seoul','South Korea',37.5665000,126.9780000,'Centro de inovação em Seoul, com forte ênfase em eletrônica e wearables.',NULL,TRUE,TRUE),
('Fab Lab Tokyo','Shibuya-ku','Tokyo','Japan',35.6762000,139.6503000,'Colaboração entre universidades e indústria japonesa para prototipagem avançada.',NULL,TRUE,TRUE),
('Fab Lab Shenzhen','Huaqiangbei District','Shenzhen','China',22.5431000,114.0579000,'Coração do ecossistema maker chinês, integrado à maior hub de eletrônica do mundo.',NULL,TRUE,TRUE),
('Fab Lab Singapore','73 Bras Basah Rd','Singapore','Singapore',1.2966000,103.8520000,'Fab Lab dentro do LASALLE College of the Arts, integrando arte e tecnologia.',NULL,TRUE,TRUE),
('Fab Lab Melbourne','371 Royal Pde','Melbourne','Australia',-37.8136000,144.9631000,'Centro maker da Universidade de Melbourne, aberto para estudantes e comunidade.',NULL,TRUE,TRUE),
('Fab Lab Sydney','15 Broadway','Sydney','Australia',-33.8688000,151.2093000,'Espaço de fabricação digital do Instituto Tecnológico de Sydney (UTS).',NULL,TRUE,TRUE),
('Fab Lab São Paulo','Av. Paulista 1009','São Paulo','Brazil',-23.5505000,-46.6333000,'Fab Lab no coração de São Paulo, conectando inovadores e makers paulistanos.',NULL,TRUE,TRUE),
('Fab Lab Rio de Janeiro','Rua Marquês de São Vicente 225','Rio de Janeiro','Brazil',-22.9068000,-43.1729000,'Integrado à PUC-Rio, com projetos de impacto social e ambiental.',NULL,TRUE,TRUE),
('Fab Lab Recife','Av. Prof. Moraes Rego 1235','Recife','Brazil',-8.0476000,-34.8770000,'No campus da UFPE, foco em soluções para o Nordeste brasileiro.',NULL,TRUE,TRUE),
('Fab Lab Belo Horizonte','Av. Antônio Carlos 6627','Belo Horizonte','Brazil',-19.9167000,-43.9345000,'Fab Lab da UFMG, referência em fabricação e design sustentável.',NULL,TRUE,TRUE),
('Fab Lab Brasília','Campus Universitário Darcy Ribeiro','Brasília','Brazil',-15.7801000,-47.9292000,'Espaço maker da UnB, com projetos governamentais e universitários.',NULL,TRUE,TRUE),
('Fab Lab Porto Alegre','Av. Ipiranga 6681','Porto Alegre','Brazil',-30.0346000,-51.2177000,'Fab Lab da PUCRS com foco em hardware livre e IoT.',NULL,TRUE,TRUE),
('Fab Lab Curitiba','Rua XV de Novembro 1299','Curitiba','Brazil',-25.4290000,-49.2671000,'Centro de inovação no sul do Brasil, referência em design industrial.',NULL,TRUE,TRUE),
('Fab Lab Fortaleza','Av. da Universidade 2853','Fortaleza','Brazil',-3.7319000,-38.5267000,'Fab Lab da UFC com forte atuação em projetos de economia criativa.',NULL,TRUE,TRUE),
('Fab Lab Manaus','Av. Darcy Vargas 1200','Manaus','Brazil',-3.1190000,-60.0217000,'Fab Lab em plena Amazônia, com foco em biohacking e soluções sustentáveis.',NULL,TRUE,TRUE),
('Fab Lab Paris','10 Rue du Caire','Paris','France',48.8566000,2.3522000,'Um dos primeiros Fab Labs da França, no coração criativo de Paris.',NULL,TRUE,TRUE),
('Fab Lab London','14 Bonhill Street','London','United Kingdom',51.5074000,-0.1278000,'Espaço maker no centro de Londres, referência em inovação europeia.',NULL,TRUE,TRUE),
('Fab Lab Berlin','Prenzlauer Allee 242','Berlin','Germany',52.5200000,13.4050000,'Fab Lab em Berlim, epicentro da cena maker e startup alemã.',NULL,TRUE,TRUE),
('Fab Lab Copenhagen','Birketinget 10','Copenhagen','Denmark',55.6761000,12.5683000,'Centro nórdico de inovação com foco em design sustentável e biomateriais.',NULL,TRUE,TRUE),
('Fab Lab Helsinki','Lonnrotinkatu 29','Helsinki','Finland',60.1699000,24.9384000,'Fab Lab no coração da capital finlandesa, com forte parceria industrial.',NULL,TRUE,TRUE),
('Fab Lab Torino','Via Egeo 18','Turin','Italy',45.0703000,7.6869000,'Fab Lab Torino: pioneiro italiano em fabricação digital e design aberto.',NULL,TRUE,TRUE),
('Fab Lab Rome','Via Merulana 28','Rome','Italy',41.9028000,12.4964000,'Espaço maker em Roma integrado a espaços culturais históricos.',NULL,TRUE,TRUE),
('Fab Lab Athens','Trias 5','Athens','Greece',37.9838000,23.7275000,'Fab Lab em Atenas, impulsionando o ecossistema maker grego.',NULL,TRUE,TRUE),
('Fab Lab Istanbul','Inönü Cd. 30','Istanbul','Turkey',41.0082000,28.9784000,'Hub maker na maior cidade turca, conectando Europa e Ásia.',NULL,TRUE,TRUE),
('Fab Lab Cairo','AUC New Cairo Campus','Cairo','Egypt',30.0444000,31.2357000,'Fab Lab da Universidade Americana no Cairo, referência no mundo árabe.',NULL,TRUE,TRUE),
('Fab Lab Casablanca','Boulevard Driss Slaoui','Casablanca','Morocco',33.5731000,-7.5898000,'Fab Lab no maior centro urbano de Marrocos, capacitando jovens africanos.',NULL,TRUE,TRUE),
('Fab Lab Johannesburg','1 Jan Smuts Ave','Johannesburg','South Africa',-26.2041000,28.0473000,'Fab Lab em Joanesburgo, núcleo de inovação tecnológica sul-africana.',NULL,TRUE,TRUE),
('Fab Lab Cape Town','25 Burg Street','Cape Town','South Africa',-33.9249000,18.4241000,'Espaço maker na Cidade do Cabo, com foco em impacto social e design.',NULL,TRUE,TRUE),
('Fab Lab Mexico City','Insurgentes Sur 1579','Mexico City','Mexico',19.4326000,-99.1332000,'Fab Lab na capital mexicana, conectando makers latinos.',NULL,TRUE,TRUE),
('Fab Lab Bogotá','Carrera 7 40-62','Bogotá','Colombia',4.7110000,-74.0721000,'Centro de inovação maker em Bogotá, com forte programa educacional.',NULL,TRUE,TRUE),
('Fab Lab Lima','Av. Universitaria 1801','Lima','Peru',-12.0464000,-77.0428000,'Fab Lab da PUCP, referência em fabricação digital no Peru.',NULL,TRUE,TRUE),
('Fab Lab Santiago','Av. Vicuña Mackenna 4860','Santiago','Chile',-33.4489000,-70.6693000,'Fab Lab da Universidad Católica do Chile, com forte ênfase em arquitetura.',NULL,TRUE,TRUE),
('Fab Lab Buenos Aires','Av. Córdoba 2122','Buenos Aires','Argentina',-34.6037000,-58.3816000,'Fab Lab na capital argentina, conectando a vibrante cena maker portenha.',NULL,TRUE,TRUE),
('Fab Lab Montevideo','Bulevar Artigas 1031','Montevideo','Uruguay',-34.9011000,-56.1915000,'Pequeno mas ativo Fab Lab no Uruguai, com foco em educação pública.',NULL,TRUE,TRUE),
('Fab Lab Boston','23 Drydock Ave','Boston','USA',42.3601000,-71.0942000,'Fab Lab público em Boston, focado em comunidades carentes e educação STEM.',NULL,TRUE,TRUE),
('Fab Lab Chicago','122 S Michigan Ave','Chicago','USA',41.8781000,-87.6298000,'Fab Lab no centro cultural de Chicago, integrado ao Instituto de Arte.',NULL,TRUE,TRUE),
('Fab Lab San Francisco','926 Howard St','San Francisco','USA',37.7749000,-122.4194000,'Espaço maker em SFO, epicentro do ecossistema de inovação do Vale do Silício.',NULL,TRUE,TRUE),
('Fab Lab New York','125 W 55th St','New York','USA',40.7128000,-74.0060000,'Fab Lab em Manhattan, conectado ao ecossistema criativo nova-iorquino.',NULL,TRUE,TRUE),
('Fab Lab Portland','516 SE Morrison St','Portland','USA',45.5231000,-122.6765000,'Fab Lab comprometido com sustentabilidade e código aberto no Oregon.',NULL,TRUE,TRUE),
('Fab Lab Accra','Cantonments','Accra','Ghana',5.6037000,-0.1870000,'Fab Lab em Acra, capital do Gana, apoiando talentos tecnológicos africanos.',NULL,TRUE,TRUE),
('Fab Lab Addis Ababa','Churchill Ave','Addis Ababa','Ethiopia',9.0250000,38.7469000,'Fab Lab em Adis Abeba, fomentando inovação na Etiópia.',NULL,TRUE,TRUE),
('Fab Lab Lahore','Canal Bank Road','Lahore','Pakistan',31.5204000,74.3587000,'Fab Lab em Lahore, principal hub maker do Paquistão.',NULL,TRUE,TRUE),
('Fab Lab Dhaka','Zahir Raihan Rd','Dhaka','Bangladesh',23.8103000,90.4125000,'Fab Lab em Dhaka com foco em soluções de baixo custo para fabricação.',NULL,TRUE,TRUE)
ON CONFLICT (slug) DO NOTHING;

-- ── View: apenas labs aprovados para o mapa público ─────────
CREATE OR REPLACE VIEW public_fablabs AS
  SELECT
    id, name, address, city, country,
    latitude, longitude,
    description, image_url, website_url,
    is_seed, created_at
  FROM fablabs
  WHERE is_approved = TRUE;

-- ── Função RPC (Supabase): submeter novo Fab Lab ────────────
-- Chamada pelo frontend ao submeter o formulário de cadastro.
-- O lab fica is_approved = FALSE até um admin aprovar (ou TRUE se auto-aprovação for desejada).
CREATE OR REPLACE FUNCTION submit_fablab(
  p_name          VARCHAR,
  p_address       TEXT,
  p_city          VARCHAR,
  p_country       VARCHAR,
  p_latitude      NUMERIC,
  p_longitude     NUMERIC,
  p_description   TEXT    DEFAULT NULL,
  p_image_url     TEXT    DEFAULT NULL,
  p_website_url   TEXT    DEFAULT NULL,
  p_email         VARCHAR DEFAULT NULL,
  p_submitted_by  UUID    DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  new_id BIGINT;
BEGIN
  INSERT INTO fablabs (
    name, address, city, country,
    latitude, longitude,
    description, image_url, website_url, email,
    is_seed, is_approved, submitted_by,
    slug
  )
  VALUES (
    p_name, p_address, p_city, p_country,
    p_latitude, p_longitude,
    p_description, p_image_url, p_website_url, p_email,
    FALSE,
    FALSE,  -- ← mude para TRUE para auto-aprovação
    p_submitted_by,
    LOWER(REGEXP_REPLACE(p_name, '[^a-zA-Z0-9]+', '-', 'g'))
  )
  RETURNING id INTO new_id;

  RETURN json_build_object('success', TRUE, 'id', new_id, 'pending_approval', TRUE);
EXCEPTION WHEN unique_violation THEN
  RETURN json_build_object('success', FALSE, 'error', 'Um Fab Lab com este nome já existe.');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── Row Level Security (Supabase) ────────────────────────────
ALTER TABLE fablabs ENABLE ROW LEVEL SECURITY;

-- Leitura pública: apenas labs aprovados
CREATE POLICY "Leitura pública de labs aprovados"
  ON fablabs FOR SELECT
  USING (is_approved = TRUE);

-- Inserção: qualquer usuário autenticado pode submeter
CREATE POLICY "Usuários autenticados podem submeter labs"
  ON fablabs FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Atualização/exclusão: apenas admins (via service_role ou role admin)
CREATE POLICY "Apenas admins podem aprovar/editar labs"
  ON fablabs FOR UPDATE
  USING (auth.role() = 'service_role');

-- ============================================================
-- NOTAS DE INTEGRAÇÃO
-- ============================================================
-- 1. Para importar o CSV diretamente:
--    COPY fablabs(name,address,city,country,latitude,longitude,description,image_url,is_seed,is_approved)
--    FROM '/caminho/fablabs_seed.csv' CSV HEADER;
--
-- 2. Coordenadas são NUMERIC(10,7) — precisão suficiente para ~1cm.
--    Para queries geoespaciais avançadas, use PostGIS e converta para GEOGRAPHY.
--
-- 3. image_url aceita links externos (Google Drive, Imgur, Cloudinary, etc).
--    No frontend, use o link de visualização direta (não de download).
--
-- 4. is_approved controla visibilidade no mapa público.
--    Labs seed são aprovados por padrão. Cadastros de usuários ficam pending.
-- ============================================================
