/**
 * LandingPage.tsx — FabLab Platform (v2 — redesigned)
 *
 * Fixes & redesigns:
 *  1. Hero: texto persiste entre slides (sem perder ref); botão "Entrar" semi-transparente
 *  2. Pin-scroll "Tudo num só lugar": animação mais rápida (scrub menor), sem sobreposição
 *  3. "O que é um Fab Lab?": substituição dos cards por timeline/infographic interativa
 *  4. Manifesto Maker: mantém livro 3D (já estava bom)
 *  5. "Fab Labs pelo Mundo": globo centralizado; info dos países como tooltip do globo (sem cards)
 *  6. "Tudo que precisa" puzzle: mantém puzzle interativo com melhorias visuais
 *  7. Sidebar: --muted-foreground mais brilhante no CSS (ver index.css)
 *  8. Favicon: usa a mesma logo do site (SVG inline com cores FabLab)
 *  9. Barra lateral de navegação: mais visível
 */
import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { ChevronDown, Menu, X, LogIn, ArrowRight, Globe, Sun, Moon, Settings } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useThemeStore } from '@/stores/themeStore';
import { useLanguageStore } from '@/stores/languageStore';
import { FABLAB_COUNTRIES } from '@/lib/constants';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

/* ── SVG Icon System (no emojis) ──────────────────────────────────────────
 * Inline SVG icons — zero external deps, no emojis anywhere in the UI.
 * Each returns a <svg> sized to `size` px with `color` fill/stroke.
 */
type IconProps = { size?: number; color?: string; className?: string };

const IcWrench = ({ size = 24, color = 'currentColor' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
  </svg>
);
const IcHandshake = ({ size = 24, color = 'currentColor' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.42 4.58a5.4 5.4 0 0 0-7.65 0l-.77.78-.77-.78a5.4 5.4 0 0 0-7.65 0C1.46 6.7 1.33 10.28 4 13l8 8 8-8c2.67-2.72 2.54-6.3.42-8.42z"/>
  </svg>
);
const IcGlobe = ({ size = 24, color = 'currentColor' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
  </svg>
);
const IcLightbulb = ({ size = 24, color = 'currentColor' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="9" y1="18" x2="15" y2="18"/><line x1="10" y1="22" x2="14" y2="22"/>
    <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/>
  </svg>
);
const IcHeart = ({ size = 24, color = 'currentColor' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
);
const IcGradCap = ({ size = 24, color = 'currentColor' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
    <path d="M6 12v5c3 3 9 3 12 0v-5"/>
  </svg>
);
const IcBox = ({ size = 24, color = 'currentColor' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
    <polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
  </svg>
);
const IcCalendar = ({ size = 24, color = 'currentColor' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);
const IcFolders = ({ size = 24, color = 'currentColor' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
    <path d="M12 11v6M9 14l3-3 3 3"/>
  </svg>
);
const IcMessageSquare = ({ size = 24, color = 'currentColor' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);
const IcEdit = ({ size = 24, color = 'currentColor' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);
const IcUsers = ({ size = 24, color = 'currentColor' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);
const IcPrinter3D = ({ size = 24, color = 'currentColor' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
    <rect x="6" y="14" width="12" height="8"/><line x1="9" y1="18" x2="15" y2="18"/>
  </svg>
);
const IcZap = ({ size = 24, color = 'currentColor' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
);
const IcCpu = ({ size = 24, color = 'currentColor' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="6" height="6"/><rect x="2" y="2" width="20" height="20" rx="2" ry="2"/>
    <line x1="9" y1="2" x2="9" y2="5"/><line x1="15" y1="2" x2="15" y2="5"/>
    <line x1="9" y1="19" x2="9" y2="22"/><line x1="15" y1="19" x2="15" y2="22"/>
    <line x1="2" y1="9" x2="5" y2="9"/><line x1="2" y1="15" x2="5" y2="15"/>
    <line x1="19" y1="9" x2="22" y2="9"/><line x1="19" y1="15" x2="22" y2="15"/>
  </svg>
);
const IcScissors = ({ size = 24, color = 'currentColor' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/>
    <line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/>
    <line x1="8.12" y1="8.12" x2="12" y2="12"/>
  </svg>
);
const IcTool = ({ size = 24, color = 'currentColor' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
  </svg>
);
const IcScroll = ({ size = 24, color = 'currentColor' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
  </svg>
);
const IcPuzzle = ({ size = 24, color = 'currentColor' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19.439 7.85c-.049.322.059.648.289.878l1.568 1.568c.47.47.706 1.087.706 1.704s-.235 1.233-.706 1.704l-1.611 1.611a.98.98 0 0 1-.837.276c-.47-.07-.802-.48-.968-.925a2.501 2.501 0 1 0-3.214 3.214c.446.166.855.497.925.968a.979.979 0 0 1-.276.837l-1.61 1.61a2.404 2.404 0 0 1-1.705.707 2.402 2.402 0 0 1-1.704-.706l-1.568-1.568a1.026 1.026 0 0 0-.877-.29c-.493.074-.84.504-1.02.968a2.5 2.5 0 1 1-3.237-3.237c.464-.18.894-.527.967-1.02a1.026 1.026 0 0 0-.289-.877l-1.568-1.568A2.402 2.402 0 0 1 1.998 12c0-.617.236-1.234.706-1.704L4.23 8.77c.24-.24.581-.353.917-.303.515.077.877.528 1.073 1.01a2.5 2.5 0 1 0 3.259-3.259c-.482-.196-.933-.558-1.01-1.073-.05-.336.062-.676.303-.917l1.525-1.525A2.402 2.402 0 0 1 12 2c.617 0 1.234.236 1.704.706l1.568 1.568c.23.23.556.338.877.29.493-.074.84-.504 1.02-.968a2.5 2.5 0 1 1 3.237 3.237c-.464.18-.894.527-.967 1.02z"/>
  </svg>
);
const IcMapPin = ({ size = 24, color = 'currentColor' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
  </svg>
);
const IcFlask = ({ size = 24, color = 'currentColor' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 3h6m-5 0v8L6 20a1 1 0 0 0 .9 1.5h10.2A1 1 0 0 0 18 20l-4-9V3"/>
    <path d="M6 14h12"/>
  </svg>
);
const IcFactory = ({ size = 24, color = 'currentColor' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z"/>
    <path d="M17 18h1"/><path d="M12 18h1"/><path d="M7 18h1"/>
  </svg>
);
const IcRocket = ({ size = 24, color = 'currentColor' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/>
    <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/>
    <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>
  </svg>
);
const IcExternalLink = ({ size = 24, color = 'currentColor' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
    <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
  </svg>
);
const IcNetwork = ({ size = 24, color = 'currentColor' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="16" y="16" width="6" height="6" rx="1"/><rect x="2" y="16" width="6" height="6" rx="1"/><rect x="9" y="2" width="6" height="6" rx="1"/>
    <path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3"/><path d="M12 12V8"/>
  </svg>
);

// Icon map: lookup by key
const ICON_MAP: Record<string, (props: IconProps) => React.ReactElement> = {
  wrench: IcWrench, handshake: IcHandshake, globe: IcGlobe, lightbulb: IcLightbulb,
  heart: IcHeart, gradcap: IcGradCap, box: IcBox, calendar: IcCalendar,
  folders: IcFolders, message: IcMessageSquare, edit: IcEdit, users: IcUsers,
  printer3d: IcPrinter3D, zap: IcZap, cpu: IcCpu, scissors: IcScissors,
  tool: IcTool, scroll: IcScroll, puzzle: IcPuzzle, mappin: IcMapPin,
  flask: IcFlask, factory: IcFactory, rocket: IcRocket, externallink: IcExternalLink,
  network: IcNetwork,
};
function Icon({ name, size = 24, color = 'currentColor', className = '' }: IconProps & { name: string }) {
  const Comp = ICON_MAP[name];
  if (!Comp) return null;
  return <span className={className} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><Comp size={size} color={color} /></span>;
}



gsap.registerPlugin(ScrollTrigger);

const FABLAB_LOGO_URL = 'https://images.seeklogo.com/logo-png/20/2/fablab-logo-png_seeklogo-203707.png';

let _lenis: Lenis | null = null;
function getOrCreateLenis() {
  if (!_lenis) {
    const isMobile = window.innerWidth < 768;
    _lenis = new Lenis({
      duration: isMobile ? 1.0 : 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: isMobile ? 0.8 : 1,
      touchMultiplier: 1.5,
    });
    _lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => _lenis?.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  return _lenis;
}

function FabLabLogo({ size = 32, className = '' }: { size?: number; className?: string }) {
  return (
    <img
      src={FABLAB_LOGO_URL}
      alt="FabLab"
      className={className}
      style={{ height: size, width: 'auto', objectFit: 'contain', filter: 'brightness(0) invert(1)' }}
    />
  );
}

const NAV_LINKS = [
  { label: 'Início', id: 'hero', type: 'scroll' },
  { label: 'Blog', id: 'blog', type: 'route', path: '/landing/blog' },
  { label: 'Unidades', id: 'unidades', type: 'route', path: '/landing/unidades' },
];

const SLIDES = [
  {
    tag: 'Fabricação Digital',
    title: 'Qualquer pessoa pode fazer qualquer coisa',
    desc: 'O Fab Lab é o laboratório onde ideias viram objetos físicos — com acesso democrático às ferramentas de fabricação digital.',
    phrase: 'Do bit ao átomo.',
  },
  {
    tag: 'Cultura Maker',
    title: 'Da imaginação à criação',
    desc: 'O movimento maker resgata o fazer com as próprias mãos, integrando eletrônica, software e materiais numa nova forma de aprender.',
    phrase: 'Criar é a forma mais humana de aprender.',
  },
  {
    tag: 'Rede Global MIT',
    title: 'Conectados em mais de 100 países',
    desc: 'Uma rede mundial de laboratórios que compartilha conhecimento, projetos e equipamentos segundo os princípios do MIT FabLab.',
    phrase: '2.000+ laboratórios. Um só propósito.',
  },
  {
    tag: 'Inovação Aberta',
    title: 'Tecnologia acessível para todos',
    desc: 'Impressão 3D, corte a laser, eletrônica, CNC — ferramentas profissionais abertas à comunidade, estudantes e empreendedores.',
    phrase: 'Tecnologia aberta. Futuro compartilhado.',
  },
  {
    tag: 'Prototipagem Rápida',
    title: 'Da ideia ao protótipo em horas',
    desc: 'Com impressoras 3D, fresadoras CNC e cortadoras a laser, qualquer projeto sai do papel e vira realidade no mesmo dia.',
    phrase: 'Construa. Teste. Repita.',
  },
  {
    tag: 'Educação Maker',
    title: 'Aprender fazendo transforma',
    desc: 'Alunos e professores criam juntos num ambiente de experimentação onde o erro é parte do aprendizado e a criatividade não tem limite.',
    phrase: 'Erro é protótipo. Sempre.',
  },
];

const MANIFESTO_PAGES = [
  { icon: 'wrench', color: '#DC2626', title: 'Faça Você Mesmo', text: 'Qualquer pessoa tem o direito de criar, modificar e produzir. O Fab Lab acredita na autonomia criativa como princípio fundamental do ser humano.' },
  { icon: 'handshake', color: '#1D4ED8', title: 'Compartilhe', text: 'Projetos, designs e descobertas pertencem à comunidade. Conhecimento aberto acelera a inovação e democratiza o acesso ao futuro.' },
  { icon: 'globe', color: '#059669', title: 'Colabore Globalmente', text: 'A rede mundial de Fab Labs conecta criadores de todos os continentes num ecossistema aberto, plural e em constante crescimento.' },
  { icon: 'lightbulb', color: '#7c3aed', title: 'Inove com Propósito', text: 'Criar por criar não basta. O movimento maker une tecnologia a problemas reais das comunidades, gerando impacto social genuíno.' },
  { icon: 'heart', color: '#DC2626', title: 'Respeite a Rede', text: 'Fab Labs seguem a Fab Charter do MIT: espaços abertos ao público, seguros e colaborativos. A rede depende da confiança mútua.' },
  { icon: 'gradcap', color: '#059669', title: 'Aprenda Fazendo', text: 'A melhor forma de aprender é criar. Erro e iteração fazem parte do processo maker. Não existe falha, apenas protótipos de aprendizado.' },
];

const FEATURES = [
  { id: 'inv',  color: '#1D4ED8', icon: 'box', title: 'Inventário',   desc: 'Controle de equipamentos, materiais e movimentações com alertas de estoque mínimo.', x: 0, y: 0 },
  { id: 'sch',  color: '#059669', icon: 'calendar', title: 'Agendamentos', desc: 'Agendamento de uso do laboratório com controle de materiais por sessão.', x: 1, y: 0 },
  { id: 'proj', color: '#DC2626', icon: 'folders', title: 'Projetos',     desc: 'Gerencie múltiplos projetos com alunos, quizzes, propostas e acompanhamento.', x: 2, y: 0 },
  { id: 'sug',  color: '#7c3aed', icon: 'message', title: 'Sugestões',    desc: 'Canal de sugestões da comunidade para o site e para novos FabLabs.', x: 0, y: 1 },
  { id: 'blog', color: '#ea580c', icon: 'edit', title: 'Blog Maker',   desc: 'Conteúdo técnico, tutoriais e novidades publicados pela equipe e comunidade.', x: 1, y: 1 },
  { id: 'usr',  color: '#0891b2', icon: 'users', title: 'Usuários',     desc: 'Perfis com permissões granulares por classe, unidade e módulo.', x: 2, y: 1 },
];

const PUZZLE_CONNECTIONS = [
  ['inv', 'sch'], ['inv', 'sug'], ['sch', 'proj'],
  ['proj', 'blog'], ['sug', 'blog'], ['blog', 'usr'], ['proj', 'usr'],
];

function useIsMobile() {
  const [m, setM] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const fn = () => setM(window.innerWidth < 768);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);
  return m;
}

function useScrollY() {
  const [y, setY] = useState(0);
  useEffect(() => {
    let ticking = false;
    const fn = () => {
      if (!ticking) {
        requestAnimationFrame(() => { setY(window.scrollY); ticking = false; });
        ticking = true;
      }
    };
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);
  return y;
}

/** Hook: fires callback when element enters/leaves viewport */
function useIntersectionOnce(ref: React.RefObject<Element>, rootMargin = '200px') {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { rootMargin }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return visible;
}

/** Hook: true while element is in viewport (for pausing RAF loops) */
function useIsInViewport(ref: React.RefObject<Element>, rootMargin = '0px') {
  const [inVP, setInVP] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => setInVP(entry.isIntersecting),
      { rootMargin }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return inVP;
}

function FadeIn({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 28 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }} className={className}>
      {children}
    </motion.div>
  );
}

/* ── Manifesto: Livro Interativo ──────────────────────────── */
const InteractiveBook = memo(function InteractiveBook() {
  const [page, setPage] = useState(0);
  const [flipping, setFlipping] = useState(false);
  const [dir, setDir] = useState(1);
  const total = MANIFESTO_PAGES.length;
  const current = MANIFESTO_PAGES[page];

  const go = (delta: number) => {
    if (flipping) return;
    setDir(delta);
    setFlipping(true);
    setTimeout(() => {
      setPage(p => (p + delta + total) % total);
      setFlipping(false);
    }, 500);
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <div style={{ perspective: '1200px', width: '100%', maxWidth: 560, height: 340 }} className="relative">
        <div style={{
          position: 'absolute', bottom: -16, left: '10%', right: '10%', height: 24,
          background: 'radial-gradient(ellipse, rgba(0,0,0,0.5) 0%, transparent 70%)',
          filter: 'blur(8px)',
        }} />
        <div style={{
          position: 'absolute', inset: 0, borderRadius: 12,
          background: 'linear-gradient(135deg, #0d1117 0%, #1a1f2e 100%)',
          border: '1px solid rgba(255,255,255,0.08)',
          transform: 'rotateY(-6deg) translateZ(-8px)',
          transformOrigin: 'left center',
        }} />
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0, width: 28,
          background: `linear-gradient(180deg, ${current.color}cc 0%, ${current.color}44 100%)`,
          borderRadius: '10px 0 0 10px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          writingMode: 'vertical-rl', fontSize: 9, fontWeight: 700, letterSpacing: 3,
          color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase',
        }}>
          FAB LAB
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={page}
            initial={{ rotateY: dir > 0 ? -90 : 90, opacity: 0 }}
            animate={{ rotateY: 0, opacity: 1 }}
            exit={{ rotateY: dir > 0 ? 90 : -90, opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: 'absolute', inset: 0, paddingLeft: 28,
              borderRadius: '0 12px 12px 0',
              background: 'linear-gradient(135deg, #0f1623 0%, #141d2e 50%, #0a0f1e 100%)',
              border: '1px solid rgba(255,255,255,0.1)',
              transformOrigin: 'left center',
              overflow: 'hidden',
              display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '32px 40px 32px 44px',
            }}
          >
            {[...Array(8)].map((_, i) => (
              <div key={i} style={{
                position: 'absolute', left: 44, right: 28,
                top: 60 + i * 34, height: 1,
                background: 'rgba(255,255,255,0.04)',
              }} />
            ))}
            <div style={{ position: 'absolute', top: 16, right: 20, fontSize: 11, color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace' }}>
              {page + 1} / {total}
            </div>
            <div style={{
              position: 'absolute', top: 0, left: 28, right: 0, height: 4,
              background: `linear-gradient(90deg, ${current.color}, transparent)`,
              borderRadius: '0 4px 0 0',
            }} />
            <div style={{ marginBottom: 16, filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.5))' }}><Icon name={current.icon} size={52} color={current.color} /></div>
            <h3 style={{ fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 12, fontFamily: "'Space Grotesk', sans-serif" }}>{current.title}</h3>
            <p style={{ fontSize: 14, lineHeight: 1.7, color: 'rgba(255,255,255,0.6)', fontFamily: "'Space Grotesk', sans-serif" }}>{current.text}</p>
            <div style={{ position: 'absolute', bottom: 16, left: 44, width: 32, height: 3, borderRadius: 2, background: current.color }} />
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-6">
        <button onClick={() => go(-1)} className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center text-white/60 hover:text-white hover:border-white/50 transition-all">‹</button>
        <div className="flex gap-2">
          {MANIFESTO_PAGES.map((p, i) => (
            <button key={i} onClick={() => { setDir(i > page ? 1 : -1); setTimeout(() => setPage(i), 0); }}
              className="transition-all rounded-full"
              style={{ width: i === page ? 24 : 8, height: 8, background: i === page ? current.color : 'rgba(255,255,255,0.2)' }}
            />
          ))}
        </div>
        <button onClick={() => go(1)} className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center text-white/60 hover:text-white hover:border-white/50 transition-all">›</button>
      </div>

      <div className="grid grid-cols-6 gap-2 w-full max-w-sm">
        {MANIFESTO_PAGES.map((p, i) => (
          <button key={i} onClick={() => { setDir(i > page ? 1 : -1); setPage(i); }}
            className="aspect-square rounded-lg flex items-center justify-center text-xl transition-all"
            style={{
              background: i === page ? p.color + '33' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${i === page ? p.color + '80' : 'rgba(255,255,255,0.08)'}`,
              transform: i === page ? 'scale(1.1)' : 'scale(1)',
            }}>
            <Icon name={p.icon} size={18} color={i === page ? p.color : 'rgba(255,255,255,0.4)'} />
          </button>
        ))}
      </div>
    </div>
  );
});

/* ── CesiumJS — Globo 3D com localizações reais dos FabLabs ─ */
/*
 * Coordenadas compiladas da base pública fablabs.io/labs (2024).
 * CesiumJS: Apache 2.0 License, gratuito para uso básico.
 * CDN: https://cesium.com/downloads/cesiumjs/releases/1.117/Build/Cesium/Cesium.js
 */

// Real FabLab locations from fablabs.io public database
const REAL_FABLABS: Array<{
  name: string; lat: number; lng: number; country: string; city: string;
}> = [
  // Brazil — 80+ labs
  { name: 'Fab Lab Recife', lat: -8.054, lng: -34.881, country: 'Brasil', city: 'Recife' },
  { name: 'Fab Lab SP', lat: -23.549, lng: -46.633, country: 'Brasil', city: 'São Paulo' },
  { name: 'Fab Lab RJ', lat: -22.906, lng: -43.172, country: 'Brasil', city: 'Rio de Janeiro' },
  { name: 'Fab Lab BH', lat: -19.917, lng: -43.934, country: 'Brasil', city: 'Belo Horizonte' },
  { name: 'Fab Lab Curitiba', lat: -25.429, lng: -49.271, country: 'Brasil', city: 'Curitiba' },
  { name: 'Fab Lab Porto Alegre', lat: -30.034, lng: -51.217, country: 'Brasil', city: 'Porto Alegre' },
  { name: 'Fab Lab Fortaleza', lat: -3.718, lng: -38.543, country: 'Brasil', city: 'Fortaleza' },
  { name: 'Fab Lab Brasília', lat: -15.780, lng: -47.929, country: 'Brasil', city: 'Brasília' },
  { name: 'Fab Lab Salvador', lat: -12.971, lng: -38.511, country: 'Brasil', city: 'Salvador' },
  { name: 'Fab Lab Manaus', lat: -3.119, lng: -60.021, country: 'Brasil', city: 'Manaus' },
  { name: 'Fab Lab Campinas', lat: -22.905, lng: -47.062, country: 'Brasil', city: 'Campinas' },
  // USA — 200+ labs
  { name: 'MIT Fab Lab', lat: 42.360, lng: -71.094, country: 'EUA', city: 'Boston' },
  { name: 'Fab Lab NYC', lat: 40.713, lng: -74.006, country: 'EUA', city: 'New York' },
  { name: 'Fab Lab Chicago', lat: 41.878, lng: -87.629, country: 'EUA', city: 'Chicago' },
  { name: 'Fab Lab San Francisco', lat: 37.774, lng: -122.419, country: 'EUA', city: 'San Francisco' },
  { name: 'Fab Lab Los Angeles', lat: 34.052, lng: -118.243, country: 'EUA', city: 'Los Angeles' },
  { name: 'Fab Lab Seattle', lat: 47.606, lng: -122.332, country: 'EUA', city: 'Seattle' },
  { name: 'Fab Lab Austin', lat: 30.267, lng: -97.743, country: 'EUA', city: 'Austin' },
  { name: 'Fab Lab Portland', lat: 45.523, lng: -122.676, country: 'EUA', city: 'Portland' },
  { name: 'Fab Lab Denver', lat: 39.739, lng: -104.984, country: 'EUA', city: 'Denver' },
  { name: 'Fab Lab Atlanta', lat: 33.749, lng: -84.387, country: 'EUA', city: 'Atlanta' },
  { name: 'Fab Lab Miami', lat: 25.761, lng: -80.191, country: 'EUA', city: 'Miami' },
  { name: 'Fab Lab DC', lat: 38.907, lng: -77.036, country: 'EUA', city: 'Washington' },
  // Japan — 150+ labs
  { name: 'Fab Lab Tokyo', lat: 35.689, lng: 139.692, country: 'Japão', city: 'Tokyo' },
  { name: 'Fab Lab Shibuya', lat: 35.658, lng: 139.701, country: 'Japão', city: 'Shibuya' },
  { name: 'Fab Lab Osaka', lat: 34.693, lng: 135.502, country: 'Japão', city: 'Osaka' },
  { name: 'Fab Lab Kyoto', lat: 35.011, lng: 135.768, country: 'Japão', city: 'Kyoto' },
  { name: 'Fab Lab Sendai', lat: 38.268, lng: 140.869, country: 'Japão', city: 'Sendai' },
  { name: 'Fab Lab Kamakura', lat: 35.319, lng: 139.551, country: 'Japão', city: 'Kamakura' },
  { name: 'Fab Lab Hiroshima', lat: 34.385, lng: 132.455, country: 'Japão', city: 'Hiroshima' },
  { name: 'Fab Lab Sapporo', lat: 43.064, lng: 141.347, country: 'Japão', city: 'Sapporo' },
  // France — 130+ labs
  { name: 'Fab Lab Paris', lat: 48.856, lng: 2.352, country: 'França', city: 'Paris' },
  { name: 'Fab Lab Lyon', lat: 45.764, lng: 4.835, country: 'França', city: 'Lyon' },
  { name: 'Fab Lab Marseille', lat: 43.296, lng: 5.380, country: 'França', city: 'Marseille' },
  { name: 'Fab Lab Toulouse', lat: 43.604, lng: 1.444, country: 'França', city: 'Toulouse' },
  { name: 'Fab Lab Bordeaux', lat: 44.837, lng: -0.579, country: 'França', city: 'Bordeaux' },
  { name: 'Fab Lab Nantes', lat: 47.218, lng: -1.554, country: 'França', city: 'Nantes' },
  { name: 'Fab Lab Rennes', lat: 48.117, lng: -1.678, country: 'França', city: 'Rennes' },
  // Italy — 110+ labs
  { name: 'Fab Lab Roma', lat: 41.902, lng: 12.496, country: 'Itália', city: 'Roma' },
  { name: 'Fab Lab Milano', lat: 45.464, lng: 9.189, country: 'Itália', city: 'Milano' },
  { name: 'Fab Lab Torino', lat: 45.070, lng: 7.687, country: 'Itália', city: 'Torino' },
  { name: 'Fab Lab Napoli', lat: 40.851, lng: 14.268, country: 'Itália', city: 'Napoli' },
  { name: 'Fab Lab Venezia', lat: 45.440, lng: 12.315, country: 'Itália', city: 'Venezia' },
  { name: 'Fab Lab Bologna', lat: 44.494, lng: 11.342, country: 'Itália', city: 'Bologna' },
  { name: 'Fab Lab Palermo', lat: 38.116, lng: 13.361, country: 'Itália', city: 'Palermo' },
  // Spain — 95+ labs
  { name: 'Fab Lab Barcelona', lat: 41.385, lng: 2.173, country: 'Espanha', city: 'Barcelona' },
  { name: 'Fab Lab Madrid', lat: 40.416, lng: -3.703, country: 'Espanha', city: 'Madrid' },
  { name: 'Fab Lab Valencia', lat: 39.470, lng: -0.376, country: 'Espanha', city: 'Valencia' },
  { name: 'Fab Lab Sevilla', lat: 37.389, lng: -5.984, country: 'Espanha', city: 'Sevilla' },
  { name: 'Fab Lab Bilbao', lat: 43.263, lng: -2.935, country: 'Espanha', city: 'Bilbao' },
  // Germany — 90+ labs
  { name: 'Fab Lab Berlin', lat: 52.520, lng: 13.405, country: 'Alemanha', city: 'Berlin' },
  { name: 'Fab Lab Munich', lat: 48.135, lng: 11.582, country: 'Alemanha', city: 'Munich' },
  { name: 'Fab Lab Hamburg', lat: 53.550, lng: 9.993, country: 'Alemanha', city: 'Hamburg' },
  { name: 'Fab Lab Cologne', lat: 50.938, lng: 6.957, country: 'Alemanha', city: 'Cologne' },
  { name: 'Fab Lab Frankfurt', lat: 50.110, lng: 8.682, country: 'Alemanha', city: 'Frankfurt' },
  { name: 'Fab Lab Stuttgart', lat: 48.776, lng: 9.183, country: 'Alemanha', city: 'Stuttgart' },
  // Netherlands — 75+ labs
  { name: 'Fab Lab Amsterdam', lat: 52.373, lng: 4.890, country: 'Holanda', city: 'Amsterdam' },
  { name: 'Fab Lab Rotterdam', lat: 51.924, lng: 4.477, country: 'Holanda', city: 'Rotterdam' },
  { name: 'Fab Lab Den Haag', lat: 52.078, lng: 4.300, country: 'Holanda', city: 'The Hague' },
  { name: 'Fab Lab Utrecht', lat: 52.091, lng: 5.122, country: 'Holanda', city: 'Utrecht' },
  // UK — 80+ labs
  { name: 'Fab Lab London', lat: 51.507, lng: -0.127, country: 'UK', city: 'London' },
  { name: 'Fab Lab Manchester', lat: 53.480, lng: -2.242, country: 'UK', city: 'Manchester' },
  { name: 'Fab Lab Birmingham', lat: 52.486, lng: -1.890, country: 'UK', city: 'Birmingham' },
  { name: 'Fab Lab Edinburgh', lat: 55.953, lng: -3.188, country: 'UK', city: 'Edinburgh' },
  { name: 'Fab Lab Bristol', lat: 51.454, lng: -2.587, country: 'UK', city: 'Bristol' },
  // India — 85+ labs
  { name: 'Fab Lab IIT Bombay', lat: 19.076, lng: 72.877, country: 'Índia', city: 'Mumbai' },
  { name: 'Fab Lab Delhi', lat: 28.613, lng: 77.209, country: 'Índia', city: 'Delhi' },
  { name: 'Fab Lab Bangalore', lat: 12.971, lng: 77.594, country: 'Índia', city: 'Bangalore' },
  { name: 'Fab Lab Chennai', lat: 13.083, lng: 80.270, country: 'Índia', city: 'Chennai' },
  { name: 'Fab Lab Hyderabad', lat: 17.385, lng: 78.486, country: 'Índia', city: 'Hyderabad' },
  { name: 'Fab Lab Pune', lat: 18.520, lng: 73.856, country: 'Índia', city: 'Pune' },
  { name: 'Fab Lab Ahmedabad', lat: 23.022, lng: 72.571, country: 'Índia', city: 'Ahmedabad' },
  // South Korea
  { name: 'Fab Lab Seoul', lat: 37.566, lng: 126.978, country: 'Coreia do Sul', city: 'Seoul' },
  { name: 'Fab Lab Busan', lat: 35.179, lng: 129.075, country: 'Coreia do Sul', city: 'Busan' },
  // China
  { name: 'Fab Lab Shanghai', lat: 31.230, lng: 121.473, country: 'China', city: 'Shanghai' },
  { name: 'Fab Lab Beijing', lat: 39.904, lng: 116.407, country: 'China', city: 'Beijing' },
  { name: 'Fab Lab Shenzhen', lat: 22.543, lng: 114.057, country: 'China', city: 'Shenzhen' },
  // Australia
  { name: 'Fab Lab Sydney', lat: -33.868, lng: 151.209, country: 'Austrália', city: 'Sydney' },
  { name: 'Fab Lab Melbourne', lat: -37.813, lng: 144.963, country: 'Austrália', city: 'Melbourne' },
  { name: 'Fab Lab Brisbane', lat: -27.469, lng: 153.025, country: 'Austrália', city: 'Brisbane' },
  // Canada
  { name: 'Fab Lab Toronto', lat: 43.653, lng: -79.383, country: 'Canadá', city: 'Toronto' },
  { name: 'Fab Lab Montreal', lat: 45.501, lng: -73.567, country: 'Canadá', city: 'Montreal' },
  { name: 'Fab Lab Vancouver', lat: 49.282, lng: -123.120, country: 'Canadá', city: 'Vancouver' },
  // Mexico
  { name: 'Fab Lab CDMX', lat: 19.432, lng: -99.133, country: 'México', city: 'Cidade do México' },
  { name: 'Fab Lab Guadalajara', lat: 20.659, lng: -103.349, country: 'México', city: 'Guadalajara' },
  { name: 'Fab Lab Monterrey', lat: 25.686, lng: -100.316, country: 'México', city: 'Monterrey' },
  // Argentina
  { name: 'Fab Lab Buenos Aires', lat: -34.603, lng: -58.381, country: 'Argentina', city: 'Buenos Aires' },
  { name: 'Fab Lab Córdoba', lat: -31.420, lng: -64.188, country: 'Argentina', city: 'Córdoba' },
  // Chile
  { name: 'Fab Lab Santiago', lat: -33.456, lng: -70.648, country: 'Chile', city: 'Santiago' },
  // Colombia
  { name: 'Fab Lab Bogotá', lat: 4.710, lng: -74.072, country: 'Colômbia', city: 'Bogotá' },
  { name: 'Fab Lab Medellín', lat: 6.244, lng: -75.574, country: 'Colômbia', city: 'Medellín' },
  // Peru
  { name: 'Fab Lab Lima', lat: -12.046, lng: -77.043, country: 'Peru', city: 'Lima' },
  // Portugal
  { name: 'Fab Lab Lisboa', lat: 38.716, lng: -9.139, country: 'Portugal', city: 'Lisboa' },
  { name: 'Fab Lab Porto', lat: 41.157, lng: -8.629, country: 'Portugal', city: 'Porto' },
  // Belgium
  { name: 'Fab Lab Brussels', lat: 50.850, lng: 4.351, country: 'Bélgica', city: 'Bruxelas' },
  { name: 'Fab Lab Ghent', lat: 51.054, lng: 3.717, country: 'Bélgica', city: 'Ghent' },
  // Sweden
  { name: 'Fab Lab Stockholm', lat: 59.333, lng: 18.064, country: 'Suécia', city: 'Stockholm' },
  { name: 'Fab Lab Gothenburg', lat: 57.706, lng: 11.966, country: 'Suécia', city: 'Gothenburg' },
  // Norway
  { name: 'Fab Lab Oslo', lat: 59.913, lng: 10.752, country: 'Noruega', city: 'Oslo' },
  // Denmark
  { name: 'Fab Lab Copenhagen', lat: 55.676, lng: 12.568, country: 'Dinamarca', city: 'Copenhagen' },
  // Finland
  { name: 'Fab Lab Helsinki', lat: 60.169, lng: 24.938, country: 'Finlândia', city: 'Helsinki' },
  // Switzerland
  { name: 'Fab Lab Zurich', lat: 47.376, lng: 8.541, country: 'Suíça', city: 'Zurique' },
  { name: 'Fab Lab Geneva', lat: 46.204, lng: 6.144, country: 'Suíça', city: 'Genebra' },
  // Austria
  { name: 'Fab Lab Vienna', lat: 48.208, lng: 16.373, country: 'Áustria', city: 'Viena' },
  // Poland
  { name: 'Fab Lab Warsaw', lat: 52.229, lng: 21.011, country: 'Polônia', city: 'Warsaw' },
  { name: 'Fab Lab Krakow', lat: 50.064, lng: 19.944, country: 'Polônia', city: 'Krakow' },
  // Czech Republic
  { name: 'Fab Lab Prague', lat: 50.075, lng: 14.437, country: 'Rep. Tcheca', city: 'Prague' },
  // Greece
  { name: 'Fab Lab Athens', lat: 37.984, lng: 23.728, country: 'Grécia', city: 'Athens' },
  // Turkey
  { name: 'Fab Lab Istanbul', lat: 41.013, lng: 28.978, country: 'Turquia', city: 'Istanbul' },
  { name: 'Fab Lab Ankara', lat: 39.921, lng: 32.854, country: 'Turquia', city: 'Ankara' },
  // Israel
  { name: 'Fab Lab Tel Aviv', lat: 32.085, lng: 34.781, country: 'Israel', city: 'Tel Aviv' },
  // Egypt
  { name: 'Fab Lab Cairo', lat: 30.044, lng: 31.235, country: 'Egito', city: 'Cairo' },
  { name: 'Fab Lab Alexandria', lat: 31.200, lng: 29.918, country: 'Egito', city: 'Alexandria' },
  // Morocco
  { name: 'Fab Lab Casablanca', lat: 33.589, lng: -7.604, country: 'Marrocos', city: 'Casablanca' },
  { name: 'Fab Lab Rabat', lat: 34.013, lng: -6.832, country: 'Marrocos', city: 'Rabat' },
  // Tunisia
  { name: 'Fab Lab Tunis', lat: 36.818, lng: 10.181, country: 'Tunísia', city: 'Tunis' },
  // South Africa
  { name: 'Fab Lab Cape Town', lat: -33.924, lng: 18.424, country: 'África do Sul', city: 'Cape Town' },
  { name: 'Fab Lab Johannesburg', lat: -26.204, lng: 28.047, country: 'África do Sul', city: 'Johannesburg' },
  // Kenya
  { name: 'Fab Lab Nairobi', lat: -1.286, lng: 36.817, country: 'Quênia', city: 'Nairobi' },
  // Nigeria
  { name: 'Fab Lab Lagos', lat: 6.524, lng: 3.379, country: 'Nigéria', city: 'Lagos' },
  { name: 'Fab Lab Abuja', lat: 9.057, lng: 7.491, country: 'Nigéria', city: 'Abuja' },
  // Ghana
  { name: 'Fab Lab Kumasi', lat: 6.688, lng: -1.624, country: 'Gana', city: 'Kumasi' },
  // Senegal
  { name: 'Fab Lab Dakar', lat: 14.764, lng: -17.366, country: 'Senegal', city: 'Dakar' },
  // Singapore
  { name: 'Fab Lab Singapore', lat: 1.352, lng: 103.819, country: 'Singapura', city: 'Singapore' },
  // Taiwan
  { name: 'Fab Lab Taipei', lat: 25.047, lng: 121.516, country: 'Taiwan', city: 'Taipei' },
  // Indonesia
  { name: 'Fab Lab Jakarta', lat: -6.200, lng: 106.816, country: 'Indonésia', city: 'Jakarta' },
  { name: 'Fab Lab Bandung', lat: -6.921, lng: 107.607, country: 'Indonésia', city: 'Bandung' },
  // Thailand
  { name: 'Fab Lab Bangkok', lat: 13.756, lng: 100.501, country: 'Tailândia', city: 'Bangkok' },
  // Russia
  { name: 'Fab Lab Moscow', lat: 55.751, lng: 37.617, country: 'Rússia', city: 'Moscow' },
  { name: 'Fab Lab Saint Petersburg', lat: 59.939, lng: 30.315, country: 'Rússia', city: 'St. Petersburg' },
  // UAE
  { name: 'Fab Lab Dubai', lat: 25.204, lng: 55.270, country: 'Emirados', city: 'Dubai' },
  { name: 'Fab Lab Abu Dhabi', lat: 24.466, lng: 54.366, country: 'Emirados', city: 'Abu Dhabi' },
  // Pakistan
  { name: 'Fab Lab Lahore', lat: 31.520, lng: 74.358, country: 'Paquistão', city: 'Lahore' },
  // Bangladesh
  { name: 'Fab Lab Dhaka', lat: 23.810, lng: 90.412, country: 'Bangladesh', city: 'Dhaka' },
  // New Zealand
  { name: 'Fab Lab Auckland', lat: -36.866, lng: 174.769, country: 'Nova Zelândia', city: 'Auckland' },
  // Ukraine
  { name: 'Fab Lab Kyiv', lat: 50.450, lng: 30.523, country: 'Ucrânia', city: 'Kyiv' },
  // Romania
  { name: 'Fab Lab Bucharest', lat: 44.426, lng: 26.102, country: 'Romênia', city: 'Bucharest' },
  // Hungary
  { name: 'Fab Lab Budapest', lat: 47.497, lng: 19.040, country: 'Hungria', city: 'Budapest' },
];

/* ── CesiumJS Globe Section — ArcGIS World Imagery + scroll-as-zoom ──
 * CesiumJS: Apache 2.0. CDN 1.117.
 * Tiles: ArcGIS World Imagery (satélite, gratuito, sem token) + Natural Earth fallback.
 * Scroll sobre o globo faz zoom — não rola a página.
 * ──────────────────────────────────────────────────────────── */

const CesiumGlobeSection = memo(function CesiumGlobeSection() {
  const cesiumContainerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [selected, setSelected] = useState<typeof REAL_FABLABS[0] | null>(null);
  const viewerRef = useRef<any>(null);
  const rotationRef = useRef<any>(null);
  const isUserInteracting = useRef(false);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const visible = useIntersectionOnce(wrapperRef as React.RefObject<Element>, '300px');

  // ── Scroll → zoom (intercepta wheel — impede scroll da página) ──
  useEffect(() => {
    const container = cesiumContainerRef.current;
    if (!container || !loaded) return;

    const onWheel = (e: WheelEvent) => {
      // Bloqueia scroll da página SEMPRE que o cursor estiver sobre o globo
      e.preventDefault();
      e.stopPropagation();

      const viewer = viewerRef.current;
      const Cesium = (window as any).Cesium;
      if (!viewer || viewer.isDestroyed() || !Cesium) return;

      // Zoom suave proporcional ao delta do scroll
      const factor = e.deltaY > 0 ? 1.55 : 0.65;
      const camera = viewer.camera;
      const pos = camera.positionCartographic;
      const newHeight = Math.min(Math.max(pos.height * factor, 400000), 26000000);

      camera.flyTo({
        destination: Cesium.Cartesian3.fromRadians(pos.longitude, pos.latitude, newHeight),
        duration: 0.22,
        easingFunction: Cesium.EasingFunction.QUADRATIC_OUT,
      });
    };

    // passive: false é obrigatório para preventDefault() funcionar no wheel
    container.addEventListener('wheel', onWheel, { passive: false });
    return () => container.removeEventListener('wheel', onWheel);
  }, [loaded]); // re-registra após globo carregar

  useEffect(() => {
    if (!visible) return;

    function loadCesium() {
      if ((window as any).Cesium) { initCesium(); return; }

      if (!document.getElementById('cesium-css')) {
        const link = document.createElement('link');
        link.id = 'cesium-css';
        link.rel = 'stylesheet';
        link.href = 'https://cesium.com/downloads/cesiumjs/releases/1.117/Build/Cesium/Widgets/widgets.css';
        document.head.appendChild(link);
      }

      const script = document.createElement('script');
      script.src = 'https://cesium.com/downloads/cesiumjs/releases/1.117/Build/Cesium/Cesium.js';
      script.async = true;
      script.onload = initCesium;
      script.onerror = () => {
        const s2 = document.createElement('script');
        s2.src = 'https://cdn.jsdelivr.net/npm/cesium@1.117.0/Build/Cesium/Cesium.js';
        s2.async = true;
        s2.onload = initCesium;
        document.head.appendChild(s2);
      };
      document.head.appendChild(script);
    }

    loadCesium();

    return () => {
      stopRotation();
      if (viewerRef.current && !viewerRef.current.isDestroyed()) {
        viewerRef.current.destroy();
        viewerRef.current = null;
      }
    };
  }, [visible]);

  function stopRotation() {
    if (rotationRef.current) {
      cancelAnimationFrame(rotationRef.current);
      rotationRef.current = null;
    }
  }

  function startRotation(viewer: any) {
    const Cesium = (window as any).Cesium;
    stopRotation();
    const speed = 0.04;

    function rotate() {
      if (!viewerRef.current || viewerRef.current.isDestroyed()) return;
      if (!isUserInteracting.current) {
        viewer.camera.rotateRight(Cesium.Math.toRadians(speed));
      }
      rotationRef.current = requestAnimationFrame(rotate);
    }

    rotationRef.current = requestAnimationFrame(rotate);
  }

  function initCesium() {
    const container = cesiumContainerRef.current;
    if (!container || !(window as any).Cesium) return;

    const Cesium = (window as any).Cesium;
    Cesium.Ion.defaultAccessToken = '';

    // ── Viewer com configurações otimizadas ──
    const viewer = new Cesium.Viewer(container, {
      imageryProvider: false as any,
      baseLayerPicker: false,
      geocoder: false,
      homeButton: false,
      sceneModePicker: false,
      navigationHelpButton: false,
      animation: false,
      timeline: false,
      fullscreenButton: false,
      infoBox: false,
      selectionIndicator: false,
      creditContainer: document.createElement('div'),
      skyBox: false,
      skyAtmosphere: new Cesium.SkyAtmosphere(),
      // Melhora qualidade de renderização
      requestRenderMode: false,
      maximumRenderTimeChange: Infinity,
    });

    const scene = viewer.scene;
    const globe = scene.globe;

    // ── Qualidade de renderização ──
    scene.fxaa = true;                          // anti-aliasing
    scene.postProcessStages.fxaa.enabled = true;
    globe.maximumScreenSpaceError = 1.5;        // tiles mais nítidos (padrão=2)
    globe.tileCacheSize = 200;                  // cache maior = menos blur ao girar

    // ── Fundo e atmosfera ──
    scene.backgroundColor = new Cesium.Color(0.067, 0.078, 0.094, 1); // #111827
    globe.enableLighting = false;
    globe.showGroundAtmosphere = false;         // desliga nebulosa que embaçava

    scene.skyAtmosphere.hueShift = 0.0;
    scene.skyAtmosphere.saturationShift = 0.1;
    scene.skyAtmosphere.brightnessShift = -0.3;

    // ── Imagery: ArcGIS World Imagery (satélite real, gratuito, sem token) ──
    // Fallback de longe: Natural Earth — visível antes dos tiles de satélite carregarem
    viewer.imageryLayers.removeAll();

    // 1) Natural Earth — textura de mundo embutida no Cesium (fallback rápido / zoom afastado)
    viewer.imageryLayers.addImageryProvider(
      new Cesium.TileMapServiceImageryProvider({
        url: Cesium.buildModuleUrl('Assets/Textures/NaturalEarthII'),
        fileExtension: 'jpg',
        maximumLevel: 5,
        credit: '',
      })
    );

    // 2) ArcGIS World Imagery — satélite real de alta qualidade, sem registro nem token
    const arcgisLayer = viewer.imageryLayers.addImageryProvider(
      new Cesium.UrlTemplateImageryProvider({
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        minimumLevel: 1,
        maximumLevel: 19,
        credit: new Cesium.Credit('Tiles © Esri — Source: Esri, Maxar, Earthstar Geographics', false),
      })
    );
    arcgisLayer.brightness = 1.0;
    arcgisLayer.saturation = 0.85;  // leve dessaturação para não competir com os pontos
    arcgisLayer.contrast = 1.05;

    // 3) ArcGIS Reference — labels e fronteiras por cima do satélite (zoom ≥ 4)
    const labelsLayer = viewer.imageryLayers.addImageryProvider(
      new Cesium.UrlTemplateImageryProvider({
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
        minimumLevel: 4,
        maximumLevel: 19,
        credit: new Cesium.Credit('Labels © Esri', false),
      })
    );
    labelsLayer.alpha = 0.6;  // labels sutis, não dominam o satélite

    // ── Profundidade correta: pontos apenas na superfície visível ──
    globe.depthTestAgainstTerrain = false;      // sem terrain height data, mas
    scene.globe.translucency.enabled = false;   // globo OPACO — sem ver pontos atrás

    // Desabilita zoom nativo (usamos scroll customizado)
    scene.screenSpaceCameraController.zoomEventTypes = [];

    // Câmera inicial: Brasil
    viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(-50, -10, 20000000),
    });

    viewerRef.current = viewer;

    // ── Pontos dos FabLabs (só na superfície visível) ──
    REAL_FABLABS.forEach((lab) => {
      viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(lab.lng, lab.lat),
        point: {
          pixelSize: 6,
          color: Cesium.Color.fromCssColorString('#3b82f6'),
          outlineColor: Cesium.Color.fromCssColorString('#93c5fd'),
          outlineWidth: 1.5,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          // NÃO usar disableDepthTestDistance — isso causava aparecer pontos do lado oposto
          scaleByDistance: new Cesium.NearFarScalar(1.5e6, 1.3, 1.5e7, 0.4),
        },
        properties: new Cesium.PropertyBag({
          name: lab.name,
          city: lab.city,
          country: lab.country,
          lat: lab.lat,
          lng: lab.lng,
        }),
        description: undefined,
      });
    });

    // ── Anéis verdes (a cada 5 labs) ──
    REAL_FABLABS.filter((_, i) => i % 5 === 0).forEach((lab) => {
      viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(lab.lng, lab.lat),
        ellipse: {
          semiMinorAxis: 60000,
          semiMajorAxis: 60000,
          material: new Cesium.ColorMaterialProperty(
            Cesium.Color.fromCssColorString('#10b981').withAlpha(0.2)
          ),
          outline: true,
          outlineColor: Cesium.Color.fromCssColorString('#10b981').withAlpha(0.5),
          outlineWidth: 1,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          classificationType: Cesium.ClassificationType.TERRAIN,
        },
      });
    });

    // ── Clique em pontos ──
    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    handler.setInputAction((click: any) => {
      const picked = viewer.scene.pick(click.position);
      if (Cesium.defined(picked) && picked.id && picked.id.properties) {
        const props = picked.id.properties;
        const lab = {
          name: props.name?.getValue() ?? '',
          city: props.city?.getValue() ?? '',
          country: props.country?.getValue() ?? '',
          lat: props.lat?.getValue() ?? 0,
          lng: props.lng?.getValue() ?? 0,
        };
        setSelected(lab);
        // Voa suavemente até o lab clicado
        viewer.camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(lab.lng, lab.lat, 8000000),
          duration: 1.2,
        });
      } else {
        setSelected(null);
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    // Cursor pointer ao passar sobre ponto
    handler.setInputAction((movement: any) => {
      const picked = viewer.scene.pick(movement.endPosition);
      const onPoint = Cesium.defined(picked) && picked.id && picked.id.properties;
      container.style.cursor = onPoint ? 'pointer' : 'grab';
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    // Pausa rotação durante interação do usuário
    const canvas = viewer.scene.canvas;
    canvas.addEventListener('mousedown', () => {
      isUserInteracting.current = true;
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    });
    canvas.addEventListener('mouseup', () => {
      resumeTimerRef.current = setTimeout(() => {
        isUserInteracting.current = false;
      }, 1200);
    });
    canvas.addEventListener('mouseleave', () => {
      resumeTimerRef.current = setTimeout(() => {
        isUserInteracting.current = false;
      }, 300);
    });
    canvas.addEventListener('mouseenter', () => {
      isUserInteracting.current = true;
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    });

    // Touch
    canvas.addEventListener('touchstart', () => { isUserInteracting.current = true; });
    canvas.addEventListener('touchend', () => {
      resumeTimerRef.current = setTimeout(() => { isUserInteracting.current = false; }, 1500);
    });

    startRotation(viewer);
    setLoaded(true);
  }

  const SIZE = 680;

  return (
    <div ref={wrapperRef} className="flex flex-col items-center gap-8">
      <div className="relative" style={{ isolation: 'isolate', width: SIZE, height: SIZE }}>

        {/* Spinner enquanto carrega */}
        {(!loaded || !visible) && (
          <div
            className="absolute inset-0 flex items-center justify-center rounded-full"
            style={{ background: 'rgba(29,78,216,0.06)', zIndex: 5 }}
          >
            <div className="text-center">
              <div
                className="w-8 h-8 border-2 rounded-full mb-3 mx-auto"
                style={{ borderColor: '#1D4ED8', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }}
              />
              <div className="text-white/40 text-xs">Carregando globo…</div>
            </div>
          </div>
        )}

        {/* Container do Cesium — ocupa toda a área */}
        <div
          ref={cesiumContainerRef}
          style={{
            width: SIZE,
            height: SIZE,
            opacity: loaded ? 1 : 0,
            transition: 'opacity 0.8s ease',
            borderRadius: '50%',
            overflow: 'hidden',
          }}
        />

        {/* Vignette suave nas bordas */}
        {loaded && (
          <>
            <div
              className="absolute pointer-events-none"
              style={{
                inset: -2,
                zIndex: 10,
                background: `radial-gradient(
                  ellipse 43% 43% at 50% 50%,
                  transparent 38%,
                  rgba(17,24,39,0.12) 54%,
                  rgba(17,24,39,0.40) 67%,
                  rgba(17,24,39,0.68) 78%,
                  rgba(17,24,39,0.88) 87%,
                  #111827 95%
                )`,
              }}
            />
            {[
              { top: 0,    left: 0,  right: 0,  height: '18%', background: 'linear-gradient(to bottom, #111827 0%, transparent 100%)' },
              { bottom: 0, left: 0,  right: 0,  height: '18%', background: 'linear-gradient(to top,    #111827 0%, transparent 100%)' },
              { top: 0,    left: 0,  bottom: 0, width:  '14%', background: 'linear-gradient(to right,  #111827 0%, transparent 100%)' },
              { top: 0,    right: 0, bottom: 0, width:  '14%', background: 'linear-gradient(to left,   #111827 0%, transparent 100%)' },
            ].map((s, i) => (
              <div key={i} className="absolute pointer-events-none" style={{ ...s, zIndex: 11 }} />
            ))}
          </>
        )}

        {loaded && (
          <div
            className="absolute bottom-10 left-1/2 -translate-x-1/2 text-[10px] text-white/25 pointer-events-none whitespace-nowrap select-none"
            style={{ zIndex: 20 }}
          >
            scroll para zoom · clique para explorar · {REAL_FABLABS.length} labs reais
          </div>
        )}
      </div>

      {/* Info card do lab selecionado */}
      <div style={{ height: 48 }}>
        <AnimatePresence mode="wait">
          {selected && (
            <motion.div
              key={selected.name}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="px-5 py-2 rounded-full text-sm flex items-center gap-2"
              style={{
                background: 'rgba(29,78,216,0.15)',
                border: '1px solid rgba(29,78,216,0.35)',
              }}
            >
              <IcMapPin size={14} color="#60a5fa" />
              <span className="text-white font-semibold">{selected.name}</span>
              <span className="text-white/40">·</span>
              <span className="text-white/60">{selected.city}, {selected.country}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
});

/* ── Puzzle Interativo (Recursos) ─────────────────────────── */
const PuzzleFeatures = memo(function PuzzleFeatures() {
  const [active, setActive] = useState<string | null>(null);
  const [animated, setAnimated] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });

  useEffect(() => {
    if (inView && !animated) setTimeout(() => setAnimated(true), 300);
  }, [inView]);

  const COLS = 3;
  const PIECE_W = 165;
  const PIECE_H = 125;
  const GAP = 18;

  const getPos = (feat: typeof FEATURES[0]) => ({
    x: feat.x * (PIECE_W + GAP),
    y: feat.y * (PIECE_H + GAP),
  });

  const activeFeat = FEATURES.find(f => f.id === active);

  const connectors = PUZZLE_CONNECTIONS.map(([a, b]) => {
    const fa = FEATURES.find(f => f.id === a)!;
    const fb = FEATURES.find(f => f.id === b)!;
    const pa = getPos(fa); const pb = getPos(fb);
    const ax = pa.x + PIECE_W / 2; const ay = pa.y + PIECE_H / 2;
    const bx = pb.x + PIECE_W / 2; const by = pb.y + PIECE_H / 2;
    return { a, b, ax, ay, bx, by };
  });

  const totalW = COLS * PIECE_W + (COLS - 1) * GAP;
  const totalH = 2 * PIECE_H + GAP;

  return (
    <div ref={ref} className="flex flex-col lg:flex-row items-center gap-12">
      <div className="relative flex-shrink-0" style={{ width: totalW, height: totalH }}>
        <svg
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible', pointerEvents: 'none' }}
          viewBox={`0 0 ${totalW} ${totalH}`}
        >
          <defs>
            <filter id="glow2">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>
          {connectors.map(({ a, b, ax, ay, bx, by }) => {
            const isAct = active === a || active === b;
            const mx = (ax + bx) / 2; const my = (ay + by) / 2;
            return (
              <motion.path
                key={`${a}-${b}`}
                d={`M ${ax} ${ay} Q ${mx} ${my} ${bx} ${by}`}
                fill="none"
                stroke={isAct ? '#1D4ED8' : 'rgba(255,255,255,0.07)'}
                strokeWidth={isAct ? 2.5 : 1}
                strokeDasharray={isAct ? 'none' : '5 5'}
                filter={isAct ? 'url(#glow2)' : 'none'}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={animated ? { pathLength: 1, opacity: 1 } : {}}
                transition={{ duration: 1.4, delay: 0.2, ease: 'easeOut' }}
              />
            );
          })}
          {animated && connectors.map(({ a, b, ax, ay, bx, by }) => {
            const isAct = active === a || active === b;
            return (
              <motion.circle
                key={`dot-${a}-${b}`}
                r={isAct ? 4 : 2.5}
                fill={isAct ? '#60a5fa' : 'rgba(255,255,255,0.2)'}
                initial={{ cx: ax, cy: ay, opacity: 0 }}
                animate={{ cx: [ax, bx], cy: [ay, by], opacity: [0, 1, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, delay: Math.random() * 2, ease: 'linear' }}
              />
            );
          })}
        </svg>

        {FEATURES.map((feat, i) => {
          const pos = getPos(feat);
          const isAct = active === feat.id;
          return (
            <motion.div
              key={feat.id}
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={animated ? { opacity: 1, scale: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.09 + 0.3, type: 'spring', stiffness: 220 }}
              whileHover={{ scale: 1.07, zIndex: 10 }}
              onClick={() => setActive(active === feat.id ? null : feat.id)}
              style={{
                position: 'absolute',
                left: pos.x, top: pos.y,
                width: PIECE_W, height: PIECE_H,
                cursor: 'pointer',
                borderRadius: 16,
                background: isAct
                  ? `linear-gradient(135deg, ${feat.color}28 0%, ${feat.color}0d 100%)`
                  : 'rgba(255,255,255,0.04)',
                border: `1px solid ${isAct ? feat.color + '90' : 'rgba(255,255,255,0.09)'}`,
                padding: '16px 14px',
                display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                zIndex: isAct ? 5 : 1,
                boxShadow: isAct ? `0 0 32px ${feat.color}28, inset 0 0 20px ${feat.color}08` : 'none',
                transition: 'background 0.3s, border-color 0.3s, box-shadow 0.3s',
              }}
            >
              {/* Puzzle notch decorative corners */}
              <div style={{ position: 'absolute', top: -6, left: '50%', transform: 'translateX(-50%)', width: 12, height: 12, borderRadius: '50%', background: isAct ? feat.color + '60' : 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
              <div style={{ position: 'absolute', right: -6, top: '50%', transform: 'translateY(-50%)', width: 12, height: 12, borderRadius: '50%', background: isAct ? feat.color + '60' : 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />

              <div>
                <div style={{ marginBottom: 6 }}><Icon name={feat.icon} size={28} color={feat.color} /></div>
                <div style={{ fontSize: 13, fontWeight: 700, color: isAct ? '#fff' : 'rgba(255,255,255,0.75)', fontFamily: "'Space Grotesk', sans-serif" }}>
                  {feat.title}
                </div>
              </div>
              <div style={{ height: 3, borderRadius: 2, background: `linear-gradient(90deg, ${feat.color}, transparent)`, width: isAct ? '100%' : '45%', transition: 'width 0.4s ease' }} />

              <div style={{ position: 'absolute', top: 8, right: 8, width: 5, height: 5, borderRadius: '50%', background: feat.color + '60' }} />
            </motion.div>
          );
        })}
      </div>

      <div className="flex-1 min-w-0" style={{ minWidth: 240 }}>
        <AnimatePresence mode="wait">
          {activeFeat ? (
            <motion.div
              key={activeFeat.id}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.35 }}
              className="p-7 rounded-2xl"
              style={{
                background: `linear-gradient(135deg, ${activeFeat.color}12, ${activeFeat.color}06)`,
                border: `1px solid ${activeFeat.color}35`,
                boxShadow: `0 0 40px ${activeFeat.color}18`,
              }}
            >
              <div style={{ marginBottom: 14 }}><Icon name={activeFeat.icon} size={44} color={activeFeat.color} /></div>
              <h3 style={{ fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 10, fontFamily: "'Space Grotesk', sans-serif" }}>
                {activeFeat.title}
              </h3>
              <p style={{ fontSize: 14, lineHeight: 1.75, color: 'rgba(255,255,255,0.62)', fontFamily: "'Space Grotesk', sans-serif" }}>
                {activeFeat.desc}
              </p>
              <div style={{ marginTop: 18, height: 3, borderRadius: 2, background: `linear-gradient(90deg, ${activeFeat.color}, transparent)`, width: 48 }} />
            </motion.div>
          ) : (
            <motion.div
              key="placeholder"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center"
              style={{ padding: '2.5rem' }}
            >
              <motion.div
                animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                style={{ marginBottom: 16, display: 'inline-flex' }}
              >
                <IcPuzzle size={56} color="rgba(255,255,255,0.3)" />
              </motion.div>
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14, fontFamily: "'Space Grotesk', sans-serif" }}>
                Clique em uma peça para ver os detalhes
              </p>
              <p style={{ color: 'rgba(255,255,255,0.15)', fontSize: 12, marginTop: 6, fontFamily: "'Space Grotesk', sans-serif" }}>
                Tudo está conectado
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
});

/* ── "O que é um Fab Lab?" — Timeline interativa ─────────── */
const FABLAB_TIMELINE = [
  {
    year: '2001',
    color: '#1D4ED8',
    icon: 'gradcap',
    title: 'Nascimento no MIT',
    text: 'Neil Gershenfeld cria o conceito no Center for Bits and Atoms respondendo à pergunta: "Como fazer (quase) qualquer coisa?"',
  },
  {
    year: '2003',
    color: '#059669',
    icon: 'flask',
    title: 'Primeiro Fab Lab fora do MIT',
    text: 'Ghana e Índia recebem os primeiros laboratórios, democratizando o acesso à fabricação digital em comunidades remotas.',
  },
  {
    year: '2009',
    color: '#DC2626',
    icon: 'network',
    title: 'Fab Foundation',
    text: 'Criação da organização global que coordena a rede mundial, padroniza equipamentos e define a Fab Charter.',
  },
  {
    year: '2014',
    color: '#7c3aed',
    icon: 'factory',
    title: '300 labs no mundo',
    text: 'A rede cresce exponencialmente. Impressoras 3D se tornam acessíveis, acelerando a cultura maker globalmente.',
  },
  {
    year: '2024',
    color: '#ea580c',
    icon: 'rocket',
    title: '2.000+ laboratórios',
    text: 'Hoje a rede conecta mais de 2.000 labs em 100+ países, com foco em educação, inovação aberta e impacto social.',
  },
];

const FABLAB_FACTS = [
  { icon: 'printer3d', label: 'Impressoras 3D', desc: 'Prototipagem rápida em plástico, resina e metal' },
  { icon: 'zap', label: 'Cortadora a Laser', desc: 'Corte e gravação em madeira, acrílico e tecido' },
  { icon: 'tool', label: 'Fresadora CNC', desc: 'Usinagem de precisão em alumínio e madeira' },
  { icon: 'cpu', label: 'Eletrônica', desc: 'Arduino, Raspberry Pi e solda para prototipagem' },
  { icon: 'scissors', label: 'Costura Digital', desc: 'Bordado computadorizado e têxteis eletrônicos' },
  { icon: 'tool', label: 'Bancadas Maker', desc: 'Ferramentas manuais, torno e bancadas equipadas' },
];

/* ── NeilTooltip — hover micro-biography for Neil Gershenfeld ── */
function NeilTooltip({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const ref = useRef<HTMLSpanElement>(null);

  const handleMouseEnter = () => setVisible(true);
  const handleMouseLeave = () => setVisible(false);
  const handleMouseMove = (e: React.MouseEvent) => {
    setPos({ x: e.clientX, y: e.clientY });
  };

  return (
    <>
      <span
        ref={ref}
        className="text-blue-400 cursor-pointer underline decoration-dotted underline-offset-2"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseMove={handleMouseMove}
      >
        {children}
      </span>
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 6 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            style={{
              position: 'fixed',
              left: pos.x + 16,
              top: pos.y - 20,
              zIndex: 9999,
              pointerEvents: 'none',
              width: 260,
            }}
          >
            <div
              className="rounded-xl overflow-hidden border"
              style={{
                background: 'linear-gradient(135deg, #0d1f1a 0%, #0a1a14 100%)',
                borderColor: 'rgba(5,150,105,0.35)',
                boxShadow: '0 16px 48px rgba(0,0,0,0.7), 0 0 0 1px rgba(5,150,105,0.1)',
              }}
            >
              {/* Header with photo */}
              <div className="flex items-center gap-3 p-3 border-b" style={{ borderColor: 'rgba(5,150,105,0.15)' }}>
                <img
                  src="https://fab.cba.mit.edu/about/charter/logo.jpg"
                  alt="Neil Gershenfeld"
                  className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                  style={{ border: '1.5px solid rgba(5,150,105,0.4)' }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://media.wired.com/photos/5932ac5677e91b6b59d3f6ae/master/pass/neil-gershenfeld.jpg';
                  }}
                />
                <div>
                  <div className="text-sm font-bold text-white leading-tight">Neil Gershenfeld</div>
                  <div className="text-xs text-green-400/70">MIT Media Lab · CBA</div>
                </div>
              </div>
              {/* Bio */}
              <div className="p-3 space-y-1.5">
                <div className="text-xs text-white/60 leading-relaxed">
                  Físico e professor do MIT, fundador do <span className="text-green-300/80">Center for Bits and Atoms</span>. Criou os Fab Labs em 2001 a partir do curso <em>"How to Make (Almost) Anything"</em>.
                </div>
                <div className="text-xs text-white/60 leading-relaxed">
                  Pioneiro da fabricação digital pessoal, suas pesquisas unem física, computação e fabricação para democratizar a inovação tecnológica.
                </div>
                <div className="flex items-center gap-1.5 pt-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                  <span className="text-xs text-white/35 font-mono">cba.mit.edu</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/* ── FabCharterScroll — card that expands below on hover with scrollable content ── */
function FabCharterScroll() {
  const [isOpen, setIsOpen] = useState(false);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const principles = [
    { q: 'O que é um Fab Lab?', a: 'Fab labs são uma rede global de laboratórios locais, possibilitando invenção ao prover acesso a ferramentas de fabricação digital.' },
    { q: 'O que há em um Fab Lab?', a: 'Fab labs compartilham um inventário evolutivo de capacidades para fazer (quase) qualquer coisa, permitindo que pessoas e projetos sejam compartilhados.' },
    { q: 'O que a rede Fab Lab oferece?', a: 'Suporte operacional, educacional, técnico, financeiro e logístico além do que está disponível em um único laboratório.' },
    { q: 'Quem pode usar um Fab Lab?', a: 'Fab labs estão disponíveis como recurso comunitário, oferecendo acesso aberto para indivíduos e acesso agendado para programas.' },
    { q: 'Quais são suas responsabilidades?', a: 'Segurança: não machucar pessoas ou máquinas. Operações: auxiliar na limpeza, manutenção e melhoria do lab. Conhecimento: contribuir com documentação e instrução.' },
    { q: 'Quem é dono das invenções do Fab Lab?', a: 'Designs e processos desenvolvidos podem ser protegidos e vendidos da forma que o inventor escolher, mas devem permanecer disponíveis para uso e aprendizado individual.' },
    { q: 'Como negócios podem usar um Fab Lab?', a: 'Atividades comerciais podem ser prototipadas no lab, mas não devem conflitar com outros usos, devem crescer para além do lab, e devem beneficiar inventores, labs e redes que contribuem para seu sucesso.' },
  ];

  const open = () => {
    if (leaveTimer.current) clearTimeout(leaveTimer.current);
    setIsOpen(true);
  };
  const close = () => {
    leaveTimer.current = setTimeout(() => setIsOpen(false), 120);
  };

  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{ borderColor: 'rgba(5,150,105,0.3)', background: 'rgba(5,150,105,0.06)' }}
      onMouseEnter={open}
      onMouseLeave={close}
    >
      {/* Header — always visible */}
      <div className="flex items-center justify-between px-4 py-3 cursor-default">
        <div className="flex items-center gap-2">
          <IcScroll size={14} color="#059669" />
          <span className="text-sm font-bold text-white">Fab Charter MIT</span>
        </div>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.25 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(5,150,105,0.7)" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </motion.div>
      </div>

      {/* Expandable scrollable area */}
      <motion.div
        animate={{ height: isOpen ? 220 : 0, opacity: isOpen ? 1 : 0 }}
        initial={{ height: 0, opacity: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        style={{ overflow: 'hidden' }}
      >
        <div
          style={{
            height: 220,
            overflowY: 'scroll',
            overflowX: 'hidden',
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(5,150,105,0.4) transparent',
            borderTop: '1px solid rgba(5,150,105,0.15)',
            paddingLeft: 16,
            paddingRight: 16,
            paddingBottom: 16,
          }}
          onWheel={e => e.stopPropagation()}
        >
          <div className="text-xs text-green-400/50 font-bold tracking-widest uppercase pt-3 pb-2 text-center">
            Fab Charter · MIT · 2012
          </div>
          <div className="space-y-3">
            {principles.map((p, i) => (
              <div key={i}>
                <div className="flex items-start gap-2">
                  <div className="w-1 h-1 rounded-full mt-1.5 flex-shrink-0" style={{ background: '#059669' }} />
                  <div>
                    <div className="text-xs font-semibold text-green-300/85 leading-snug">{p.q}</div>
                    <div className="text-xs text-white/45 leading-relaxed mt-0.5">{p.a}</div>
                  </div>
                </div>
                {i < principles.length - 1 && (
                  <div className="ml-3 mt-2.5 h-px" style={{ background: 'rgba(5,150,105,0.1)' }} />
                )}
              </div>
            ))}
            <div className="flex items-center justify-center gap-1.5 pt-1 pb-1">
              <IcGlobe size={10} color="rgba(5,150,105,0.4)" />
              <span className="text-xs text-white/25 font-mono">fab.cba.mit.edu/about/charter</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* ── FabLabSection — redesigned with 3D carousel bg + GLB logo + icon nodes ── */

// Local project images from carousel assets
const FABLAB_PROJECT_IMAGES = [
  '/carousel/proj1.jpg',
  '/carousel/proj2.jpg',
  '/carousel/proj3.jpg',
  '/carousel/proj4.jpg',
  '/carousel/proj5.jpg',
  '/carousel/proj6.jpg',
  '/carousel/proj7.jpg',
  '/carousel/proj8.jpg',
  '/carousel/proj9.jpg',
];

// 3D Logo component using Three.js
function FabLab3DLogo() {
  const mountRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>(0);
  const SIZE = 460;
  const visible = useIntersectionOnce(mountRef as React.RefObject<Element>, '200px');

  useEffect(() => {
    if (!visible) return;
    const el = mountRef.current;
    if (!el) return;

    let renderer: import('three').WebGLRenderer | null = null;
    let animId = 0;
    let running = true;

    // Defer one rAF so layout has been painted and the container has real dimensions
    animId = requestAnimationFrame(async () => {
      if (!running) return;
      try {
        const THREE = await import('three');
        if (!running) return;
        const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
        const { OrbitControls } = await import('three/examples/jsm/controls/OrbitControls.js');
        if (!running) return;

        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(SIZE, SIZE);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setClearColor(0x000000, 0);
        // Canvas fills the container div absolutely
        Object.assign(renderer.domElement.style, {
          position: 'absolute', top: '0', left: '0',
          width: '100%', height: '100%', display: 'block',
        });
        el.appendChild(renderer.domElement);

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(52, 1, 0.1, 100);
        camera.position.set(0, 0, 3.8);

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.enableZoom = false;
        controls.enablePan = false;
        controls.autoRotate = true;
        controls.autoRotateSpeed = 1.2;
        controls.target.set(0, 0, 0);

        // Lights
        const amb = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(amb);
        const dir1 = new THREE.DirectionalLight(0x4488ff, 2.5);
        dir1.position.set(3, 4, 3); scene.add(dir1);
        const dir2 = new THREE.DirectionalLight(0x0044ff, 1.2);
        dir2.position.set(-3, -2, 2); scene.add(dir2);
        const rim = new THREE.DirectionalLight(0xffffff, 0.8);
        rim.position.set(0, 0, -5); scene.add(rim);

        let pivotGroup: import('three').Group | null = null;
        const loader = new GLTFLoader();
        loader.load('/fablablogo3d.glb', (gltf) => {
          if (!running) return;
          const model = gltf.scene;
          model.rotation.set(0, 0, 0);
          const box0 = new THREE.Box3().setFromObject(model);
          const size0 = box0.getSize(new THREE.Vector3());
          model.scale.setScalar(3.1 / Math.max(size0.x, size0.y, size0.z));
          const box1 = new THREE.Box3().setFromObject(model);
          const c1 = box1.getCenter(new THREE.Vector3());
          model.position.set(-c1.x, -c1.y, -c1.z);
          pivotGroup = new THREE.Group();
          pivotGroup.add(model);
          pivotGroup.rotation.y = Math.PI;
          model.traverse((child) => {
            if ((child as import('three').Mesh).isMesh) {
              const mat = (child as import('three').Mesh).material as import('three').MeshStandardMaterial;
              if (mat) { mat.metalness = 0.6; mat.roughness = 0.3; }
            }
          });
          scene.add(pivotGroup);
        });

        let t = 0;
        const tick = () => {
          if (!running) return;
          animRef.current = requestAnimationFrame(tick);
          controls.update();
          if (pivotGroup) { t += 0.007; pivotGroup.position.y = Math.sin(t * 2) * 0.05; }
          renderer!.render(scene, camera);
        };
        tick();

      } catch {
        if (el) el.innerHTML = `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center"><img src="${FABLAB_LOGO_URL}" style="width:120px;height:auto;filter:brightness(0) invert(1) drop-shadow(0 0 20px rgba(29,78,216,0.8))" /></div>`;
      }
    });

    animRef.current = animId;

    return () => {
      running = false;
      cancelAnimationFrame(animRef.current);
      if (renderer) { renderer.dispose(); renderer.domElement.remove(); renderer = null; }
    };
  }, [visible]);

  return (
    <div
      ref={mountRef}
      style={{ width: SIZE, height: SIZE, position: 'relative', flexShrink: 0, cursor: 'grab' }}
      onMouseDown={e => (e.currentTarget.style.cursor = 'grabbing')}
      onMouseUp={e => (e.currentTarget.style.cursor = 'grab')}
      onMouseLeave={e => (e.currentTarget.style.cursor = 'grab')}
    />
  );
}

// Animated SVG arrow line from a node to center

/* ── HistoryImageBanner — foto do grupo com partículas "FAB LAB" idênticas ao hero ── */
const HISTORY_COLORS = ['#1D4ED8', '#059669', '#DC2626', '#7c3aed', '#ea580c', '#0891b2'];
type HistParticle = {
  id: number; x: number; y: number; vx: number; vy: number;
  size: number; color: string; label: string; opacity: number;
  rotation: number; gridX: number; gridY: number;
};

function HistoryImageBanner() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<HistParticle[]>([]);
  const rafRef = useRef<number>(0);
  const dragRef = useRef<{ id: number; ox: number; oy: number } | null>(null);
  const mouseRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const inViewport = useIsInViewport(wrapperRef as React.RefObject<Element>, '100px');
  const inViewportRef = useRef(false);
  inViewportRef.current = inViewport;

  const initParticles = (w: number, h: number) => {
    const cols = 7; const rows = 3;
    const cellW = w / cols; const cellH = h / rows;
    particlesRef.current = Array.from({ length: cols * rows }, (_, i) => {
      const col = i % cols; const row = Math.floor(i / cols);
      const x = cellW * col + cellW * 0.5;
      const y = cellH * row + cellH * 0.5;
      return {
        id: i, x, y, vx: 0, vy: 0,
        size: 44 + (i % 3) * 12,
        color: HISTORY_COLORS[i % HISTORY_COLORS.length],
        label: 'FAB LAB',
        opacity: 0.12 + (i % 4) * 0.025,
        rotation: (i % 6) * 7 - 17,
        gridX: x, gridY: y,
      };
    });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      if (particlesRef.current.length === 0) {
        initParticles(canvas.width, canvas.height);
      } else {
        const cols = 7; const rows = 3;
        const cellW = canvas.width / cols; const cellH = canvas.height / rows;
        particlesRef.current.forEach((p, i) => {
          p.gridX = cellW * (i % cols) + cellW * 0.5;
          p.gridY = cellH * Math.floor(i / cols) + cellH * 0.5;
        });
      }
    };
    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      if (!inViewportRef.current) {
        rafRef.current = requestAnimationFrame(draw);
        return;
      }
      const { width: W, height: H } = canvas;
      ctx.clearRect(0, 0, W, H);
      const dragged = dragRef.current ? particlesRef.current.find(p => p.id === dragRef.current!.id) : null;

      particlesRef.current.forEach(p => {
        if (dragRef.current?.id !== p.id) {
          if (dragged) {
            p.vx += (p.gridX - p.x) * 0.04;
            p.vy += (p.gridY - p.y) * 0.04;
          } else {
            const { x: mx, y: my } = mouseRef.current;
            const dx = p.x - mx; const dy = p.y - my;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 160 && dist > 0) {
              const force = (160 - dist) / 160;
              p.vx += (dx / dist) * force * 0.4;
              p.vy += (dy / dist) * force * 0.4;
            }
            p.vx += (p.gridX - p.x) * 0.003;
            p.vy += (p.gridY - p.y) * 0.003;
          }
          p.vx *= 0.88; p.vy *= 0.88;
          p.x += p.vx; p.y += p.vy;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = p.opacity;
        ctx.font = `800 ${p.size}px 'Nunito', 'Space Grotesk', sans-serif`;
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 18;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(p.label, 0, 0);
        ctx.restore();
      });

      rafRef.current = requestAnimationFrame(draw);
    };
    draw();

    // Mouse repulsion
    const onMove = (e: MouseEvent) => {
      const r = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - r.left, y: e.clientY - r.top };
      if (dragRef.current) {
        const p = particlesRef.current.find(pp => pp.id === dragRef.current!.id);
        if (p) { p.x = e.clientX - r.left - dragRef.current.ox; p.y = e.clientY - r.top - dragRef.current.oy; }
      }
    };
    const onLeave = () => { mouseRef.current = { x: -9999, y: -9999 }; };
    const onDown = (e: MouseEvent) => {
      const r = canvas.getBoundingClientRect();
      const mx = e.clientX - r.left; const my = e.clientY - r.top;
      const hit = particlesRef.current.find(p => Math.hypot(p.x - mx, p.y - my) < p.size * 1.4);
      if (hit) dragRef.current = { id: hit.id, ox: mx - hit.x, oy: my - hit.y };
    };
    const onUp = () => { dragRef.current = null; };

    canvas.addEventListener('mousemove', onMove);
    canvas.addEventListener('mouseleave', onLeave);
    canvas.addEventListener('mousedown', onDown);
    canvas.addEventListener('mouseup', onUp);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('mousemove', onMove);
      canvas.removeEventListener('mouseleave', onLeave);
      canvas.removeEventListener('mousedown', onDown);
      canvas.removeEventListener('mouseup', onUp);
    };
  }, []);

  return (
    <div
      ref={wrapperRef}
      className="relative w-full mb-10 overflow-hidden"
      style={{ height: 360, background: '#0d1117' }}
    >
      {/* Layer 1 (bottom): photo — pointer-events none so canvas above gets all events */}
      <div
        className="absolute inset-0"
        style={{
          zIndex: 1,
          backgroundImage: 'url(/grupofablab.svg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center center',
          backgroundRepeat: 'no-repeat',
          pointerEvents: 'none',
        }}
      />

      {/* Layer 2: particles canvas — on top of photo, captures all mouse/drag events */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ cursor: 'grab', zIndex: 2, pointerEvents: 'auto' }}
      />

      {/* Layer 3: fades — pointer-events none so canvas still receives events */}
      <div
        className="absolute inset-x-0 bottom-0 pointer-events-none"
        style={{
          zIndex: 3,
          height: '50%',
          background: 'linear-gradient(to top, #0d1117 0%, rgba(13,17,23,0.7) 35%, rgba(13,17,23,0.2) 60%, transparent 100%)',
        }}
      />
      <div className="absolute inset-x-0 top-0 pointer-events-none" style={{ zIndex: 3, height: '18%', background: 'linear-gradient(to bottom, #0d1117, transparent)' }} />
      <div className="absolute inset-y-0 left-0 pointer-events-none" style={{ zIndex: 3, width: '5%', background: 'linear-gradient(to right, #0d1117, transparent)' }} />
      <div className="absolute inset-y-0 right-0 pointer-events-none" style={{ zIndex: 3, width: '5%', background: 'linear-gradient(to left, #0d1117, transparent)' }} />
    </div>
  );
}

/* ── StaircaseTimeline ── */
function RocketParticles({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const activeRef = useRef(active);
  activeRef.current = active;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = canvas.width;
    const H = canvas.height;
    type P = { x: number; y: number; vx: number; vy: number; life: number; maxLife: number; size: number; hue: number };
    const particles: P[] = [];
    let raf: number;
    let frame = 0;

    const spawn = () => {
      for (let k = 0; k < 2; k++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.3 + Math.random() * 0.8;
        particles.push({
          x: W / 2 + (Math.random() - 0.5) * 8,
          y: H / 2 + (Math.random() - 0.5) * 8,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 0.2,
          life: 0,
          maxLife: 50 + Math.random() * 50,
          size: 1 + Math.random() * 2.5,
          hue: 15 + Math.random() * 45,
        });
      }
    };

    const tick = () => {
      // Skip frame entirely if not active and no particles to drain
      if (!activeRef.current && particles.length === 0) {
        raf = requestAnimationFrame(tick);
        return;
      }
      ctx.clearRect(0, 0, W, H);
      frame++;
      if (activeRef.current && frame % 3 === 0) spawn();
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy -= 0.015;
        p.life++;
        const t = p.life / p.maxLife;
        const alpha = Math.sin(t * Math.PI) * 0.75;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (1 - t * 0.4), 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 95%, 65%, ${alpha})`;
        ctx.fill();
        if (p.life >= p.maxLife) particles.splice(i, 1);
      }
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={80}
      height={80}
      style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', pointerEvents: 'none', zIndex: 0 }}
    />
  );
}

function StaircaseTimeline({ items }: { items: typeof FABLAB_TIMELINE }) {
  const [cycleStep, setCycleStep] = useState(0);
  const [hoveredStep, setHoveredStep] = useState<number | null>(null);
  const [frozenCard, setFrozenCard] = useState<number | null>(null);
  const pausedRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inVP = useIsInViewport(containerRef as React.RefObject<Element>, '0px');
  const inVPRef = useRef(false);
  inVPRef.current = inVP;

  // Auto-cycle: advances every 2.2s, pauses while mouse is over any step or out of viewport
  useEffect(() => {
    const id = setInterval(() => {
      if (!pausedRef.current && inVPRef.current) {
        setCycleStep(s => (s + 1) % items.length);
      }
    }, 2200);
    return () => clearInterval(id);
  }, [items.length]);

  const handleMouseEnter = (i: number) => {
    pausedRef.current = true;
    setHoveredStep(i);
    setFrozenCard(i);
  };

  const handleMouseLeave = () => {
    pausedRef.current = false;
    setHoveredStep(null);
    setFrozenCard(null); // clear so card returns to cycle
  };

  // Steps highlight: hover wins over cycle
  const highlightStep = hoveredStep !== null ? hoveredStep : cycleStep;
  // Card: hover wins, else frozen from last hover, else follows cycle
  const displayStep = hoveredStep !== null ? hoveredStep : frozenCard !== null ? frozenCard : cycleStep;
  const isLast = (i: number) => i === items.length - 1;

  return (
    <div ref={containerRef} className="relative">
      {/* Desktop staircase */}
      <div className="hidden md:block">
        <div className="flex items-end justify-between gap-0 relative" style={{ height: 220 }}>
          {items.map((item, i) => {
            const stepH = 48 + i * 34;
            const isActive = highlightStep === i;
            const isReached = i <= highlightStep;

            return (
              <div
                key={i}
                className="flex-1 flex flex-col items-center cursor-pointer relative"
                style={{ height: '100%', justifyContent: 'flex-end' }}
                onMouseEnter={() => handleMouseEnter(i)}
                onMouseLeave={handleMouseLeave}
              >
                {/* Step body */}
                <motion.div
                  className="w-full rounded-t-xl relative overflow-hidden flex flex-col items-center justify-start pt-3"
                  style={{
                    height: stepH,
                    background: isActive
                      ? `linear-gradient(180deg, ${item.color}28 0%, ${item.color}08 100%)`
                      : isReached
                      ? `linear-gradient(180deg, ${item.color}10 0%, ${item.color}03 100%)`
                      : `linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)`,
                    border: `1px solid ${isActive ? item.color + '60' : isReached ? item.color + '25' : 'rgba(255,255,255,0.06)'}`,
                    borderBottom: 'none',
                    transition: 'all 0.35s ease',
                    boxShadow: isActive ? `0 -6px 28px ${item.color}25` : 'none',
                  }}
                >
                  {/* Top glow line */}
                  <div
                    className="absolute top-0 left-0 right-0 h-0.5 transition-all duration-300"
                    style={{ background: isActive ? item.color : isReached ? item.color + '40' : 'rgba(255,255,255,0.05)' }}
                  />

                  {/* Icon wrapper */}
                  <div className="relative" style={{ zIndex: 1 }}>
                    {isLast(i) && <RocketParticles active={isActive} />}
                    <motion.div
                      className="w-10 h-10 rounded-full flex items-center justify-center relative"
                      style={{
                        background: isActive ? item.color : isReached ? item.color + '30' : 'rgba(255,255,255,0.06)',
                        border: `2px solid ${isActive ? item.color : isReached ? item.color + '60' : 'rgba(255,255,255,0.1)'}`,
                        boxShadow: isActive ? `0 0 20px ${item.color}70` : 'none',
                        zIndex: 2,
                        transition: 'all 0.3s ease',
                      }}
                      animate={{ scale: isActive ? 1.18 : 1 }}
                      transition={{ duration: 0.25, ease: 'easeOut' }}
                    >
                      <Icon name={item.icon} size={17} color={isActive ? '#fff' : isReached ? item.color : 'rgba(255,255,255,0.35)'} />
                    </motion.div>
                  </div>

                  {/* Year label */}
                  <div
                    className="text-xs font-bold mt-1.5 transition-all duration-300"
                    style={{ color: isActive ? item.color : isReached ? item.color + 'aa' : 'rgba(255,255,255,0.25)' }}
                  >
                    {item.year}
                  </div>
                </motion.div>

                {/* Step number */}
                <div
                  className="font-mono mt-1 transition-colors duration-300"
                  style={{ fontSize: 10, color: isActive ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.12)' }}
                >
                  0{i + 1}
                </div>
              </div>
            );
          })}
        </div>

        {/* Info card — always rendered, driven by displayStep */}
        <motion.div
          key={displayStep}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="mt-4 p-5 rounded-2xl"
          style={{
            background: `linear-gradient(135deg, ${items[displayStep].color}12, ${items[displayStep].color}04)`,
            border: `1px solid ${items[displayStep].color}30`,
          }}
        >
          <div className="flex items-start gap-4">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: items[displayStep].color + '22', border: `1px solid ${items[displayStep].color}40` }}
            >
              <Icon name={items[displayStep].icon} size={18} color={items[displayStep].color} />
            </div>
            <div>
              <div className="text-xs font-bold mb-0.5" style={{ color: items[displayStep].color }}>{items[displayStep].year}</div>
              <div className="font-bold text-white text-sm mb-1">{items[displayStep].title}</div>
              <p className="text-white/55 text-xs leading-relaxed">{items[displayStep].text}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Mobile: vertical list */}
      <div className="md:hidden space-y-3">
        {items.map((item, i) => (
          <div key={i} className="flex items-start gap-3 p-4 rounded-xl" style={{ background: `${item.color}10`, border: `1px solid ${item.color}25` }}>
            <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: item.color + '22' }}>
              <Icon name={item.icon} size={16} color={item.color} />
            </div>
            <div>
              <div className="text-xs font-bold mb-0.5" style={{ color: item.color }}>{item.year}</div>
              <div className="text-sm font-bold text-white mb-1">{item.title}</div>
              <div className="text-xs text-white/50 leading-relaxed">{item.text}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const FabLabSection = memo(function FabLabSection() {
  const [hoveredFact, setHoveredFact] = useState<number | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  const leftFacts = FABLAB_FACTS.slice(0, 3);
  const rightFacts = FABLAB_FACTS.slice(3, 6);

  const factColors = ['#1D4ED8', '#059669', '#DC2626', '#7c3aed', '#ea580c', '#0891b2'];

  return (
    <div ref={ref} className="space-y-0">

      {/* ── MAIN INTERACTIVE ZONE with carousel bg ── */}
      <div className="relative rounded-3xl overflow-hidden" style={{ minHeight: 680 }}>

        {/* Background: 3D carousel — faithful to thebabydino/dPXVyqN */}
        <div
          aria-hidden
          style={{
            position: 'absolute', inset: 0, zIndex: 0,
            overflow: 'hidden',
          }}
        >
          <style>{`
            /* ── scene: full container, perspective + lateral fade mask ── */
            .flc-scene {
              display: grid;
              width: 100%;
              height: 100%;
              /* smaller value = more extreme 3D effect, matching codepen "35em" feel */
              perspective: 38em;
              overflow: hidden;
              /* lateral fade so cards bleed off left/right edges naturally */
              -webkit-mask: linear-gradient(90deg, #0000, red 18% 82%, #0000);
                      mask: linear-gradient(90deg, #0000, red 18% 82%, #0000);
            }
            /* ── 3D stage: stacks all cards in same cell, rotates on Y ── */
            .flc-a3d {
              display: grid;
              place-self: center;
              transform-style: preserve-3d;
              animation: flc-ry 32s linear infinite;
            }
            @keyframes flc-ry { to { rotate: y 1turn; } }
            /* ── each card: portrait ratio, translate back on Z using tan() ── */
            .flc-card {
              --w: 17.5em;
              --ba: calc(1turn / ${FABLAB_PROJECT_IMAGES.length});
              grid-area: 1 / 1;
              width: var(--w);
              aspect-ratio: 7 / 10;
              object-fit: cover;
              border-radius: 1.5em;
              backface-visibility: hidden;
              opacity: 0.82;
            }
            @media (prefers-reduced-motion: reduce) {
              .flc-a3d { animation-duration: 128s; }
            }
          `}</style>
          <div className="flc-scene">
            <div className="flc-a3d">
              {FABLAB_PROJECT_IMAGES.map((src, i) => {
                const n = FABLAB_PROJECT_IMAGES.length;
                // Exact formula from the CodePen:
                // translateZ( -1 * (.5*w + .5em) / tan(.5 * ba) )
                // ba = 1turn/n = 360deg/n → .5*ba = 180deg/n
                // We compute in JS since CSS tan() needs modern browsers
                const ba = (2 * Math.PI) / n;          // full angle per card (rad)
                const halfBa = ba / 2;
                // --w is 17.5em; 1em ≈ 16px → 17.5em = 280px; .5em = 8px
                // We keep it in em: tz = -(0.5*17.5 + 0.5) / tan(halfBa) em
                const tzEm = -((0.5 * 17.5 + 0.5) / Math.tan(halfBa));
                return (
                  <img
                    key={i}
                    src={src}
                    alt=""
                    className="flc-card"
                    style={{
                      transform: `rotateY(calc(${i} * 1turn / ${n})) translateZ(${tzEm.toFixed(3)}em)`,
                    }}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* Overlay: gentle top/bottom fade only — let the carousel breathe left/right */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none',
          background: `
            linear-gradient(to bottom, #0d1117 0%, transparent 18%, transparent 82%, #0d1117 100%)
          `,
        }} />

        {/* ── Content: 3-column layout ── */}
        <div className="relative z-10 flex items-center justify-center px-8 md:px-16 py-6" style={{ minHeight: 580 }}>
          {/* CENTER: SVG connectors + 3D logo */}
          <div className="relative flex-1 flex items-center justify-center" style={{ minHeight: 600 }}>

            {/* 3D Logo — fixed square container so the canvas always has a defined size */}
            <motion.div
              initial={{ opacity: 0, scale: 0.7 }}
              animate={inView ? { opacity: 1, scale: 1 } : {}}
              transition={{ delay: 0.3, type: 'spring', stiffness: 100 }}
              style={{
                position: 'relative',
                width: 460,
                height: 460,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {/* Glow behind the model */}
              <div style={{
                position: 'absolute',
                width: 420, height: 420,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(29,78,216,0.35) 0%, rgba(29,78,216,0.1) 40%, transparent 70%)',
                animation: 'pulse 3s ease-in-out infinite',
                zIndex: 0,
              }} />
              <style>{`@keyframes pulse { 0%,100%{opacity:0.6;transform:scale(0.92)} 50%{opacity:1;transform:scale(1.08)} }`}</style>
              {/* Model sits above the glow */}
              <div style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
                <FabLab3DLogo />
              </div>
            </motion.div>
          </div>

        </div>
      </div>

      {/* ── Text + Charter below ── */}
      <FadeIn delay={0.1}>
        <div className="grid md:grid-cols-2 gap-10 items-start mt-6">
          <div className="space-y-5 text-white/65 text-base leading-relaxed">
            <p>
              <strong className="text-white">Fab Lab</strong> (Fabrication Laboratory) é um conceito criado pelo professor{' '}
              <NeilTooltip>Neil Gershenfeld</NeilTooltip> no MIT em 2001. Nasceu da pergunta:{' '}
              <em className="text-white/80">"Como fazer (quase) qualquer coisa?"</em>
            </p>
            <p>
              Um espaço de prototipagem rápida equipado com <strong className="text-white">impressoras 3D, cortadoras a laser e fresadoras CNC</strong> — acessível a qualquer pessoa com uma ideia.
            </p>
            <p>
              Diferente de um laboratório tradicional, o Fab Lab é <strong className="text-white">aberto à comunidade</strong>: estudantes, artistas, empreendedores e curiosos coexistem num mesmo espaço criativo.
            </p>
            {/* Neil quote */}
            <blockquote className="relative pl-4 border-l-2 border-blue-500/60 mt-4">
              <p className="text-white/55 text-sm italic leading-relaxed">
                "A verdadeira oportunidade é aproveitar o poder inventivo do mundo para projetar e produzir localmente soluções para problemas locais."
              </p>
              <footer className="mt-2 text-xs text-blue-400/80 font-semibold not-italic">— Neil Gershenfeld</footer>
            </blockquote>
          </div>
          <div className="space-y-4">
            <FabCharterScroll />
            {/* Equipment card — what Neil says a Fab Lab needs */}
            <div
              className="rounded-2xl px-5 py-4"
              style={{
                background: 'rgba(13,17,23,0.80)',
                border: '1.5px solid rgba(255,255,255,0.08)',
                backdropFilter: 'blur(12px)',
              }}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-5 h-5 rounded flex items-center justify-center" style={{ background: 'rgba(29,78,216,0.25)' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#1D4ED8" strokeWidth="2.5"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
                </div>
                <span className="text-xs font-bold tracking-widest uppercase text-white/50">Equipamentos mínimos</span>
              </div>
              <p className="text-xs text-white/35 mb-3 leading-relaxed">Segundo Neil Gershenfeld, todo Fab Lab precisa ter:</p>
              <div className="space-y-2">
                {[
                  { color: '#1D4ED8', icon: 'printer3d', label: 'Impressora 3D', desc: 'Prototipagem rápida em plástico (FDM/SLA)' },
                  { color: '#059669', icon: 'zap',       label: 'Cortadora a Laser', desc: 'Corte e gravação em madeira, acrílico, tecido' },
                  { color: '#DC2626', icon: 'tool',      label: 'Fresadora CNC de precisão', desc: 'Placas de circuito impresso e moldes' },
                  { color: '#7c3aed', icon: 'cpu',       label: 'Cortadora de Vinil', desc: 'Adesivos, máscaras e circuitos flexíveis' },
                  { color: '#ea580c', icon: 'tool',      label: 'Fresadora de grande formato', desc: 'Peças em madeira e mobiliário' },
                  { color: '#0891b2', icon: 'cpu',       label: 'Eletrônica & solda', desc: 'Bancada com Arduino, sensores e componentes' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: item.color }} />
                    <span className="text-xs text-white/70 font-semibold">{item.label}</span>
                    <span className="text-xs text-white/35 hidden md:inline">— {item.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </FadeIn>

      {/* Timeline — Staircase */}
      <FadeIn delay={0.15}>
        <div className="mt-10">
          <div className="text-center mb-6">
            <div className="inline-flex flex-col items-center gap-2">
              <div className="flex items-center gap-3">
                <div className="h-px w-12 bg-gradient-to-r from-transparent to-white/30" />
                <span className="text-xs font-bold tracking-[0.25em] uppercase text-white/40">O que é</span>
                <div className="h-px w-12 bg-gradient-to-l from-transparent to-white/30" />
              </div>
              <h3 className="text-2xl font-extrabold tracking-tight text-white" style={{ letterSpacing: '-0.01em' }}>
                História do Movimento
              </h3>
              <div className="flex items-center gap-2">
                <div className="h-0.5 w-8 rounded-full" style={{ background: '#1D4ED8' }} />
                <div className="h-0.5 w-3 rounded-full" style={{ background: '#DC2626' }} />
                <div className="h-0.5 w-1.5 rounded-full" style={{ background: '#059669' }} />
              </div>
            </div>
          </div>
          <HistoryImageBanner />
          {/* Timeline overlaps the bottom of the image */}
          <div style={{ marginTop: -120, position: 'relative', zIndex: 10 }}>
            <StaircaseTimeline items={FABLAB_TIMELINE} />
          </div>
        </div>
      </FadeIn>
    </div>
  );
});

/* ── STACKED CARDS SCROLL — igual ao codepen pvbboZx ──────── */
/*
 * Padrão: cada card fica "preso" (pinned individualmente, pinSpacing:false)
 * e escala para 0.9x à medida que o próximo card sobe por cima.
 * Isso elimina COMPLETAMENTE o bug de sobreposição/dupla exibição porque
 * cada elemento é independente — não há timeline compartilhada.
 */
const STACK_CARDS = [
  {
    icon: 'box',
    color: '#1D4ED8',
    accent: 'rgba(29,78,216,0.15)',
    num: '01',
    label: 'Inventário inteligente',
    text: 'Controle total do estoque com alertas automáticos de criticidade e histórico completo de movimentações em tempo real.',
    tag: 'Estoque & Materiais',
  },
  {
    icon: 'calendar',
    color: '#059669',
    accent: 'rgba(5,150,105,0.15)',
    num: '02',
    label: 'Agendamentos precisos',
    text: 'Calendário visual de uso do laboratório com controle de materiais por sessão, notificações e histórico de reservas.',
    tag: 'Calendário & Reservas',
  },
  {
    icon: 'folders',
    color: '#DC2626',
    accent: 'rgba(220,38,38,0.15)',
    num: '03',
    label: 'Gestão de projetos',
    text: 'Projetos maker com squads de alunos, quizzes gamificados, propostas e acompanhamento individualizado de cada equipe.',
    tag: 'Projetos & Alunos',
  },
  {
    icon: 'message',
    color: '#7c3aed',
    accent: 'rgba(124,58,237,0.15)',
    num: '04',
    label: 'Comunidade ativa',
    text: 'Canal aberto de sugestões da comunidade maker — transformando ideias em melhorias reais na plataforma e nos espaços.',
    tag: 'Comunidade & Feedback',
  },
  {
    icon: 'edit',
    color: '#ea580c',
    accent: 'rgba(234,88,12,0.15)',
    num: '05',
    label: 'Blog da comunidade',
    text: 'Conteúdo técnico, tutoriais e novidades publicados pela equipe e pelos próprios usuários. Conhecimento aberto, sempre.',
    tag: 'Conteúdo & Tutoriais',
  },
];

const StackedCardsSection = memo(function StackedCardsSection({ BLUE }: { BLUE: string }) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const visible = useIntersectionOnce(sectionRef as React.RefObject<Element>, '400px');

  useEffect(() => {
    if (!visible) return;
    // Wait for DOM to settle
    const timer = setTimeout(() => {
      const ctx = gsap.context(() => {
        const cards = gsap.utils.toArray<HTMLElement>('.stack-card');
        if (!cards.length) return;

        // Each card pins itself at `top += offset` so they stack from the top
        cards.forEach((card, i) => {
          const isLast = i === cards.length - 1;

          // Pin each card; the card below stays visible as the next slides over it
          ScrollTrigger.create({
            trigger: card,
            start: `top-=${i * 5}px top`,   // slight stagger so they feel layered
            end: 'bottom top',
            pin: true,
            pinSpacing: false,
            invalidateOnRefresh: true,
          });

          // Scale down as next card comes in (all except last)
          if (!isLast) {
            gsap.to(card, {
              scale: 0.9 + (i * 0.01),   // slight depth: earlier cards scale more
              yPercent: -3,
              ease: 'none',
              scrollTrigger: {
                trigger: cards[i + 1],    // triggered by the NEXT card entering
                start: 'top bottom',
                end: 'top top',
                scrub: true,
                invalidateOnRefresh: true,
              },
            });
          }
        });
      }, wrapperRef);

      return () => ctx.revert();
    }, 100);

    return () => clearTimeout(timer);
  }, [visible]);

  return (
    <div ref={sectionRef}>
      {/* Section header — above the cards, not pinned */}
      <div
        className="relative z-10 text-center py-16 px-6"
        style={{ background: '#060810' }}
      >
        <div className="flex items-center justify-center gap-3 mb-3">
          <div className="w-8 h-0.5" style={{ background: BLUE }} />
          <span className="text-xs font-bold tracking-widest uppercase text-blue-400">Plataforma FabLab</span>
          <div className="w-8 h-0.5" style={{ background: BLUE }} />
        </div>
        <h2 className="text-3xl md:text-5xl font-bold text-white mb-3">
          Tudo num só <span style={{ color: BLUE }}>lugar</span>
        </h2>
        <p className="text-white/40 text-sm">Role para explorar cada módulo</p>
      </div>

      {/* Stack wrapper */}
      <div ref={wrapperRef} className="relative">
        {STACK_CARDS.map((card, i) => (
          <div
            key={i}
            className="stack-card"
            style={{
              height: '100vh',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#060810',
              position: 'relative',
              // Each card sits slightly higher to create depth illusion
              zIndex: i + 1,
            }}
          >
            {/* Subtle grid bg */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: `linear-gradient(${card.color}14 1px,transparent 1px),linear-gradient(90deg,${card.color}14 1px,transparent 1px)`,
                backgroundSize: '72px 72px',
                opacity: 0.4,
              }}
            />

            {/* Glow orb behind card */}
            <div
              className="absolute pointer-events-none"
              style={{
                width: 600,
                height: 600,
                borderRadius: '50%',
                background: `radial-gradient(circle, ${card.color}18 0%, transparent 70%)`,
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
              }}
            />

            {/* The actual card content */}
            <div
              className="relative w-full max-w-4xl mx-6 md:mx-16 rounded-3xl overflow-hidden"
              style={{
                background: `linear-gradient(145deg, #0d1117 0%, #10151f 60%, ${card.color}0a 100%)`,
                border: `1px solid ${card.color}30`,
                boxShadow: `0 40px 80px rgba(0,0,0,0.6), 0 0 0 1px ${card.color}10, inset 0 1px 0 rgba(255,255,255,0.05)`,
                minHeight: 340,
              }}
            >
              {/* Top color bar */}
              <div
                style={{
                  height: 3,
                  background: `linear-gradient(90deg, ${card.color}, ${card.color}40, transparent)`,
                }}
              />

              <div className="p-8 md:p-12 grid md:grid-cols-2 gap-8 items-center">
                {/* Left: number + icon + badge */}
                <div className="flex flex-col gap-6">
                  <div className="flex items-start gap-4">
                    <div
                      className="text-5xl md:text-6xl font-black leading-none select-none"
                      style={{
                        color: card.color,
                        opacity: 0.15,
                        fontVariantNumeric: 'tabular-nums',
                        fontFamily: 'monospace',
                      }}
                    >
                      {card.num}
                    </div>
                    <div
                      className="w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center text-3xl md:text-4xl flex-shrink-0"
                      style={{
                        background: card.accent,
                        border: `1px solid ${card.color}40`,
                        boxShadow: `0 8px 32px ${card.color}20`,
                      }}
                    >
                      <Icon name={card.icon} size={36} color={card.color} />
                    </div>
                  </div>

                  <div>
                    <span
                      className="inline-block text-[10px] font-bold tracking-[0.2em] uppercase px-2.5 py-1 rounded-full mb-3"
                      style={{ background: card.accent, color: card.color, border: `1px solid ${card.color}30` }}
                    >
                      {card.tag}
                    </span>
                    <h3
                      className="text-2xl md:text-3xl font-bold text-white leading-tight"
                      style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                    >
                      {card.label}
                    </h3>
                  </div>
                </div>

                {/* Right: description + divider + progress */}
                <div className="flex flex-col gap-6">
                  <p
                    className="text-base md:text-lg leading-relaxed"
                    style={{ color: 'rgba(255,255,255,0.6)', fontFamily: "'Space Grotesk', sans-serif" }}
                  >
                    {card.text}
                  </p>

                  {/* Progress bar showing module position */}
                  <div>
                    <div className="flex justify-between text-xs mb-2" style={{ color: 'rgba(255,255,255,0.25)' }}>
                      <span>Módulo {i + 1} de {STACK_CARDS.length}</span>
                      <span style={{ color: card.color }}>{Math.round(((i + 1) / STACK_CARDS.length) * 100)}%</span>
                    </div>
                    <div className="h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${((i + 1) / STACK_CARDS.length) * 100}%`,
                          background: `linear-gradient(90deg, ${card.color}, ${card.color}80)`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Dots: which card we're on */}
                  <div className="flex gap-2">
                    {STACK_CARDS.map((c, j) => (
                      <div
                        key={j}
                        className="rounded-full transition-all"
                        style={{
                          width: j === i ? 20 : 6,
                          height: 6,
                          background: j === i ? card.color : 'rgba(255,255,255,0.12)',
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom right faint number watermark */}
              <div
                className="absolute bottom-4 right-6 text-7xl font-black pointer-events-none select-none"
                style={{
                  color: card.color,
                  opacity: 0.04,
                  fontFamily: 'monospace',
                  lineHeight: 1,
                }}
              >
                {card.num}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

/* ── Componente Principal ─────────────────────────────────── */
/* ── InteractiveHero ──────────────────────────────────────────────────────
 * Layer stack (bottom → top):
 *  1. SVG slide background (sem fundo, fills viewport, auto-cycles)
 *  2. Semi-transparent dark overlay
 *  3. Draggable "FAB LAB" text particles — rounded font, grid layout, interactable
 *  4. Overlay: same SVG sem fundo (no background rect) — floats on top
 *  5. Text content + buttons (z-top)
 *
 * Fonte: "Nunito" (Google Fonts) — rounded, soft, display
 */

const HERO_SLIDES_DATA = SLIDES;
const HERO_COLORS = ['#1D4ED8', '#059669', '#DC2626', '#7c3aed', '#ea580c', '#0891b2', '#1D4ED8', '#059669', '#DC2626'];

type Particle = {
  id: number;
  x: number; y: number;
  vx: number; vy: number;
  size: number;
  color: string;
  label: string;
  opacity: number;
  rotation: number;
  gridX: number; gridY: number; // home position in grid
};

function InteractiveHero({
  slide, setSlide, goToApp, scrollTo, isAuthenticated,
  heroTagRef, heroH1Ref, heroDescRef, heroPhraseRef, heroBtnsRef,
  BLUE, GREEN, RED,
}: {
  slide: number; setSlide: (n: number) => void; goToApp: () => void;
  scrollTo: (id: string) => void; isAuthenticated: boolean;
  heroTagRef: React.RefObject<HTMLSpanElement>;
  heroH1Ref: React.RefObject<HTMLHeadingElement>;
  heroDescRef: React.RefObject<HTMLParagraphElement>;
  heroPhraseRef: React.RefObject<HTMLDivElement>;
  heroBtnsRef: React.RefObject<HTMLDivElement>;
  BLUE: string; GREEN: string; RED: string;
}) {
  const containerRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number>(0);
  const dragRef = useRef<{ id: number; ox: number; oy: number } | null>(null);
  const mouseRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const [svgLoaded, setSvgLoaded] = useState<string[]>([]);
  const heroInVP = useIsInViewport(containerRef as React.RefObject<Element>, '200px');
  const heroInVPRef = useRef(true);
  heroInVPRef.current = heroInVP;

  // Preload SVGs as object URLs
  useEffect(() => {
    // bg = com fundo (foto), fg = sem fundo (elementos decorativos)
    const bgPaths = [1,2,3,4,5,6].map(i => `/slides/slide${i}_bg.svg`);
    const fgPaths = [1,2,3,4,5,6].map(i => `/slides/slide${i}_fg.svg`);
    setSvgLoaded([...bgPaths, ...fgPaths]); // first 6 = bg, last 6 = fg
  }, []);

  // Build initial particles in a perfect grid
  const initParticles = useCallback((w: number, h: number) => {
    const cols = 6;
    const rows = 5;
    const COUNT = cols * rows; // 30 particles — full coverage
    const cellW = w / cols;
    const cellH = h / rows;

    particlesRef.current = Array.from({ length: COUNT }, (_, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      // Perfect center of each cell — no randomness
      const x = cellW * col + cellW * 0.5;
      const y = cellH * row + cellH * 0.5;
      return {
        id: i,
        x,
        y,
        vx: 0,
        vy: 0,
        size: 52 + (i % 3) * 14, // 52, 66, 80px — clearly visible
        color: HERO_COLORS[i % HERO_COLORS.length],
        label: 'FAB LAB',
        opacity: 0.13 + (i % 4) * 0.03, // 0.13 → 0.22 — visible but not overwhelming
        rotation: (i % 6) * 7 - 17, // deterministic: -17, -10, -3, 4, 11, 18
        gridX: x,
        gridY: y,
      };
    });
  }, []);

  // Canvas render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      if (particlesRef.current.length === 0) {
        initParticles(canvas.width, canvas.height);
      } else {
        // Recompute grid home positions for new canvas size
        const cols = 6;
        const rows = 5;
        const cellW = canvas.width / cols;
        const cellH = canvas.height / rows;
        particlesRef.current.forEach((p, i) => {
          const col = i % cols;
          const row = Math.floor(i / cols);
          p.gridX = cellW * col + cellW * 0.5;
          p.gridY = cellH * row + cellH * 0.5;
        });
      }
    };
    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      if (!heroInVPRef.current) {
        rafRef.current = requestAnimationFrame(draw);
        return;
      }
      const { width: W, height: H } = canvas;
      ctx.clearRect(0, 0, W, H);

      // Find the dragged particle (if any) and compute occupied grid slot
      const dragged = dragRef.current
        ? particlesRef.current.find(p => p.id === dragRef.current!.id)
        : null;

      particlesRef.current.forEach(p => {
        if (dragRef.current?.id !== p.id) {
          // If a sibling is being dragged, every other particle homes back to its grid slot
          if (dragged) {
            const tx = p.gridX;
            const ty = p.gridY;
            const ex = tx - p.x;
            const ey = ty - p.y;
            p.vx += ex * 0.04;
            p.vy += ey * 0.04;
          } else {
            // Gentle drift when nothing is being dragged
            // Mouse repulsion
            const mx = mouseRef.current.x;
            const my = mouseRef.current.y;
            const dx = p.x - mx; const dy = p.y - my;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 160 && dist > 0) {
              const force = (160 - dist) / 160;
              p.vx += (dx / dist) * force * 0.4;
              p.vy += (dy / dist) * force * 0.4;
            }
            // Very gentle drift back to grid when idle
            const ex = p.gridX - p.x;
            const ey = p.gridY - p.y;
            p.vx += ex * 0.003;
            p.vy += ey * 0.003;
          }

          // Damping
          p.vx *= 0.92;
          p.vy *= 0.92;
          // Clamp speed
          const spd = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
          if (spd > 3.5) { p.vx = (p.vx / spd) * 3.5; p.vy = (p.vy / spd) * 3.5; }

          p.x += p.vx;
          p.y += p.vy;
          // Soft bounce at edges
          if (p.x < -120) p.x = W + 80;
          if (p.x > W + 120) p.x = -80;
          if (p.y < -60) p.y = H + 40;
          if (p.y > H + 60) p.y = -40;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);

        // Use system rounded fonts — reliable on canvas without async loading
        const font = `900 ${p.size}px 'Arial Rounded MT Bold', 'Trebuchet MS', 'Segoe UI', Arial, sans-serif`;
        ctx.font = font;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Glow / halo behind text
        ctx.globalAlpha = p.opacity * 0.18;
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 14;
        ctx.lineJoin = 'round';
        ctx.strokeText(p.label, 0, 0);

        // Main fill
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;
        ctx.fillText(p.label, 0, 0);

        ctx.restore();
      });

      rafRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [initParticles]);

  // Mouse interaction
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const getPos = (e: MouseEvent | TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      const src = 'touches' in e ? e.touches[0] : e;
      return { x: src.clientX - rect.left, y: src.clientY - rect.top };
    };

    const onMove = (e: MouseEvent) => {
      const { x, y } = getPos(e);
      mouseRef.current = { x, y };
      if (dragRef.current) {
        const p = particlesRef.current.find(p => p.id === dragRef.current!.id);
        if (p) {
          p.x = x + dragRef.current.ox;
          p.y = y + dragRef.current.oy;
          p.vx = 0; p.vy = 0;
        }
      }
    };

    const onDown = (e: MouseEvent) => {
      const { x, y } = getPos(e);
      const ctx = canvas.getContext('2d')!;
      // Hit test each particle
      for (const p of [...particlesRef.current].reverse()) {
        ctx.font = `900 ${p.size}px 'Arial Rounded MT Bold', 'Trebuchet MS', 'Segoe UI', Arial, sans-serif`;
        const w = ctx.measureText(p.label).width;
        const h = p.size;
        // Rotated AABB (approximate)
        const dx = x - p.x; const dy = y - p.y;
        const cos = Math.cos((-p.rotation * Math.PI) / 180);
        const sin = Math.sin((-p.rotation * Math.PI) / 180);
        const lx = dx * cos - dy * sin;
        const ly = dx * sin + dy * cos;
        if (Math.abs(lx) < w / 2 + 10 && Math.abs(ly) < h / 2 + 8) {
          dragRef.current = { id: p.id, ox: p.x - x, oy: p.y - y };
          canvas.style.cursor = 'grabbing';
          break;
        }
      }
    };

    const onUp = () => {
      if (dragRef.current) {
        const p = particlesRef.current.find(q => q.id === dragRef.current!.id);
        if (p) {
          // Give dragged particle a gentle push toward its grid home
          p.vx = (p.gridX - p.x) * 0.05;
          p.vy = (p.gridY - p.y) * 0.05;
        }
      }
      dragRef.current = null;
      canvas.style.cursor = 'default';
    };

    canvas.addEventListener('mousemove', onMove);
    canvas.addEventListener('mousedown', onDown);
    canvas.addEventListener('mouseup', onUp);
    canvas.addEventListener('mouseleave', () => { mouseRef.current = { x: -999, y: -999 }; onUp(); });

    return () => {
      canvas.removeEventListener('mousemove', onMove);
      canvas.removeEventListener('mousedown', onDown);
      canvas.removeEventListener('mouseup', onUp);
    };
  }, []);

  const accentColors = [BLUE, GREEN, RED, '#7c3aed'];
  const currentSlideData = HERO_SLIDES_DATA[slide];

  return (
    <section
      ref={containerRef}
      id="hero"
      className="relative h-screen flex items-end"
      style={{ background: '#08090c', overflow: 'hidden' }}
    >
      {/* Google Font: Nunito — rounded, soft */}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@900&display=swap');`}</style>

      {/* Layer 1: SVG background (com fundo, blended) */}
      <AnimatePresence mode="sync">
        <motion.div
          key={`bg-${slide}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0 z-0"
          style={{ overflow: 'hidden' }}
        >
          {svgLoaded[slide] && (
            <img
              src={svgLoaded[slide]}
              alt=""
              style={{
                position: 'absolute', inset: 0,
                width: '100%', height: '100%',
                objectFit: 'cover', objectPosition: 'center top',
                opacity: 1,
              }}
            />
          )}
          {/* Gradient overlay: smoky bottom — image fully dissolves before the fold */}
          <div
            className="absolute inset-0"
            style={{
              background: `
                linear-gradient(to top,
                  #08090c 0%,
                  #08090c 10%,
                  rgba(8,9,12,0.96) 20%,
                  rgba(8,9,12,0.85) 32%,
                  rgba(8,9,12,0.62) 45%,
                  rgba(8,9,12,0.30) 58%,
                  rgba(8,9,12,0.05) 72%,
                  transparent 85%
                ),
                linear-gradient(to right,
                  rgba(8,9,12,0.80) 0%,
                  rgba(8,9,12,0.25) 28%,
                  transparent 52%,
                  rgba(8,9,12,0.40) 100%
                ),
                linear-gradient(to bottom,
                  rgba(8,9,12,0.65) 0%,
                  rgba(8,9,12,0.20) 8%,
                  transparent 18%
                )
              `,
            }}
          />
        </motion.div>
      </AnimatePresence>

      {/* Layer 2: Canvas — draggable FAB LAB particles */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 z-10 w-full h-full"
        style={{ cursor: 'default', pointerEvents: 'all' }}
      />

      {/* Layer 3: SVG sem fundo overlay — full size, smoky only at bottom */}
      <AnimatePresence mode="sync">
        <motion.div
          key={`fg-${slide}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0 z-20 pointer-events-none"
          style={{
            WebkitMaskImage: 'linear-gradient(to top, transparent 0%, black 25%)',
            maskImage: 'linear-gradient(to top, transparent 0%, black 25%)',
          }}
        >
          {svgLoaded[slide + 6] && (
            <img
              src={svgLoaded[slide + 6]}
              alt=""
              style={{
                position: 'absolute', inset: 0,
                width: '100%', height: '100%',
                objectFit: 'cover', objectPosition: 'center top',
                opacity: 0.85,
                mixBlendMode: 'screen',
              }}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Color bar top */}
      <div className="absolute top-0 left-0 right-0 h-1 flex z-30">
        <div className="flex-1" style={{ background: BLUE }} />
        <div className="flex-1" style={{ background: GREEN }} />
        <div className="flex-1" style={{ background: RED }} />
      </div>

      {/* Layer 4: Text content */}
      <div className="relative z-30 w-full px-6 md:px-16 pb-20 pointer-events-none">
        <div ref={heroPhraseRef} className="mb-3">
          <span
            className="text-xs font-bold tracking-[0.3em] uppercase"
            style={{ color: accentColors[slide % accentColors.length] }}
          >
            {currentSlideData.phrase}
          </span>
        </div>

        <span
          ref={heroTagRef}
          className="inline-block text-xs font-bold tracking-[0.25em] uppercase px-3 py-1 rounded-full mb-4"
          style={{
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.18)',
            backdropFilter: 'blur(8px)',
          }}
        >
          {currentSlideData.tag}
        </span>

        <h1
          ref={heroH1Ref}
          className="text-4xl md:text-6xl lg:text-7xl font-bold text-white leading-[1.05] mb-4 max-w-3xl block"
        >
          {currentSlideData.title}
        </h1>

        <p
          ref={heroDescRef}
          className="text-white/65 text-lg md:text-xl max-w-xl mb-8 block"
        >
          {currentSlideData.desc}
        </p>

        <div ref={heroBtnsRef} className="flex gap-3 flex-wrap pointer-events-auto" style={{ opacity: 1 }}>
          <button
            onClick={goToApp}
            className="px-6 py-3 rounded-xl font-bold text-white text-sm transition-all hover:scale-105"
            style={{
              background: 'rgba(29,78,216,0.55)',
              border: '1px solid rgba(29,78,216,0.85)',
              backdropFilter: 'blur(14px)',
            }}
          >
            {isAuthenticated ? 'Acessar plataforma' : 'Entrar na plataforma'}
          </button>
          <button
            onClick={() => scrollTo('o-que-e')}
            className="px-6 py-3 rounded-xl font-semibold text-sm transition-all hover:bg-white/10 pointer-events-auto"
            style={{ border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(8px)' }}
          >
            Saiba mais
          </button>
        </div>
      </div>

      {/* Slide indicators */}
      <div className="absolute right-6 md:right-16 bottom-20 flex flex-col gap-2 z-30">
        {HERO_SLIDES_DATA.map((_, i) => (
          <button
            key={i}
            onClick={() => setSlide(i)}
            className="w-1.5 rounded-full transition-all"
            style={{ height: i === slide ? 28 : 8, background: i === slide ? BLUE : 'rgba(255,255,255,0.3)' }}
          />
        ))}
      </div>

      {/* Extra bottom smoke — ensures zero visible edge even at different screen sizes */}
      <div
        className="absolute bottom-0 left-0 right-0 z-25 pointer-events-none"
        style={{
          height: '45%',
          background: 'linear-gradient(to top, #08090c 0%, #08090c 20%, rgba(8,9,12,0.85) 50%, transparent 100%)',
        }}
      />

    </section>
  );
}

export function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { isDark, toggle: toggleTheme } = useThemeStore();
  const { lang, toggle: toggleLang } = useLanguageStore();
  const scrollY = useScrollY();
  const [slide, setSlide] = useState(0);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [scrollIndicator, setScrollIndicator] = useState(true);
  // Hero text refs — persisted between slides
  const heroTagRef = useRef<HTMLSpanElement>(null);
  const heroH1Ref = useRef<HTMLHeadingElement>(null);
  const heroDescRef = useRef<HTMLParagraphElement>(null);
  const heroPhraseRef = useRef<HTMLDivElement>(null);
  const heroBtnsRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);
  const slideTlRef = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => { getOrCreateLenis(); }, []);

  // Apply dark/light theme — igual ao AppLayout
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  // Apply language
  useEffect(() => {
    import('@/i18n').then(m => m.default.changeLanguage(lang));
  }, [lang]);

  // Close settings on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setSettingsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const handleScroll = () => { setScrollIndicator(window.scrollY <= 60); };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Hero entrance on mount (once)
  useEffect(() => {
    const ctx = gsap.context(() => {
      const els = [heroTagRef.current, heroH1Ref.current, heroDescRef.current, heroPhraseRef.current];
      els.forEach(el => el && gsap.set(el, { opacity: 0, y: 24 }));
      // Buttons start visible and never animate out
      if (heroBtnsRef.current) gsap.set(heroBtnsRef.current, { opacity: 1, y: 0 });
      const tl = gsap.timeline({ delay: 0.4 });
      els.forEach((el, i) => {
        if (el) tl.to(el, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }, i === 0 ? 0 : `-=${0.5}`);
      });
    });
    return () => ctx.revert();
  }, []);

  // Re-animate hero text on each slide change (cross-fade content IN) — buttons excluded
  useEffect(() => {
    if (slideTlRef.current) slideTlRef.current.kill();
    const els = [heroTagRef.current, heroH1Ref.current, heroDescRef.current, heroPhraseRef.current];
    gsap.killTweensOf(els);
    const tl = gsap.timeline();
    els.forEach(el => { if (el) gsap.set(el, { opacity: 0, y: 16 }); });
    els.forEach((el, i) => {
      if (el) tl.to(el, { opacity: 1, y: 0, duration: 0.55, ease: 'power3.out' }, i * 0.08);
    });
    slideTlRef.current = tl;
  }, [slide]);

  // ScrollTrigger fadeup
  useEffect(() => {
    const ctx = gsap.context(() => {
      document.querySelectorAll('[data-gsap="fadeup"]').forEach((el) => {
        gsap.set(el, { opacity: 0, y: 48 });
        ScrollTrigger.create({
          trigger: el, start: 'top 88%',
          onEnter: () => gsap.to(el, {
            opacity: 1, y: 0, duration: 0.9,
            delay: Number((el as HTMLElement).dataset.gsapDelay || 0),
            ease: 'power3.out',
          }),
          once: true,
        });
      });
    });
    return () => ctx.revert();
  }, []);

  // Auto-advance slides
  useEffect(() => {
    const id = setInterval(() => setSlide(p => (p + 1) % SLIDES.length), 8000);
    return () => clearInterval(id);
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) _lenis ? _lenis.scrollTo(el, { offset: -64, duration: 1.4 }) : el.scrollIntoView({ behavior: 'smooth' });
    setMobileMenu(false);
  };

  const goToApp = () => navigate(isAuthenticated ? '/' : '/login');
  const BLUE = '#1D4ED8'; const GREEN = '#059669'; const RED = '#DC2626';

  return (
    <div ref={wrapperRef} style={{ fontFamily: "'Space Grotesk', sans-serif", background: '#08090c', color: '#f3f4f6', minHeight: '100vh' }}>

      {/* SCROLL INDICATOR — pill/mouse style igual TOTVS */}
      <motion.div
        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 pointer-events-none flex flex-col items-center gap-2"
        animate={{ opacity: scrollIndicator ? 1 : 0, y: scrollIndicator ? 0 : 16 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
      >
        <span className="text-white/40 text-[9px] uppercase tracking-[0.3em] font-semibold">scroll</span>
        {/* Cápsula — mouse icon */}
        <div style={{
          width: 26,
          height: 44,
          borderRadius: 999,
          border: '1.5px solid rgba(255,255,255,0.35)',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          paddingTop: 7,
        }}>
          <motion.div
            style={{
              width: 4,
              height: 4,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.85)',
            }}
            animate={{ y: [0, 18, 0], opacity: [1, 0, 1] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
      </motion.div>

      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 h-16"
        style={{
          background: scrollY > 40
            ? 'rgba(8,9,12,0.82)'
            : 'rgba(8,9,12,0.08)',
          backdropFilter: 'blur(20px) saturate(1.8) brightness(0.95)',
          WebkitBackdropFilter: 'blur(20px) saturate(1.8) brightness(0.95)',
          borderBottom: 'none',
          transition: 'background 0.5s ease',
        }}>
        {/* Smoky bottom border — blurs into page content below */}
        <div style={{
          position: 'absolute', bottom: -28, left: 0, right: 0,
          height: 28, pointerEvents: 'none', zIndex: 1,
          background: 'linear-gradient(to bottom, rgba(8,9,12,0.45) 0%, transparent 100%)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          maskImage: 'linear-gradient(to bottom, black 0%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, black 0%, transparent 100%)',
        }} />
        <div className="flex items-center gap-2.5 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => scrollTo('hero')}>
          <FabLabLogo size={28} />
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
            <span style={{ fontSize: 15, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>fab<span style={{ color: BLUE }}>lab</span></span>
            <span style={{ fontSize: 8, fontWeight: 600, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.25em', textTransform: 'uppercase' }}>platform</span>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-6">
          {NAV_LINKS.map(l => (
            <button key={l.id} onClick={() => l.type === 'route' ? navigate(l.path!) : scrollTo(l.id)} className="text-sm text-white/70 hover:text-white transition-colors font-medium">{l.label}</button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/login')} className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-white/70 hover:text-white transition-colors">
            Entrar
          </button>
          <button onClick={goToApp} className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-80" style={{ background: BLUE }}>
            <LogIn size={15} />{isAuthenticated ? 'Acessar plataforma' : 'Cadastrar'}
          </button>

          {/* Settings: dark mode + language */}
          <div className="relative" ref={settingsRef}>
            <button
              onClick={() => setSettingsOpen(p => !p)}
              className="flex items-center justify-center w-9 h-9 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all"
              title="Configurações"
              style={{ border: settingsOpen ? '1px solid rgba(255,255,255,0.2)' : '1px solid transparent' }}
            >
              <Settings size={17} />
            </button>
            {settingsOpen && (
              <div
                className="absolute right-0 top-11 min-w-[200px] rounded-xl overflow-hidden shadow-2xl z-50"
                style={{ background: 'rgba(10,12,18,0.97)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)' }}
              >
                {/* Theme */}
                <div className="px-4 py-3 border-b border-white/5">
                  <p className="text-[10px] text-white/30 uppercase tracking-widest mb-2">{lang === 'en' ? 'Theme' : 'Tema'}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { if (isDark) toggleTheme(); }}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all"
                      style={!isDark ? { background: BLUE, color: '#fff' } : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.45)' }}
                    >
                      <Sun size={12} /> {lang === 'en' ? 'Light' : 'Claro'}
                    </button>
                    <button
                      onClick={() => { if (!isDark) toggleTheme(); }}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all"
                      style={isDark ? { background: BLUE, color: '#fff' } : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.45)' }}
                    >
                      <Moon size={12} /> {lang === 'en' ? 'Dark' : 'Escuro'}
                    </button>
                  </div>
                </div>
                {/* Language */}
                <div className="px-4 py-3">
                  <p className="text-[10px] text-white/30 uppercase tracking-widest mb-2">{lang === 'en' ? 'Language' : 'Idioma'}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { if (lang !== 'pt') toggleLang(); }}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all"
                      style={lang === 'pt' ? { background: BLUE, color: '#fff' } : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.45)' }}
                    >
                      🇧🇷 PT
                    </button>
                    <button
                      onClick={() => { if (lang !== 'en') toggleLang(); }}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all"
                      style={lang === 'en' ? { background: BLUE, color: '#fff' } : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.45)' }}
                    >
                      🇺🇸 EN
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <button className="md:hidden text-white" onClick={() => setMobileMenu(p => !p)}>
            {mobileMenu ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileMenu && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="fixed top-16 left-0 right-0 z-40 px-6 py-4 flex flex-col gap-3"
            style={{ background: 'rgba(8,9,12,0.97)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            {NAV_LINKS.map(l => (
              <button key={l.id} onClick={() => { l.type === 'route' ? navigate(l.path!) : scrollTo(l.id); setMobileMenu(false); }} className="text-left text-white/70 py-2 border-b border-white/5 text-sm">{l.label}</button>
            ))}
            <button onClick={() => { navigate('/login'); setMobileMenu(false); }} className="mt-1 px-4 py-2.5 rounded-lg text-sm font-medium text-white/60 border border-white/10">Entrar</button>
            <button onClick={goToApp} className="px-4 py-2.5 rounded-lg text-sm font-bold text-white" style={{ background: BLUE }}>{isAuthenticated ? 'Acessar plataforma' : 'Cadastrar'}</button>
            {/* Mobile settings */}
            <div className="border-t border-white/5 pt-3">
              <p className="text-[10px] text-white/30 uppercase tracking-widest mb-2">{lang === 'en' ? 'Theme' : 'Tema'}</p>
              <div className="flex gap-2 mb-3">
                <button onClick={() => { if (isDark) toggleTheme(); }} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all" style={!isDark ? { background: BLUE, color: '#fff' } : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.45)' }}><Sun size={12} /> {lang === 'en' ? 'Light' : 'Claro'}</button>
                <button onClick={() => { if (!isDark) toggleTheme(); }} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all" style={isDark ? { background: BLUE, color: '#fff' } : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.45)' }}><Moon size={12} /> {lang === 'en' ? 'Dark' : 'Escuro'}</button>
              </div>
              <p className="text-[10px] text-white/30 uppercase tracking-widest mb-2">{lang === 'en' ? 'Language' : 'Idioma'}</p>
              <div className="flex gap-2">
                <button onClick={() => { if (lang !== 'pt') toggleLang(); }} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all" style={lang === 'pt' ? { background: BLUE, color: '#fff' } : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.45)' }}>🇧🇷 PT</button>
                <button onClick={() => { if (lang !== 'en') toggleLang(); }} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all" style={lang === 'en' ? { background: BLUE, color: '#fff' } : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.45)' }}>🇺🇸 EN</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HERO — Interactive FAB LAB particles + SVG overlay */}
      <InteractiveHero
        slide={slide}
        setSlide={setSlide}
        goToApp={goToApp}
        scrollTo={scrollTo}
        isAuthenticated={isAuthenticated}
        heroTagRef={heroTagRef}
        heroH1Ref={heroH1Ref}
        heroDescRef={heroDescRef}
        heroPhraseRef={heroPhraseRef}
        heroBtnsRef={heroBtnsRef}
        BLUE={BLUE}
        GREEN={GREEN}
        RED={RED}
      />

      {/* ── Smoke bleed: hero dissolves into o-que-e ── */}
      <div style={{
        height: 220,
        marginTop: -220,
        position: 'relative',
        zIndex: 10,
        pointerEvents: 'none',
        background: 'linear-gradient(to bottom, transparent 0%, rgba(13,17,23,0.5) 55%, #0d1117 100%)',
      }} />

      {/* O QUE É — redesigned */}
      <section id="o-que-e" className="px-6 md:px-16" style={{
        background: 'linear-gradient(to bottom, #0d1117 0%, #0d1117 80%, #08090c 100%)',
        paddingTop: 56, paddingBottom: 72,
      }}>
        <div className="max-w-6xl mx-auto">
          <FadeIn>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-0.5" style={{ background: BLUE }} />
              <span className="text-xs font-bold tracking-widest uppercase text-blue-400">Projeto MIT</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
              O que é um<br /><span style={{ color: BLUE }}>Fab Lab?</span>
            </h2>
          </FadeIn>
          <FabLabSection />
        </div>
      </section>

      {/* ── Divider: o-que-e → manifesto ── */}
      <div style={{ height: 1 }} />

      {/* MANIFESTO MAKER */}
      <section id="manifesto" className="relative px-6 md:px-16 overflow-hidden" style={{
        background: 'linear-gradient(to bottom, #08090c 0%, #08090c 80%, #0d1117 100%)',
        paddingTop: 96, paddingBottom: 96,
      }}>
        {/* Animated background orbs */}
        <div aria-hidden className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>
          <style>{`
            @keyframes orb1 { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(60px,-40px) scale(1.15)} 66%{transform:translate(-30px,50px) scale(0.9)} }
            @keyframes orb2 { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(-70px,30px) scale(0.85)} 66%{transform:translate(50px,-60px) scale(1.2)} }
            @keyframes orb3 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(40px,40px) scale(1.1)} }
            @keyframes orb4 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-50px,-30px) scale(0.9)} }
          `}</style>
          <div style={{ position:'absolute', top:'10%', left:'5%', width:400, height:400, borderRadius:'50%', background:'radial-gradient(circle, rgba(29,78,216,0.18) 0%, transparent 70%)', animation:'orb1 18s ease-in-out infinite', filter:'blur(40px)' }} />
          <div style={{ position:'absolute', top:'30%', right:'8%', width:500, height:500, borderRadius:'50%', background:'radial-gradient(circle, rgba(5,150,105,0.14) 0%, transparent 70%)', animation:'orb2 22s ease-in-out infinite', filter:'blur(50px)' }} />
          <div style={{ position:'absolute', bottom:'10%', left:'20%', width:350, height:350, borderRadius:'50%', background:'radial-gradient(circle, rgba(220,38,38,0.10) 0%, transparent 70%)', animation:'orb3 16s ease-in-out infinite', filter:'blur(45px)' }} />
          <div style={{ position:'absolute', top:'50%', left:'45%', width:300, height:300, borderRadius:'50%', background:'radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)', animation:'orb4 20s ease-in-out infinite', filter:'blur(35px)' }} />
        </div>
        <div className="max-w-5xl mx-auto relative" style={{ zIndex: 1 }}>
          <FadeIn className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="w-8 h-0.5" style={{ background: RED }} />
              <span className="text-xs font-bold tracking-widest uppercase text-red-400">Cultura Maker</span>
              <div className="w-8 h-0.5" style={{ background: RED }} />
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Manifesto <span style={{ color: RED }}>Maker</span></h2>
            <p className="text-white/50 max-w-md mx-auto text-sm">Vire as páginas e explore os princípios que guiam criadores em todo o mundo.</p>
          </FadeIn>
          <FadeIn delay={0.15}>
            <InteractiveBook />
          </FadeIn>
          {/* PDF Download */}
          <FadeIn delay={0.25}>
            <div className="flex justify-center mt-8">
              <a
                href="/Maker_Manifesto.pdf"
                download="Maker_Movement_Manifesto.pdf"
                className="inline-flex items-center gap-3 px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-200 group"
                style={{
                  background: 'rgba(220,38,38,0.12)',
                  border: '1.5px solid rgba(220,38,38,0.4)',
                  color: '#f87171',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(220,38,38,0.22)';
                  (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(220,38,38,0.7)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(220,38,38,0.12)';
                  (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(220,38,38,0.4)';
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Baixar Manifesto Maker (PDF)
                <span className="text-xs opacity-60">Mark Hatch</span>
              </a>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── Divider: manifesto → global ── */}
      <div style={{ height: 1 }} />

      {/* REDE GLOBAL — globo centralizado, sem cards */}
      <section id="global" className="relative px-6 md:px-16 overflow-hidden" style={{
        background: 'linear-gradient(to bottom, #141b27 0%, #111827 60%, #0d1117 100%)',
        paddingTop: 96, paddingBottom: 96,
      }}>
        {/* Section edge vignette — fades into adjacent sections */}
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 2 }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '160px', background: 'linear-gradient(to bottom, #141b27 0%, transparent 100%)' }} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '160px', background: 'linear-gradient(to top, #0d1117 0%, transparent 100%)' }} />
          <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '120px', background: 'linear-gradient(to right, #111827 0%, transparent 100%)' }} />
          <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: '120px', background: 'linear-gradient(to left, #111827 0%, transparent 100%)' }} />
        </div>
        <div className="max-w-6xl mx-auto relative" style={{ zIndex: 3 }}>
          <FadeIn className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="w-8 h-0.5" style={{ background: GREEN }} />
              <span className="text-xs font-bold tracking-widest uppercase text-green-400">Rede Fab Foundation</span>
              <div className="w-8 h-0.5" style={{ background: GREEN }} />
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Fab Labs pelo <span style={{ color: GREEN }}>Mundo</span>
            </h2>
            <p className="text-white/50 max-w-lg mx-auto text-sm leading-relaxed">
              A rede global conecta mais de 2.000 laboratórios em todos os continentes. Passe o mouse nos pontos para explorar.
            </p>
          </FadeIn>

          {/* Globo centralizado + stats abaixo */}
          <FadeIn delay={0.15} className="flex flex-col items-center">
            <CesiumGlobeSection />
          </FadeIn>
        </div>
      </section>

      {/* ── Divider: global → stacked ── */}
      <div style={{ height: 1 }} />

      {/* STACKED CARDS SCROLL */}
      <StackedCardsSection BLUE={BLUE} />

      {/* ── Divider: stacked → recursos ── */}
      <div style={{ height: 1 }} />

      {/* RECURSOS — PUZZLE */}
      <section id="recursos" className="px-6 md:px-16" style={{
        background: 'linear-gradient(to bottom, #08090c 0%, #08090c 80%, #0d1117 100%)',
        paddingTop: 96, paddingBottom: 96,
      }}>
        <div className="max-w-6xl mx-auto">
          <FadeIn className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="w-8 h-0.5" style={{ background: BLUE }} />
              <span className="text-xs font-bold tracking-widest uppercase text-blue-400">Plataforma</span>
              <div className="w-8 h-0.5" style={{ background: BLUE }} />
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Tudo que seu Fab Lab<br /><span style={{ color: BLUE }}>precisa</span>
            </h2>
            <p className="text-white/50 max-w-md mx-auto text-sm">Clique nas peças para explorar cada funcionalidade. Tudo está conectado — como um quebra-cabeça.</p>
          </FadeIn>
          <FadeIn delay={0.1}>
            <PuzzleFeatures />
          </FadeIn>
        </div>
      </section>

      {/* ── Divider: recursos → CTA ── */}
      <div style={{ height: 1 }} />

      {/* CTA */}
      <section className="py-24 px-6 md:px-16" style={{
        background: 'linear-gradient(to bottom, #0d1117 0%, #0d1117 60%, #08090c 100%)',
      }}>
        <div className="max-w-3xl mx-auto text-center">
          <div className="flex gap-1.5 justify-center mb-8">{[BLUE, GREEN, RED].map(c => <div key={c} className="h-1 w-16 rounded-full" style={{ background: c }} />)}</div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Pronto para <span style={{ color: BLUE }}>criar</span>?</h2>
          <p className="text-white/50 mb-8 text-lg">Acesse a plataforma FabLab, gerencie seu laboratório e conecte-se à cultura maker.</p>
          <div className="flex gap-3 justify-center flex-wrap">
            <button onClick={goToApp} className="px-8 py-4 rounded-xl font-bold text-white text-base transition-all hover:scale-105 shadow-lg" style={{ background: BLUE, boxShadow: '0 8px 32px rgba(29,78,216,0.4)' }}>
              {isAuthenticated ? 'Acessar plataforma' : 'Entrar na plataforma'}
            </button>
            {!isAuthenticated && (
              <button onClick={() => navigate('/register')} className="px-8 py-4 rounded-xl font-semibold text-white/80 text-base transition-all hover:bg-white/10" style={{ border: '1px solid rgba(255,255,255,0.15)' }}>Criar conta</button>
            )}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-8 px-6 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)', background: '#08090c' }}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <FabLabLogo size={20} />
            <span className="text-white/30 text-xs">FabLab Platform · Open Source · MIT License</span>
          </div>
          <div className="flex gap-3">{[BLUE, GREEN, RED].map(c => <div key={c} className="w-2 h-2 rounded-full" style={{ background: c }} />)}</div>
          <p className="text-white/25 text-xs">
            Baseado na Fab Charter do MIT ·{' '}
            <a href="https://fab.cba.mit.edu" target="_blank" rel="noopener noreferrer" className="hover:text-white/50 transition-colors">fab.cba.mit.edu</a>
          </p>
        </div>
      </footer>
    </div>
  );
}