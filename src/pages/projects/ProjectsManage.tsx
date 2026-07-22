/**
 * ProjectsManage.tsx — FabLab Platform · Módulo Projetos
 * Gerenciamento de múltiplos projetos (Altas Habilidades, Maker, etc.)
 * Cada projeto tem: alunos, quizzes, propostas e acompanhamento.
 *
 * Diferente do módulo anterior (Gifted isolado), aqui qualquer tipo
 * de projeto pode ser criado e gerenciado no mesmo padrão.
 */
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Search, Edit2, Trash2, MoreVertical, FolderKanban,
  Users, HelpCircle, ChevronRight, Archive, CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageTransition } from '@/components/layout/PageTransition';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';
import { PROJECT_TYPES } from '@/lib/constants';
import type { Project } from '@/types';

// ── Status labels com cores (rótulos são traduzidos no componente) ──
const STATUS_STYLE = {
  ativo:     { color: '#059669', bg: 'rgba(5,150,105,0.12)' },
  concluido: { color: '#1D4ED8', bg: 'rgba(29,78,216,0.12)' },
  arquivado: { color: '#6B7280', bg: 'rgba(107,114,128,0.12)' },
};

const EMPTY = {
  title: '', description: '', type: 'Altas Habilidades', class_name: '',
  tags: '', status: 'ativo' as const, link: '',
};

export function ProjectsManage() {
  const { t } = useTranslation();
  const STATUS_CONFIG = {
    ativo:     { ...STATUS_STYLE.ativo,     label: t('projectsManage.status.ativo') },
    concluido: { ...STATUS_STYLE.concluido, label: t('projectsManage.status.concluido') },
    arquivado: { ...STATUS_STYLE.arquivado, label: t('projectsManage.status.arquivado') },
  };
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [projects, setProjects]   = useState<Project[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [modal, setModal]         = useState(false);
  const [editItem, setEditItem]   = useState<Project | null>(null);
  const [deleteItem, setDeleteItem] = useState<Project | null>(null);
  const [form, setForm]           = useState(EMPTY);
  const [saving, setSaving]       = useState(false);

  const isAdmin = user?.role === 'admin';
  const canManage = user?.role !== 'funcionario';

  useEffect(() => { fetchProjects(); }, []);

  /** Busca projetos do banco com contagem de alunos e quizzes */
  const fetchProjects = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setProjects(data as Project[]);
    setLoading(false);
  };

  const openAdd = () => { setEditItem(null); setForm(EMPTY); setModal(true); };
  const openEdit = (p: Project) => {
    setEditItem(p);
    setForm({ title: p.title, description: p.description, type: p.type, class_name: p.class_name, tags: p.tags.join(', '), status: (p.status || 'ativo') as any, link: p.link || '' });
    setModal(true);
  };

  const handleSave = async () => {
    if (!form.title) return;
    setSaving(true);
    const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean);
    const payload = { title: form.title, description: form.description, type: form.type, class_name: form.class_name, tags, status: form.status, link: form.link, author: user?.name || '', author_id: user?.id };

    if (editItem) {
      await supabase.from('projects').update(payload).eq('id', editItem.id);
      setProjects(p => p.map(proj => proj.id === editItem.id ? { ...proj, ...payload } : proj));
    } else {
      const { data } = await supabase.from('projects').insert(payload).select().single();
      if (data) setProjects(p => [data as Project, ...p]);
    }
    setSaving(false);
    setModal(false);
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    await supabase.from('projects').delete().eq('id', deleteItem.id);
    setProjects(p => p.filter(proj => proj.id !== deleteItem.id));
    setDeleteItem(null);
  };

  // ── Tipos únicos para filtro ──────────────────────────────
  const types = ['all', ...Array.from(new Set(projects.map(p => p.type)))];

  const filtered = projects.filter(p => {
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'all' || p.type === typeFilter;
    return matchSearch && matchType;
  });

  return (
    <PageTransition>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <FolderKanban size={24} style={{ color: '#059669' }} />
              {t('projectsManage.title')}
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              {t('projectsManage.subtitle')}
            </p>
          </div>
          {canManage && (
            <Button onClick={openAdd} style={{ background: '#059669' }} className="text-white gap-2">
              <Plus size={16} /> {t('projectsManage.newProject')}
            </Button>
          )}
        </div>

        {/* Filtros */}
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('projectsManage.searchProjects')} className="pl-9" />
          </div>
          {/* Filtro de tipo - "Organizadores" */}
          <div className="flex gap-2 flex-wrap">
            {types.map(tp => (
              <button
                key={tp}
                onClick={() => setTypeFilter(tp)}
                className="px-3 py-1.5 rounded-full text-xs font-semibold border transition-all"
                style={typeFilter === tp
                  ? { background: '#059669', color: '#fff', borderColor: '#059669' }
                  : { borderColor: 'var(--border)', color: 'var(--text-secondary)' }
                }
              >
                {tp === 'all' ? t('projectsManage.allTypes') : tp}
              </button>
            ))}
          </div>
        </div>

        {/* Grid de projetos */}
        {loading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground gap-2">
            <div className="w-5 h-5 border-2 border-border border-t-green-500 rounded-full animate-spin" />
            {t('projectsManage.loadingProjects')}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <FolderKanban size={48} className="mx-auto mb-3 opacity-20" />
            <p className="font-medium">{t('projectsManage.noProjectsFound')}</p>
            <p className="text-sm mt-1">{t('projectsManage.createToStart')}</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(p => {
              const status = STATUS_CONFIG[p.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.ativo;
              return (
                <div key={p.id} className="bg-card border border-border rounded-xl p-5 flex flex-col gap-3 hover:shadow-md transition-shadow group">
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{p.type}</span>
                      <h3 className="font-bold text-foreground text-base leading-tight mt-0.5 truncate">{p.title}</h3>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ color: status.color, background: status.bg }}>
                        {status.label}
                      </span>
                      {canManage && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100">
                              <MoreVertical size={14} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEdit(p)}><Edit2 size={13} className="mr-2" /> {t('app.edit')}</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate(`/projects/students?project=${p.id}`)}><Users size={13} className="mr-2" /> {t('sidebar.students')}</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate(`/projects/quiz-creator?project=${p.id}`)}><HelpCircle size={13} className="mr-2" /> {t('projectsManage.quizzes')}</DropdownMenuItem>
                            {isAdmin && <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => setDeleteItem(p)} className="text-destructive"><Trash2 size={13} className="mr-2" /> {t('app.delete')}</DropdownMenuItem>
                            </>}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>

                  {/* Descrição */}
                  <p className="text-sm text-muted-foreground line-clamp-2">{p.description || t('projectsManage.noDescription')}</p>

                  {/* Tags */}
                  {p.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {p.tags.slice(0, 3).map(tag => (
                        <Badge key={tag} variant="secondary" className="text-[10px] px-1.5">{tag}</Badge>
                      ))}
                      {p.tags.length > 3 && <Badge variant="outline" className="text-[10px] px-1.5">+{p.tags.length - 3}</Badge>}
                    </div>
                  )}

                  {/* Footer */}
                  <div className="mt-auto pt-2 border-t border-border flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{p.class_name || t('projectsManage.noClass')}</span>
                    <button
                      onClick={() => navigate(`/projects/students?project=${p.id}`)}
                      className="flex items-center gap-1 text-xs font-semibold transition-colors hover:text-green-600"
                      style={{ color: '#059669' }}
                    >
                      {t('projectsManage.viewDetails')} <ChevronRight size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Modal criar/editar ───────────────────────────── */}
      <Dialog open={modal} onOpenChange={setModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editItem ? t('projectsManage.editProject') : t('projectsManage.newProject')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t('fabSuggestions.titleLabel')} *</Label>
              <Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder={t('projectsManage.projectNamePlaceholder')} />
            </div>
            <div>
              <Label>{t('app.description')}</Label>
              <textarea
                value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                placeholder={t('projectsManage.describeProject')}
                rows={3}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{t('app.type')}</Label>
                <Select value={form.type} onValueChange={v => setForm(p => ({ ...p, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PROJECT_TYPES.map(pt => <SelectItem key={pt} value={pt}>{pt}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v as any }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativo">{t('projectsManage.status.ativo')}</SelectItem>
                    <SelectItem value="concluido">{t('projectsManage.status.concluido')}</SelectItem>
                    <SelectItem value="arquivado">{t('projectsManage.status.arquivado')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>{t('projectsManage.classGroup')}</Label>
              <Input value={form.class_name} onChange={e => setForm(p => ({ ...p, class_name: e.target.value }))} placeholder={t('projectsManage.classPlaceholder')} />
            </div>
            <div>
              <Label>{t('projectsManage.tagsCommaSeparated')}</Label>
              <Input value={form.tags} onChange={e => setForm(p => ({ ...p, tags: e.target.value }))} placeholder={t('projectsManage.tagsExample')} />
            </div>
            <div>
              <Label>{t('projectsManage.externalLink')}</Label>
              <Input value={form.link} onChange={e => setForm(p => ({ ...p, link: e.target.value }))} placeholder="https://..." type="url" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setModal(false)}>{t('app.cancel')}</Button>
            <Button onClick={handleSave} disabled={!form.title || saving} style={{ background: '#059669' }} className="text-white">
              {saving ? t('fabSuggestions.saving') : editItem ? t('projectsManage.saveChanges') : t('projectsManage.createProject')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Modal excluir ────────────────────────────────── */}
      <Dialog open={!!deleteItem} onOpenChange={() => setDeleteItem(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t('projectsManage.deleteProjectTitle')}</DialogTitle></DialogHeader>
          <p className="text-muted-foreground text-sm">{t('projectsManage.deleteProjectDesc', { title: deleteItem?.title })}</p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteItem(null)}>{t('app.cancel')}</Button>
            <Button variant="destructive" onClick={handleDelete}>{t('app.delete')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
}
