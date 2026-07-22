# FabLab Platform

Plataforma open source para gestão de laboratórios de fabricação digital (Fab Labs),
baseada nos princípios do projeto MIT e da cultura maker.

## Stack
- React 18 + TypeScript + Vite
- Tailwind CSS + shadcn/ui
- Supabase (Auth, Database, RLS)
- Zustand (estado global)
- Framer Motion (animações)

## Módulos
| Módulo | Rota | Descrição |
|--------|------|-----------|
| FabLab | `/fablab/*` | Inventário, agendamentos, blog, relatórios |
| Projetos | `/projects/*` | Multi-projeto: alunos, quizzes, propostas |
| Aluno | `/student/*` | Quiz, notas, proposta de trabalho |

## Setup
1. Clone o repositório
2. Copie `.env.example` para `.env` e preencha as variáveis do Supabase
3. Execute o `supabase_schema.sql` no SQL Editor do Supabase
4. `npm install && npm run dev`

## Paleta de cores
- Azul: `#1D4ED8` — módulo FabLab
- Verde: `#059669` — módulo Projetos
- Vermelho: `#DC2626` — ações destrutivas / destaques

## Contribuição
Projeto open source. PRs bem-vindos!
Mantenha o código documentado e siga os padrões existentes.

## Licença
MIT — baseado na Fab Charter do MIT (fab.cba.mit.edu)
