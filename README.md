<div align="center">

<img src="public/logo.svg" alt="FabLabSystem Logo" width="90" height="90" />

# FabLabSystem · Gestão de Laboratórios

**Sistema inteligente para gerenciamento de laboratórios de fabricação digital, agendamento de máquinas e controle de estoque**

[![React](https://img.shields.io/badge/React-18-61dafb?style=flat-square&logo=react)](https://reactjs.org)
[![Vite](https://img.shields.io/badge/Vite-5-646cff?style=flat-square&logo=vite)](https://vitejs.dev)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ecf8e?style=flat-square&logo=supabase)](https://supabase.io)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?style=flat-square&logo=tailwindcss)](https://tailwindcss.com)
[![PWA](https://img.shields.io/badge/PWA-Ready-5a0fc8?style=flat-square)](https://web.dev/progressive-web-apps)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)
[![Open Source](https://img.shields.io/badge/Open%20Source-%E2%9D%A4-red?style=flat-square)](https://github.com/gualvesx/FabLabSystem)

[**🌐 Demo ao vivo**](https://fablab.ynm.com.br) · [**📖 Documentação**](#-funcionalidades) · [**⭐ Deixe uma estrela**](https://github.com/gualvesx/FabLabSystem)

</div>

---

## ✨ O que é o FabLabSystem?

FabLabSystem é uma plataforma **open source** desenvolvida para otimizar e automatizar a gestão operacional de **Fab Labs, Makerspaces e Laboratórios de Prototipagem**. O sistema centraliza o agendamento de máquinas de fabricação digital, o controle de insumos e matérias-primas, a habilitação de usuários (badges de segurança) e a documentação de projetos abertos da comunidade maker.

> *"Dê às pessoas as ferramentas para fabricar o que precisam e elas mudarão o mundo."*  
> — Neil Gershenfeld, Criador do conceito Fab Lab (MIT)

---

## 🚀 Funcionalidades

### 🖨️ Equipamentos & Máquinas
- **Cadastro completo de parque fabril**: impressoras 3D (FDM/SLA), cortadoras a laser, fresadoras CNC, plotters de corte e bancadas de eletrônica
- **Status em tempo real**: Operacional, Em Uso, Em Manutenção ou Fora de Serviço
- **Especificações e manuais**: vínculo de documentação técnica, parâmetros de corte/impressão e checklist de segurança por equipamento
- **Histórico de manutenção**: registro preventivo e corretivo das máquinas com log de substituição de peças

### 📅 Agendamentos & Reservas
- **Grade de horários inteligente**: visualização diária, semanal e mensal de ocupação do laboratório
- **Regras de reserva flexíveis**: limite de horas por usuário/semana para prevenção de gargalos
- **Validação de pré-requisitos**: sistema impede a reserva de máquinas complexas caso o usuário não possua a habilitação/treinamento exigido
- **Check-in & Check-out**: confirmação de presença no início da sessão para liberação do equipamento

### 📦 Controle de Estoque & Insumos
- **Gestão de matérias-primas**: filamentos 3D (PLA, ABS, PETG, TPU), chapas de MDF, acrílicos, componentes eletrônicos e ferramentas
- **Alertas de estoque baixo**: notificações automáticas quando um insumo atinge a quantidade mínima de segurança
- **Baixa automática por projeto**: desconto de gramas de filamento ou área em $m^2$ consumidos durante as sessões
- **Histórico de compras e fornecedores**: controle financeiro de entradas e saídas de material

### 🎓 Habilitações & Treinamentos (Badges)
- **Certificação de usuários**: controle de capacitações e treinamentos de segurança concluídos
- **Emissão e validação de badges**: perfis exibem as habilidades e equipamentos autorizados
- **Níveis de experiência**: categorização de makers (Iniciante, Operador, Monitor, Fab Manager)

### 👥 Gestão de Makers & Comunidade
- **Cadastro de membros e visitantes**: controle de acessos ao espaço e estatísticas de público
- **Galeria de projetos open source**: portfólio de projetos desenvolvidos no laboratório com suporte a arquivos CAD, STL e esquemáticos
- **Registro de presença**: controle diário de fluxo de pessoas no makerspace

### 📊 Dashboard & Relatórios
- **Métricas de utilização**: taxa de ocupação de máquinas, horas trabalhadas por equipamento e pico de horários
- **Consumo de materiais**: relatórios detalhados de desperdício e consumo de insumos por período
- **Exportação de relatórios**: relatórios em PDF, CSV e JSON para prestação de contas institucionais

### ⚙️ Configurações & Acessos
- **Controle de permissões (RBAC)**: perfis diferenciados para Administrador, Fab Manager, Monitor e Maker
- **Tema escuro/claro**: interface moderna adaptável com persistência de preferência
- **Notificações configuráveis**: e-mails e alertas sobre confirmação de reservas e lembretes de devolução de ferramentas

---

## 📱 PWA — Progressive Web App

FabLabSystem foi projetado como um **PWA de alta performance**, permitindo o uso fluido tanto no navegador desktop quanto instalado em tablets de bancada e smartphones.

### Instalar no Desktop / Tablet de Bancada
1. Acesse o sistema no navegador (Chrome, Edge ou Safari)
2. Clique no ícone de instalação na barra de navegação
3. Clique em **Instalar** para executar a aplicação como janela autônoma de quiosque

### O que o PWA oferece
| Recurso | Disponível |
|---------|-----------|
| Funciona offline (leitura e cache) | ✅ Service Worker |
| Instalável na tela inicial | ✅ |
| Notificações in-app e push | ✅ |
| Interface responsiva para quiosques | ✅ |
| Atualizações em tempo real | ✅ via Supabase Realtime |

---

## 🏗️ Stack Tecnológica

| Camada | Tecnologia | Versão |
|--------|-----------|--------|
| UI / Frontend | React | 18 |
| Build Tool | Vite | 5 |
| Linguagem | JavaScript (ES6+) | — |
| Estilização | Tailwind CSS | 3.4 |
| Ícones | Lucide React | — |
| Backend & Auth | Supabase | — |
| Banco de Dados | PostgreSQL (via Supabase) | — |
| PWA | Service Worker + Web App Manifest | — |
| CI/CD | GitHub Actions | — |
| Hospedagem | Vercel / Netlify / Serverless | — |

---

## 🗂️ Estrutura do Projeto

```
fablabsystem/
├── public/
│   ├── logo.svg                # Logo vetorial do FabLabSystem
│   ├── icon-192.png            # Ícone PWA 192×192
│   ├── icon-512.png            # Ícone PWA 512×512
│   ├── manifest.json          # Manifesto PWA
│   └── sw.js                  # Service Worker para cache e modo offline
│
├── src/
│   ├── App.jsx                 # Roteamento central e gerenciamento de sessões
│   ├── main.jsx                # Ponto de entrada do React
│   │
│   ├── hooks/
│   │   ├── useAuth.js          # Autenticação e perfil do usuário no Supabase
│   │   ├── useMachines.js      # Gerenciamento de máquinas e status
│   │   ├── useReservations.js  # CRUD de agendamentos e verificação de conflitos
│   │   ├── useInventory.js     # Controle de insumos e movimentações
│   │   └── useTheme.js         # Controle de tema claro/escuro
│   │
│   ├── pages/
│   │   ├── DashboardPage.jsx  # Indicadores gerais e resumo operacional
│   │   ├── MachinesPage.jsx   # Listagem e controle de máquinas
│   │   ├── SchedulePage.jsx   # Calendário e criação de reservas
│   │   ├── InventoryPage.jsx  # Gestão de estoque e insumos
│   │   ├── ProjectsPage.jsx   # Portfólio de projetos abertos da comunidade
│   │   ├── UsersPage.jsx      # Gestão de membros e habilitações
│   │   └── SettingsPage.jsx   # Configurações do laboratório
│   │
│   ├── components/
│   │   ├── machines/
│   │   │   ├── MachineCard.jsx    # Card com status e ações rápidas da máquina
│   │   │   └── MachineModal.jsx   # Modal de criação/edição de equipamento
│   │   ├── schedule/
│   │   │   ├── CalendarView.jsx   # Componente visual da grade de horários
│   │   │   └── ReserveModal.jsx   # Modal de confirmação de agendamento
│   │   ├── inventory/
│   │   │   └── StockItemModal.jsx # Modal de movimentação de material
│   │   ├── ui/
│   │   │   ├── BadgeTag.jsx       # Componente visual para badges de segurança
│   │   │   └── StatCard.jsx       # Card de indicador para o dashboard
│   │   └── layout/
│   │       ├── Header.jsx
│   │       ├── Sidebar.jsx
│   │       └── Footer.jsx
│   │
│   └── utils/
│       ├── supabase.js         # Conexão e cliente Supabase
│       ├── date.js             # Formatação e manipulação de horários de reserva
│       └── validators.js       # Validações de formulários e permissões
│
├── .github/
│   └── workflows/
│       └── deploy.yml          # Pipeline CI/CD para deploy automático
│
├── vite.config.js              # Configurações do Vite e aliases
├── tailwind.config.js          # Configuração de temas e cores do Tailwind CSS
└── package.json
```

---

## 🗄️ Schema do Banco (Supabase / PostgreSQL)

```sql
-- Perfis de Usuários e Roles
profiles (
  id              uuid PRIMARY KEY REFERENCES auth.users,
  full_name       text NOT NULL,
  avatar_url      text,
  role            text CHECK (role IN ('admin', 'manager', 'monitor', 'maker')) DEFAULT 'maker',
  bio             text,
  phone           text,
  created_at      timestamptz DEFAULT now()
);

-- Máquinas e Equipamentos
machines (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                    text NOT NULL,
  category                text NOT NULL, -- '3d_printer', 'laser_cutter', 'cnc', 'electronics', 'other'
  description             text,
  status                  text CHECK (status IN ('available', 'in_use', 'maintenance', 'offline')) DEFAULT 'available',
  requires_certification  boolean DEFAULT true,
  max_reservation_hours  integer DEFAULT 2,
  image_url               text,
  created_at              timestamptz DEFAULT now()
);

-- Habilitações e Certificações
certifications (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  description text,
  machine_id  uuid REFERENCES machines(id) ON DELETE CASCADE,
  created_at  timestamptz DEFAULT now()
);

-- Vínculo Usuário <-> Certificação
user_certifications (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid REFERENCES profiles(id) ON DELETE CASCADE,
  certification_id uuid REFERENCES certifications(id) ON DELETE CASCADE,
  granted_by       uuid REFERENCES profiles(id),
  granted_at       timestamptz DEFAULT now()
);

-- Agendamentos e Reservas
reservations (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES profiles(id) ON DELETE CASCADE,
  machine_id  uuid REFERENCES machines(id) ON DELETE CASCADE,
  start_time  timestamptz NOT NULL,
  end_time    timestamptz NOT NULL,
  status      text CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')) DEFAULT 'scheduled',
  notes       text,
  created_at  timestamptz DEFAULT now()
);

-- Controle de Estoque de Insumos
inventory (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  category      text NOT NULL, -- 'filament', 'mdf', 'acrylic', 'components', 'tools'
  quantity      numeric DEFAULT 0,
  unit          text NOT NULL, -- 'g', 'kg', 'm2', 'units'
  min_quantity  numeric DEFAULT 5,
  unit_cost     numeric DEFAULT 0,
  location      text,
  updated_at    timestamptz DEFAULT now()
);

-- Portfólio de Projetos
projects (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id    uuid REFERENCES profiles(id) ON DELETE CASCADE,
  title        text NOT NULL,
  description  text,
  repository   text,
  license      text DEFAULT 'CC-BY-SA-4.0',
  images       jsonb DEFAULT '[]',
  created_at   timestamptz DEFAULT now()
);
```

---

## ⚙️ Rodando Localmente

### Pré-requisitos
- **Node.js** (versão 18 ou superior)
- npm ou yarn
- Uma conta no [Supabase](https://supabase.io) (gratuita)

### Passo a passo

```bash
# 1. Clone o repositório
git clone https://github.com/gualvesx/FabLabSystem.git
cd FabLabSystem

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
cp .env.example .env

# Edite o arquivo .env com suas credenciais do Supabase:
# VITE_SUPABASE_URL=https://sua-instancia.supabase.co
# VITE_SUPABASE_ANON_KEY=sua-chave-anonima-aqui

# 4. Execute o servidor de desenvolvimento
npm run dev

# O app estará disponível em: http://localhost:5173
```

### Build para Produção

```bash
# Compilar o projeto para produção
npm run build

# Os arquivos estáticos otimizados serão gerados na pasta /dist
```

---

## 🤝 Contribuindo

O **FabLabSystem** é um projeto **open source** e contribuições da comunidade maker e desenvolvedora são muito bem-vindas!

```bash
# Fork → Clone → Branch → Commit → Push → Pull Request
git checkout -b feature/sua-feature
git commit -m "feat: adiciona controle de manutenção de máquinas"
git push origin feature/sua-feature
```

### Ideias de contribuição
- 🔌 Integração com leitores de QR Code e RFID/NFC para check-in
- 📊 Novos gráficos estatísticos de consumo de insumos
- 🌍 Suporte a múltiplos idiomas (i18n)
- 🔔 Integração com Webhooks e Telegram/Discord para avisos de reservas
- 🧪 Testes automatizados (Vitest + Playwright)
- 📖 Melhorias na documentação e tutoriais de instalação

### Diretrizes
- Mantenha o padrão arquitetural do projeto (React hooks, componentes modulares e Tailwind)
- Faça commits semânticos (`feat:`, `fix:`, `docs:`, `refactor:`)
- Abra uma *issue* para discutir grandes alterações antes de enviar uma PR

---

## 📄 Licença

```
MIT License

Copyright (c) 2025 gualvesx

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
```

Veja o arquivo [LICENSE](LICENSE) para o texto completo.

---

## 👤 Autor

Desenvolvido com ❤️ por **[gualvesx](https://github.com/gualvesx)**

---

<div align="center">

**[🌐 Demo do Projeto](https://fablab.ynm.com.br)** · **[🐛 Reportar Bug](https://github.com/gualvesx/FabLabSystem/issues)** · **[⭐ GitHub](https://github.com/gualvesx/FabLabSystem)**

*Se este projeto é útil para o seu Fab Lab ou Makerspace, considere deixar uma ⭐ no repositório!*

</div>
