import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Upload, File, Download, Trash2, Search, FolderOpen,
  AlertCircle, CheckCircle2, X, Plus, Eye, Edit3, Save,
  Calendar, User, ChevronLeft, Image, Tag, Link2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';
import { PageTransition } from '@/components/layout/PageTransition';

// ── Types ─────────────────────────────────────────────────────────────────
type FileCategory = 'stl' | 'gcode' | 'svg' | 'dxf' | '3mf' | 'glb' | 'image' | 'outro';

interface FilePost {
  id: string;
  title: string;
  description: string;          // markdown rico
  category: FileCategory;
  tags: string[];
  // arquivo principal
  file_name: string;
  file_url: string;
  storage_path: string;
  size_bytes: number;
  compressed: boolean;
  // galeria de imagens (URLs públicas — upload separado ou links externos)
  gallery: string[];
  // meta
  uploaded_by: string;
  author_role: string;
  published: boolean;
  created_at: string;
  updated_at: string;
  project_id?: string;
}

// ── Config ────────────────────────────────────────────────────────────────
const BUCKET = 'fablab-files';

const CAT_STYLE: Record<FileCategory, { color: string; exts: string[]; compressible: boolean }> = {
  stl:   { color: '#7c3aed', exts: ['.stl','.obj'],            compressible: false },
  '3mf': { color: '#6d28d9', exts: ['.3mf'],                   compressible: false },
  glb:   { color: '#4f46e5', exts: ['.glb','.gltf'],           compressible: false },
  gcode: { color: '#D42020', exts: ['.gcode','.nc','.cnc'],     compressible: true  },
  svg:   { color: '#059669', exts: ['.svg'],                    compressible: true  },
  dxf:   { color: '#d97706', exts: ['.dxf','.dwg'],             compressible: true  },
  image: { color: '#0ea5e9', exts: ['.png','.jpg','.jpeg','.webp','.gif'], compressible: false },
  outro: { color: '#6b7280', exts: ['*'],                       compressible: false },
};

function useCatConfig(): Record<FileCategory, { label: string; color: string; exts: string[]; compressible: boolean }> {
  const { t } = useTranslation();
  return {
    stl:   { ...CAT_STYLE.stl,   label: t('fabFiles.cat.stl') },
    '3mf': { ...CAT_STYLE['3mf'], label: t('fabFiles.cat.threemf') },
    glb:   { ...CAT_STYLE.glb,   label: t('fabFiles.cat.glb') },
    gcode: { ...CAT_STYLE.gcode, label: t('fabFiles.cat.gcode') },
    svg:   { ...CAT_STYLE.svg,   label: t('fabFiles.cat.svg') },
    dxf:   { ...CAT_STYLE.dxf,   label: t('fabFiles.cat.dxf') },
    image: { ...CAT_STYLE.image, label: t('fabFiles.cat.image') },
    outro: { ...CAT_STYLE.outro, label: t('fabFiles.cat.other') },
  };
}

const EXT_MAP: Record<string, FileCategory> = {
  stl:'stl', obj:'stl',
  '3mf':'3mf',
  glb:'glb', gltf:'glb',
  gcode:'gcode', nc:'gcode', cnc:'gcode',
  svg:'svg',
  dxf:'dxf', dwg:'dxf',
  png:'image', jpg:'image', jpeg:'image', webp:'image', gif:'image',
};

function getCategory(filename: string): FileCategory {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  return EXT_MAP[ext] || 'outro';
}

function formatBytes(b: number) {
  if (!b) return '—';
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

// ── Compression (browser-native gzip) ────────────────────────────────────
async function compressFile(file: File): Promise<Blob> {
  const stream = file.stream().pipeThrough(new CompressionStream('gzip'));
  const chunks: Uint8Array[] = [];
  const reader = stream.getReader();
  while (true) { const { done, value } = await reader.read(); if (done) break; chunks.push(value); }
  return new Blob(chunks, { type: 'application/gzip' });
}
async function decompressBlob(blob: Blob): Promise<Blob> {
  const stream = blob.stream().pipeThrough(new DecompressionStream('gzip'));
  const chunks: Uint8Array[] = [];
  const reader = stream.getReader();
  while (true) { const { done, value } = await reader.read(); if (done) break; chunks.push(value); }
  return new Blob(chunks);
}

// ── Markdown renderer (reusado do FabBlog) ───────────────────────────────
function renderMarkdown(md: string): string {
  if (!md) return '';
  return md
    .replace(/^#{3}\s+(.+)$/gm, '<h3 class="text-lg font-bold mt-6 mb-2">$1</h3>')
    .replace(/^#{2}\s+(.+)$/gm, '<h2 class="text-xl font-extrabold mt-8 mb-3">$1</h2>')
    .replace(/^#{1}\s+(.+)$/gm, '<h1 class="text-2xl font-black mt-8 mb-4">$1</h1>')
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`([^`\n]+)`/g, '<code class="bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-primary">$1</code>')
    .replace(/^>\s+(.+)$/gm, '<blockquote class="border-l-4 border-primary pl-4 italic text-muted-foreground my-4">$1</blockquote>')
    .replace(/^---$/gm, '<hr class="border-border my-6" />')
    .replace(/^[-*]\s+(.+)$/gm, '<li class="ml-6 list-disc my-0.5">$1</li>')
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<figure class="my-6"><img src="$2" alt="$1" class="w-full rounded-xl max-h-96 object-cover border border-border" /><figcaption class="text-center text-xs text-muted-foreground mt-2">$1</figcaption></figure>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-primary underline">$1</a>')
    .replace(/^(?!<[houbl]|<p|<hr|<fig|<pre|<blockquote)(.+)$/gm, '<p class="my-3 leading-relaxed">$1</p>');
}

// ── Markdown Editor (mini, sem deps) ─────────────────────────────────────
function MarkdownEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { t } = useTranslation();
  const [preview, setPreview] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);
  const ins = (b: string, a = '', ph = 'texto') => {
    const el = ref.current; if (!el) return;
    const s = el.selectionStart, e = el.selectionEnd;
    const sel = el.value.substring(s, e) || ph;
    onChange(el.value.substring(0, s) + b + sel + a + el.value.substring(e));
    setTimeout(() => { el.focus(); el.setSelectionRange(s + b.length, s + b.length + sel.length); }, 0);
  };
  const insImg = () => { const u = prompt('URL da imagem:'); if (u) ins(`\n![imagem](${u})\n`, '', ''); };

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-background">
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-border bg-muted/30 flex-wrap">
        {[['**','**','negrito'],['*','*','itálico']].map(([b,a,ph]) => (
          <button key={b} type="button" onClick={() => ins(b,a,ph)}
            className="px-2 py-1 rounded hover:bg-muted text-xs text-muted-foreground hover:text-foreground font-mono">{b.replace(/\*/g,'B').replace('**','N') || ph}</button>
        ))}
        <button type="button" onClick={() => ins('\n## ','',t('fabFiles.titleWord'))} className="px-2 py-1 rounded hover:bg-muted text-xs text-muted-foreground hover:text-foreground">H2</button>
        <button type="button" onClick={() => ins('\n- ','','item')} className="px-2 py-1 rounded hover:bg-muted text-xs text-muted-foreground hover:text-foreground">{t('fabFiles.list')}</button>
        <button type="button" onClick={insImg} className="px-2 py-1 rounded hover:bg-muted text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"><Image size={11}/>Img</button>
        <div className="flex-1"/>
        <button type="button" onClick={() => setPreview(!preview)}
          className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${preview ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
          <Eye size={11}/>{preview ? t('app.edit') : t('fabFiles.preview')}
        </button>
      </div>
      {preview
        ? <div className="min-h-[220px] max-h-[400px] overflow-y-auto p-4 text-sm prose dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(value) || `<p class="text-muted-foreground italic">${t('fabFiles.nothingWrittenYet')}</p>` }} />
        : <textarea ref={ref} value={value} onChange={e => onChange(e.target.value)}
            placeholder={t('fabFiles.descPlaceholder')}
            rows={8} className="w-full p-4 bg-transparent text-sm font-mono resize-y outline-none placeholder:text-muted-foreground/40 leading-relaxed" spellCheck={false} />
      }
    </div>
  );
}

// ── Gallery Image picker ──────────────────────────────────────────────────
function GalleryEditor({ images, onChange }: { images: string[]; onChange: (imgs: string[]) => void }) {
  const { t: tg } = useTranslation();
  const [url, setUrl] = useState('');
  const add = () => { if (url.trim()) { onChange([...images, url.trim()]); setUrl(''); } };
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input value={url} onChange={e => setUrl(e.target.value)} placeholder={tg('fabFiles.imageUrl')}
          className="h-9 text-sm flex-1" onKeyDown={e => e.key === 'Enter' && add()} />
        <Button size="sm" variant="outline" className="h-9" onClick={add}><Plus size={13}/></Button>
      </div>
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {images.map((img, i) => (
            <div key={i} className="relative group aspect-video rounded-lg overflow-hidden border border-border bg-muted">
              <img src={img} alt="" className="w-full h-full object-cover" />
              <button onClick={() => onChange(images.filter((_, j) => j !== i))}
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-destructive text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <X size={10}/>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Post Card ─────────────────────────────────────────────────────────────
function FileCard({ post, onClick, onEdit, onDelete, isAdmin }: {
  post: FilePost; onClick: () => void; onEdit: () => void; onDelete: () => void; isAdmin: boolean;
}) {
  const { t } = useTranslation();
  const CAT_CONFIG = useCatConfig();
  const cc = CAT_CONFIG[post.category];
  const cover = post.gallery[0];
  return (
    <article className="bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/40 transition-all duration-300 group flex flex-col cursor-pointer" onClick={onClick}>
      {/* Cover / placeholder */}
      <div className="h-44 overflow-hidden bg-gradient-to-br from-muted to-muted/30 flex-shrink-0 relative">
        {cover
          ? <img src={cover} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          : <div className="w-full h-full flex items-center justify-center" style={{ background: cc.color + '12' }}>
              <File size={36} style={{ color: cc.color + '60' }} />
            </div>
        }
        {/* Category pill */}
        <span className="absolute top-3 left-3 text-[10px] font-bold px-2 py-0.5 rounded-full"
          style={{ background: cc.color, color: '#fff' }}>{cc.label}</span>
        {!post.published && (
          <span className="absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-400 text-yellow-900">{t('fabFiles.draft')}</span>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1">
        <div className="flex gap-1 flex-wrap mb-2">
          {post.tags.slice(0,3).map(t => <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>)}
        </div>
        <h3 className="font-extrabold text-sm mb-1 line-clamp-2 group-hover:text-primary transition-colors leading-snug">{post.title}</h3>
        <p className="text-muted-foreground text-xs line-clamp-2 mb-3 flex-1 leading-relaxed">
          {post.description.replace(/[#*`>[\]!()\\=_~-]/g,'').replace(/\n+/g,' ').trim().substring(0,110)}…
        </p>
        <div className="flex items-center justify-between pt-3 border-t border-border/50">
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <User size={10}/><span className="truncate max-w-[70px]">{post.uploaded_by}</span>
            <span>·</span><span>{formatBytes(post.size_bytes)}</span>
          </div>
          <div className="flex items-center gap-0.5" onClick={e => e.stopPropagation()}>
            <Button variant="ghost" size="sm" className="h-7 text-xs px-2" onClick={onClick}>
              <Eye size={11} className="mr-1"/>{t('fabFiles.view')}
            </Button>
            {isAdmin && <>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onEdit}><Edit3 size={11}/></Button>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={onDelete}><Trash2 size={11}/></Button>
            </>}
          </div>
        </div>
      </div>
    </article>
  );
}

// ── Post Detail View ──────────────────────────────────────────────────────
function FileDetail({ post, onBack, onDownload, downloading }: {
  post: FilePost; onBack: () => void;
  onDownload: (p: FilePost) => void; downloading: boolean;
}) {
  const { t, i18n } = useTranslation();
  const LOCALE_MAP: Record<string, string> = { pt: 'pt-BR', en: 'en-US', es: 'es-ES', fr: 'fr-FR' };
  const dateLocale = LOCALE_MAP[i18n.language] || 'pt-BR';
  const CAT_CONFIG = useCatConfig();
  const cc = CAT_CONFIG[post.category];
  const [galleryIdx, setGalleryIdx] = useState(0);
  return (
    <PageTransition>
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors group">
        <ChevronLeft size={16} className="group-hover:-translate-x-0.5 transition-transform"/>{t('app.back')}
      </button>

      {/* Gallery */}
      {post.gallery.length > 0 && (
        <div className="mb-8 space-y-2">
          <div className="w-full h-64 md:h-96 rounded-2xl overflow-hidden border border-border bg-muted">
            <img src={post.gallery[galleryIdx]} alt={post.title} className="w-full h-full object-cover"/>
          </div>
          {post.gallery.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {post.gallery.map((img, i) => (
                <button key={i} onClick={() => setGalleryIdx(i)}
                  className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${i === galleryIdx ? 'border-primary' : 'border-border'}`}>
                  <img src={img} alt="" className="w-full h-full object-cover"/>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="max-w-3xl mx-auto">
        {/* Meta */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: cc.color, color: '#fff' }}>{cc.label}</span>
          {post.tags.map(t => <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>)}
        </div>
        <h1 className="text-3xl font-black mb-3 leading-tight">{post.title}</h1>
        <div className="flex items-center gap-3 text-sm text-muted-foreground mb-6 pb-6 border-b border-border flex-wrap">
          <User size={13}/><span className="font-medium">{post.uploaded_by}</span>
          <span>·</span>
          <Calendar size={13}/>
          <span>{new Date(post.created_at).toLocaleDateString(dateLocale,{day:'2-digit',month:'long',year:'numeric'})}</span>
          <span>·</span>
          <span>{formatBytes(post.size_bytes)}</span>
          {post.compressed && <Badge variant="outline" className="text-[10px]">{t('fabFiles.compressed')}</Badge>}
        </div>

        {/* Content */}
        <div className="text-sm leading-relaxed mb-8"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(post.description) }}/>

        {/* Download CTA */}
        <div className="bg-muted/50 border border-border rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-4">
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm truncate">{post.file_name.replace(/\.gz$/,'')}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {formatBytes(post.size_bytes)}{post.compressed ? ` · ${t('fabFiles.autoDecompressed')}` : ''}
            </p>
          </div>
          <Button onClick={() => onDownload(post)} disabled={downloading}
            className="flex-shrink-0 gap-2" style={{ background: 'var(--fab-primary)' }}>
            <Download size={15}/>
            {downloading ? t('fabFiles.downloading') : `${t('fabFiles.download')} ${cc.label}`}
          </Button>
        </div>
      </div>
    </PageTransition>
  );
}

// ── Upload progress states ────────────────────────────────────────────────
type UploadStep = 'idle'|'compressing'|'uploading'|'saving'|'done'|'error';

// ── Main Component ────────────────────────────────────────────────────────
export function FabFiles() {
  const { t, i18n } = useTranslation();
  const CAT_CONFIG = useCatConfig();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin' || user?.role === 'professor';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imgInputRef  = useRef<HTMLInputElement>(null);

  const [posts,    setPosts]    = useState<FilePost[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [catFilter,setCatFilter]= useState<FileCategory|'all'>('all');
  const [detail,   setDetail]   = useState<FilePost|null>(null);

  // editor
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing,    setEditing]    = useState<FilePost|null>(null);

  const emptyForm = (): Partial<FilePost> => ({
    title:'', description:'', category:'outro', tags:[], gallery:[],
    file_name:'', file_url:'', storage_path:'', size_bytes:0, compressed:false,
    uploaded_by: user?.name||'', author_role: user?.role||'', published:false, project_id:'',
  });
  const [form,      setForm]      = useState<Partial<FilePost>>(emptyForm());
  const [tagsInput, setTagsInput] = useState('');

  // file upload within editor
  const [selFile,     setSelFile]    = useState<File|null>(null);
  const [uploadStep,  setUploadStep] = useState<UploadStep>('idle');
  const [uploadError, setUploadError]= useState('');

  // download
  const [downloading, setDownloading] = useState<string|null>(null);

  // delete confirm
  const [deleteId, setDeleteId] = useState<string|null>(null);

  useEffect(() => { fetchPosts(); }, []);

  // ── Fetch ──
  const fetchPosts = async () => {
    setLoading(true);
    let q = supabase.from('fablab_files').select('*').order('created_at',{ascending:false});
    if (!isAdmin) q = q.eq('published', true);
    const { data, error } = await q;
    if (error) {
      // fallback localStorage
      setPosts(JSON.parse(localStorage.getItem('fablab_files_posts')||'[]'));
    } else {
      setPosts((data as FilePost[]) ?? []);
    }
    setLoading(false);
  };

  // ── Open editor ──
  const openEditor = (post?: FilePost) => {
    if (post) {
      setEditing(post);
      setForm({...post});
      setTagsInput(post.tags.join(', '));
    } else {
      setEditing(null);
      setForm(emptyForm());
      setTagsInput('');
    }
    setSelFile(null);
    setUploadStep('idle');
    setUploadError('');
    setEditorOpen(true);
  };
  const closeEditor = () => { setEditorOpen(false); setEditing(null); setForm(emptyForm()); setTagsInput(''); setSelFile(null); };

  // ── File select ──
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    setSelFile(f);
    const cat = getCategory(f.name);
    setForm(p => ({ ...p, category: cat, size_bytes: f.size, file_name: f.name }));
  };

  // ── Save / publish ──
  const handleSave = async (publish: boolean) => {
    if (!form.title?.trim()) return;
    setUploadStep('idle');
    let fileUrl  = form.file_url  || '';
    let storagePath = form.storage_path || '';
    let compressed  = form.compressed  || false;
    let fileName    = form.file_name   || '';
    let sizeBytes   = form.size_bytes  || 0;

    // upload new file if selected
    if (selFile) {
      const cat  = getCategory(selFile.name);
      const shouldGzip = CAT_CONFIG[cat].compressible;
      const unit = (user as any)?.unit || 'geral';
      const stoName = `${Date.now()}_${selFile.name}${shouldGzip?'.gz':''}`;
      storagePath = `${unit}/${stoName}`;
      fileName    = stoName;
      sizeBytes   = selFile.size;

      let blob: Blob = selFile;
      if (shouldGzip) { setUploadStep('compressing'); blob = await compressFile(selFile); }
      setUploadStep('uploading');
      const { error: upErr } = await supabase.storage.from(BUCKET)
        .upload(storagePath, blob, { contentType: shouldGzip?'application/gzip':selFile.type||'application/octet-stream', upsert:false });
      if (upErr) { setUploadError(upErr.message); setUploadStep('error'); return; }
      const { data: urlD } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
      fileUrl    = urlD?.publicUrl || '';
      compressed = shouldGzip;
    }

    setUploadStep('saving');
    const now  = new Date().toISOString();
    const tags = tagsInput.split(',').map(t=>t.trim()).filter(Boolean);

    const payload: Omit<FilePost,'id'> = {
      title:       form.title!.trim(),
      description: form.description||'',
      category:    (form.category as FileCategory)||'outro',
      tags,
      gallery:     (form.gallery as string[])||[],
      file_name:   fileName,
      file_url:    fileUrl,
      storage_path:storagePath,
      size_bytes:  sizeBytes,
      compressed,
      uploaded_by: user?.name||'',
      author_role: user?.role||'',
      published:   publish,
      created_at:  editing?.created_at||now,
      updated_at:  now,
      project_id:  form.project_id||undefined,
    };

    let saved: FilePost | null = null;
    if (editing) {
      const { data } = await supabase.from('fablab_files').update(payload).eq('id',editing.id).select().single();
      saved = data as FilePost;
    } else {
      const { data } = await supabase.from('fablab_files').insert(payload).select().single();
      saved = data as FilePost;
    }

    // localStorage fallback
    if (!saved) {
      const fb = { ...payload, id: editing?.id||crypto.randomUUID() } as FilePost;
      const prev: FilePost[] = JSON.parse(localStorage.getItem('fablab_files_posts')||'[]');
      const updated = editing ? prev.map(p=>p.id===editing.id?fb:p) : [fb,...prev];
      localStorage.setItem('fablab_files_posts', JSON.stringify(updated));
      saved = fb;
    }

    setUploadStep('done');
    setTimeout(() => { closeEditor(); fetchPosts(); }, 900);
  };

  // ── Download ──
  const handleDownload = async (post: FilePost) => {
    setDownloading(post.id);
    try {
      if (post.compressed) {
        const res   = await fetch(post.file_url);
        const gz    = await res.blob();
        const blob  = await decompressBlob(gz);
        const url   = URL.createObjectURL(blob);
        const a     = document.createElement('a');
        a.href      = url;
        a.download  = post.file_name.replace(/\.gz$/,'');
        a.click();
        URL.revokeObjectURL(url);
      } else {
        const a = document.createElement('a');
        a.href = post.file_url; a.download = post.file_name; a.click();
      }
    } catch { alert('Erro ao baixar o arquivo.'); }
    setDownloading(null);
  };

  // ── Delete ──
  const handleDelete = async (id: string) => {
    const post = posts.find(p=>p.id===id); if (!post) return;
    if (post.storage_path) await supabase.storage.from(BUCKET).remove([post.storage_path]);
    await supabase.from('fablab_files').delete().eq('id',id);
    const prev: FilePost[] = JSON.parse(localStorage.getItem('fablab_files_posts')||'[]');
    localStorage.setItem('fablab_files_posts', JSON.stringify(prev.filter(p=>p.id!==id)));
    setPosts(p=>p.filter(p=>p.id!==id));
    setDeleteId(null);
    if (detail?.id===id) setDetail(null);
  };

  // ── Filters ──
  const filtered = posts.filter(p => {
    const mCat = catFilter==='all' || p.category===catFilter;
    const mQ   = !search || p.title.toLowerCase().includes(search.toLowerCase())
      || p.description.toLowerCase().includes(search.toLowerCase())
      || p.tags.some(t=>t.toLowerCase().includes(search.toLowerCase()));
    return mCat && mQ;
  });

  // ── Detail view ──
  if (detail) return (
    <FileDetail post={detail} onBack={()=>setDetail(null)}
      onDownload={handleDownload} downloading={downloading===detail.id} />
  );

  // ── Upload step label ──
  const stepLabel: Record<UploadStep,string> = {
    idle:'', compressing: t('fabFiles.compressing'), uploading: t('fabFiles.uploadingFile'),
    saving: t('fabFiles.savingStep'), done: t('fabFiles.published'), error:'',
  };

  return (
    <PageTransition>
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-xl font-extrabold">{t('fabFiles.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('fabFiles.subtitle')}</p>
        </div>
        {isAdmin && (
          <Button size="sm" onClick={()=>openEditor()} style={{background:'var(--fab-primary)'}}>
            <Plus size={14} className="mr-1"/>{t('fabFiles.newFile')}
          </Button>
        )}
      </div>

      {/* Category pills */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <button onClick={()=>setCatFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${catFilter==='all'?'bg-foreground text-background border-foreground':'bg-card border-border text-muted-foreground hover:text-foreground'}`}>
          {t('app.all')} ({posts.length})
        </button>
        {(Object.entries(CAT_CONFIG) as [FileCategory,typeof CAT_CONFIG[FileCategory]][]).map(([key,cfg]) => {
          const count = posts.filter(p=>p.category===key).length;
          if (count===0 && catFilter!==key) return null;
          return (
            <button key={key} onClick={()=>setCatFilter(catFilter===key?'all':key)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors"
              style={catFilter===key
                ? {color:cfg.color,borderColor:cfg.color,background:cfg.color+'15'}
                : {background:'var(--card)',borderColor:'var(--border)',color:'var(--muted-foreground)'}}>
              {cfg.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"/>
        <Input value={search} onChange={e=>setSearch(e.target.value)}
          placeholder={t('fabFiles.searchPlaceholder')} className="pl-9 h-9 text-sm"/>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="text-center py-16 text-muted-foreground text-sm">{t('fabFiles.loadingFiles')}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <FolderOpen size={36} className="mx-auto mb-3 opacity-20"/>
          <p>{t('fabFiles.noFilesFound')}</p>
          {isAdmin && <p className="text-xs mt-1">{t('fabFiles.clickNewFileToStart')}</p>}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map(post => (
            <FileCard key={post.id} post={post}
              onClick={()=>setDetail(post)}
              onEdit={()=>openEditor(post)}
              onDelete={()=>setDeleteId(post.id)}
              isAdmin={isAdmin}/>
          ))}
        </div>
      )}

      {/* ══ Editor Dialog ══ */}
      <Dialog open={editorOpen} onOpenChange={o=>{if(!o&&uploadStep!=='uploading'&&uploadStep!=='compressing')closeEditor();}}>
        <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing?t('fabFiles.editFile'):t('fabFiles.publishFile')}</DialogTitle>
          </DialogHeader>

          <div className="space-y-5 mt-1">
            {/* Title */}
            <div className="space-y-1">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('fabSuggestions.titleLabel')} *</Label>
              <Input value={form.title||''} onChange={e=>setForm(p=>({...p,title:e.target.value}))}
                placeholder={t('fabFiles.titlePlaceholder')} className="h-10 font-semibold"/>
            </div>

            {/* File upload */}
            <div className="space-y-1">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {t('fabFiles.file')} {editing&&form.file_name?`(${t('fabFiles.leaveEmptyToKeep')})`:'*'}
              </Label>
              <input ref={fileInputRef} type="file"
                accept=".stl,.obj,.3mf,.glb,.gltf,.gcode,.nc,.cnc,.svg,.dxf,.dwg,.png,.jpg,.jpeg,.webp,.gif,.zip,.pdf"
                className="hidden" onChange={handleFileSelect}/>
              <div onClick={()=>fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors ${selFile?'border-primary bg-primary/5':'border-border hover:border-primary/40 hover:bg-muted/20'}`}>
                {selFile ? (
                  <div className="flex items-center gap-3">
                    <File size={18} className="text-primary flex-shrink-0"/>
                    <div className="text-left">
                      <p className="text-sm font-semibold">{selFile.name}</p>
                      <p className="text-xs text-muted-foreground">{formatBytes(selFile.size)}
                        {CAT_CONFIG[getCategory(selFile.name)].compressible && <span className="ml-2 text-green-600">· {t('fabFiles.willBeCompressed')}</span>}
                      </p>
                    </div>
                    <button onClick={e=>{e.stopPropagation();setSelFile(null);}} className="ml-auto text-muted-foreground hover:text-foreground"><X size={15}/></button>
                  </div>
                ) : editing&&form.file_name ? (
                  <p className="text-sm text-muted-foreground">{t('fabFiles.currentFile')}: <strong className="text-foreground">{form.file_name.replace(/\.gz$/,'')}</strong> — {t('fabFiles.clickToReplace')}</p>
                ) : (
                  <>
                    <Upload size={20} className="mx-auto mb-1 text-muted-foreground"/>
                    <p className="text-sm font-medium">{t('fabFiles.clickToSelect')}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">STL, 3MF, GLB, G-Code, SVG, DXF, {t('fabFiles.imagesAndMore')}</p>
                    <p className="text-xs text-green-600 mt-0.5">{t('fabFiles.autoCompressNote')}</p>
                  </>
                )}
              </div>
            </div>

            {/* Gallery */}
            <div className="space-y-1">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <Image size={11}/>{t('fabFiles.imageGallery')}
              </Label>
              <GalleryEditor
                images={(form.gallery as string[])||[]}
                onChange={imgs=>setForm(p=>({...p,gallery:imgs}))}/>
            </div>

            {/* Tags */}
            <div className="space-y-1">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <Tag size={11}/>{t('projectsManage.tagsCommaSeparated')}
              </Label>
              <Input value={tagsInput} onChange={e=>setTagsInput(e.target.value)}
                placeholder={t('fabFiles.tagsExample')} className="h-10"/>
            </div>

            {/* Description markdown */}
            <div className="space-y-1">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {t('fabFiles.descTutorialMd')}
              </Label>
              <MarkdownEditor value={form.description||''} onChange={v=>setForm(p=>({...p,description:v}))}/>
            </div>

            {/* Project ID */}
            <div className="space-y-1">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('fabFiles.projectIdOptional')}</Label>
              <Input value={form.project_id||''} onChange={e=>setForm(p=>({...p,project_id:e.target.value}))}
                placeholder={t('fabFiles.leaveEmptyForGeneral')} className="h-10"/>
            </div>

            {/* Progress */}
            {uploadStep!=='idle'&&uploadStep!=='error'&&(
              <div className={`rounded-lg px-3 py-2.5 flex items-center gap-2 text-sm ${uploadStep==='done'?'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400':'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'}`}>
                {uploadStep==='done'?<CheckCircle2 size={15}/>:<span className="animate-spin">⏳</span>}
                {stepLabel[uploadStep]}
              </div>
            )}
            {uploadError&&(
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-lg px-3 py-2.5 flex items-start gap-2 text-sm text-red-700 dark:text-red-400">
                <AlertCircle size={14} className="mt-0.5 flex-shrink-0"/>
                <div>
                  <p className="font-semibold">{t('fabFiles.errorWord')}</p>
                  <p className="text-xs mt-0.5">{uploadError}</p>
                  <p className="text-xs mt-1 opacity-70">{t('fabFiles.checkBucket')} <code>fablab-files</code> {t('fabFiles.existsInSupabase')}.</p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="pt-4 border-t border-border mt-2">
            <Button variant="outline" size="sm" onClick={closeEditor} disabled={uploadStep==='uploading'||uploadStep==='compressing'}>
              <X size={13} className="mr-1"/>{t('app.cancel')}
            </Button>
            <Button variant="outline" size="sm" disabled={!form.title?.trim()||uploadStep==='uploading'||uploadStep==='compressing'}
              onClick={()=>handleSave(false)}>
              <Save size={13} className="mr-1"/>{t('fabFiles.saveDraft')}
            </Button>
            <Button size="sm" disabled={!form.title?.trim()||uploadStep==='uploading'||uploadStep==='compressing'}
              onClick={()=>handleSave(true)} style={{background:'var(--fab-primary)'}}>
              {uploadStep==='uploading'||uploadStep==='compressing'
                ? <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                : <><Save size={13} className="mr-1"/>{t('app.publish')}</>
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══ Delete confirm ══ */}
      <Dialog open={!!deleteId} onOpenChange={o=>{if(!o)setDeleteId(null);}}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{t('fabFiles.deleteFileTitle')}</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground py-2">{t('fabFiles.deleteFileDesc')}</p>
          <DialogFooter>
            <Button variant="outline" onClick={()=>setDeleteId(null)}>{t('app.cancel')}</Button>
            <Button variant="destructive" onClick={()=>deleteId&&handleDelete(deleteId)}>{t('app.delete')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
}
