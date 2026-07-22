/**
 * UnitSelectPopup.tsx — FabLab Platform
 * Pop-up exibido na primeira visita (ou ao trocar unidade) para o usuário
 * selecionar em qual unidade do FabLab está trabalhando.
 *
 * Armazenamento: localStorage + authStore.updateUnit()
 * Para adicionar novas unidades, edite DEFAULT_UNITS em lib/constants.ts
 */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Plus, X, Building2, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from 'react-i18next';
import { DEFAULT_UNITS } from '@/lib/constants';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';

const STORAGE_KEY = 'fablab-unit-selected';

interface UnitSelectPopupProps {
  /** Forçar exibição mesmo que já tenha escolhido antes */
  forceOpen?: boolean;
  onClose?: () => void;
}

export function UnitSelectPopup({ forceOpen, onClose }: UnitSelectPopupProps) {
  const { t } = useTranslation();
  const { user, updateUnit } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [customUnit, setCustomUnit] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const [saving, setSaving] = useState(false);

  // Exibe popup na primeira vez ou quando forçado
  useEffect(() => {
    if (forceOpen) { setOpen(true); return; }
    const chosen = localStorage.getItem(STORAGE_KEY);
    if (!chosen) setOpen(true);
  }, [forceOpen]);

  const handleSelect = async (unit: string) => {
    setSaving(true);
    try {
      // Persiste no banco
      if (user?.id) {
        await supabase.from('users').update({ unit }).eq('id', user.id);
      }
      updateUnit(unit);
      localStorage.setItem(STORAGE_KEY, unit);
      setOpen(false);
      onClose?.();
    } finally {
      setSaving(false);
    }
  };

  const handleCustomSubmit = () => {
    if (customUnit.trim()) handleSelect(customUnit.trim());
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          {/* Modal */}
          <motion.div
            className="relative z-10 w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
            initial={{ scale: 0.92, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          >
            {/* Header colorido */}
            <div className="h-2" style={{ background: 'linear-gradient(90deg, #1D4ED8, #059669, #DC2626)' }} />

            <div className="p-6">
              {/* Ícone + Título */}
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#EFF6FF' }}>
                  <Building2 size={20} style={{ color: '#1D4ED8' }} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground">{t('unitPopup.title')}</h2>
                  <p className="text-xs text-muted-foreground">{t('unitPopup.subtitle')}</p>
                </div>
              </div>

              <p className="text-sm text-muted-foreground mb-5 mt-3">
                {t('unitPopup.description')}
              </p>

              {/* Lista de unidades */}
              <div className="space-y-2 mb-4">
                {DEFAULT_UNITS.map((unit) => (
                  <button
                    key={unit}
                    onClick={() => handleSelect(unit)}
                    disabled={saving}
                    className="w-full flex items-center justify-between p-3 rounded-xl border border-border hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 transition-all group text-left"
                  >
                    <div className="flex items-center gap-3">
                      <MapPin size={16} className="text-muted-foreground group-hover:text-blue-500" />
                      <span className="font-medium text-sm text-foreground">{unit}</span>
                    </div>
                    <ChevronRight size={14} className="text-muted-foreground group-hover:text-blue-500" />
                  </button>
                ))}
              </div>

              {/* Cadastrar nova unidade */}
              {!showCustom ? (
                <button
                  onClick={() => setShowCustom(true)}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full justify-center py-2"
                >
                  <Plus size={14} />
                  {t('unitPopup.addNew')}
                </button>
              ) : (
                <div className="flex gap-2">
                  <Input
                    value={customUnit}
                    onChange={e => setCustomUnit(e.target.value)}
                    placeholder={t('unitPopup.newUnitPlaceholder')}
                    onKeyDown={e => e.key === 'Enter' && handleCustomSubmit()}
                    className="flex-1"
                  />
                  <Button onClick={handleCustomSubmit} disabled={!customUnit.trim() || saving} size="sm" style={{ background: '#1D4ED8' }}>
                    OK
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setShowCustom(false)}>
                    <X size={14} />
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
