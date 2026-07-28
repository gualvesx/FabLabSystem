import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Check, ArrowUp, ArrowDown, Pencil, Trash2, Search, Package, AlertTriangle, FileUp, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useAuthStore } from '@/stores/authStore';
import { INV_CATS, UNIT_MEASURES } from '@/lib/constants';
import { PageTransition } from '@/components/layout/PageTransition';

const EMPTY_FORM = { name: '', category: 'Equipamento' as const, subcategory: '', quantity: 0, total: 1, unit_measure: 'un', description: '', location: '', min_stock: 0 };

const CAT_COLORS: Record<string, string> = {
  'Equipamento': '#2563eb', 'Eletrônico': '#7c3aed', 'Ferramenta': '#ea580c',
  'Insumo': '#059669', 'Material': '#0891b2', 'Consumível': '#D42020', 'EPI': '#d97706', 'Outro': '#6b7280',
};

export function FabInventory() {
  const { t, i18n } = useTranslation();
  const LOCALE_MAP: Record<string, string> = { pt: 'pt-BR', en: 'en-US', es: 'es-ES', fr: 'fr-FR' };
  const dateLocale = LOCALE_MAP[i18n.language] || 'pt-BR';
  const { items, movements, addItem, updateItem, deleteItem, addMovement, fetchItems, fetchMovements } = useInventoryStore();
  const { user } = useAuthStore();

  useEffect(() => { fetchItems(); fetchMovements(); }, []);

  const [filter, setFilter] = useState('all');
  const [catFilter, setCatFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'items' | 'history'>('items');
  const [addOpen, setAddOpen] = useState(false);
  const [editItemId, setEditItemId] = useState<string | null>(null);
  const [moveItem, setMoveItem] = useState<{ id: string; type: 'entrada' | 'saida' } | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [moveForm, setMoveForm] = useState({ quantity: 1, notes: '', responsible: user?.name || '' });
  const isAdmin = user?.role === 'admin' || user?.role === 'professor';

  // ── CSV Import ──
  const [csvOpen, setCsvOpen] = useState(false);
  const [csvText, setCsvText] = useState('');
  const [csvPreview, setCsvPreview] = useState<{ rows: any[]; errors: string[] } | null>(null);
  const [csvImporting, setCsvImporting] = useState(false);

  const CSV_TEMPLATE = `nome,categoria,subcategoria,quantidade_atual,quantidade_total,unidade,localizacao,estoque_minimo,descricao
Arduino Uno Rev3,Eletrônico,Microcontrolador,5,10,un,Prateleira A1,2,Kit com cabo USB
Impressora 3D Creality,Equipamento,Impressão 3D,1,1,un,Bancada 2,1,FDM 220x220x250mm`;

  const parseCSV = (text: string) => {
    const lines = text.trim().split('\n').filter(l => l.trim());
    if (lines.length < 2) return { rows: [], errors: [t('fabInventory.csvHeaderError')] };

    const errors: string[] = [];
    const header = lines[0].split(',').map(h => h.trim().toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove acentos
      .replace(/\s+/g, '_'));

    const REQUIRED = ['nome'];
    const missing = REQUIRED.filter(r => !header.includes(r));
    if (missing.length) return { rows: [], errors: [`${t('fabInventory.missingColumn')}: ${missing.join(', ')}`] };

    const idx = (key: string) => header.indexOf(key);

    const rows = lines.slice(1).map((line, i) => {
      // parse respeitando aspas
      const cols: string[] = [];
      let cur = '', inQ = false;
      for (const ch of line) {
        if (ch === '"') { inQ = !inQ; }
        else if (ch === ',' && !inQ) { cols.push(cur.trim()); cur = ''; }
        else cur += ch;
      }
      cols.push(cur.trim());

      const get = (key: string) => (cols[idx(key)] ?? '').replace(/^"|"$/g, '').trim();
      const name = get('nome');
      if (!name) { errors.push(`${t('fabInventory.line')} ${i + 2}: ${t('fabInventory.emptyNameIgnored')}`); return null; }

      const rawCat = get('categoria');
      const validCats = ['Equipamento','Eletrônico','Ferramenta','Insumo','Material','Consumível','EPI','Outro'];
      const category = validCats.includes(rawCat) ? rawCat : 'Outro';
      if (rawCat && !validCats.includes(rawCat)) errors.push(`${t('fabInventory.line')} ${i + 2}: ${t('fabInventory.unknownCategory')} "${rawCat}" → "Outro".`);

      const quantity = Math.max(0, parseInt(get('quantidade_atual') || get('quantidade')) || 0);
      const total    = Math.max(1, parseInt(get('quantidade_total') || get('total')) || 1);

      return {
        name,
        category,
        subcategory:  get('subcategoria') || get('subcategory') || '',
        quantity,
        total,
        unit_measure: get('unidade') || get('unit_measure') || 'un',
        location:     get('localizacao') || get('location') || '',
        min_stock:    parseInt(get('estoque_minimo') || get('min_stock')) || 0,
        description:  get('descricao') || get('descricao') || get('description') || '',
        status:       quantity > 0 ? 'in' as const : 'out' as const,
        last_action:  new Date().toISOString().split('T')[0],
        last_action_by: user?.name || '',
      };
    }).filter(Boolean);

    return { rows, errors };
  };

  const handleCsvParse = () => {
    setCsvPreview(parseCSV(csvText));
  };

  const handleCsvImport = async () => {
    if (!csvPreview?.rows.length) return;
    setCsvImporting(true);
    for (const row of csvPreview.rows) {
      await addItem(row as any);
    }
    setCsvImporting(false);
    setCsvOpen(false);
    setCsvText('');
    setCsvPreview(null);
  };

  const filtered = items.filter(i => {
    const matchStatus = filter === 'all' || (filter === 'in' && i.quantity > 0) || (filter === 'out' && i.quantity === 0) || (filter === 'low' && i.quantity > 0 && i.quantity < i.total * 0.3);
    const matchCat = catFilter === 'all' || i.category === catFilter;
    const matchSearch = !search || i.name.toLowerCase().includes(search.toLowerCase()) || i.description?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchCat && matchSearch;
  });

  const stockStatus = (i: typeof items[0]) => {
    if (i.quantity === 0) return { label: t('fabInventory.outOfStock'), variant: 'destructive' as const, pct: 0 };
    const pct = i.total > 0 ? (i.quantity / i.total) * 100 : 100;
    if (pct < 30) return { label: t('fabInventory.critical'), variant: 'secondary' as const, pct };
    return { label: t('fabInventory.available'), variant: 'default' as const, pct };
  };

  const handleSave = () => {
    if (!form.name.trim()) return;
    const payload = {
      name: form.name.trim(), category: form.category, subcategory: form.subcategory,
      quantity: +form.quantity, total: +form.total, unit_measure: form.unit_measure,
      status: +form.quantity > 0 ? 'in' as const : 'out' as const,
      description: form.description, location: form.location,
      min_stock: +form.min_stock,
      last_action: new Date().toISOString().split('T')[0],
      last_action_by: user?.name || '',
    };
    if (editItemId) { updateItem(editItemId, payload); setEditItemId(null); }
    else { addItem(payload); setAddOpen(false); }
    setForm(EMPTY_FORM);
  };

  const openEdit = (item: typeof items[0]) => {
    setForm({ name: item.name, category: item.category as any, subcategory: item.subcategory || '', quantity: item.quantity, total: item.total, unit_measure: item.unit_measure || 'un', description: item.description, location: item.location || '', min_stock: item.min_stock || 0 });
    setEditItemId(item.id);
    setAddOpen(true);
  };

  const handleMove = () => {
    if (!moveItem) return;
    const item = items.find(i => i.id === moveItem.id);
    if (!item) return;
    const delta = +moveForm.quantity;
    if (delta <= 0) return;
    const newQty = moveItem.type === 'entrada' ? item.quantity + delta : item.quantity - delta;
    if (newQty < 0) return;
    updateItem(moveItem.id, { quantity: newQty, status: newQty > 0 ? 'in' : 'out', last_action: new Date().toISOString().split('T')[0], last_action_by: moveForm.responsible });
    addMovement({ item_id: moveItem.id, item_name: item.name, action: moveItem.type, quantity: delta, responsible: moveForm.responsible, notes: moveForm.notes });
    setMoveItem(null);
    setMoveForm({ quantity: 1, notes: '', responsible: user?.name || '' });
  };

  // Stats
  const totalItems = items.length;
  const available = items.filter(i => i.quantity > 0).length;
  const critical = items.filter(i => i.quantity > 0 && i.quantity < i.total * 0.3).length;
  const outOfStock = items.filter(i => i.quantity === 0).length;

  return (
    <PageTransition>
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-xl font-extrabold">{tab === 'items' ? t('sidebar.inventory') : t('fabInventory.movementHistory')}</h1>
          <p className="text-sm text-muted-foreground">{totalItems} {t('fabInventory.itemsCount')} · {outOfStock} {t('fabInventory.outOfStockCount')}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" variant={tab === 'items' ? 'default' : 'outline'} onClick={() => setTab('items')}>{t('fabInventory.items')}</Button>
          <Button size="sm" variant={tab === 'history' ? 'default' : 'outline'} onClick={() => setTab('history')}>{t('fabInventory.history')}</Button>
          {isAdmin && tab === 'items' && (
            <>
              <Button size="sm" variant="outline" onClick={() => { setCsvText(''); setCsvPreview(null); setCsvOpen(true); }}>
                <FileUp size={14} className="mr-1" /> {t('fabInventory.importCsv')}
              </Button>
              <Button size="sm" onClick={() => { setEditItemId(null); setForm(EMPTY_FORM); setAddOpen(true); }} style={{ background: 'var(--fab-primary)' }}>
                <Plus size={14} className="mr-1" /> {t('fabInventory.registerItem')}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Stats row */}
      {tab === 'items' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          {[
            { label: t('fabInventory.total'), value: totalItems, icon: <Package size={16} />, color: '#2563eb' },
            { label: t('fabInventory.availablePlural'), value: available, icon: <Check size={16} />, color: '#059669' },
            { label: t('fabInventory.criticalPlural'), value: critical, icon: <AlertTriangle size={16} />, color: '#d97706' },
            { label: t('fabInventory.outOfStockPlural'), value: outOfStock, icon: <Package size={16} />, color: '#D42020' },
          ].map(s => (
            <div key={s.label} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: s.color + '15', color: s.color }}>{s.icon}</div>
              <div><div className="text-xl font-extrabold leading-none">{s.value}</div><div className="text-xs text-muted-foreground mt-0.5">{s.label}</div></div>
            </div>
          ))}
        </div>
      )}

      {tab === 'items' && (
        <>
          {/* Filters */}
          <div className="flex gap-2 mb-4 flex-wrap">
            <div className="relative flex-1 min-w-[180px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('fabInventory.searchItem')} className="pl-9 h-9 text-sm" />
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {['all', 'in', 'out', 'low'].map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${filter === f ? 'bg-foreground text-background border-foreground' : 'bg-card border-border text-muted-foreground hover:text-foreground'}`}>
                  {f === 'all' ? t('app.all') : f === 'in' ? t('fabInventory.available') : f === 'out' ? t('fabInventory.outOfStock') : t('fabInventory.critical')}
                </button>
              ))}
            </div>
            <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
              className="h-9 px-3 rounded-lg border border-input bg-background text-sm text-foreground">
              <option value="all">{t('fabInventory.allCategories')}</option>
              {INV_CATS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Items grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map(item => {
              const st = stockStatus(item);
              const catColor = CAT_COLORS[item.category] || '#6b7280';
              return (
                <div key={item.id} className="bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition-colors flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: catColor + '15', color: catColor }}>{item.category}</span>
                        {item.subcategory && <span className="text-[10px] text-muted-foreground">{item.subcategory}</span>}
                        <Badge variant={st.variant} className="text-[10px]">{st.label}</Badge>
                      </div>
                      <h3 className="font-semibold text-sm leading-snug truncate">{item.name}</h3>
                      {item.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{item.description}</p>}
                      {item.location && <p className="text-[10px] text-muted-foreground mt-0.5">📍 {item.location}</p>}
                    </div>
                    {isAdmin && (
                      <div className="flex gap-1 flex-shrink-0">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEdit(item)}><Pencil size={12} /></Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => setDeleteId(item.id)}><Trash2 size={12} /></Button>
                      </div>
                    )}
                  </div>

                  {/* Stock bar */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-muted-foreground">{t('fabInventory.stock')}</span>
                      <span className="text-xs font-bold">{item.quantity}<span className="text-muted-foreground font-normal">/{item.total} {item.unit_measure || t('fabDashboard.unitAbbrev')}</span></span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(st.pct, 100)}%`, background: st.pct < 30 ? '#D42020' : st.pct < 60 ? '#d97706' : '#059669' }} />
                    </div>
                    {(item.min_stock ?? 0) > 0 && item.quantity <= (item.min_stock ?? 0) && (
                      <p className="text-[10px] text-amber-600 mt-1 flex items-center gap-1"><AlertTriangle size={10} /> {t('fabInventory.belowMinStock')} ({item.min_stock})</p>
                    )}
                  </div>

                  {/* Move buttons */}
                  <div className="flex gap-2 pt-1 border-t border-border/50">
                    <Button size="sm" variant="outline" className="flex-1 h-7 text-xs gap-1" onClick={() => { setMoveItem({ id: item.id, type: 'entrada' }); setMoveForm({ quantity: 1, notes: '', responsible: user?.name || '' }); }}>
                      <ArrowDown size={11} className="text-green-600" /> {t('fabInventory.stockIn')}
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1 h-7 text-xs gap-1" disabled={item.quantity === 0} onClick={() => { setMoveItem({ id: item.id, type: 'saida' }); setMoveForm({ quantity: 1, notes: '', responsible: user?.name || '' }); }}>
                      <ArrowUp size={11} className="text-red-600" /> {t('fabInventory.stockOut')}
                    </Button>
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && (
              <div className="col-span-full text-center py-16 text-muted-foreground">
                <Package size={36} className="mx-auto mb-3 opacity-20" />
                <p>{t('fabInventory.noItemsFound')}</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* History tab */}
      {tab === 'history' && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 text-left">
                {[t('fabInventory.item'), t('fabInventory.action'), t('fabInventory.qty'), t('app.responsible'), t('app.date'), t('fabInventory.obs')].map((h, i) => (
                  <th key={i} className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {movements.slice(0, 100).map(m => (
                <tr key={m.id} className="hover:bg-muted/20">
                  <td className="px-4 py-2.5 font-medium">{m.item_name}</td>
                  <td className="px-4 py-2.5">
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${m.action === 'entrada' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                      {m.action === 'entrada' ? <ArrowDown size={10} /> : <ArrowUp size={10} />}
                      {m.action === 'entrada' ? t('fabInventory.stockIn') : t('fabInventory.stockOut')}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 font-bold">{m.quantity}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{m.responsible}</td>
                  <td className="px-4 py-2.5 text-muted-foreground text-xs">{new Date(m.moved_at).toLocaleString(dateLocale)}</td>
                  <td className="px-4 py-2.5 text-muted-foreground text-xs">{m.notes}</td>
                </tr>
              ))}
              {movements.length === 0 && (
                <tr><td colSpan={6} className="text-center py-10 text-muted-foreground">{t('fabInventory.noMovements')}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ══ Add/Edit Item Modal ══ */}
      <Dialog open={addOpen || !!editItemId} onOpenChange={o => { if (!o) { setAddOpen(false); setEditItemId(null); setForm(EMPTY_FORM); } }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editItemId ? t('fabInventory.editItem') : t('fabInventory.registerItem')}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('fabInventory.itemName')} *</Label>
              <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder={t('fabInventory.itemNamePlaceholder')} className="h-10" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('app.category')} *</Label>
                <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value as any }))}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
                  {INV_CATS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('fabInventory.subcategory')}</Label>
                <Input value={form.subcategory} onChange={e => setForm(p => ({ ...p, subcategory: e.target.value }))} placeholder={t('fabInventory.subcategoryPlaceholder')} className="h-10" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('fabInventory.currentQty')}</Label>
                <Input type="number" min="0" value={form.quantity} onChange={e => setForm(p => ({ ...p, quantity: +e.target.value }))} className="h-10" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('fabInventory.totalQty')}</Label>
                <Input type="number" min="1" value={form.total} onChange={e => setForm(p => ({ ...p, total: +e.target.value }))} className="h-10" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('fabInventory.unit')}</Label>
                <select value={form.unit_measure} onChange={e => setForm(p => ({ ...p, unit_measure: e.target.value }))}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
                  {UNIT_MEASURES.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('fabMaintenance.location')}</Label>
                <Input value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} placeholder={t('fabInventory.locationPlaceholder')} className="h-10" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('fabInventory.minStock')}</Label>
                <Input type="number" min="0" value={form.min_stock} onChange={e => setForm(p => ({ ...p, min_stock: +e.target.value }))} className="h-10" />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('fabInventory.descObs')}</Label>
              <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                placeholder={t('fabInventory.descPlaceholder')} rows={2}
                className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm resize-none outline-none focus:ring-1 focus:ring-ring" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setAddOpen(false); setEditItemId(null); setForm(EMPTY_FORM); }}>{t('app.cancel')}</Button>
            <Button onClick={handleSave} style={{ background: 'var(--fab-primary)' }}>{t('app.save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══ Movement Modal ══ */}
      <Dialog open={!!moveItem} onOpenChange={o => { if (!o) setMoveItem(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{moveItem?.type === 'entrada' ? t('fabInventory.registerStockIn') : t('fabInventory.registerStockOut')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {(() => { const item = items.find(i => i.id === moveItem?.id); return item ? (
              <p className="text-sm font-medium text-muted-foreground">{t('fabInventory.item')}: <strong className="text-foreground">{item.name}</strong> · {t('fabInventory.currentStock')}: <strong>{item.quantity} {item.unit_measure || t('fabDashboard.unitAbbrev')}</strong></p>
            ) : null; })()}
            {moveItem?.type === 'saida' && (() => { const item = items.find(i => i.id === moveItem?.id); const excess = item && +moveForm.quantity > item.quantity; return excess ? (
              <p className="text-xs text-destructive flex items-center gap-1"><AlertTriangle size={11} /> {t('fabInventory.quantityExceedsStock')}</p>
            ) : null; })()}
            <div className="space-y-1">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('fabInventory.quantity')} *</Label>
              <Input type="number" min="1" value={moveForm.quantity} onChange={e => setMoveForm(p => ({ ...p, quantity: +e.target.value }))} className="h-10" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('app.responsible')}</Label>
              <Input value={moveForm.responsible} onChange={e => setMoveForm(p => ({ ...p, responsible: e.target.value }))} className="h-10" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('app.notes')}</Label>
              <Input value={moveForm.notes} onChange={e => setMoveForm(p => ({ ...p, notes: e.target.value }))} placeholder={t('fabInventory.reasonDestination')} className="h-10" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMoveItem(null)}>{t('app.cancel')}</Button>
            <Button onClick={handleMove} style={{ background: moveItem?.type === 'entrada' ? '#059669' : '#D42020' }}>
              {moveItem?.type === 'entrada' ? t('fabInventory.confirmStockIn') : t('fabInventory.confirmStockOut')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══ Delete Confirm ══ */}
      <Dialog open={!!deleteId} onOpenChange={o => { if (!o) setDeleteId(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{t('fabInventory.deleteItemTitle')}</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground py-2">{t('fabInventory.deleteItemDesc')}</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>{t('app.cancel')}</Button>
            <Button variant="destructive" onClick={() => { if (deleteId) { deleteItem(deleteId); setDeleteId(null); } }}>{t('app.delete')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* ══ CSV Import Modal ══ */}
      <Dialog open={csvOpen} onOpenChange={o => { if (!o) { setCsvOpen(false); setCsvText(''); setCsvPreview(null); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><FileUp size={16} /> {t('fabInventory.importItemsByCsv')}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-1">
            {/* Template hint */}
            <div className="bg-muted/50 rounded-lg p-3 space-y-1.5">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('fabInventory.acceptedColumns')}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                <strong className="text-foreground">nome</strong> ({t('fabInventory.required')}),{' '}
                categoria, subcategoria, quantidade_atual, quantidade_total, unidade, localizacao, estoque_minimo, descricao
              </p>
              <button
                onClick={() => setCsvText(CSV_TEMPLATE)}
                className="text-xs text-primary hover:underline font-medium mt-1"
              >
                ↓ {t('fabInventory.loadExample')}
              </button>
            </div>

            {/* Textarea */}
            <div className="space-y-1">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('fabInventory.pasteCsvHere')}</Label>
              <textarea
                value={csvText}
                onChange={e => { setCsvText(e.target.value); setCsvPreview(null); }}
                placeholder={"nome,categoria,quantidade_atual,...\nArduino Uno,Eletrônico,5,..."}
                rows={7}
                className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm font-mono resize-y outline-none focus:ring-1 focus:ring-ring"
              />
            </div>

            <Button size="sm" variant="outline" onClick={handleCsvParse} disabled={!csvText.trim()}>
              {t('fabInventory.validateAndPreview')}
            </Button>

            {/* Preview */}
            {csvPreview && (
              <div className="space-y-3">
                {/* Errors */}
                {csvPreview.errors.length > 0 && (
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 space-y-1">
                    <p className="text-xs font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                      <AlertCircle size={13} /> {csvPreview.errors.length} {t('fabInventory.warnings')}
                    </p>
                    {csvPreview.errors.map((e, i) => (
                      <p key={i} className="text-xs text-amber-700 dark:text-amber-400 pl-5">{e}</p>
                    ))}
                  </div>
                )}

                {/* Success count */}
                {csvPreview.rows.length > 0 ? (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg px-3 py-2 flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-green-600 dark:text-green-400 flex-shrink-0" />
                    <p className="text-xs font-semibold text-green-700 dark:text-green-400">
                      {csvPreview.rows.length} {t('fabInventory.validItemsReady')}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-destructive text-center py-2">{t('fabInventory.noValidItems')}</p>
                )}

                {/* Table preview */}
                {csvPreview.rows.length > 0 && (
                  <div className="border border-border rounded-lg overflow-auto max-h-52">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-muted/50 text-left">
                          {[t('app.name'), t('app.category'), t('fabInventory.qty'), t('fabInventory.totalAbbrev'), t('fabInventory.unitAbbrev2'), t('fabMaintenance.location')].map(h => (
                            <th key={h} className="px-3 py-2 font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {csvPreview.rows.map((row, i) => (
                          <tr key={i} className="hover:bg-muted/20">
                            <td className="px-3 py-1.5 font-medium max-w-[160px] truncate">{row.name}</td>
                            <td className="px-3 py-1.5 text-muted-foreground">{row.category}</td>
                            <td className="px-3 py-1.5 font-bold">{row.quantity}</td>
                            <td className="px-3 py-1.5 text-muted-foreground">{row.total}</td>
                            <td className="px-3 py-1.5 text-muted-foreground">{row.unit_measure}</td>
                            <td className="px-3 py-1.5 text-muted-foreground max-w-[100px] truncate">{row.location || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setCsvOpen(false); setCsvText(''); setCsvPreview(null); }}>{t('app.cancel')}</Button>
            <Button
              onClick={handleCsvImport}
              disabled={!csvPreview?.rows.length || csvImporting}
              style={{ background: 'var(--fab-primary)' }}
            >
              {csvImporting ? t('fabInventory.importing') : `${t('fabInventory.import')} ${csvPreview?.rows.length ?? 0} ${t('fabInventory.itemsParens')}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
}
