/**
 * authStore.ts — FabLab Platform
 * Gerenciamento de autenticação via Supabase.
 * Usa zustand com persist para manter sessão entre recarregamentos.
 *
 * Fluxo:
 *   1. login() → supabase.auth.signInWithPassword → busca perfil público
 *   2. loadSession() → verifica sessão existente (chamado no main.tsx)
 *   3. logout() → limpa sessão no supabase e no store
 *
 * Recuperação de senha: delegada ao Supabase (email nativo).
 * Não há lógica de reset aqui — o Supabase gerencia o fluxo completo.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types';
import { supabase } from '@/lib/supabase';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  loadSession: () => Promise<void>;
  updateUnit: (unit: string) => void;
}

/** Busca o perfil público do usuário após autenticação. */
async function fetchUserProfile(userId: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('id, name, email, role, class_id, unit, active')
    .eq('id', userId)
    .single();

  if (error || !data) return null;
  if (data.active === false) return null; // bloqueia usuários inativos
  return data as User;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,

      /** Verifica sessão existente no Supabase (chamado na inicialização). */
      loadSession: async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          set({ user: null, isAuthenticated: false });
          return;
        }
        const profile = await fetchUserProfile(session.user.id);
        if (profile) {
          set({ user: profile, isAuthenticated: true });
        } else {
          await supabase.auth.signOut();
          set({ user: null, isAuthenticated: false });
        }
      },

      /** Autentica com email e senha. Retorna true se OK. */
      login: async (email: string, password: string) => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error || !data.session) return false;

        const profile = await fetchUserProfile(data.session.user.id);
        if (!profile) {
          await supabase.auth.signOut();
          return false;
        }
        set({ user: profile, isAuthenticated: true });
        return true;
      },

      /** Encerra a sessão. */
      logout: async () => {
        await supabase.auth.signOut();
        set({ user: null, isAuthenticated: false });
      },

      /** Atualiza a unidade do usuário no store (sem re-fetch). */
      updateUnit: (unit: string) => {
        const u = get().user;
        if (u) set({ user: { ...u, unit } });
      },
    }),
    {
      name: 'fablab-auth',  // renomeado de 'fablab-auth' para 'fablab-auth'
      partialize: (s) => ({ user: s.user, isAuthenticated: s.isAuthenticated }),
    }
  )
);
