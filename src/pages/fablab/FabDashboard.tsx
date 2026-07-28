import { useMemo, useEffect } from 'react';
import { Package, Calendar, CheckCircle, AlertTriangle, MapPin } from 'lucide-react';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useScheduleStore } from '@/stores/scheduleStore';
import { useAuthStore } from '@/stores/authStore';
import { Badge } from '@/components/ui/badge';
import { PageTransition } from '@/components/layout/PageTransition';

function StatCard({ label, value, sub, icon, color }: { label: string; value: number; sub: string; icon: React.ReactNode; color: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 border-l-[3px]" style={{ borderLeftColor: color }}>
      <div className="text-muted-foreground mb-2">{icon}</div>
      <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">{label}</div>
      <div className="text-3xl font-extrabold tracking-tight">{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{sub}</div>
    </div>
  );
}

export function FabDashboard() {
  const { items, fetchItems } = useInventoryStore();
  const { schedules, fetchSchedules } = useScheduleStore();
  const { user } = useAuthStore();

  useEffect(() => { fetchItems(); fetchSchedules(); }, []);

  const todayStr = new Date().toISOString().split('T')[0];
  const total = items.reduce((a, i) => a + (i.total || i.quantity || 0), 0);
  const out = items.filter((i) => i.status === 'out').length;
  const todaySched = schedules.filter((s) => s.date === todayStr).length;
  const completed = schedules.filter((s) => s.status === 'concluido').length;

  const upcoming = useMemo(() =>
    schedules.filter((s) => s.status !== 'cancelado' && s.status !== 'concluido').slice(0, 5),
    [schedules]
  );

  return (
    <PageTransition>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Visão geral do FabLab</p>
        </div>

        {/* Card de unidade */}
        {user?.unit && (
          <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-4 py-3 shadow-sm flex-shrink-0">
            <MapPin size={15} className="text-[#D42020]" />
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground leading-none mb-0.5">Unidade</div>
              <div className="text-sm font-semibold leading-tight">{user.unit}</div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Itens cadastrados" value={total} sub="no inventário" icon={<Package size={18} />} color="#D42020" />
        <StatCard label="Itens em saída" value={out} sub="fora do lab" icon={<AlertTriangle size={18} />} color="#9CA3AF" />
        <StatCard label="Agendamentos hoje" value={todaySched} sub={`total: ${schedules.length}`} icon={<Calendar size={18} />} color="#2563EB" />
        <StatCard label="Concluídos" value={completed} sub="agendamentos" icon={<CheckCircle size={18} />} color="#16A34A" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border font-bold text-sm">Próximos agendamentos</div>
          <div className="divide-y divide-border">
            {upcoming.length === 0 && (
              <div className="px-5 py-6 text-sm text-muted-foreground text-center">Nenhum agendamento pendente</div>
            )}
            {upcoming.map((s) => (
              <div key={s.id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold">{s.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{s.date} · {s.start_time} - {s.class_name}</div>
                </div>
                <Badge variant={s.status === 'confirmado' ? 'default' : 'secondary'}>{s.status}</Badge>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl overflow-hidden flex flex-col" style={{ maxHeight: '420px' }}>
          <div className="px-5 py-4 border-b border-border font-bold text-sm flex items-center justify-between flex-shrink-0">
            <span>Status do inventário</span>
            {(() => {
              const atencao = items.filter(i => {
                const qty = i.quantity ?? 0;
                const min = i.min_stock ?? 0;
                return qty === 0 || (min > 0 && qty <= min);
              });
              return atencao.length > 0 ? (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: '#D4202015', color: '#D42020' }}>
                  {atencao.length} item(s) com atenção
                </span>
              ) : null;
            })()}
          </div>
          <div className="divide-y divide-border overflow-y-auto flex-1">
            {(() => {
              const critical = items.filter(i => (i.quantity ?? 0) === 0);
              const low = items.filter(i => {
                const qty = i.quantity ?? 0;
                const min = i.min_stock ?? 0;
                return qty > 0 && min > 0 && qty <= min;
              });
              const prioritized = [...critical, ...low];

              if (prioritized.length === 0) {
                return (
                  <div className="px-5 py-6 text-sm text-muted-foreground text-center">
                    <CheckCircle size={28} className="mx-auto mb-2 opacity-20" />
                    Todos os itens com estoque adequado
                  </div>
                );
              }

              return prioritized.map(i => {
                const qty = i.quantity ?? 0;
                const min = i.min_stock ?? 0;
                const isEmpty = qty === 0;
                const color = isEmpty ? '#D42020' : '#d97706';
                const label = isEmpty ? 'Esgotado' : 'Estoque baixo';
                return (
                  <div key={i.id} className="px-5 py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold truncate">{i.name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {i.category} · <span style={{ color }} className="font-semibold">
                          {qty} {i.unit_measure || 'un'}
                        </span>
                        {min > 0 && <span className="text-muted-foreground"> / mín. {min}</span>}
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full flex-shrink-0"
                      style={{ background: color + '15', color }}>
                      {label}
                    </span>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
