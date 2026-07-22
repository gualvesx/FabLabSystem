/**
 * FabSuggestions.tsx — FabLab Platform
 * Módulo de sugestões com dois canais:
 *   - "Para o Site": melhorias e ideias para esta plataforma
 *   - "Para FabLabs": ideias de projetos, equipamentos e iniciativas para FabLabs
 *
 * Filtragem por categoria (organizadores) com botões clicáveis.
 * Votação, criação e moderação por admin.
 */
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, ArrowUp, Check, Edit2, Trash2, MoreVertical, Monitor, FlaskConical, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuthStore } from '@/stores/authStore';
import { PageTransition } from '@/components/layout/PageTransition';
import { supabase } from '@/lib/supabase';
import type { Suggestion } from '@/types';

// ── Categorias organizadoras (valores canônicos usados no banco de dados) ──
const CATEGORIES = ['Todos', 'Interface', 'Funcionalidade', 'Equipamento', 'Educação', 'Comunidade', 'Outro'];

const TYPE_STYLE = {
  site:   { color: '#1D4ED8', bg: 'rgba(29,78,216,0.1)',  icon: <Monitor size={14} /> },
  fablab: { color: '#059669', bg: 'rgba(5,150,105,0.1)', icon: <FlaskConical size={14} /> },
  geral:  { color: '#6B7280', bg: 'rgba(107,114,128,0.1)', icon: <Filter size={14} /> },
};

const EMPTY = { title: '', desc: '', tags: '', suggestion_type: 'geral' as const, category: 'Outro' };

export function FabSuggestions() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const TYPE_CONFIG = {
    site:   { ...TYPE_STYLE.site,   label: t('fabSuggestions.type.site') },
    fablab: { ...TYPE_STYLE.fablab, label: t('fabSuggestions.type.fablab') },
    geral:  { ...TYPE_STYLE.geral,  label: t('fabSuggestions.type.geral') },
  } as const;
  const CATEGORY_LABELS: Record<string, string> = {
    Todos: t('app.all'),
    Interface: t('fabSuggestions.category.interface'),
    Funcionalidade: t('fabSuggestions.category.feature'),
    Equipamento: t('fabSuggestions.category.equipment'),
    'Educação': t('fabSuggestions.category.education'),
    Comunidade: t('fabSuggestions.category.community'),
    Outro: t('fabSuggestions.category.other'),
  };
  const [items, setItems]           = useState<Suggestion[]>([]);
  const [loading, setLoading]       = useState(true);
  const [modal, setModal]           = useState(false);
  const [editItem, setEditItem]     = useState<Suggestion | null>(null);
  const [deleteItem, setDeleteItem] = useState<Suggestion | null>(null);
  const [form, setForm]             = useState(EMPTY);
  const [saving, setSaving]         = useState(false);

  // Filtros ativos
  const [activeType, setActiveType]     = useState<'all' | 'site' | 'fablab' | 'geral'>('all');
  const [activeCategory, setActiveCategory] = useState('Todos');

  const isAdmin  = user?.role === 'admin';
  const canAdd   = user?.role !== 'funcionario';

  useEffect(() => { fetchItems(); }, []);

  const fetchItems = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('suggestions')
      .select('*')
      .order('votes', { ascending: false });
    if (data) setItems(data as Suggestion[]);
    setLoading(false);
  };

  const openAdd  = () => { setEditItem(null); setForm(EMPTY); setModal(true); };
  const openEdit = (item: Suggestion) => {
    setEditItem(item);
    setForm({
      title: item.title, desc: item.description,
      tags: item.tags.join(', '),
      suggestion_type: (item.suggestion_type || 'geral') as any,
      category: item.category || 'Outro',
    });
    setModal(true);
  };

  const handleSave = async () => {
    if (!form.title) return;
    setSaving(true);
    const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean);
    const payload = {
      title: form.title, description: form.desc, tags,
      suggestion_type: form.suggestion_type,
      category: form.category,
      author: user?.name || '',
      votes: editItem?.votes ?? 0,
      status: editItem?.status ?? 'open',
    };
    if (editItem) {
      await supabase.from('suggestions').update(payload).eq('id', editItem.id);
      setItems(p => p.map(i => i.id === editItem.id ? { ...i, ...payload } : i));
    } else {
      const { data } = await supabase.from('suggestions').insert(payload).select().single();
      if (data) setItems(p => [data as Suggestion, ...p]);
    }
    setSaving(false);
    setModal(false);
  };

  const handleVote = async (item: Suggestion) => {
    const newVotes = item.votes + 1;
    await supabase.from('suggestions').update({ votes: newVotes }).eq('id', item.id);
    setItems(p => p.map(i => i.id === item.id ? { ...i, votes: newVotes } : i));
  };

  const handleApprove = async (item: Suggestion) => {
    const newStatus = item.status === 'approved' ? 'open' : 'approved';
    await supabase.from('suggestions').update({ status: newStatus }).eq('id', item.id);
    setItems(p => p.map(i => i.id === item.id ? { ...i, status: newStatus } : i));
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    await supabase.from('suggestions').delete().eq('id', deleteItem.id);
    setItems(p => p.filter(i => i.id !== deleteItem.id));
    setDeleteItem(null);
  };

  // Filtragem composta
  const filtered = items.filter(i => {
    const matchType = activeType === 'all' || i.suggestion_type === activeType || (!i.suggestion_type && activeType === 'geral');
    const matchCat  = activeCategory === 'Todos' || i.category === activeCategory || (!i.category && activeCategory === 'Outro');
    return matchType && matchCat;
  });

  return (
    <PageTransition>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t('sidebar.suggestions')}</h1>
            <p className="text-muted-foreground text-sm mt-0.5">{t('fabSuggestions.subtitle')}</p>
          </div>
          {canAdd && (
            <Button onClick={openAdd} style={{ background: '#1D4ED8' }} className="text-white gap-2">
              <Plus size={16} /> {t('fabSuggestions.newSuggestion')}
            </Button>
          )}
        </div>

        {/* ── Filtros de tipo ── */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setActiveType('all')}
            className="px-4 py-2 rounded-full text-sm font-semibold border transition-all"
            style={activeType === 'all'
              ? { background: '#1D4ED8', color: '#fff', borderColor: '#1D4ED8' }
              : { borderColor: 'var(--border)', color: 'var(--text-secondary)' }
            }
          >
            {t('app.all')}
          </button>
          {(Object.keys(TYPE_CONFIG) as (keyof typeof TYPE_CONFIG)[]).map(type => {
            const cfg = TYPE_CONFIG[type];
            return (
              <button
                key={type}
                onClick={() => setActiveType(type as any)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold border transition-all"
                style={activeType === type
                  ? { background: cfg.color, color: '#fff', borderColor: cfg.color }
                  : { borderColor: 'var(--border)', color: 'var(--text-secondary)' }
                }
              >
                {cfg.icon} {cfg.label}
              </button>
            );
          })}
        </div>

        {/* ── Filtros de categoria (Organizadores) ── */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-2">
            <Filter size={12} /> {t('fabSuggestions.organizers')}
          </p>
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className="px-3 py-1 rounded-full text-xs font-medium border transition-all"
                style={activeCategory === cat
                  ? { background: 'var(--foreground)', color: 'var(--background)', borderColor: 'transparent' }
                  : { borderColor: 'var(--border)', color: 'var(--text-secondary)' }
                }
              >
                {CATEGORY_LABELS[cat] ?? cat}
              </button>
            ))}
          </div>
        </div>

        {/* ── Lista de sugestões ── */}
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
            <div className="w-5 h-5 border-2 border-border border-t-blue-500 rounded-full animate-spin" />
            {t('app.loading')}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <p className="font-medium">{t('fabSuggestions.noSuggestionsFound')}</p>
            <p className="text-sm mt-1">{t('fabSuggestions.beTheFirst')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(item => {
              const typeCfg = TYPE_CONFIG[(item.suggestion_type || 'geral') as keyof typeof TYPE_CONFIG] || TYPE_CONFIG.geral;
              return (
                <div key={item.id} className="bg-card border border-border rounded-xl p-4 flex gap-4 hover:shadow-sm transition-shadow group">
                  {/* Votos */}
                  <div className="flex flex-col items-center gap-1 pt-1">
                    <button onClick={() => handleVote(item)}
                      className="flex flex-col items-center gap-0.5 group/vote hover:text-blue-500 transition-colors text-muted-foreground">
                      <ArrowUp size={16} className="group-hover/vote:scale-110 transition-transform" />
                      <span className="text-xs font-bold">{item.votes}</span>
                    </button>
                  </div>

                  {/* Conteúdo */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
                            style={{ color: typeCfg.color, background: typeCfg.bg }}>
                            {typeCfg.icon} {typeCfg.label}
                          </span>
                          {item.category && item.category !== 'Outro' && (
                            <span className="text-[10px] text-muted-foreground border border-border rounded-full px-2 py-0.5">{CATEGORY_LABELS[item.category] ?? item.category}</span>
                          )}
                          {item.status === 'approved' && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 dark:bg-green-950/30 px-2 py-0.5 rounded-full">
                              <Check size={10} /> {t('fabSuggestions.approved')}
                            </span>
                          )}
                        </div>
                        <h3 className="font-semibold text-foreground text-sm">{item.title}</h3>
                        {item.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{item.description}</p>}
                      </div>

                      {/* Ações */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 flex-shrink-0">
                            <MoreVertical size={14} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {(isAdmin || item.author === user?.name) && (
                            <DropdownMenuItem onClick={() => openEdit(item)}><Edit2 size={13} className="mr-2" /> {t('app.edit')}</DropdownMenuItem>
                          )}
                          {isAdmin && (
                            <DropdownMenuItem onClick={() => handleApprove(item)}>
                              <Check size={13} className="mr-2" />
                              {item.status === 'approved' ? t('fabSuggestions.removeApproval') : t('app.approve')}
                            </DropdownMenuItem>
                          )}
                          {isAdmin && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => setDeleteItem(item)} className="text-destructive">
                                <Trash2 size={13} className="mr-2" /> {t('app.delete')}
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Tags + autor */}
                    <div className="flex items-center justify-between flex-wrap gap-2 mt-2">
                      <div className="flex gap-1 flex-wrap">
                        {item.tags?.map(tag => <Badge key={tag} variant="secondary" className="text-[10px] px-1.5">{tag}</Badge>)}
                      </div>
                      <span className="text-[10px] text-muted-foreground">{item.author}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Modal criar/editar ───────────────────────────── */}
      <Dialog open={modal} onOpenChange={setModal}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editItem ? t('fabSuggestions.editSuggestion') : t('fabSuggestions.newSuggestion')}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {/* Tipo */}
            <div>
              <Label className="mb-2 block">{t('fabSuggestions.suggestionType')}</Label>
              <div className="flex gap-2">
                {(Object.keys(TYPE_CONFIG) as (keyof typeof TYPE_CONFIG)[]).map(type => {
                  const cfg = TYPE_CONFIG[type];
                  return (
                    <button
                      key={type}
                      onClick={() => setForm(p => ({ ...p, suggestion_type: type as any }))}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border text-sm font-semibold transition-all"
                      style={form.suggestion_type === type
                        ? { background: cfg.color, color: '#fff', borderColor: cfg.color }
                        : { borderColor: 'var(--border)' }
                      }
                    >
                      {cfg.icon} {cfg.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <Label>{t('fabSuggestions.titleLabel')} *</Label>
              <Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder={t('fabSuggestions.titlePlaceholder')} />
            </div>
            <div>
              <Label>{t('app.description')}</Label>
              <textarea
                value={form.desc}
                onChange={e => setForm(p => ({ ...p, desc: e.target.value }))}
                placeholder={t('fabSuggestions.descPlaceholder')}
                rows={3}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{t('app.category')}</Label>
                <select
                  value={form.category}
                  onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {CATEGORIES.filter(c => c !== 'Todos').map(c => <option key={c} value={c}>{CATEGORY_LABELS[c] ?? c}</option>)}
                </select>
              </div>
              <div>
                <Label>{t('app.tags')}</Label>
                <Input value={form.tags} onChange={e => setForm(p => ({ ...p, tags: e.target.value }))} placeholder={t('fabSuggestions.tagsPlaceholder')} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setModal(false)}>{t('app.cancel')}</Button>
            <Button onClick={handleSave} disabled={!form.title || saving} style={{ background: '#1D4ED8' }} className="text-white">
              {saving ? t('fabSuggestions.saving') : editItem ? t('app.save') : t('fabSuggestions.sendSuggestion')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmar exclusão */}
      <Dialog open={!!deleteItem} onOpenChange={() => setDeleteItem(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t('fabSuggestions.deleteConfirmTitle')}</DialogTitle></DialogHeader>
          <p className="text-muted-foreground text-sm">{t('fabSuggestions.deleteConfirmDesc', { title: deleteItem?.title })}</p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteItem(null)}>{t('app.cancel')}</Button>
            <Button variant="destructive" onClick={handleDelete}>{t('app.delete')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
}
