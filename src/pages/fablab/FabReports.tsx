import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Activity, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/stores/authStore';
import { PageTransition } from '@/components/layout/PageTransition';
import { supabase } from '@/lib/supabase';
import type { MaterialUsage } from '@/types';
import type { Report } from '@/types';
import { cn } from '@/lib/utils';

export function FabReports() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [tab, setTab] = useState<'diario' | 'semanal' | 'mensal' | 'materiais'>('diario');
  const [reports, setReports] = useState<Report[]>([]);
  const [materialUsage, setMaterialUsage] = useState<MaterialUsage[]>([]);

  useEffect(() => {
    supabase.from('reports').select('*').order('generated_at', { ascending: false }).then(({ data }) => {
      if (data) setReports(data as Report[]);
    });
    supabase.from('material_usage').select('*').order('total_used', { ascending: false }).then(({ data }) => {
      if (data) setMaterialUsage(data as MaterialUsage[]);
    });
  }, []);
  const [expanded, setExpanded] = useState<string | null>(null);
  const isAdmin = user?.role === 'admin';

  const pct = (a: number, b: number) => b > 0 ? Math.round(a / b * 100) : 0;

  const filtered = reports.filter((r) => r.type === (tab === 'diario' ? 'daily' : tab === 'semanal' ? 'weekly' : 'monthly'));

  const StatCard = ({ label, value, color }: { label: string; value: number; color: string }) => (
    <div className="bg-card border border-border rounded-xl p-4 text-center">
      <div className="text-3xl font-extrabold" style={{ color }}>{value}</div>
      <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mt-1">{label}</div>
    </div>
  );

  return (
    <PageTransition>
      <div className="mb-6">
        <h1 className="text-xl font-extrabold">{t('fablab.reportsTitle')}</h1>
        <p className="text-sm text-muted-foreground">Uso de materiais e agendamentos - diário, semanal e mensal</p>
      </div>

      <div className="flex gap-0 border-b border-border mb-4">
        {(['diario', 'semanal', 'mensal', 'materiais'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={cn('px-4 py-2.5 text-sm font-semibold border-b-2 -mb-[2px] transition-colors',
              tab === t ? 'border-[#D42020] text-[#D42020]' : 'border-transparent text-muted-foreground hover:text-foreground')}>
            {t === 'diario' ? 'Diário' : t === 'semanal' ? 'Semanal' : t === 'mensal' ? 'Mensal' : 'Uso de Materiais'}
          </button>
        ))}
      </div>

      {tab !== 'materiais' && (
        <>
          {isAdmin && (
            <div className="bg-card border border-border rounded-xl p-4 mb-4 flex gap-3 items-end flex-wrap">
              <Button size="sm" style={{ background: 'var(--fab-primary)' }}><Activity size={14} className="mr-1" /> Gerar relatório {tab}</Button>
            </div>
          )}
          {filtered.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground text-sm">Nenhum relatório {tab} gerado ainda.</div>
          ) : (
            <div className="space-y-3">
              {filtered.map((r) => (
                <div key={r.id} className="bg-card border border-border rounded-xl overflow-hidden">
                  <button onClick={() => setExpanded(expanded === r.id ? null : r.id)} className="w-full px-5 py-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                    <span className="font-bold text-sm">[{tab === 'diario' ? 'D' : tab === 'semanal' ? 'S' : 'M'}] {r.period_start}{r.period_end !== r.period_start ? ' → ' + r.period_end : ''}</span>
                    <div className="flex gap-2 items-center">
                      <Badge variant="default">{r.total_completed} concluídos</Badge>
                      <Badge variant="secondary">{r.total_schedules} total</Badge>
                      {expanded === r.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </button>
                  {expanded === r.id && (
                    <div className="px-5 pb-5 border-t border-border">
                      <div className="grid grid-cols-4 gap-3 my-4">
                        <StatCard label="Total" value={r.total_schedules} color="#2563EB" />
                        <StatCard label="Concluídos" value={r.total_completed} color="#16A34A" />
                        <StatCard label="Pendentes" value={r.total_pending} color="#D97706" />
                        <StatCard label="Cancelados" value={r.total_cancelled} color="#DC2626" />
                      </div>
                      <div className="mb-3">
                        <div className="text-sm font-bold mb-2">{t('fablab.completionRate')}</div>
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: pct(r.total_completed, r.total_schedules) + '%' }} />
                          </div>
                          <span className="text-lg font-bold text-emerald-500">{pct(r.total_completed, r.total_schedules)}%</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'materiais' && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-muted/50 text-left">
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Material</th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{t('app.category')}</th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{t('fablab.totalUsed')}</th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{t('fablab.usageCount')}</th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{t('fablab.relativeUsage')}</th>
              </tr></thead>
              <tbody className="divide-y divide-border">
                {materialUsage.map((m, i) => {
                  const maxUsed = materialUsage[0]?.total_used || 1;
                  return (
                    <tr key={i}>
                      <td className="px-4 py-3 font-semibold">{m.item_name}</td>
                      <td className="px-4 py-3"><span className="text-xs bg-muted px-2 py-0.5 rounded">{m.category}</span></td>
                      <td className="px-4 py-3 font-bold">{m.total_used}</td>
                      <td className="px-4 py-3">{m.times_used}×</td>
                      <td className="px-4 py-3 min-w-[120px]">
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full" style={{ width: Math.round(m.total_used / maxUsed * 100) + '%' }} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </PageTransition>
  );
}
