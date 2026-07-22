/**
 * FabUsers.tsx — FabLab Platform
 * Gerenciamento de usuários e classes de permissão.
 *
 * Funcionalidades:
 *   - Listar, criar, editar e desativar usuários
 *   - Importar usuários via CSV (campos: name, email, role, unit)
 *   - Importar lista de alunos via CSV (campos: name, email, unit)
 *   - Gerenciar classes de permissão com editor granular de rotas
 *
 * Formato CSV de usuários:
 *   name,email,role,unit
 *   João Silva,joao@email.com,professor,FabLab Central
 *
 * Formato CSV de alunos:
 *   name,email,unit
 *   Maria Souza,maria@email.com,FabLab Norte
 */
import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Edit2, Trash2, MoreVertical, Shield, Settings,
         Upload, Download, Users, UserCheck, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { PageTransition } from '@/components/layout/PageTransition';
import { ROLE_LABELS, ALL_ROUTES, CLASS_COLORS } from '@/lib/constants';
import { supabase } from '@/lib/supabase';
import { useClassStore } from '@/stores/classStore';
import type { User, UserClass, RoutePermission } from '@/types';

const EMPTY_USER = { name: '', email: '', role: 'professor', unit: '', class_id: '' };

// ── Editor de permissões por rota ────────────────────────────
function PermissionEditor({ perms, onChange }: { perms: RoutePermission[]; onChange: (p: RoutePermission[]) => void }) {
  const { t } = useTranslation();
  const modules = ['fablab', 'projects', 'student'] as const;
  const moduleLabels = { fablab: t('modules.fablab'), projects: t('sidebar.projects'), student: t('modules.student') };

  const toggle = (route: string) =>
    onChange(perms.map(p => p.route === route ? { ...p, allowed: !p.allowed } : p));

  const toggleAll = (mod: string, val: boolean) => {
    const routes = ALL_ROUTES.filter(r => r.module === mod).map(r => r.route);
    onChange(perms.map(p => (routes as string[]).includes(p.route) ? { ...p, allowed: val } : p));
  };

  return (
    <div className="space-y-3">
      {modules.map(mod => {
        const modRoutes = ALL_ROUTES.filter(r => r.module === mod);
        const modPerms  = perms.filter(p => modRoutes.some(r => r.route === p.route));
        const allOn  = modPerms.every(p => p.allowed);
        const allOff = modPerms.every(p => !p.allowed);
        return (
          <div key={mod} className="border border-border rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 bg-muted/40">
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{moduleLabels[mod]}</span>
              <div className="flex gap-2">
                <button onClick={() => toggleAll(mod, true)} className={`text-[10px] font-semibold px-2 py-1 rounded ${allOn ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>{t('fabUsers.all')}</button>
                <button onClick={() => toggleAll(mod, false)} className={`text-[10px] font-semibold px-2 py-1 rounded ${allOff ? 'bg-destructive text-destructive-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>{t('fabUsers.none')}</button>
              </div>
            </div>
            <div className="divide-y divide-border/50">
              {modPerms.map(p => (
                <label key={p.route} className="flex items-center justify-between px-4 py-2.5 cursor-pointer hover:bg-muted/20">
                  <span className="text-sm">{p.label.split(' · ')[1] || p.label}</span>
                  <div onClick={() => toggle(p.route)}
                    className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 cursor-pointer ${p.allowed ? 'bg-primary' : 'bg-muted-foreground/30'}`}>
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${p.allowed ? 'translate-x-4' : 'translate-x-0.5'}`} />
                  </div>
                </label>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Card de classe ───────────────────────────────────────────
function ClassCard({ cls, onEdit, onDelete }: { cls: UserClass; onEdit: () => void; onDelete: () => void }) {
  const { t } = useTranslation();
  const allowed = cls.permissions.filter(p => p.allowed).length;
  const total   = cls.permissions.length;
  return (
    <div className="bg-card border border-border rounded-xl p-4 flex items-center justify-between gap-3 hover:shadow-sm transition-shadow">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: cls.color + '22' }}>
          <Shield size={16} style={{ color: cls.color }} />
        </div>
        <div>
          <div className="font-semibold text-sm text-foreground">{cls.name}</div>
          <div className="text-xs text-muted-foreground">{ROLE_LABELS[cls.base_role] || cls.base_role} · {allowed}/{total} {t('fabUsers.routes')}</div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{ width: `${total > 0 ? (allowed / total) * 100 : 0}%`, background: cls.color }} />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7"><MoreVertical size={14} /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}><Settings size={13} className="mr-2" /> {t('fabUsers.configure')}</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onDelete} className="text-destructive"><Trash2 size={13} className="mr-2" /> {t('app.delete')}</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

// ── Hook para parsing CSV ────────────────────────────────────
function parseCSV(text: string): Record<string, string>[] {
  const lines  = text.trim().split('\n').filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''));
  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim().replace(/['"]/g, ''));
    return Object.fromEntries(headers.map((h, i) => [h, values[i] || '']));
  });
}

export function FabUsers() {
  const { t } = useTranslation();
  const { classes, fetchClasses } = useClassStore();
  const [users, setUsers]           = useState<User[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Modais usuário
  const [userModal, setUserModal]   = useState(false);
  const [editUser, setEditUser]     = useState<User | null>(null);
  const [deleteUser, setDeleteUser] = useState<User | null>(null);
  const [userForm, setUserForm]     = useState(EMPTY_USER);
  const [saving, setSaving]         = useState(false);

  // Modais classe
  const [classModal, setClassModal]   = useState(false);
  const [editClass, setEditClass]     = useState<UserClass | null>(null);
  const [deleteClass, setDeleteClass] = useState<UserClass | null>(null);
  const [classForm, setClassForm]     = useState({ name: '', base_role: 'professor', color: CLASS_COLORS[0] });
  const [classPerms, setClassPerms]   = useState<RoutePermission[]>([]);

  // CSV import
  const [csvModal, setCsvModal]       = useState(false);
  const [csvType, setCsvType]         = useState<'users' | 'students'>('users');
  const [csvPreview, setCsvPreview]   = useState<Record<string, string>[]>([]);
  const [csvError, setCsvError]       = useState('');
  const [csvSuccess, setCsvSuccess]   = useState('');
  const [csvImporting, setCsvImporting] = useState(false);
  const csvRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchUsers(); fetchClasses(); }, []);

  const fetchUsers = async () => {
    setLoading(true);
    const { data } = await supabase.from('users').select('id, name, email, role, class_id, unit, active').order('name');
    if (data) setUsers(data as User[]);
    setLoading(false);
  };

  // ── Usuários CRUD ────────────────────────────────────────
  const openAddUser  = () => { setEditUser(null); setUserForm(EMPTY_USER); setUserModal(true); };
  const openEditUser = (u: User) => { setEditUser(u); setUserForm({ name: u.name, email: u.email, role: u.role, unit: u.unit, class_id: u.class_id || '' }); setUserModal(true); };

  const handleSaveUser = async () => {
    if (!userForm.name || !userForm.email) return;
    setSaving(true);
    const payload = { name: userForm.name, email: userForm.email, role: userForm.role, unit: userForm.unit, class_id: userForm.class_id || null };
    if (editUser) {
      await supabase.from('users').update(payload).eq('id', editUser.id);
      setUsers(p => p.map(u => u.id === editUser.id ? { ...u, ...payload } : u));
    } else {
      // Criação via invite do Supabase Auth
      const { data } = await supabase.auth.admin?.inviteUserByEmail(userForm.email, { data: { name: userForm.name, role: userForm.role, unit: userForm.unit } }).catch(() => ({ data: null }));
    }
    setSaving(false);
    setUserModal(false);
  };

  const handleToggleActive = async (u: User) => {
    await supabase.from('users').update({ active: !u.active }).eq('id', u.id);
    setUsers(p => p.map(usr => usr.id === u.id ? { ...usr, active: !u.active } : usr));
  };

  // ── Classes CRUD ─────────────────────────────────────────
  const defaultPerms = (): RoutePermission[] =>
    ALL_ROUTES.map(r => ({ route: r.route, label: r.label, allowed: false }));

  const openAddClass = () => {
    setEditClass(null);
    setClassForm({ name: '', base_role: 'professor', color: CLASS_COLORS[0] });
    setClassPerms(defaultPerms());
    setClassModal(true);
  };

  const openEditClass = (cls: UserClass) => {
    setEditClass(cls);
    setClassForm({ name: cls.name, base_role: cls.base_role, color: cls.color });
    // Merge existing perms with default (handles new routes added later)
    const merged = defaultPerms().map(dp => {
      const existing = cls.permissions.find(p => p.route === dp.route);
      return existing ? { ...dp, allowed: existing.allowed } : dp;
    });
    setClassPerms(merged);
    setClassModal(true);
  };

  const handleSaveClass = async () => {
    if (!classForm.name) return;
    setSaving(true);
    const payload = { name: classForm.name, base_role: classForm.base_role, color: classForm.color, permissions: classPerms };
    if (editClass) {
      await supabase.from('user_classes').update(payload).eq('id', editClass.id);
    } else {
      await supabase.from('user_classes').insert(payload);
    }
    await fetchClasses();
    setSaving(false);
    setClassModal(false);
  };

  const handleDeleteClass = async () => {
    if (!deleteClass) return;
    await supabase.from('user_classes').delete().eq('id', deleteClass.id);
    await fetchClasses();
    setDeleteClass(null);
  };

  // ── CSV Import ───────────────────────────────────────────
  const handleCsvFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvError(''); setCsvSuccess(''); setCsvPreview([]);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const rows = parseCSV(text);
      if (rows.length === 0) { setCsvError(t('fabUsers.emptyOrInvalidCsv')); return; }
      // Validate required columns
      const required = csvType === 'students' ? ['name', 'email'] : ['name', 'email'];
      const cols = Object.keys(rows[0]);
      const missing = required.filter(r => !cols.includes(r));
      if (missing.length > 0) { setCsvError(`${t('fabInventory.missingColumn')}: ${missing.join(', ')}`); return; }
      setCsvPreview(rows.slice(0, 5)); // show first 5 rows preview
    };
    reader.readAsText(file);
  };

  const handleCsvImport = async () => {
    if (!csvRef.current?.files?.[0]) return;
    setCsvImporting(true); setCsvError(''); setCsvSuccess('');
    const text = await csvRef.current.files[0].text();
    const rows = parseCSV(text);
    let ok = 0, errors = 0;

    for (const row of rows) {
      if (!row.name || !row.email) { errors++; continue; }
      const role = csvType === 'students' ? 'student' : (row.role || 'professor');
      const unit = row.unit || '';
      // Insert into users table (assumes auth user exists or will be created separately)
      const { error } = await supabase.from('users').upsert(
        { name: row.name, email: row.email, role, unit, active: true },
        { onConflict: 'email', ignoreDuplicates: false }
      );
      if (error) errors++;
      else ok++;
    }

    setCsvImporting(false);
    if (errors > 0) setCsvError(`${errors} ${t('fabUsers.linesWithError')}. ${ok} ${t('fabUsers.importedSuccessfully')}.`);
    else setCsvSuccess(`${ok} ${t('fabUsers.recordsImportedSuccessfully')}`);
    await fetchUsers();
    // Reset file input
    if (csvRef.current) csvRef.current.value = '';
    setCsvPreview([]);
  };

  // ── Filtragem ─────────────────────────────────────────────
  const filtered = users.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole   = roleFilter === 'all' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  return (
    <PageTransition>
      <div className="max-w-6xl mx-auto space-y-6">
        <Tabs defaultValue="users">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-bold text-foreground">{t('fabUsers.usersAndClasses')}</h1>
              <p className="text-muted-foreground text-sm mt-0.5">{t('fabUsers.subtitle')}</p>
            </div>
            <TabsList>
              <TabsTrigger value="users" className="gap-2"><Users size={14} /> {t('sidebar.users')}</TabsTrigger>
              <TabsTrigger value="classes" className="gap-2"><Shield size={14} /> {t('fabUsers.classes')}</TabsTrigger>
            </TabsList>
          </div>

          {/* ── ABA USUÁRIOS ── */}
          <TabsContent value="users" className="space-y-4 mt-4">
            <div className="flex gap-3 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Users size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('fabUsers.searchUsers')} className="pl-9" />
              </div>
              <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
                className="rounded-lg border border-input bg-background px-3 py-2 text-sm">
                <option value="all">{t('fabUsers.allRoles')}</option>
                {Object.entries(ROLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <Button onClick={() => { setCsvType('users'); setCsvError(''); setCsvSuccess(''); setCsvPreview([]); setCsvModal(true); }} variant="outline" className="gap-2">
                <Upload size={15} /> {t('fabInventory.importCsv')}
              </Button>
              <Button onClick={() => { setCsvType('students'); setCsvError(''); setCsvSuccess(''); setCsvPreview([]); setCsvModal(true); }} variant="outline" className="gap-2">
                <UserCheck size={15} /> {t('fabUsers.studentsList')}
              </Button>
              <Button onClick={openAddUser} style={{ background: '#1D4ED8' }} className="text-white gap-2">
                <Plus size={15} /> {t('fabUsers.newUser')}
              </Button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
                <div className="w-5 h-5 border-2 border-border border-t-blue-500 rounded-full animate-spin" />{t('app.loading')}
              </div>
            ) : (
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">{t('fabUsers.user')}</th>
                      <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider hidden md:table-cell">{t('fabUsers.role')}</th>
                      <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider hidden lg:table-cell">{t('app.unit')}</th>
                      <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {filtered.map(u => (
                      <tr key={u.id} className="hover:bg-muted/20 transition-colors group">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8 flex-shrink-0">
                              <AvatarFallback className="text-xs font-bold text-white" style={{ background: '#1D4ED8' }}>
                                {u.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium text-foreground leading-tight">{u.name}</div>
                              <div className="text-xs text-muted-foreground">{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <Badge variant="outline" className="text-xs">{ROLE_LABELS[u.role] || u.role}</Badge>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground text-xs">{u.unit || '—'}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${u.active ? 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400'}`}>
                            {u.active ? t('fabUsers.active') : t('fabUsers.inactive')}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100"><MoreVertical size={14} /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditUser(u)}><Edit2 size={13} className="mr-2" /> {t('app.edit')}</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleToggleActive(u)}>
                                {u.active ? <><Trash2 size={13} className="mr-2" /> {t('fabUsers.deactivate')}</> : <><UserCheck size={13} className="mr-2" /> {t('fabUsers.activate')}</>}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filtered.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground text-sm">{t('fabUsers.noUsersFound')}</div>
                )}
              </div>
            )}
          </TabsContent>

          {/* ── ABA CLASSES ── */}
          <TabsContent value="classes" className="space-y-4 mt-4">
            <div className="flex justify-end">
              <Button onClick={openAddClass} style={{ background: '#1D4ED8' }} className="text-white gap-2">
                <Plus size={15} /> {t('fabUsers.newClass')}
              </Button>
            </div>
            <div className="space-y-3">
              {classes.map(cls => (
                <ClassCard key={cls.id} cls={cls} onEdit={() => openEditClass(cls)} onDelete={() => setDeleteClass(cls)} />
              ))}
              {classes.length === 0 && (
                <div className="text-center py-12 text-muted-foreground text-sm">{t('fabUsers.noClassesCreated')}</div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* ── Modal Usuário ── */}
      <Dialog open={userModal} onOpenChange={setUserModal}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editUser ? t('fabUsers.editUser') : t('fabUsers.newUser')}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t('app.name')} *</Label>
              <Input value={userForm.name} onChange={e => setUserForm(p => ({ ...p, name: e.target.value }))} placeholder={t('fabUsers.fullName')} />
            </div>
            <div>
              <Label>{t('app.email')} *</Label>
              <Input value={userForm.email} onChange={e => setUserForm(p => ({ ...p, email: e.target.value }))} type="email" placeholder={t('fabUsers.emailExample')} disabled={!!editUser} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{t('fabUsers.role')}</Label>
                <select value={userForm.role} onChange={e => setUserForm(p => ({ ...p, role: e.target.value }))}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                  {Object.entries(ROLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <Label>{t('app.unit')}</Label>
                <Input value={userForm.unit} onChange={e => setUserForm(p => ({ ...p, unit: e.target.value }))} placeholder="FabLab Central" />
              </div>
            </div>
            <div>
              <Label>{t('fabUsers.permissionClass')}</Label>
              <select value={userForm.class_id} onChange={e => setUserForm(p => ({ ...p, class_id: e.target.value }))}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                <option value="">{t('fabUsers.roleDefault')}</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setUserModal(false)}>{t('app.cancel')}</Button>
            <Button onClick={handleSaveUser} disabled={!userForm.name || !userForm.email || saving} style={{ background: '#1D4ED8' }} className="text-white">
              {saving ? t('fabSuggestions.saving') : editUser ? t('app.save') : t('fabUsers.createUser')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Modal Classe ── */}
      <Dialog open={classModal} onOpenChange={setClassModal}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editClass ? t('fabUsers.editClass') : t('fabUsers.newClass')}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{t('app.name')} *</Label>
                <Input value={classForm.name} onChange={e => setClassForm(p => ({ ...p, name: e.target.value }))} placeholder={t('fabUsers.classNamePlaceholder')} />
              </div>
              <div>
                <Label>{t('fabUsers.baseRole')}</Label>
                <select value={classForm.base_role} onChange={e => setClassForm(p => ({ ...p, base_role: e.target.value }))}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                  {Object.entries(ROLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
            </div>
            <div>
              <Label className="mb-2 block">{t('fabUsers.color')}</Label>
              <div className="flex gap-2 flex-wrap">
                {CLASS_COLORS.map(c => (
                  <button key={c} onClick={() => setClassForm(p => ({ ...p, color: c }))}
                    className="w-7 h-7 rounded-full border-2 transition-all"
                    style={{ background: c, borderColor: classForm.color === c ? '#fff' : 'transparent', boxShadow: classForm.color === c ? `0 0 0 2px ${c}` : 'none' }} />
                ))}
              </div>
            </div>
            <div>
              <Label className="mb-2 block">{t('fabUsers.routePermissions')}</Label>
              <PermissionEditor perms={classPerms} onChange={setClassPerms} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setClassModal(false)}>{t('app.cancel')}</Button>
            <Button onClick={handleSaveClass} disabled={!classForm.name || saving} style={{ background: '#1D4ED8' }} className="text-white">
              {saving ? t('fabSuggestions.saving') : editClass ? t('app.save') : t('fabUsers.createClass')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Modal CSV Import ── */}
      <Dialog open={csvModal} onOpenChange={setCsvModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload size={18} />
              {csvType === 'students' ? t('fabUsers.importStudentList') : t('fabUsers.importUsers')} {t('fabUsers.viaCsv')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-muted/50 border border-border text-sm text-muted-foreground">
              <p className="font-semibold text-foreground mb-1">{t('fabUsers.expectedFormat')}</p>
              {csvType === 'students' ? (
                <code className="text-xs block">name,email,unit<br/>João Silva,joao@email.com,FabLab Central</code>
              ) : (
                <code className="text-xs block">name,email,role,unit<br/>João Silva,joao@email.com,professor,FabLab Central</code>
              )}
              <p className="mt-2 text-xs">{t('fabUsers.validRoles')}: admin, professor, funcionario, student</p>
            </div>

            <div>
              <Label>{t('fabUsers.selectCsvFile')}</Label>
              <input
                ref={csvRef}
                type="file"
                accept=".csv,text/csv"
                onChange={handleCsvFile}
                className="mt-1 w-full text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer"
              />
            </div>

            {csvPreview.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">{t('fabUsers.previewFirst5')}</p>
                <div className="border border-border rounded-lg overflow-auto max-h-32">
                  <table className="w-full text-xs">
                    <thead><tr className="bg-muted/30">{Object.keys(csvPreview[0]).map(h => <th key={h} className="px-2 py-1.5 text-left font-semibold">{h}</th>)}</tr></thead>
                    <tbody className="divide-y divide-border/50">
                      {csvPreview.map((row, i) => (
                        <tr key={i}>{Object.values(row).map((v, j) => <td key={j} className="px-2 py-1.5">{v}</td>)}</tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {csvError   && <div className="flex items-center gap-2 text-sm text-destructive"><AlertCircle size={14} />{csvError}</div>}
            {csvSuccess && <div className="flex items-center gap-2 text-sm text-green-600"><CheckCircle2 size={14} />{csvSuccess}</div>}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCsvModal(false)}>{t('app.close')}</Button>
            <Button
              onClick={handleCsvImport}
              disabled={csvPreview.length === 0 || csvImporting}
              style={{ background: '#1D4ED8' }} className="text-white gap-2"
            >
              <Upload size={14} />{csvImporting ? t('fabInventory.importing') : t('fabInventory.import')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Confirmar excluir classe ── */}
      <Dialog open={!!deleteClass} onOpenChange={() => setDeleteClass(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t('fabUsers.deleteClassTitle')}</DialogTitle></DialogHeader>
          <p className="text-muted-foreground text-sm">{t('fabUsers.deleteClassDesc', { name: deleteClass?.name })}</p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteClass(null)}>{t('app.cancel')}</Button>
            <Button variant="destructive" onClick={handleDeleteClass}>{t('app.delete')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
}
