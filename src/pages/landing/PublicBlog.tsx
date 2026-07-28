/**
 * PublicBlog.tsx — Página pública de Blog da Landing Page
 * Exibe os posts publicados (published = true) do dashboard FabBlog
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Calendar, User, Search } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useTranslation } from 'react-i18next';

const BLUE = '#1D4ED8';

interface BlogPost {
  id: string;
  title: string;
  content: string;
  cover_url: string;
  tags: string[];
  author: string;
  author_role: string;
  published: boolean;
  created_at: string;
}

function renderMarkdown(md: string): string {
  if (!md) return '';
  let html = md
    .replace(/^#{3}\s+(.+)$/gm, '<h3 class="text-lg font-bold mt-6 mb-2">$1</h3>')
    .replace(/^#{2}\s+(.+)$/gm, '<h2 class="text-xl font-extrabold mt-8 mb-3">$1</h2>')
    .replace(/^#{1}\s+(.+)$/gm, '<h1 class="text-2xl font-black mt-8 mb-4">$1</h1>')
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`([^`\n]+)`/g, '<code class="bg-white/10 px-1.5 py-0.5 rounded text-sm font-mono text-blue-300">$1</code>')
    .replace(/^>\s+(.+)$/gm, '<blockquote class="border-l-4 border-blue-500 pl-4 italic text-white/60 my-4 py-1">$1</blockquote>')
    .replace(/^[-*]\s+(.+)$/gm, '<li class="ml-6 list-disc my-0.5">$1</li>')
    .replace(/((?:<li class="ml-6 list-disc[^>]*>.*?<\/li>\n?)+)/g, '<ul class="my-4 space-y-1">$1</ul>')
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<figure class="my-6"><img src="$2" alt="$1" class="w-full rounded-xl max-h-96 object-cover" /></figure>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-400 underline underline-offset-2 hover:opacity-80">$1</a>')
    .replace(/^(?!<[houbl]|<p|<hr|<fig|<pre|<blockquote)(.+)$/gm, '<p class="my-3 leading-relaxed">$1</p>')
    .replace(/\n{3,}/g, '\n\n');
  return html;
}

function FabLabLogo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="8" fill={BLUE} />
      <polygon points="16,5 27,11 27,21 16,27 5,21 5,11" fill="none" stroke="white" strokeWidth="1.8" />
      <circle cx="16" cy="16" r="4" fill="white" />
      <line x1="16" y1="9" x2="16" y2="12" stroke="white" strokeWidth="1.5" />
      <line x1="16" y1="20" x2="16" y2="23" stroke="white" strokeWidth="1.5" />
      <line x1="10" y1="12.5" x2="12.6" y2="14" stroke="white" strokeWidth="1.5" />
      <line x1="19.4" y1="18" x2="22" y2="19.5" stroke="white" strokeWidth="1.5" />
      <line x1="22" y1="12.5" x2="19.4" y2="14" stroke="white" strokeWidth="1.5" />
      <line x1="12.6" y1="18" x2="10" y2="19.5" stroke="white" strokeWidth="1.5" />
    </svg>
  );
}

function PostCard({ post, onClick }: { post: BlogPost; onClick: () => void }) {
  const { t, i18n } = useTranslation();
  const LOCALE_MAP: Record<string, string> = { pt: 'pt-BR', en: 'en-US', es: 'es-ES', fr: 'fr-FR' };
  const date = new Date(post.created_at).toLocaleDateString(LOCALE_MAP[i18n.language] || 'pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  const preview = post.content.replace(/[#*`>[\]]/g, '').slice(0, 160) + '...';

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.4 }}
      onClick={onClick}
      className="cursor-pointer group"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 16,
        overflow: 'hidden',
        transition: 'border-color 0.3s, box-shadow 0.3s',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(29,78,216,0.5)';
        (e.currentTarget as HTMLElement).style.boxShadow = '0 0 40px rgba(29,78,216,0.15)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)';
        (e.currentTarget as HTMLElement).style.boxShadow = 'none';
      }}
    >
      {post.cover_url && (
        <div style={{ height: 200, overflow: 'hidden' }}>
          <img
            src={post.cover_url}
            alt={post.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s' }}
            className="group-hover:scale-105"
          />
        </div>
      )}
      <div style={{ padding: '24px' }}>
        {post.tags?.length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
            {post.tags.slice(0, 3).map(tag => (
              <span key={tag} style={{
                fontSize: 11, fontWeight: 600, padding: '3px 10px',
                borderRadius: 100, background: 'rgba(29,78,216,0.2)',
                color: '#93C5FD', border: '1px solid rgba(29,78,216,0.3)',
                textTransform: 'uppercase', letterSpacing: '0.08em',
              }}>{tag}</span>
            ))}
          </div>
        )}
        <h2 style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 10, lineHeight: 1.35 }}
          className="group-hover:text-blue-300 transition-colors">
          {post.title}
        </h2>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6, marginBottom: 16 }}>{preview}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <User size={12} /> {post.author || t('publicBlog.fablabTeam')}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <Calendar size={12} /> {date}
          </span>
        </div>
      </div>
    </motion.article>
  );
}

function PostModal({ post, onClose }: { post: BlogPost; onClose: () => void }) {
  const { t, i18n } = useTranslation();
  const LOCALE_MAP: Record<string, string> = { pt: 'pt-BR', en: 'en-US', es: 'es-ES', fr: 'fr-FR' };
  const date = new Date(post.created_at).toLocaleDateString(LOCALE_MAP[i18n.language] || 'pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '20px', overflowY: 'auto', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.96 }}
        transition={{ type: 'spring', damping: 24, stiffness: 300 }}
        style={{
          width: '100%', maxWidth: 760, marginTop: 20, marginBottom: 40,
          background: '#0e1117', borderRadius: 20,
          border: '1px solid rgba(255,255,255,0.1)',
          overflow: 'hidden',
        }}
      >
        {post.cover_url && (
          <div style={{ height: 320, overflow: 'hidden', position: 'relative' }}>
            <img src={post.cover_url} alt={post.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #0e1117 0%, transparent 60%)' }} />
          </div>
        )}
        <div style={{ padding: '36px 40px' }}>
          <button onClick={onClose} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 24, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            className="hover:text-white transition-colors">
            <ArrowLeft size={14} /> {t('publicBlog.backToBlog')}
          </button>

          {post.tags?.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
              {post.tags.map(tag => (
                <span key={tag} style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 100, background: 'rgba(29,78,216,0.2)', color: '#93C5FD', border: '1px solid rgba(29,78,216,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{tag}</span>
              ))}
            </div>
          )}

          <h1 style={{ fontSize: 28, fontWeight: 900, color: '#fff', marginBottom: 16, lineHeight: 1.25 }}>{post.title}</h1>

          <div style={{ display: 'flex', alignItems: 'center', gap: 20, fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 32, paddingBottom: 24, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <User size={13} />
              <span style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>{post.author || t('publicBlog.fablabTeam')}</span>
              {post.author_role && <span style={{ color: 'rgba(255,255,255,0.3)' }}>· {post.author_role}</span>}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Calendar size={13} /> {date}
            </span>
          </div>

          <div
            style={{ color: 'rgba(255,255,255,0.8)', lineHeight: 1.75, fontSize: 15 }}
            dangerouslySetInnerHTML={{ __html: renderMarkdown(post.content) }}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}

export function PublicBlog() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);

  useEffect(() => {
    supabase
      .from('blog_posts')
      .select('*')
      .eq('published', true)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setPosts(data || []);
        setLoading(false);
      });
  }, []);

  const allTags = Array.from(new Set(posts.flatMap(p => p.tags || [])));

  const filtered = posts.filter(p => {
    const matchSearch = !search || p.title.toLowerCase().includes(search.toLowerCase()) || p.content.toLowerCase().includes(search.toLowerCase());
    const matchTag = !selectedTag || p.tags?.includes(selectedTag);
    return matchSearch && matchTag;
  });

  return (
    <div style={{ minHeight: '100vh', background: '#08090c', color: '#fff', fontFamily: "'Space Grotesk', system-ui, sans-serif" }}>
      {/* Navbar */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px', height: 64,
        background: 'rgba(8,9,12,0.92)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => navigate('/landing')}>
          <FabLabLogo size={28} />
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
            <span style={{ fontSize: 15, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>
              fab<span style={{ color: BLUE }}>lab</span>
            </span>
            <span style={{ fontSize: 8, fontWeight: 600, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.25em', textTransform: 'uppercase' }}>platform</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
          <button onClick={() => navigate('/landing')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: 500, cursor: 'pointer' }} className="hover:text-white transition-colors">{t('publicBlog.home')}</button>
          <button onClick={() => navigate('/landing/blog')} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>{t('sidebar.blog')}</button>
          <button onClick={() => navigate('/landing/unidades')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: 500, cursor: 'pointer' }} className="hover:text-white transition-colors">{t('publicBlog.units')}</button>
        </div>
        <button onClick={() => navigate('/login')} style={{ background: BLUE, color: '#fff', border: 'none', borderRadius: 10, padding: '8px 18px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
          {t('app.login')}
        </button>
      </nav>

      {/* Hero */}
      <div style={{ paddingTop: 120, paddingBottom: 60, textAlign: 'center', padding: '120px 24px 60px' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 700,
            padding: '6px 16px', borderRadius: 100, marginBottom: 20,
            background: 'rgba(29,78,216,0.15)', border: '1px solid rgba(29,78,216,0.3)', color: '#93C5FD',
            textTransform: 'uppercase', letterSpacing: '0.1em',
          }}>{t('publicBlog.communityBlog')}</span>
          <h1 style={{ fontSize: 'clamp(32px, 6vw, 56px)', fontWeight: 900, color: '#fff', marginBottom: 16, lineHeight: 1.1 }}>
            {t('publicBlog.heroLine1')}<br />
            <span style={{ color: BLUE }}>{t('publicBlog.heroLine2')}</span>
          </h1>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)', maxWidth: 480, margin: '0 auto 36px' }}>
            {t('publicBlog.heroDesc')}
          </p>

          {/* Search */}
          <div style={{ maxWidth: 480, margin: '0 auto', position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t('publicBlog.searchPosts')}
              style={{
                width: '100%', padding: '12px 16px 12px 44px', borderRadius: 12,
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box',
                fontFamily: 'inherit',
              }}
            />
          </div>

          {/* Tags filter */}
          {allTags.length > 0 && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginTop: 20 }}>
              <button
                onClick={() => setSelectedTag('')}
                style={{
                  padding: '5px 14px', borderRadius: 100, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  background: !selectedTag ? BLUE : 'rgba(255,255,255,0.06)',
                  color: !selectedTag ? '#fff' : 'rgba(255,255,255,0.5)',
                  border: 'none',
                }}
              >{t('app.all')}</button>
              {allTags.map(tag => (
                <button key={tag} onClick={() => setSelectedTag(tag === selectedTag ? '' : tag)}
                  style={{
                    padding: '5px 14px', borderRadius: 100, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    background: selectedTag === tag ? BLUE : 'rgba(255,255,255,0.06)',
                    color: selectedTag === tag ? '#fff' : 'rgba(255,255,255,0.5)',
                    border: 'none',
                  }}>{tag}</button>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Posts grid */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px 80px' }}>
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ height: 320, borderRadius: 16, background: 'rgba(255,255,255,0.04)', animation: 'pulse 1.5s infinite' }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'rgba(255,255,255,0.3)' }}>
            <p style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>{t('publicBlog.noPostsFound')}</p>
            <p style={{ fontSize: 14 }}>{t('publicBlog.tryAnotherSearch')}</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
            {filtered.map((post, i) => (
              <motion.div key={post.id} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                <PostCard post={post} onClick={() => setSelectedPost(post)} />
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Post modal */}
      <AnimatePresence>
        {selectedPost && <PostModal post={selectedPost} onClose={() => setSelectedPost(null)} />}
      </AnimatePresence>
    </div>
  );
}
