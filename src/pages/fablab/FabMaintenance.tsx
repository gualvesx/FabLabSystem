import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Wrench, AlertTriangle, CheckCircle2, Clock, Search, Trash2, Pencil, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/stores/authStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { PageTransition } from '@/components/layout/PageTransition';
import { supabase } from '@/lib/supabase';

// ── Types ─────────────────────────────────────────────────────────
type TicketStatus = 'aberto' | 'em_andamento' | 'aguardando_peca' | 'resolvido';
type TicketPriority = 'baixa' | 'media' | 'alta' | 'critica';

interface MaintenanceLog {
  id: string;
  date: string;
  author: string;
  note: string;
}

interface MaintenanceTicket {
  id: string;
  machine_name: string;
  machine_location: string;
  problem: string;
  priority: TicketPriority;
  status: TicketStatus;
  reported_by: string;
  assigned_to: string;
  opened_at: string;
  resolved_at?: string;
  logs: MaintenanceLog[];
  inventory_item_id?: string;
}

// ── Helpers ───────────────────────────────────────────────────────
const STATUS_STYLE: Record<TicketStatus, { color: string; icon: React.ReactNode }> = {
  aberto:           { color: '#D42020', icon: <AlertTriangle size={12} /> },
  em_andamento:     { color: '#2563eb', icon: <Wrench size={12} /> },
  aguardando_peca:  { color: '#d97706', icon: <Clock size={12} /> },
  resolvido:        { color: '#059669', icon: <CheckCircle2 size={12} /> },
};

const PRIORITY_STYLE: Record<TicketPriority, { color: string }> = {
  baixa:   { color: '#6b7280' },
  media:   { color: '#2563eb' },
  alta:    { color: '#d97706' },
  critica: { color: '#D42020' },
};

const EMPTY_FORM = {
  machine_name: '', machine_location: '', problem: '',
  priority: 'media' as TicketPriority, assigned_to: '', inventory_item_id: '',
};

// ── Local storage fallback (substitua por Supabase quando tiver a tabela) ──
const STORAGE_KEY = 'fablab_maintenance_tickets';
const loadTickets = (): MaintenanceTicket[] => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
};
const saveTickets = (t: MaintenanceTicket[]) =>
  localStorage.setItem(STORAGE_KEY, JSON.stringify(t));

// ── Component ─────────────────────────────────────────────────────
const LOCALE_MAP: Record<string, string> = { pt: 'pt-BR', en: 'en-US', es: 'es-ES', fr: 'fr-FR' };

export function FabMaintenance() {
  const { t, i18n } = useTranslation();
  const dateLocale = LOCALE_MAP[i18n.language] || 'pt-BR';
  const STATUS_CONFIG: Record<TicketStatus, { label: string; color: string; icon: React.ReactNode }> = {
    aberto:           { ...STATUS_STYLE.aberto,           label: t('fabMaintenance.status.aberto') },
    em_andamento:     { ...STATUS_STYLE.em_andamento,     label: t('fabMaintenance.status.em_andamento') },
    aguardando_peca:  { ...STATUS_STYLE.aguardando_peca,  label: t('fabMaintenance.status.aguardando_peca') },
    resolvido:        { ...STATUS_STYLE.resolvido,        label: t('fabMaintenance.status.resolvido') },
  };
  const PRIORITY_CONFIG: Record<TicketPriority, { label: string; color: string }> = {
    baixa:   { ...PRIORITY_STYLE.baixa,   label: t('fabMaintenance.priority.baixa') },
    media:   { ...PRIORITY_STYLE.media,   label: t('fabMaintenance.priority.media') },
    alta:    { ...PRIORITY_STYLE.alta,    label: t('fabMaintenance.priority.alta') },
    critica: { ...PRIORITY_STYLE.critica, label: t('fabMaintenance.priority.critica') },
  };
  const { user } = useAuthStore();
  const { items } = useInventoryStore();
  const isAdmin = user?.role === 'admin' || user?.role === 'professor';

  const [tickets, setTickets] = useState<MaintenanceTicket[]>(loadTickets);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'all'>('all');
  const [addOpen, setAddOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [logNote, setLogNote] = useState('');
  const [form, setForm] = useState(EMPTY_FORM);

  // Persist
  useEffect(() => { saveTickets(tickets); }, [tickets]);

  const machines = [
    ...new Set([
      ...tickets.map(t => t.machine_name),
      ...items.filter(i => i.category === 'Equipamento').map(i => i.name),
    ])
  ].filter(Boolean);

  // Filtros
  const filtered = tickets.filter(t => {
    const matchS = statusFilter === 'all' || t.status === statusFilter;
    const matchQ = !search || t.machine_name.toLowerCase().includes(search.toLowerCase())
      || t.problem.toLowerCase().includes(search.toLowerCase());
    return matchS && matchQ;
  });

  const counts = {
    aberto:          tickets.filter(t => t.status === 'aberto').length,
    em_andamento:    tickets.filter(t => t.status === 'em_andamento').length,
    aguardando_peca: tickets.filter(t => t.status === 'aguardando_peca').length,
    resolvido:       tickets.filter(t => t.status === 'resolvido').length,
  };

  // ── CRUD ──
  const handleSave = () => {
    if (!form.machine_name.trim() || !form.problem.trim()) return;
    const now = new Date().toISOString();
    if (editId) {
      setTickets(prev => prev.map(t => t.id === editId
        ? { ...t, ...form } : t));
      setEditId(null);
    } else {
      const ticket: MaintenanceTicket = {
        id: crypto.randomUUID(),
        ...form,
        status: 'aberto',
        reported_by: user?.name || t('fabMaintenance.anonymous'),
        opened_at: now,
        logs: [{ id: crypto.randomUUID(), date: now, author: user?.name || '', note: t('fabMaintenance.ticketOpened') }],
      };
      setTickets(prev => [ticket, ...prev]);
    }
    setAddOpen(false);
    setForm(EMPTY_FORM);
  };

  const handleStatusChange = (id: string, status: TicketStatus) => {
    const now = new Date().toISOString();
    setTickets(prev => prev.map(t => t.id === id ? {
      ...t,
      status,
      resolved_at: status === 'resolvido' ? now : t.resolved_at,
      logs: [...t.logs, {
        id: crypto.randomUUID(), date: now,
        author: user?.name || '',
        note: `${t('fabMaintenance.statusChangedTo')}: ${STATUS_CONFIG[status].label}`,
      }],
    } : t));
  };

  const handleAddLog = (id: string) => {
    if (!logNote.trim()) return;
    const now = new Date().toISOString();
    setTickets(prev => prev.map(t => t.id === id ? {
      ...t,
      logs: [...t.logs, { id: crypto.randomUUID(), date: now, author: user?.name || '', note: logNote.trim() }],
    } : t));
    setLogNote('');
  };

  const handleDelete = (id: string) => {
    setTickets(prev => prev.filter(t => t.id !== id));
    if (detailId === id) setDetailId(null);
  };

  const openEdit = (t: MaintenanceTicket) => {
    setForm({ machine_name: t.machine_name, machine_location: t.machine_location,
      problem: t.problem, priority: t.priority, assigned_to: t.assigned_to,
      inventory_item_id: t.inventory_item_id || '' });
    setEditId(t.id);
    setAddOpen(true);
  };

  const detail = tickets.find(t => t.id === detailId);

  return (
    <PageTransition>
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-xl font-extrabold">{t('fabMaintenance.title')}</h1>
          <p className="text-sm text-muted-foreground">{tickets.filter(tk => tk.status !== 'resolvido').length} {t('fabMaintenance.openTickets')}</p>
        </div>
        {isAdmin && (
          <Button size="sm" onClick={() => { setEditId(null); setForm(EMPTY_FORM); setAddOpen(true); }} style={{ background: 'var(--fab-primary)' }}>
            <Plus size={14} className="mr-1" /> {t('fabMaintenance.newTicket')}
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {(Object.entries(STATUS_CONFIG) as [TicketStatus, typeof STATUS_CONFIG[TicketStatus]][]).map(([key, cfg]) => (
          <button key={key} onClick={() => setStatusFilter(statusFilter === key ? 'all' : key)}
            className={`bg-card border rounded-xl p-4 flex items-center gap-3 transition-colors text-left ${statusFilter === key ? 'border-primary ring-1 ring-primary' : 'border-border hover:border-primary/30'}`}>
            <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: cfg.color + '15', color: cfg.color }}>{cfg.icon}</div>
            <div>
              <div className="text-xl font-extrabold leading-none">{counts[key]}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{cfg.label}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input value={search} onChange={e => setSearch(e.target.value)}
          placeholder={t('fabMaintenance.searchPlaceholder')} className="pl-9 h-9 text-sm" />
      </div>

      {/* Tickets list */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <Wrench size={36} className="mx-auto mb-3 opacity-20" />
            <p>{t('fabMaintenance.noTicketsFound')}</p>
          </div>
        )}
        {filtered.map(ticket => {
          const sc = STATUS_CONFIG[ticket.status];
          const pc = PRIORITY_CONFIG[ticket.priority];
          return (
            <div key={ticket.id}
              className="bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition-colors">
              <div className="flex items-start gap-3">
                {/* Priority bar */}
                <div className="w-1 self-stretch rounded-full flex-shrink-0 mt-1"
                  style={{ background: pc.color }} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-semibold text-sm">{ticket.machine_name}</span>
                    {ticket.machine_location && (
                      <span className="text-[11px] text-muted-foreground">📍 {ticket.machine_location}</span>
                    )}
                    {/* Status badge */}
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: sc.color + '15', color: sc.color }}>
                      {sc.icon}{sc.label}
                    </span>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: pc.color + '15', color: pc.color }}>
                      {pc.label}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{ticket.problem}</p>
                  <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground flex-wrap">
                    <span>{t('fabMaintenance.openedBy')} <strong className="text-foreground">{ticket.reported_by}</strong></span>
                    <span>{new Date(ticket.opened_at).toLocaleDateString(dateLocale)}</span>
                    {ticket.assigned_to && <span>→ <strong className="text-foreground">{ticket.assigned_to}</strong></span>}
                    <span>{ticket.logs.length} {t('fabMaintenance.logsCount')}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button size="sm" variant="outline" className="h-7 text-xs px-2"
                    onClick={() => setDetailId(detailId === ticket.id ? null : ticket.id)}>
                    {t('fabMaintenance.details')} <ChevronDown size={11} className={`ml-1 transition-transform ${detailId === ticket.id ? 'rotate-180' : ''}`} />
                  </Button>
                  {isAdmin && (
                    <>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEdit(ticket)}>
                        <Pencil size={12} />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(ticket.id)}>
                        <Trash2 size={12} />
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Detail panel */}
              {detailId === ticket.id && (
                <div className="mt-4 pt-4 border-t border-border space-y-4">
                  {/* Status changer */}
                  {isAdmin && (
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">{t('fabMaintenance.changeStatus')}</p>
                      <div className="flex gap-2 flex-wrap">
                        {(Object.entries(STATUS_CONFIG) as [TicketStatus, typeof STATUS_CONFIG[TicketStatus]][]).map(([key, cfg]) => (
                          <button key={key} onClick={() => handleStatusChange(ticket.id, key)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${ticket.status === key ? 'border-current' : 'border-border opacity-60 hover:opacity-100'}`}
                            style={{ color: cfg.color, borderColor: ticket.status === key ? cfg.color : undefined, background: ticket.status === key ? cfg.color + '15' : undefined }}>
                            {cfg.icon}{cfg.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Logs */}
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                      {t('fabMaintenance.maintenanceLog')}
                    </p>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {ticket.logs.map(log => (
                        <div key={log.id} className="flex gap-2 text-xs">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                          <div>
                            <span className="text-muted-foreground">
                              {new Date(log.date).toLocaleString(dateLocale)} · <strong className="text-foreground">{log.author}</strong>
                            </span>
                            <p className="text-foreground">{log.note}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Input value={logNote} onChange={e => setLogNote(e.target.value)}
                        placeholder={t('fabMaintenance.addLogNote')} className="h-8 text-xs flex-1"
                        onKeyDown={e => e.key === 'Enter' && handleAddLog(ticket.id)} />
                      <Button size="sm" className="h-8 text-xs" onClick={() => handleAddLog(ticket.id)}>
                        {t('fabMaintenance.register')}
                      </Button>
                    </div>
                  </div>

                  {/* Resolved at */}
                  {ticket.resolved_at && (
                    <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                      <CheckCircle2 size={12} />
                      {t('fabMaintenance.resolvedAt')} {new Date(ticket.resolved_at).toLocaleString(dateLocale)}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ══ Add/Edit Modal ══ */}
      <Dialog open={addOpen} onOpenChange={o => { if (!o) { setAddOpen(false); setEditId(null); setForm(EMPTY_FORM); } }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? t('fabMaintenance.editTicket') : t('fabMaintenance.newMaintenanceTicket')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('fabMaintenance.machineEquipment')} *</Label>
              <Input list="machines-list" value={form.machine_name}
                onChange={e => setForm(p => ({ ...p, machine_name: e.target.value }))}
                placeholder={t('fabMaintenance.machinePlaceholder')} className="h-10" />
              <datalist id="machines-list">
                {machines.map(m => <option key={m} value={m} />)}
              </datalist>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('fabMaintenance.location')}</Label>
              <Input value={form.machine_location}
                onChange={e => setForm(p => ({ ...p, machine_location: e.target.value }))}
                placeholder={t('fabMaintenance.locationPlaceholder')} className="h-10" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('fabMaintenance.problemDesc')} *</Label>
              <textarea value={form.problem}
                onChange={e => setForm(p => ({ ...p, problem: e.target.value }))}
                placeholder={t('fabMaintenance.problemPlaceholder')}
                rows={3} className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm resize-none outline-none focus:ring-1 focus:ring-ring" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('fabMaintenance.priorityLabel')}</Label>
                <select value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value as TicketPriority }))}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
                  {(Object.entries(PRIORITY_CONFIG) as [TicketPriority, { label: string }][]).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('app.responsible')}</Label>
                <Input value={form.assigned_to}
                  onChange={e => setForm(p => ({ ...p, assigned_to: e.target.value }))}
                  placeholder={t('fabMaintenance.technicianName')} className="h-10" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setAddOpen(false); setEditId(null); setForm(EMPTY_FORM); }}>{t('app.cancel')}</Button>
            <Button onClick={handleSave} disabled={!form.machine_name.trim() || !form.problem.trim()} style={{ background: 'var(--fab-primary)' }}>
              {editId ? t('app.save') : t('fabMaintenance.openTicket')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
}
