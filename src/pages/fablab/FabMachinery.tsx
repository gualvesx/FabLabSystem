import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Plus, Search, Trash2, Pencil, Wrench, CheckCircle2,
  AlertTriangle, Clock, Droplets, Calendar, ChevronDown,
  Power, PowerOff, Settings,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/stores/authStore';
import { PageTransition } from '@/components/layout/PageTransition';

// ── Types ──────────────────────────────────────────────────────────────────
type MachineStatus = 'operacional' | 'manutencao' | 'limpeza' | 'inativo' | 'aguardando_peca';

interface ScheduledEvent {
  id: string;
  type: 'manutencao' | 'limpeza';
  scheduled_date: string; // ISO date string (YYYY-MM-DD)
  note: string;
  created_by: string;
}

interface Machine {
  id: string;
  name: string;
  model: string;
  location: string;
  category: string;
  status: MachineStatus;
  notes: string;
  scheduled_events: ScheduledEvent[];
  created_at: string;
  updated_at: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────
const STATUS_STYLE: Record<MachineStatus, { color: string; icon: React.ReactNode; bg: string }> = {
  operacional:     { color: '#059669', bg: '#05966915', icon: <CheckCircle2 size={13} /> },
  manutencao:      { color: '#D42020', bg: '#D4202015', icon: <Wrench size={13} /> },
  limpeza:         { color: '#2563eb', bg: '#2563eb15', icon: <Droplets size={13} /> },
  aguardando_peca: { color: '#d97706', bg: '#d9770615', icon: <Clock size={13} /> },
  inativo:         { color: '#6b7280', bg: '#6b728015', icon: <PowerOff size={13} /> },
};

// Valores canônicos (armazenados); a exibição é traduzida via CATEGORY_LABELS
const CATEGORIES = ['Corte a Laser', 'Impressão 3D', 'CNC', 'Eletrônica', 'Costura', 'Sublimação', 'Outro'];
const LOCALE_MAP: Record<string, string> = { pt: 'pt-BR', en: 'en-US', es: 'es-ES', fr: 'fr-FR' };

const STORAGE_KEY = 'fablab_machinery';
const load = (): Machine[] => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
};
const save = (m: Machine[]) => localStorage.setItem(STORAGE_KEY, JSON.stringify(m));

const EMPTY_FORM = {
  name: '', model: '', location: '', category: CATEGORIES[0], status: 'operacional' as MachineStatus, notes: '',
};
const EMPTY_EVENT: Omit<ScheduledEvent, 'id' | 'created_by'> = {
  type: 'limpeza', scheduled_date: '', note: '',
};

function getDaysUntil(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  const now = new Date(); now.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - now.getTime()) / 86400000);
}

function EventBadge({ ev }: { ev: ScheduledEvent }) {
  const { t } = useTranslation();
  const days = getDaysUntil(ev.scheduled_date);
  const isLimpeza = ev.type === 'limpeza';
  const color = isLimpeza ? '#2563eb' : '#d97706';
  const icon = isLimpeza ? <Droplets size={10} /> : <Wrench size={10} />;
  const label = isLimpeza ? t('fabMachinery.cleaning') : t('fabMachinery.maintenance');
  const urgency = days < 0 ? ` (${t('fabMachinery.late')})` : days === 0 ? ` (${t('fabMachinery.today')})` : days === 1 ? ` (${t('fabMachinery.tomorrow')})` : ` ${t('fabMachinery.in')} ${days}d`;
  const urgencyColor = days <= 0 ? '#D42020' : days <= 2 ? '#d97706' : color;

  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border"
      style={{ color: urgencyColor, borderColor: urgencyColor + '50', background: urgencyColor + '12' }}>
      {icon}
      {label}
      {urgency}
    </span>
  );
}

// ── Component ──────────────────────────────────────────────────────────────
export function FabMachinery() {
  const { t, i18n } = useTranslation();
  const dateLocale = LOCALE_MAP[i18n.language] || 'pt-BR';
  const STATUS_CONFIG: Record<MachineStatus, { label: string; color: string; icon: React.ReactNode; bg: string }> = {
    operacional:     { ...STATUS_STYLE.operacional,     label: t('fabMachinery.status.operacional') },
    manutencao:      { ...STATUS_STYLE.manutencao,      label: t('fabMachinery.status.manutencao') },
    limpeza:         { ...STATUS_STYLE.limpeza,         label: t('fabMachinery.status.limpeza') },
    aguardando_peca: { ...STATUS_STYLE.aguardando_peca, label: t('fabMachinery.status.aguardando_peca') },
    inativo:         { ...STATUS_STYLE.inativo,         label: t('fabMachinery.status.inativo') },
  };
  const CATEGORY_LABELS: Record<string, string> = {
    'Corte a Laser': t('fabMachinery.category.laserCutting'),
    'Impressão 3D': t('fabMachinery.category.printing3d'),
    CNC: t('fabMachinery.category.cnc'),
    'Eletrônica': t('fabMachinery.category.electronics'),
    Costura: t('fabMachinery.category.sewing'),
    'Sublimação': t('fabMachinery.category.sublimation'),
    Outro: t('fabMachinery.category.other'),
  };
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin' || user?.role === 'professor';

  const [machines, setMachines] = useState<Machine[]>(load);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<MachineStatus | 'all'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  // event scheduling state
  const [eventForm, setEventForm] = useState(EMPTY_EVENT);
  const [schedTarget, setSchedTarget] = useState<string | null>(null);

  useEffect(() => { save(machines); }, [machines]);

  // ── Computed ──
  const counts = Object.fromEntries(
    (Object.keys(STATUS_CONFIG) as MachineStatus[]).map(k => [k, machines.filter(m => m.status === k).length])
  ) as Record<MachineStatus, number>;

  const filtered = machines.filter(m => {
    const matchS = statusFilter === 'all' || m.status === statusFilter;
    const q = search.toLowerCase();
    const matchQ = !q || m.name.toLowerCase().includes(q) || m.location.toLowerCase().includes(q) || m.category.toLowerCase().includes(q);
    return matchS && matchQ;
  });

  // Get the nearest upcoming event for a machine (for banner highlight)
  const nearestEvent = (m: Machine): ScheduledEvent | null => {
    const upcoming = m.scheduled_events
      .filter(e => getDaysUntil(e.scheduled_date) >= -7) // show even slightly past
      .sort((a, b) => a.scheduled_date.localeCompare(b.scheduled_date));
    return upcoming[0] ?? null;
  };

  // ── CRUD machines ──
  const handleSave = () => {
    if (!form.name.trim()) return;
    const now = new Date().toISOString();
    if (editId) {
      setMachines(prev => prev.map(m => m.id === editId ? { ...m, ...form, updated_at: now } : m));
      setEditId(null);
    } else {
      const machine: Machine = {
        id: crypto.randomUUID(), ...form,
        scheduled_events: [], created_at: now, updated_at: now,
      };
      setMachines(prev => [machine, ...prev]);
    }
    setAddOpen(false); setForm(EMPTY_FORM);
  };

  const handleDelete = (id: string) => {
    setMachines(prev => prev.filter(m => m.id !== id));
    if (expandedId === id) setExpandedId(null);
  };

  const openEdit = (m: Machine) => {
    setForm({ name: m.name, model: m.model, location: m.location, category: m.category, status: m.status, notes: m.notes });
    setEditId(m.id); setAddOpen(true);
  };

  const setStatus = (id: string, status: MachineStatus) => {
    setMachines(prev => prev.map(m => m.id === id ? { ...m, status, updated_at: new Date().toISOString() } : m));
  };

  // ── CRUD events ──
  const addEvent = (machineId: string) => {
    if (!eventForm.scheduled_date) return;
    const ev: ScheduledEvent = {
      id: crypto.randomUUID(), ...eventForm,
      created_by: user?.name || 'Admin',
    };
    setMachines(prev => prev.map(m => m.id === machineId
      ? { ...m, scheduled_events: [...m.scheduled_events, ev], updated_at: new Date().toISOString() }
      : m));
    setEventForm(EMPTY_EVENT); setSchedTarget(null);
  };

  const removeEvent = (machineId: string, eventId: string) => {
    setMachines(prev => prev.map(m => m.id === machineId
      ? { ...m, scheduled_events: m.scheduled_events.filter(e => e.id !== eventId) }
      : m));
  };

  return (
    <PageTransition>
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-xl font-extrabold">{t('sidebar.machinery')}</h1>
          <p className="text-sm text-muted-foreground">
            {machines.length} {t('fabMachinery.registeredMachines')} · {counts.operacional} {t('fabMachinery.operational')}
          </p>
        </div>
        {isAdmin && (
          <Button size="sm" onClick={() => { setEditId(null); setForm(EMPTY_FORM); setAddOpen(true); }}
            style={{ background: 'var(--fab-primary)' }}>
            <Plus size={14} className="mr-1" /> {t('fabMachinery.newMachine')}
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
        {(Object.entries(STATUS_CONFIG) as [MachineStatus, typeof STATUS_CONFIG[MachineStatus]][]).map(([key, cfg]) => (
          <button key={key} onClick={() => setStatusFilter(statusFilter === key ? 'all' : key)}
            className={`bg-card border rounded-xl p-3 flex items-center gap-2.5 transition-colors text-left ${statusFilter === key ? 'border-primary ring-1 ring-primary' : 'border-border hover:border-primary/30'}`}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: cfg.bg, color: cfg.color }}>{cfg.icon}</div>
            <div>
              <div className="text-lg font-extrabold leading-none">{counts[key]}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{cfg.label}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input value={search} onChange={e => setSearch(e.target.value)}
          placeholder={t('fabMachinery.searchPlaceholder')} className="pl-9 h-9 text-sm" />
      </div>

      {/* List */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <Settings size={36} className="mx-auto mb-3 opacity-20" />
            <p>{t('fabMachinery.noMachinesFound')}</p>
          </div>
        )}

        {filtered.map(machine => {
          const sc = STATUS_CONFIG[machine.status];
          const near = nearestEvent(machine);
          const isExpanded = expandedId === machine.id;

          return (
            <div key={machine.id} className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary/30 transition-colors">
              {/* Upcoming event banner */}
              {near && (
                <div className="px-4 py-1.5 border-b flex items-center gap-2 text-xs"
                  style={{ background: (near.type === 'limpeza' ? '#2563eb' : '#d97706') + '10', borderColor: (near.type === 'limpeza' ? '#2563eb' : '#d97706') + '30' }}>
                  <Calendar size={11} style={{ color: near.type === 'limpeza' ? '#2563eb' : '#d97706' }} />
                  <span className="font-semibold" style={{ color: near.type === 'limpeza' ? '#2563eb' : '#d97706' }}>
                    {near.type === 'limpeza' ? t('fabMachinery.cleaning') : t('fabMachinery.maintenance')} {t('fabMachinery.scheduledFor')}{' '}
                    {new Date(near.scheduled_date + 'T00:00:00').toLocaleDateString(dateLocale, { day: '2-digit', month: 'long', year: 'numeric' })}
                  </span>
                  {near.note && <span className="text-muted-foreground truncate">— {near.note}</span>}
                </div>
              )}

              <div className="p-4">
                <div className="flex items-start gap-3">
                  {/* Status dot */}
                  <div className="w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: sc.color }} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-semibold text-sm">{machine.name}</span>
                      {machine.model && <span className="text-[11px] text-muted-foreground">{machine.model}</span>}
                      {/* Status badge */}
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: sc.bg, color: sc.color }}>
                        {sc.icon}{sc.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground flex-wrap">
                      {machine.location && <span>📍 {machine.location}</span>}
                      <span className="px-1.5 py-0.5 rounded bg-muted text-[10px]">{CATEGORY_LABELS[machine.category] ?? machine.category}</span>
                      {machine.scheduled_events.length > 0 && (
                        <div className="flex gap-1 flex-wrap">
                          {machine.scheduled_events
                            .filter(e => getDaysUntil(e.scheduled_date) >= -7)
                            .slice(0, 3)
                            .map(ev => <EventBadge key={ev.id} ev={ev} />)}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button size="sm" variant="outline" className="h-7 text-xs px-2"
                      onClick={() => setExpandedId(isExpanded ? null : machine.id)}>
                      {t('fabMaintenance.details')} <ChevronDown size={11} className={`ml-1 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </Button>
                    {isAdmin && (
                      <>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEdit(machine)}>
                          <Pencil size={12} />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(machine.id)}>
                          <Trash2 size={12} />
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {/* Expanded panel */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-border space-y-5">

                    {/* Status changer */}
                    {isAdmin && (
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">{t('fabMachinery.machineState')}</p>
                        <div className="flex gap-2 flex-wrap">
                          {(Object.entries(STATUS_CONFIG) as [MachineStatus, typeof STATUS_CONFIG[MachineStatus]][]).map(([key, cfg]) => (
                            <button key={key} onClick={() => setStatus(machine.id, key)}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${machine.status === key ? 'border-current opacity-100' : 'border-border opacity-50 hover:opacity-80'}`}
                              style={{ color: cfg.color, borderColor: machine.status === key ? cfg.color : undefined, background: machine.status === key ? cfg.bg : undefined }}>
                              {cfg.icon}{cfg.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Notes */}
                    {machine.notes && (
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">{t('app.notes')}</p>
                        <p className="text-sm text-muted-foreground">{machine.notes}</p>
                      </div>
                    )}

                    {/* Scheduled events */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('fabMachinery.scheduledEvents')}</p>
                        {isAdmin && (
                          <Button size="sm" variant="outline" className="h-6 text-[10px] px-2"
                            onClick={() => setSchedTarget(schedTarget === machine.id ? null : machine.id)}>
                            <Plus size={10} className="mr-1" /> {t('fabMachinery.schedule')}
                          </Button>
                        )}
                      </div>

                      {/* Add event form */}
                      {schedTarget === machine.id && (
                        <div className="mb-3 p-3 rounded-lg border border-border bg-muted/30 space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t('app.type')}</Label>
                              <select value={eventForm.type}
                                onChange={e => setEventForm(p => ({ ...p, type: e.target.value as 'limpeza' | 'manutencao' }))}
                                className="w-full h-8 px-2 rounded border border-input bg-background text-xs">
                                <option value="limpeza">🧹 {t('fabMachinery.cleaning')}</option>
                                <option value="manutencao">🔧 {t('fabMachinery.maintenance')}</option>
                              </select>
                            </div>
                            <div className="space-y-1">
                              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t('app.date')} *</Label>
                              <Input type="date" value={eventForm.scheduled_date}
                                onChange={e => setEventForm(p => ({ ...p, scheduled_date: e.target.value }))}
                                className="h-8 text-xs" />
                            </div>
                          </div>
                          <Input value={eventForm.note}
                            onChange={e => setEventForm(p => ({ ...p, note: e.target.value }))}
                            placeholder={t('fabMachinery.notePlaceholder')} className="h-8 text-xs" />
                          <div className="flex gap-2 justify-end">
                            <Button size="sm" variant="outline" className="h-7 text-xs"
                              onClick={() => { setSchedTarget(null); setEventForm(EMPTY_EVENT); }}>{t('app.cancel')}</Button>
                            <Button size="sm" className="h-7 text-xs"
                              disabled={!eventForm.scheduled_date}
                              onClick={() => addEvent(machine.id)}
                              style={{ background: 'var(--fab-primary)' }}>
                              {t('app.save')}
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Events list */}
                      {machine.scheduled_events.length === 0 && schedTarget !== machine.id && (
                        <p className="text-xs text-muted-foreground">{t('fabMachinery.noSchedules')}</p>
                      )}
                      <div className="space-y-1.5">
                        {machine.scheduled_events
                          .sort((a, b) => a.scheduled_date.localeCompare(b.scheduled_date))
                          .map(ev => {
                            const days = getDaysUntil(ev.scheduled_date);
                            const isLate = days < 0;
                            const color = ev.type === 'limpeza' ? '#2563eb' : '#d97706';
                            return (
                              <div key={ev.id} className="flex items-center gap-2 p-2 rounded-lg border text-xs"
                                style={{ borderColor: color + '30', background: color + '08' }}>
                                <div style={{ color }}>{ev.type === 'limpeza' ? <Droplets size={12} /> : <Wrench size={12} />}</div>
                                <span className="font-semibold" style={{ color }}>
                                  {ev.type === 'limpeza' ? t('fabMachinery.cleaning') : t('fabMachinery.maintenance')}
                                </span>
                                <span className="text-muted-foreground">
                                  {new Date(ev.scheduled_date + 'T00:00:00').toLocaleDateString(dateLocale)}
                                  {isLate && <span className="ml-1 text-red-500 font-semibold">({t('fabMachinery.late')})</span>}
                                  {days === 0 && <span className="ml-1 text-orange-500 font-semibold">({t('fabMachinery.today')})</span>}
                                </span>
                                {ev.note && <span className="text-muted-foreground truncate flex-1">— {ev.note}</span>}
                                <span className="text-muted-foreground">{t('fabMachinery.by')} {ev.created_by}</span>
                                {isAdmin && (
                                  <button onClick={() => removeEvent(machine.id, ev.id)}
                                    className="ml-auto text-muted-foreground hover:text-destructive transition-colors">
                                    <Trash2 size={11} />
                                  </button>
                                )}
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ══ Add/Edit Dialog ══ */}
      <Dialog open={addOpen} onOpenChange={o => { if (!o) { setAddOpen(false); setEditId(null); setForm(EMPTY_FORM); } }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? t('fabMachinery.editMachine') : t('fabMachinery.newMachine')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('app.name')} *</Label>
              <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                placeholder={t('fabMachinery.namePlaceholder')} className="h-10" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('fabMachinery.model')}</Label>
                <Input value={form.model} onChange={e => setForm(p => ({ ...p, model: e.target.value }))}
                  placeholder={t('fabMachinery.modelPlaceholder')} className="h-10" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('fabMaintenance.location')}</Label>
                <Input value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
                  placeholder={t('fabMachinery.locationPlaceholder')} className="h-10" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('app.category')}</Label>
                <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
                  {CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_LABELS[c] ?? c}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('fabMachinery.machineState')}</Label>
                <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value as MachineStatus }))}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
                  {(Object.entries(STATUS_CONFIG) as [MachineStatus, typeof STATUS_CONFIG[MachineStatus]][]).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('app.notes')}</Label>
              <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                placeholder={t('fabMachinery.notesPlaceholder')} rows={3}
                className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm resize-none outline-none focus:ring-1 focus:ring-ring" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setAddOpen(false); setEditId(null); setForm(EMPTY_FORM); }}>{t('app.cancel')}</Button>
            <Button onClick={handleSave} disabled={!form.name.trim()} style={{ background: 'var(--fab-primary)' }}>
              {editId ? t('app.save') : t('fabMachinery.register')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
}
