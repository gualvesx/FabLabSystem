<div align="center">

<img src="public/logo.svg" alt="FabLabSystem Logo" width="90" height="90" />

# FabLabSystem · Gestão de Laboratórios

**Sistema web completo para gerenciamento de Fab Labs, agendamento de máquinas, controle de estoque e usuários**

[![React](https://img.shields.io/badge/React-18-61dafb?style=flat-square&logo=react)](https://reactjs.org)
[![Vite](https://img.shields.io/badge/Vite-5-646cff?style=flat-square&logo=vite)](https://vitejs.dev)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=nodedotjs)](https://nodejs.org)
[![Render](https://img.shields.io/badge/Render-Deployed-46E3B7?style=flat-square&logo=render)](https://render.com)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)
[![Open Source](https://img.shields.io/badge/Open%20Source-%E2%9D%A4-red?style=flat-square)](https://github.com/gualvesx/FabLabSystem)

[**🌐 Acesse a Aplicação**](https://fablabsystem-dcim.onrender.com/) · [**📖 Documentação**](#-funcionalidades) · [**⭐ Deixe uma estrela**](https://github.com/gualvesx/FabLabSystem)

</div>

---

## ✨ O que é o FabLabSystem?

**FabLabSystem** é um sistema web desenvolvido para simplificar a gestão operacional de **Fab Labs, Makerspaces e Laboratórios de Prototipagem**. A plataforma centraliza o cadastro e controle de status do parque fabril, o agendamento de uso de máquinas (impressoras 3D, cortadoras a laser, CNCs), o gerenciamento de insumos e o controle de acesso dos membros da comunidade.

> *"Se você pode imaginar, você pode fabricar."*  
> — Filosofia do Movimento Maker

---

## 🚀 Funcionalidades

### 🖨️ Equipamentos & Máquinas
- **Cadastro de parque fabril**: controle de impressoras 3D, cortadoras a laser, fresadoras CNC e bancadas de eletrônica
- **Status em tempo real**: indicação visual de equipamentos *Disponíveis*, *Em Uso*, *Em Manutenção* ou *Inativos*
- **Especificações técnicas**: registro de manuais, parâmetros operacionais e recomendações de segurança

### 📅 Agendamento & Reservas
- **Grade de horários**: controle de uso de máquinas por data e faixa horária
- **Evitação de conflitos**: validação automática de horários sobrepostos no mesmo equipamento
- **Gestão de reservas**: confirmação, cancelamento e histórico de utilização por usuário

### 📦 Controle de Insumos & Estoque
- **Gestão de materiais**: filamentos (PLA, ABS, PETG), chapas de MDF, acrílicos e componentes eletrônicos
- **Entradas e saídas**: registro de movimentações de estoque por projeto ou manutenção
- **Alerta de quantidade mínima**: monitoramento para reposição preventiva de insumos

### 👥 Gestão de Usuários & Acessos
- **Perfis e níveis de acesso**: separação entre Administradores, Gestores do Lab e Makers/Membros
- **Histórico do usuário**: acompanhamento das reservas e projetos de cada membro
- **Controle de permissões**: restrição de agendamento de máquinas conforme o nível do usuário

### 📊 Dashboard & Relatórios
- **Visão geral do espaço**: estatísticas rápidas de uso e ocupação do laboratório
- **Gráficos e métricas**: relatórios de máquinas mais utilizadas e consumo de materiais
- **Resumo operacional**: painel com próximos agendamentos e atividades do dia

---

## 🌐 Hospedagem & Deploy

A aplicação está hospedada e em execução no **Render**:

- **URL de Produção**: [https://fablabsystem-dcim.onrender.com/](https://fablabsystem-dcim.onrender.com/)
- **Deploy Continuo**: integração automática via webhook no repositório GitHub a cada atualização no branch principal (`main`)

---

## 🏗️ Stack Tecnológica

| Camada | Tecnologia | Descrição |
|--------|-----------|-----------|
| Frontend | React 18 | Biblioteca UI reativa e modular |
| Build Tool | Vite 5 | Bundler de alto desempenho para desenvolvimento ágil |
| Estilização | CSS Modules / Tailwind | Design responsivo e adaptado para telas desktop e mobile |
| Roteamento | React Router | Navegação SPA de alta performance |
| Backend / API | Node.js / Express | API RESTful para regras de negócio |
| Banco de Dados | PostgreSQL / MongoDB | Armazenamento de usuários, máquinas e reservas |
| Hospedagem | Render | Plataforma Cloud para serviços web e banco de dados |

---

## 🗂️ Estrutura do Projeto

```
FabLabSystem/
├── public/
│   ├── favicon.ico             # Ícone do navegador
│   └── logo.svg                # Logo do projeto
│
├── src/
│   ├── assets/                 # Imagens, ícones e arquivos estáticos
│   ├── components/             # Componentes reutilizáveis da interface
│   │   ├── common/             # Botões, inputs, modais e cards
│   │   ├── layout/             # Header, Sidebar e Footer
│   │   ├── machines/           # Componentes relativos às máquinas
│   │   └── schedule/           # Componentes de agendamento
│   │
│   ├── context/                # Contextos globais (AuthContext, ThemeContext)
│   ├── hooks/                  # Custom hooks para requisições e estados
│   ├── pages/                  # Páginas principais (Dashboard, Máquinas, Reservas, Estoque)
│   ├── services/               # Clientes de API e comunicação com backend
│   ├── styles/                 # Arquivos de estilo global
│   ├── utils/                  # Utilitários de formatação de datas e validações
│   │
│   ├── App.jsx                 # Roteamento central da aplicação
│   └── main.jsx                # Ponto de entrada do React
│
├── .env.example                # Exemplo de variáveis de ambiente
├── vite.config.js              # Configurações do Vite
└── package.json
```

---

## 🗄️ Modelo de Dados (Schema Simplificado)

```sql
-- Usuários do Sistema
users (
  id          UUID PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  email       VARCHAR(100) UNIQUE NOT NULL,
  role        VARCHAR(20) DEFAULT 'maker', -- 'admin', 'manager', 'maker'
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Parque de Máquinas
machines (
  id          UUID PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  category    VARCHAR(50) NOT NULL,
  status      VARCHAR(20) DEFAULT 'available', -- 'available', 'in_use', 'maintenance'
  description TEXT
);

-- Reservas de Horário
reservations (
  id          UUID PRIMARY KEY,
  user_id     UUID REFERENCES users(id),
  machine_id  UUID REFERENCES machines(id),
  start_time  TIMESTAMP NOT NULL,
  end_time    TIMESTAMP NOT NULL,
  status      VARCHAR(20) DEFAULT 'confirmed'
);

-- Insumos e Materiais
inventory (
  id          UUID PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  quantity    NUMERIC NOT NULL DEFAULT 0,
  unit        VARCHAR(20) NOT NULL, -- 'g', 'kg', 'm2', 'un'
  min_stock   NUMERIC DEFAULT 5
);
```

---

## ⚙️ Rodando Localmente

### Pré-requisitos
- **Node.js** (v18 ou superior)
- **npm** ou **yarn**

### Passo a Passo

```bash
# 1. Clone o repositório
git clone https://github.com/gualvesx/FabLabSystem.git
cd FabLabSystem

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
cp .env.example .env
# Preencha o arquivo .env com suas configurações locais

# 4. Inicie o servidor de desenvolvimento
npm run dev

# Acesse no navegador: http://localhost:5173
```

### Build de Produção

```bash
# Compilar o código para produção
npm run build

# Executar a pré-visualização da build
npm run preview
```

---

## 🤝 Contribuindo

Contribuições são super bem-vindas! Se você deseja colaborar com o desenvolvimento do **FabLabSystem**:

1. Faça um **Fork** do projeto
2. Crie uma Branch para sua funcionalidade (`git checkout -b feature/NovaFuncionalidade`)
3. Faça o **Commit** de suas alterações (`git commit -m 'feat: adiciona nova funcionalidade'`)
4. Envie para o branch (`git push origin feature/NovaFuncionalidade`)
5. Abra um **Pull Request**

---

## 📄 Licença

Este projeto está sob a licença **MIT**. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## 👤 Autor

Desenvolvido por **[gualvesx](https://github.com/gualvesx)**

---

<div align="center">

**[🌐 fablabsystem-dcim.onrender.com](https://fablabsystem-dcim.onrender.com/)** · **[⭐ GitHub](https://github.com/gualvesx/FabLabSystem)**

*Gostou do projeto? Deixe uma estrela no repositório para apoiar o desenvolvimento!*

</div>
